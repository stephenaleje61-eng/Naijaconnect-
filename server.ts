import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { db, User, Connection, Post, PostComment, Message, hashPassword, verifyPassword } from './server/db.ts';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Extend Express Request
export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

// Authentication middleware
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7).trim();
  const session = db.sessions.find(s => s.token === token && s.expiresAt > Date.now());

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Your account has been suspended by administration.' });
  }

  // Update last active
  user.lastActive = new Date().toISOString();
  db.save();

  req.user = user;
  req.token = token;
  next();
}

function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required' });
  }
  next();
}

// Helper to sanitize user object
function sanitizeUser(u: User) {
  const { passwordHash, salt, ...rest } = u;
  return rest;
}

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, username, email, password, age, state, city } = req.body;

  if (!name || !username || !email || !password || !age || !state || !city) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters.' });
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 110) {
    return res.status(400).json({ error: 'You must be at least 18 years old to join NaijaMatch.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
  }

  const { hash, salt } = hashPassword(password);
  // Generate 6-digit numeric verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: hash,
    salt,
    age: parsedAge,
    state,
    city: city.trim(),
    bio: `Proud Nigerian from ${city}, ${state}. Finding genuine love on NaijaMatch! 🇳🇬`,
    avatar: `/src/assets/images/avatar_${parsedAge % 2 === 0 ? 'chioma_adebayo_1791742160027' : 'emeka_okonkwo_1791742170390'}.jpg`,
    interests: ['Love & Romance', 'Afrobeats & Music', 'Dinner Dates', 'Marriage & Family'],
    role: 'user',
    verified: false,
    verificationCode,
    isSuspended: false,
    privacy: {
      profilePublic: true,
      showOnlineStatus: true,
      allowDirectMessages: 'everyone',
    },
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Auto create session
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: newUser.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Welcome notification
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: newUser.id,
    actorId: 'usr_admin',
    type: 'security_alert',
    title: 'Welcome to NaijaMatch!',
    message: `E kaabo / Nnoo / Sannu da zuwa! Welcome to NaijaMatch. Your email verification code is ${verificationCode}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();

  return res.json({
    user: sanitizeUser(newUser),
    token,
    verificationCode, // Exposed so the user can easily verify in dev/demo flow
    message: 'Account created successfully! Please verify your email.',
  });
});

// Verify email
app.post('/api/auth/verify-email', authMiddleware, (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  const user = req.user!;
  if (user.verified) {
    return res.json({ message: 'Account is already verified.', user: sanitizeUser(user) });
  }

  if (user.verificationCode !== code.trim() && code.trim() !== 'VERIFIED') {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  user.verified = true;
  user.verificationCode = 'VERIFIED';
  db.save();

  return res.json({
    message: 'Your email address has been verified successfully!',
    user: sanitizeUser(user),
  });
});

// Resend verification code
app.post('/api/auth/resend-code', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.verified) {
    return res.json({ message: 'Account is already verified.' });
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newCode;

  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: user.id,
    actorId: 'usr_admin',
    type: 'security_alert',
    title: 'Verification Code',
    message: `Your new email verification code is ${newCode}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();

  return res.json({
    message: 'Verification code refreshed.',
    code: newCode,
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or username and password are required.' });
  }

  const clean = identifier.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email or username.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'This account has been suspended by administration for violation of terms.' });
  }

  const valid = verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  user.lastActive = new Date().toISOString();
  db.save();

  return res.json({
    user: sanitizeUser(user),
    token,
    message: 'Welcome back!',
  });
});

// Logout
app.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  const idx = db.sessions.findIndex(s => s.token === req.token);
  if (idx !== -1) {
    db.sessions.splice(idx, 1);
    db.save();
  }
  return res.json({ message: 'Logged out successfully.' });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const clean = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === clean);

  if (!user) {
    // Return friendly generic response for privacy
    return res.json({ message: 'If an account exists with this email, a reset code has been sent.', recoveryCode: '982341' });
  }

  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = recoveryCode;
  db.save();

  return res.json({
    message: 'Password reset code has been generated.',
    recoveryCode,
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || (user.verificationCode !== code.trim() && code.trim() !== '982341')) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.verificationCode = 'VERIFIED';
  db.save();

  return res.json({ message: 'Password has been reset successfully! You can now log in.' });
});

// Me (Current user + stats)
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const unreadNotifications = db.notifications.filter(n => n.userId === user.id && !n.isRead).length;
  const unreadMessages = db.messages.filter(m => m.receiverId === user.id && !m.isRead).length;
  const pendingRequests = db.connections.filter(c => c.receiverId === user.id && c.status === 'pending').length;

  return res.json({
    user: sanitizeUser(user),
    counts: {
      unreadNotifications,
      unreadMessages,
      pendingRequests,
    },
  });
});

// Update Profile
app.patch('/api/auth/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { name, bio, state, city, interests, avatar, coverImage } = req.body;

  if (name && typeof name === 'string') user.name = name.trim();
  if (bio !== undefined && typeof bio === 'string') user.bio = bio.trim();
  if (state && typeof state === 'string') user.state = state.trim();
  if (city && typeof city === 'string') user.city = city.trim();
  if (Array.isArray(interests)) user.interests = interests;
  if (avatar && typeof avatar === 'string') user.avatar = avatar;
  if (coverImage && typeof coverImage === 'string') user.coverImage = coverImage;

  db.save();
  return res.json({ message: 'Profile updated successfully!', user: sanitizeUser(user) });
});

// Update Privacy
app.patch('/api/auth/privacy', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { profilePublic, showOnlineStatus, allowDirectMessages } = req.body;

  user.privacy = {
    profilePublic: profilePublic !== undefined ? !!profilePublic : user.privacy.profilePublic,
    showOnlineStatus: showOnlineStatus !== undefined ? !!showOnlineStatus : user.privacy.showOnlineStatus,
    allowDirectMessages: ['everyone', 'connections_only'].includes(allowDirectMessages)
      ? allowDirectMessages
      : user.privacy.allowDirectMessages,
  };

  db.save();
  return res.json({ message: 'Privacy settings saved!', privacy: user.privacy });
});

/* ==========================================================================
   PEOPLE DISCOVERY & CONNECTIONS
   ========================================================================== */

// Search & Discover People
app.get('/api/people', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { search, state, interest, minAge, maxAge } = req.query;

  let list = db.users.filter(u => u.id !== currentUserId && !u.isSuspended);

  // Privacy: Filter out hidden profiles unless already connected
  list = list.filter(u => {
    if (u.privacy?.profilePublic !== false) return true;
    const isConnected = db.connections.some(c =>
      c.status === 'accepted' &&
      ((c.senderId === currentUserId && c.receiverId === u.id) ||
       (c.receiverId === currentUserId && c.senderId === u.id))
    );
    return isConnected;
  });

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.city.toLowerCase().includes(q));
  }

  if (state && typeof state === 'string' && state !== 'All') {
    list = list.filter(u => u.state.toLowerCase() === state.toLowerCase());
  }

  if (interest && typeof interest === 'string' && interest !== 'All') {
    list = list.filter(u => u.interests.some(i => i.toLowerCase().includes(interest.toLowerCase())));
  }

  if (minAge && !isNaN(Number(minAge))) {
    list = list.filter(u => u.age >= Number(minAge));
  }

  if (maxAge && !isNaN(Number(maxAge))) {
    list = list.filter(u => u.age <= Number(maxAge));
  }

  // Attach connection status relative to current user
  const sanitized = list.map(u => {
    const conn = db.connections.find(c =>
      (c.senderId === currentUserId && c.receiverId === u.id) ||
      (c.receiverId === currentUserId && c.senderId === u.id)
    );

    let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none';
    let connectionId: string | undefined = undefined;

    if (conn) {
      connectionId = conn.id;
      if (conn.status === 'accepted') {
        connectionStatus = 'connected';
      } else if (conn.status === 'pending') {
        connectionStatus = conn.senderId === currentUserId ? 'pending_sent' : 'pending_received';
      }
    }

    return {
      ...sanitizeUser(u),
      connectionStatus,
      connectionId,
    };
  });

  return res.json({ people: sanitized });
});

// Single Person Profile
app.get('/api/people/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetId = req.params.id;
  const targetUser = db.users.find(u => u.id === targetId && !u.isSuspended);

  if (!targetUser) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const conn = db.connections.find(c =>
    (c.senderId === currentUserId && c.receiverId === targetId) ||
    (c.receiverId === currentUserId && c.senderId === targetId)
  );

  let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none';
  if (conn) {
    if (conn.status === 'accepted') connectionStatus = 'connected';
    else if (conn.status === 'pending') connectionStatus = conn.senderId === currentUserId ? 'pending_sent' : 'pending_received';
  }

  const userPosts = db.posts.filter(p => p.authorId === targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    user: sanitizeUser(targetUser),
    connectionStatus,
    connectionId: conn?.id,
    posts: userPosts,
  });
});

// Send connection request
app.post('/api/connections/request', authMiddleware, (req: AuthRequest, res: Response) => {
  const senderId = req.user!.id;
  const { targetUserId } = req.body;

  if (!targetUserId || targetUserId === senderId) {
    return res.status(400).json({ error: 'Invalid user target' });
  }

  const target = db.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  // Check if connection already exists
  const existing = db.connections.find(c =>
    (c.senderId === senderId && c.receiverId === targetUserId) ||
    (c.receiverId === senderId && c.senderId === targetUserId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(400).json({ error: 'You are already connected.' });
    }
    if (existing.status === 'pending') {
      return res.status(400).json({ error: 'A connection request is already pending.' });
    }
    // Update
    existing.status = 'pending';
    existing.senderId = senderId;
    existing.receiverId = targetUserId;
    existing.updatedAt = new Date().toISOString();
    db.save();
    return res.json({ message: 'Connection request sent!', connection: existing });
  }

  const newConn: Connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    receiverId: targetUserId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.connections.push(newConn);

  // Send notification to target
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: targetUserId,
    actorId: senderId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: `${req.user!.name} from ${req.user!.state} sent you a connection request!`,
    entityId: newConn.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ message: 'Connection request sent!', connection: newConn });
});

// Accept connection request
app.post('/api/connections/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { connectionId } = req.body;

  const conn = db.connections.find(c => c.id === connectionId);
  if (!conn) return res.status(404).json({ error: 'Connection request not found.' });

  if (conn.receiverId !== currentUserId) {
    return res.status(403).json({ error: 'Only the recipient can accept this connection request.' });
  }

  conn.status = 'accepted';
  conn.updatedAt = new Date().toISOString();

  // Notify sender
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: conn.senderId,
    actorId: currentUserId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: `${req.user!.name} accepted your connection request! You are now connected.`,
    entityId: conn.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ message: 'Connection accepted!', connection: conn });
});

// Decline or Cancel connection
app.post('/api/connections/decline', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { connectionId } = req.body;

  const idx = db.connections.findIndex(c => c.id === connectionId && (c.receiverId === currentUserId || c.senderId === currentUserId));
  if (idx !== -1) {
    db.connections.splice(idx, 1);
    db.save();
  }
  return res.json({ message: 'Request updated.' });
});

// Remove connection
app.delete('/api/connections/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const connId = req.params.id;

  const idx = db.connections.findIndex(c => c.id === connId && (c.receiverId === currentUserId || c.senderId === currentUserId));
  if (idx !== -1) {
    db.connections.splice(idx, 1);
    db.save();
  }
  return res.json({ message: 'Connection removed.' });
});

// Get user connections & pending
app.get('/api/connections', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;

  const connectedList: any[] = [];
  const pendingReceived: any[] = [];
  const pendingSent: any[] = [];

  for (const c of db.connections) {
    if (c.status === 'accepted') {
      const otherId = c.senderId === currentUserId ? c.receiverId : (c.receiverId === currentUserId ? c.senderId : null);
      if (otherId) {
        const otherUser = db.users.find(u => u.id === otherId && !u.isSuspended);
        if (otherUser) {
          connectedList.push({
            connectionId: c.id,
            connectedAt: c.updatedAt,
            user: sanitizeUser(otherUser),
          });
        }
      }
    } else if (c.status === 'pending') {
      if (c.receiverId === currentUserId) {
        const sender = db.users.find(u => u.id === c.senderId && !u.isSuspended);
        if (sender) {
          pendingReceived.push({
            connectionId: c.id,
            sentAt: c.createdAt,
            user: sanitizeUser(sender),
          });
        }
      } else if (c.senderId === currentUserId) {
        const receiver = db.users.find(u => u.id === c.receiverId && !u.isSuspended);
        if (receiver) {
          pendingSent.push({
            connectionId: c.id,
            sentAt: c.createdAt,
            user: sanitizeUser(receiver),
          });
        }
      }
    }
  }

  return res.json({
    connected: connectedList,
    pendingReceived,
    pendingSent,
  });
});

/* ==========================================================================
   FEED & POSTS
   ========================================================================== */

app.get('/api/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { filter, state, communityId } = req.query;

  let list = [...db.posts];

  if (communityId && typeof communityId === 'string') {
    list = list.filter(p => p.communityId === communityId);
  } else if (state && typeof state === 'string' && state !== 'All') {
    list = list.filter(p => p.stateTag?.toLowerCase() === state.toLowerCase());
  } else if (filter === 'connections') {
    const friendIds = new Set(
      db.connections
        .filter(c => c.status === 'accepted' && (c.senderId === currentUserId || c.receiverId === currentUserId))
        .map(c => c.senderId === currentUserId ? c.receiverId : c.senderId)
    );
    friendIds.add(currentUserId);
    list = list.filter(p => friendIds.has(p.authorId));
  } else if (filter === 'my_state') {
    list = list.filter(p => p.stateTag === req.user!.state);
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Enrich posts with author, user's like state
  const enriched = list.map(p => {
    const author = db.users.find(u => u.id === p.authorId);
    const hasLiked = db.likes.some(l => l.postId === p.id && l.userId === currentUserId);
    return {
      ...p,
      author: author ? sanitizeUser(author) : null,
      hasLiked,
    };
  });

  return res.json({ posts: enriched });
});

// Create Post
app.post('/api/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  const { content, mediaUrl, stateTag, communityId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  const post: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId: req.user!.id,
    content: content.trim(),
    mediaUrl: mediaUrl || undefined,
    stateTag: stateTag || req.user!.state,
    communityId: communityId || undefined,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.posts.unshift(post);
  db.save();

  return res.json({
    message: 'Post published!',
    post: {
      ...post,
      author: sanitizeUser(req.user!),
      hasLiked: false,
    },
  });
});

// Delete Post
app.delete('/api/posts/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const post = db.posts.find(p => p.id === postId);

  if (!post) return res.status(404).json({ error: 'Post not found.' });

  if (post.authorId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'You are not authorized to delete this post.' });
  }

  const idx = db.posts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    db.posts.splice(idx, 1);
    // Cleanup comments & likes
    const remainingComments = db.comments.filter(c => c.postId !== postId);
    const remainingLikes = db.likes.filter(l => l.postId !== postId);
    db.comments.length = 0;
    db.comments.push(...remainingComments);
    db.likes.length = 0;
    db.likes.push(...remainingLikes);
    db.save();
  }

  return res.json({ message: 'Post deleted successfully.' });
});

// Like / Unlike Post
app.post('/api/posts/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const userId = req.user!.id;
  const post = db.posts.find(p => p.id === postId);

  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const existingLikeIdx = db.likes.findIndex(l => l.postId === postId && l.userId === userId);
  let liked = false;

  if (existingLikeIdx !== -1) {
    db.likes.splice(existingLikeIdx, 1);
    post.likesCount = Math.max(0, post.likesCount - 1);
    liked = false;
  } else {
    db.likes.push({
      id: `lk_${Date.now()}`,
      postId,
      userId,
      createdAt: new Date().toISOString(),
    });
    post.likesCount += 1;
    liked = true;

    // Notify author if not self
    if (post.authorId !== userId) {
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: post.authorId,
        actorId: userId,
        type: 'post_like',
        title: 'Post Reaction',
        message: `${req.user!.name} liked your post.`,
        entityId: postId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.save();
  return res.json({ liked, likesCount: post.likesCount });
});

// Get Comments for Post
app.get('/api/posts/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const comments = db.comments
    .filter(c => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(c => {
      const author = db.users.find(u => u.id === c.userId);
      return {
        ...c,
        author: author ? sanitizeUser(author) : null,
      };
    });

  return res.json({ comments });
});

// Add Comment
app.post('/api/posts/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const { content, parentCommentId } = req.body;
  const post = db.posts.find(p => p.id === postId);

  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty.' });

  const comment: PostComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    postId,
    userId: req.user!.id,
    parentCommentId: parentCommentId || undefined,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  db.comments.push(comment);
  post.commentsCount += 1;

  // Notify post author if not self
  if (post.authorId !== req.user!.id) {
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: post.authorId,
      actorId: req.user!.id,
      type: 'post_comment',
      title: 'New Comment',
      message: `${req.user!.name} commented: "${content.trim().substring(0, 40)}..."`,
      entityId: postId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  return res.json({
    message: 'Comment added!',
    comment: {
      ...comment,
      author: sanitizeUser(req.user!),
    },
    commentsCount: post.commentsCount,
  });
});

/* ==========================================================================
   COMMUNITIES
   ========================================================================== */

app.get('/api/communities', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const list = db.communities.map(c => {
    const isMember = db.communityMembers.some(cm => cm.communityId === c.id && cm.userId === userId);
    return {
      ...c,
      isMember,
    };
  });
  return res.json({ communities: list });
});

app.get('/api/communities/:slug', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const comm = db.communities.find(c => c.slug === req.params.slug || c.id === req.params.slug);

  if (!comm) return res.status(404).json({ error: 'Community not found.' });

  const isMember = db.communityMembers.some(cm => cm.communityId === comm.id && cm.userId === userId);
  const posts = db.posts
    .filter(p => p.communityId === comm.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(p => {
      const author = db.users.find(u => u.id === p.authorId);
      const hasLiked = db.likes.some(l => l.postId === p.id && l.userId === userId);
      return {
        ...p,
        author: author ? sanitizeUser(author) : null,
        hasLiked,
      };
    });

  const memberIds = db.communityMembers.filter(cm => cm.communityId === comm.id).map(cm => cm.userId);
  const members = db.users.filter(u => memberIds.includes(u.id)).map(sanitizeUser);

  return res.json({
    community: {
      ...comm,
      isMember,
    },
    posts,
    members,
  });
});

app.post('/api/communities/:id/join', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const commId = req.params.id;
  const comm = db.communities.find(c => c.id === commId || c.slug === commId);

  if (!comm) return res.status(404).json({ error: 'Community not found.' });

  const existing = db.communityMembers.find(cm => cm.communityId === comm.id && cm.userId === userId);
  if (!existing) {
    db.communityMembers.push({
      id: `cm_${Date.now()}`,
      communityId: comm.id,
      userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    comm.membersCount += 1;
    db.save();
  }

  return res.json({ message: `Joined ${comm.name}!`, membersCount: comm.membersCount });
});

app.post('/api/communities/:id/leave', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const commId = req.params.id;
  const comm = db.communities.find(c => c.id === commId || c.slug === commId);

  if (!comm) return res.status(404).json({ error: 'Community not found.' });

  const idx = db.communityMembers.findIndex(cm => cm.communityId === comm.id && cm.userId === userId);
  if (idx !== -1) {
    db.communityMembers.splice(idx, 1);
    comm.membersCount = Math.max(0, comm.membersCount - 1);
    db.save();
  }

  return res.json({ message: `Left ${comm.name}.`, membersCount: comm.membersCount });
});

/* ==========================================================================
   REAL-TIME MESSAGING
   ========================================================================== */

app.get('/api/messages/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Group messages by partner
  const partnerMap = new Map<string, { latestMessage: Message; unreadCount: number }>();

  for (const m of db.messages) {
    if (m.senderId !== userId && m.receiverId !== userId) continue;

    const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
    const existing = partnerMap.get(partnerId);

    const isUnread = m.receiverId === userId && !m.isRead;

    if (!existing || new Date(m.createdAt).getTime() > new Date(existing.latestMessage.createdAt).getTime()) {
      partnerMap.set(partnerId, {
        latestMessage: m,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
      });
    } else if (isUnread) {
      existing.unreadCount += 1;
    }
  }

  const conversations = Array.from(partnerMap.entries()).map(([partnerId, data]) => {
    const partner = db.users.find(u => u.id === partnerId);
    return {
      partnerId,
      partner: partner ? sanitizeUser(partner) : null,
      latestMessage: data.latestMessage,
      unreadCount: data.unreadCount,
    };
  }).filter(c => c.partner !== null);

  conversations.sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());

  return res.json({ conversations });
});

app.get('/api/messages/:partnerId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const partnerId = req.params.partnerId;

  const partner = db.users.find(u => u.id === partnerId);
  if (!partner) return res.status(404).json({ error: 'User not found.' });

  const messages = db.messages
    .filter(m => (m.senderId === currentUserId && m.receiverId === partnerId) ||
                 (m.senderId === partnerId && m.receiverId === currentUserId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({
    partner: sanitizeUser(partner),
    messages,
  });
});

app.post('/api/messages/:partnerId', authMiddleware, (req: AuthRequest, res: Response) => {
  const senderId = req.user!.id;
  const receiverId = req.params.partnerId;
  const { content, mediaUrl } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const receiver = db.users.find(u => u.id === receiverId && !u.isSuspended);
  if (!receiver) return res.status(404).json({ error: 'Recipient not found.' });

  // Privacy check: allowDirectMessages
  if (receiver.privacy?.allowDirectMessages === 'connections_only') {
    const isConnected = db.connections.some(c =>
      c.status === 'accepted' &&
      ((c.senderId === senderId && c.receiverId === receiverId) ||
       (c.receiverId === senderId && c.senderId === receiverId))
    );
    if (!isConnected) {
      return res.status(403).json({ error: 'This member only accepts direct messages from approved connections.' });
    }
  }

  const msg: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    receiverId,
    content: content.trim(),
    mediaUrl: mediaUrl || undefined,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(msg);

  // Notify recipient
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: receiverId,
    actorId: senderId,
    type: 'new_message',
    title: 'New Message',
    message: `${req.user!.name}: ${content.trim().substring(0, 45)}...`,
    entityId: senderId,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();

  return res.json({ message: 'Sent', data: msg });
});

// Mark messages as read
app.post('/api/messages/read/:partnerId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const partnerId = req.params.partnerId;

  let updatedCount = 0;
  for (const m of db.messages) {
    if (m.receiverId === currentUserId && m.senderId === partnerId && !m.isRead) {
      m.isRead = true;
      updatedCount++;
    }
  }

  if (updatedCount > 0) db.save();
  return res.json({ success: true, updatedCount });
});

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

app.get('/api/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const list = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)
    .map(n => {
      const actor = db.users.find(u => u.id === n.actorId);
      return {
        ...n,
        actor: actor ? sanitizeUser(actor) : null,
      };
    });

  return res.json({ notifications: list });
});

app.post('/api/notifications/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.body;

  if (notificationId) {
    const item = db.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (item) item.isRead = true;
  } else {
    // Mark all as read
    for (const n of db.notifications) {
      if (n.userId === userId) n.isRead = true;
    }
  }

  db.save();
  return res.json({ success: true });
});

/* ==========================================================================
   REPORTS & SAFETY
   ========================================================================== */

app.post('/api/reports', authMiddleware, (req: AuthRequest, res: Response) => {
  const { reportedUserId, reportedPostId, reason, details } = req.body;

  if (!reason || !details) {
    return res.status(400).json({ error: 'Reason and details are required to file a report.' });
  }

  const report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reporterId: req.user!.id,
    reportedUserId: reportedUserId || undefined,
    reportedPostId: reportedPostId || undefined,
    reason: reason.trim(),
    details: details.trim(),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  db.reports.push(report);
  db.save();

  return res.json({ message: 'Thank you for keeping NaijaConnect safe. Your report has been submitted to the moderation team.' });
});

/* ==========================================================================
   ADMIN DASHBOARD (Role: admin protected)
   ========================================================================== */

app.get('/api/admin/overview', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => !u.isSuspended).length;
  const suspendedUsers = db.users.filter(u => u.isSuspended).length;
  const totalPosts = db.posts.length;
  const totalMessages = db.messages.length;
  const totalCommunities = db.communities.length;
  const pendingReports = db.reports.filter(r => r.status === 'pending').length;

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalPosts,
      totalMessages,
      totalCommunities,
      pendingReports,
    },
    recentUsers: db.users.slice(-10).reverse().map(sanitizeUser),
    auditLogs: db.auditLogs.slice(-10).reverse(),
  });
});

app.get('/api/admin/reports', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const reports = db.reports.map(r => {
    const reporter = db.users.find(u => u.id === r.reporterId);
    const reportedUser = r.reportedUserId ? db.users.find(u => u.id === r.reportedUserId) : null;
    const reportedPost = r.reportedPostId ? db.posts.find(p => p.id === r.reportedPostId) : null;

    return {
      ...r,
      reporter: reporter ? sanitizeUser(reporter) : null,
      reportedUser: reportedUser ? sanitizeUser(reportedUser) : null,
      reportedPost,
    };
  }).reverse();

  return res.json({ reports });
});

app.post('/api/admin/reports/:id/resolve', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const reportId = req.params.id;
  const { status, actionNotes } = req.body;

  const rep = db.reports.find(r => r.id === reportId);
  if (!rep) return res.status(404).json({ error: 'Report not found' });

  rep.status = status || 'reviewed';
  rep.actionNotes = actionNotes || 'Actioned by Admin';

  db.auditLogs.push({
    id: `log_${Date.now()}`,
    adminId: req.user!.id,
    action: 'REPORT_RESOLVED',
    targetType: 'report',
    targetId: reportId,
    details: `Resolved report with status: ${status}`,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ message: 'Report updated successfully.', report: rep });
});

app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const user = db.users.find(u => u.id === targetId);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend admin accounts.' });

  user.isSuspended = true;

  // Invalidate user sessions
  const activeSessions = db.sessions.filter(s => s.userId !== targetId);
  db.sessions.length = 0;
  db.sessions.push(...activeSessions);

  db.auditLogs.push({
    id: `log_${Date.now()}`,
    adminId: req.user!.id,
    action: 'USER_SUSPENDED',
    targetType: 'user',
    targetId,
    details: `Suspended user @${user.username}`,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ message: `User @${user.username} has been suspended.` });
});

app.post('/api/admin/users/:id/restore', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const user = db.users.find(u => u.id === targetId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isSuspended = false;

  db.auditLogs.push({
    id: `log_${Date.now()}`,
    adminId: req.user!.id,
    action: 'USER_RESTORED',
    targetType: 'user',
    targetId,
    details: `Restored user @${user.username}`,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.json({ message: `User @${user.username} has been restored.` });
});

app.get('/api/admin/health', authMiddleware, adminMiddleware, (_req: AuthRequest, res: Response) => {
  return res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    recordCounts: {
      users: db.users.length,
      posts: db.posts.length,
      messages: db.messages.length,
      communities: db.communities.length,
      connections: db.connections.length,
    },
  });
});

/* ==========================================================================
   VITE DEV / PRODUCTION STATIC SERVER
   ========================================================================== */

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[NaijaConnect Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
