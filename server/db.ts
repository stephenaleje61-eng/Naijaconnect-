import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  age: number;
  state: string;
  city: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  interests: string[];
  role: 'admin' | 'user';
  verified: boolean;
  verificationCode: string;
  isSuspended: boolean;
  privacy: {
    profilePublic: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: 'everyone' | 'connections_only';
  };
  createdAt: string;
  lastActive: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface Connection {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  stateTag?: string;
  communityId?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  stateTag?: string;
  banner?: string;
  icon?: string;
  membersCount: number;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'connection_request' | 'connection_accepted' | 'new_message' | 'post_like' | 'post_comment' | 'community_invite' | 'security_alert';
  title: string;
  message: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedPostId?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
  actionNotes?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  connections: Connection[];
  messages: Message[];
  posts: Post[];
  likes: PostLike[];
  comments: PostComment[];
  communities: Community[];
  communityMembers: CommunityMember[];
  notifications: Notification[];
  reports: Report[];
  auditLogs: AuditLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'naijaconnect.json');

// Password hashing utilities using Node.js crypto
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, reinitializing', err);
      }
    }

    const initial = this.seedInitialData();
    this.saveDirect(initial);
    return initial;
  }

  public save(): void {
    this.saveDirect(this.data);
  }

  private saveDirect(dataToSave: DatabaseSchema): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // Schema Accessors
  get users() { return this.data.users; }
  get sessions() { return this.data.sessions; }
  get connections() { return this.data.connections; }
  get messages() { return this.data.messages; }
  get posts() { return this.data.posts; }
  get likes() { return this.data.likes; }
  get comments() { return this.data.comments; }
  get communities() { return this.data.communities; }
  get communityMembers() { return this.data.communityMembers; }
  get notifications() { return this.data.notifications; }
  get reports() { return this.data.reports; }
  get auditLogs() { return this.data.auditLogs; }

  private seedInitialData(): DatabaseSchema {
    const adminAuth = hashPassword('NaijaAdmin2026!');
    const chiomaAuth = hashPassword('Naija2026!');
    const emekaAuth = hashPassword('Naija2026!');
    const fatimaAuth = hashPassword('Naija2026!');
    const tundeAuth = hashPassword('Naija2026!');
    const chineduAuth = hashPassword('Naija2026!');

    const users: User[] = [
      {
        id: 'usr_admin',
        name: 'Babajide Balogun',
        username: 'admin',
        email: 'admin@naijaconnect.ng',
        passwordHash: adminAuth.hash,
        salt: adminAuth.salt,
        age: 33,
        state: 'Lagos',
        city: 'Ikeja',
        bio: 'NaijaConnect Community Administrator & Software Architect. Building bridges across all 36 states and the FCT. 🇳🇬',
        avatar: '/src/assets/images/hero_nigerians_connecting_1791742121950.jpg',
        interests: ['Community Building', 'Tech Ecosystem', 'Public Policy', 'Afrobeats'],
        role: 'admin',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-01-01T08:00:00Z',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'usr_chioma',
        name: 'Chioma Adebayo',
        username: 'chioma_tech',
        email: 'chioma@example.ng',
        passwordHash: chiomaAuth.hash,
        salt: chiomaAuth.salt,
        age: 27,
        state: 'Lagos',
        city: 'Lekki Phase 1',
        bio: 'Product Designer & Fintech Enthusiast in Lagos. Proudly Nigerian. Exploring cultural arts, startups, and rooftop discussions.',
        avatar: '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg',
        coverImage: '/src/assets/images/lagos_city_vibe_1791742147929.jpg',
        interests: ['Product Design', 'Fintech', 'Art Galleries', 'Afrobeats', 'Photography'],
        role: 'user',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-02-10T11:00:00Z',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'usr_emeka',
        name: 'Emeka Okonkwo',
        username: 'emeka_builds',
        email: 'emeka@example.ng',
        passwordHash: emekaAuth.hash,
        salt: emekaAuth.salt,
        age: 29,
        state: 'FCT (Abuja)',
        city: 'Maitama',
        bio: 'AI researcher and clean energy entrepreneur in Abuja. Passionate about youth mentorship, football, and building the future of Nigeria.',
        avatar: '/src/assets/images/avatar_emeka_okonkwo_1791742170390.jpg',
        coverImage: '/src/assets/images/community_abuja_tech_1791742137722.jpg',
        interests: ['Artificial Intelligence', 'Clean Tech', 'Football', 'Abuja Networking', 'Reading'],
        role: 'user',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-02-12T14:30:00Z',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'usr_fatima',
        name: 'Fatima Sanusi',
        username: 'fatima_k',
        email: 'fatima@example.ng',
        passwordHash: fatimaAuth.hash,
        salt: fatimaAuth.salt,
        age: 26,
        state: 'Kano',
        city: 'Nassarawa',
        bio: 'E-commerce logistics founder & agricultural supply chain strategist. Connecting Northern agricultural produce with global markets.',
        avatar: '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg',
        interests: ['Agribusiness', 'Logistics', 'Kano Culture', 'Poetry', 'Economics'],
        role: 'user',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-03-01T09:15:00Z',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'usr_tunde',
        name: 'Tunde Oladipo',
        username: 'tunde_beats',
        email: 'tunde@example.ng',
        passwordHash: tundeAuth.hash,
        salt: tundeAuth.salt,
        age: 25,
        state: 'Oyo',
        city: 'Ibadan',
        bio: 'Music producer, sound engineer and UI developer based in Bodija, Ibadan. Love Amapiano and Afrobeats fusion.',
        avatar: '/src/assets/images/avatar_emeka_okonkwo_1791742170390.jpg',
        interests: ['Music Production', 'Afrobeats', 'Sound Design', 'Web Development'],
        role: 'user',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-03-05T16:20:00Z',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'usr_chinedu',
        name: 'Chinedu Eze',
        username: 'chinedu_ph',
        email: 'chinedu@example.ng',
        passwordHash: chineduAuth.hash,
        salt: chineduAuth.salt,
        age: 30,
        state: 'Rivers',
        city: 'Port Harcourt',
        bio: 'Energy engineer, photographer, and proud Port Harcourt foodie (Bole and fish lover). Connecting with creative minds across Nigeria.',
        avatar: '/src/assets/images/hero_nigerians_connecting_1791742121950.jpg',
        interests: ['Energy Sector', 'Port Harcourt Bole', 'Photography', 'Travel', 'Investing'],
        role: 'user',
        verified: true,
        verificationCode: 'VERIFIED',
        isSuspended: false,
        privacy: {
          profilePublic: true,
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
        },
        createdAt: '2026-03-10T12:00:00Z',
        lastActive: new Date().toISOString(),
      },
    ];

    const communities: Community[] = [
      {
        id: 'comm_lagos',
        slug: 'lagos-connect',
        name: 'Lagos State Community',
        description: 'Center of Excellence. The premier gathering for Lagosians, Eko hustlers, techies, creatives, and culture shapers.',
        category: 'States',
        stateTag: 'Lagos',
        banner: '/src/assets/images/lagos_city_vibe_1791742147929.jpg',
        membersCount: 4,
        createdAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'comm_abuja',
        slug: 'abuja-fct',
        name: 'Abuja & FCT Network',
        description: 'Federal Capital Territory professionals, policy innovators, civil servants, university students, and entrepreneurs.',
        category: 'States',
        stateTag: 'FCT (Abuja)',
        banner: '/src/assets/images/community_abuja_tech_1791742137722.jpg',
        membersCount: 3,
        createdAt: '2026-01-06T00:00:00Z',
      },
      {
        id: 'comm_tech',
        slug: 'tech-hustle',
        name: 'Tech & Remote Work Nigeria',
        description: 'Nigerian software developers, product designers, remote workers, and startup founders sharing opportunities & insights.',
        category: 'Professional',
        membersCount: 5,
        createdAt: '2026-01-08T00:00:00Z',
      },
      {
        id: 'comm_rivers',
        slug: 'rivers-ph-city',
        name: 'Rivers State (PH City)',
        description: 'Garden City vibes! Connecting Rivers residents, oil & gas professionals, business owners, and youth.',
        category: 'States',
        stateTag: 'Rivers',
        membersCount: 2,
        createdAt: '2026-01-10T00:00:00Z',
      },
      {
        id: 'comm_kano',
        slug: 'kano-commerce',
        name: 'Kano & Northern Hub',
        description: 'Ancient city of commerce. Entrepreneurs, traders, cultural custodians, and youth across Northern Nigeria.',
        category: 'States',
        stateTag: 'Kano',
        membersCount: 2,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'comm_music',
        slug: 'afrobeats-entertainment',
        name: 'Afrobeats & Creative Culture',
        description: 'From Burna Boy, Wizkid and Rema to emerging indie talents. Music producers, songwriters, video directors, and fans.',
        category: 'Entertainment',
        membersCount: 4,
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'comm_students',
        slug: 'universities-nysc',
        name: 'Nigerian Universities & NYSC',
        description: 'Students from UNILAG, UI, OAU, ABU, UNN, Covenant and Corp Members sharing career advice, campus life & networking.',
        category: 'Education',
        membersCount: 3,
        createdAt: '2026-01-20T00:00:00Z',
      },
    ];

    const communityMembers: CommunityMember[] = [
      { id: 'cm_1', communityId: 'comm_lagos', userId: 'usr_chioma', role: 'member', joinedAt: '2026-02-10T12:00:00Z' },
      { id: 'cm_2', communityId: 'comm_lagos', userId: 'usr_admin', role: 'admin', joinedAt: '2026-01-05T00:00:00Z' },
      { id: 'cm_3', communityId: 'comm_abuja', userId: 'usr_emeka', role: 'admin', joinedAt: '2026-02-12T15:00:00Z' },
      { id: 'cm_4', communityId: 'comm_tech', userId: 'usr_chioma', role: 'member', joinedAt: '2026-02-11T10:00:00Z' },
      { id: 'cm_5', communityId: 'comm_tech', userId: 'usr_emeka', role: 'member', joinedAt: '2026-02-13T09:00:00Z' },
      { id: 'cm_6', communityId: 'comm_kano', userId: 'usr_fatima', role: 'admin', joinedAt: '2026-03-01T10:00:00Z' },
      { id: 'cm_7', communityId: 'comm_rivers', userId: 'usr_chinedu', role: 'admin', joinedAt: '2026-03-10T13:00:00Z' },
    ];

    const posts: Post[] = [
      {
        id: 'post_1',
        authorId: 'usr_chioma',
        content: 'Good morning from Lagos! 🇳🇬 Just wrapped up an inspiring meetup in Lekki with fellow founders and designers. The sheer resilience and innovation bubbling in Nigeria right now is unmatched. Who else is attending the tech showcase in Victoria Island this weekend?',
        mediaUrl: '/src/assets/images/lagos_city_vibe_1791742147929.jpg',
        stateTag: 'Lagos',
        communityId: 'comm_lagos',
        likesCount: 14,
        commentsCount: 3,
        createdAt: '2026-03-12T09:30:00Z',
      },
      {
        id: 'post_2',
        authorId: 'usr_emeka',
        content: 'Abuja evening vibes! We just tested our solar-backed battery storage system for community schools in the FCT. Building for One Nigeria means solving real infrastructure bottlenecks together. Looking to connect with electrical engineers and agritech partners!',
        mediaUrl: '/src/assets/images/community_abuja_tech_1791742137722.jpg',
        stateTag: 'FCT (Abuja)',
        communityId: 'comm_abuja',
        likesCount: 22,
        commentsCount: 4,
        createdAt: '2026-03-13T17:45:00Z',
      },
      {
        id: 'post_3',
        authorId: 'usr_fatima',
        content: 'Kano is buzzing today at Kurmi Market! Direct farm shipments from rural Jigawa and Kano farms are now cataloged digitally. Bridging North-South trade has never been more exciting. Welcome to all new members of NaijaConnect!',
        stateTag: 'Kano',
        communityId: 'comm_kano',
        likesCount: 18,
        commentsCount: 2,
        createdAt: '2026-03-14T11:20:00Z',
      },
      {
        id: 'post_4',
        authorId: 'usr_admin',
        content: 'Welcome everyone to NaijaConnect — One Nigeria! 🇳🇬 Our mission is simple: to help Nigerians meet genuine people, build lasting friendships, foster professional relationships, and unite across all 36 states and the FCT. Treat every member with warmth and respect.',
        mediaUrl: '/src/assets/images/hero_nigerians_connecting_1791742121950.jpg',
        likesCount: 45,
        commentsCount: 6,
        createdAt: '2026-03-10T08:00:00Z',
      },
    ];

    const comments: PostComment[] = [
      {
        id: 'cmt_1',
        postId: 'post_1',
        userId: 'usr_emeka',
        content: 'Count me in Chioma! I am flying in to Lagos on Friday. Let us connect at the rooftop networking session!',
        createdAt: '2026-03-12T10:15:00Z',
      },
      {
        id: 'cmt_2',
        postId: 'post_1',
        userId: 'usr_tunde',
        content: 'Great stuff! Representing Ibadan from Oyo state, will catch the live stream if available!',
        createdAt: '2026-03-12T11:00:00Z',
      },
      {
        id: 'cmt_3',
        postId: 'post_2',
        userId: 'usr_chinedu',
        content: 'Solid work Emeka! We are doing something similar in Rivers state for rural communities. Let us exchange notes on direct message.',
        createdAt: '2026-03-13T18:20:00Z',
      },
    ];

    const likes: PostLike[] = [
      { id: 'lk_1', postId: 'post_1', userId: 'usr_emeka', createdAt: '2026-03-12T09:35:00Z' },
      { id: 'lk_2', postId: 'post_1', userId: 'usr_admin', createdAt: '2026-03-12T09:40:00Z' },
      { id: 'lk_3', postId: 'post_2', userId: 'usr_chioma', createdAt: '2026-03-13T18:00:00Z' },
      { id: 'lk_4', postId: 'post_4', userId: 'usr_chioma', createdAt: '2026-03-10T09:00:00Z' },
      { id: 'lk_5', postId: 'post_4', userId: 'usr_emeka', createdAt: '2026-03-10T09:10:00Z' },
    ];

    const connections: Connection[] = [
      {
        id: 'conn_1',
        senderId: 'usr_chioma',
        receiverId: 'usr_emeka',
        status: 'accepted',
        createdAt: '2026-02-15T10:00:00Z',
        updatedAt: '2026-02-15T12:00:00Z',
      },
      {
        id: 'conn_2',
        senderId: 'usr_fatima',
        receiverId: 'usr_chioma',
        status: 'accepted',
        createdAt: '2026-03-02T14:00:00Z',
        updatedAt: '2026-03-02T16:00:00Z',
      },
      {
        id: 'conn_3',
        senderId: 'usr_chinedu',
        receiverId: 'usr_emeka',
        status: 'pending',
        createdAt: '2026-03-14T09:00:00Z',
        updatedAt: '2026-03-14T09:00:00Z',
      },
    ];

    const messages: Message[] = [
      {
        id: 'msg_1',
        senderId: 'usr_emeka',
        receiverId: 'usr_chioma',
        content: 'Hi Chioma! Loved your recent post about the Lekki UI showcase. Are you free for a quick chat regarding the fintech collaboration?',
        isRead: true,
        createdAt: '2026-03-12T14:10:00Z',
      },
      {
        id: 'msg_2',
        senderId: 'usr_chioma',
        receiverId: 'usr_emeka',
        content: 'Hey Emeka! Absolutely. We are looking for clean energy monitoring UI ideas. How is Abuja treating you today?',
        isRead: true,
        createdAt: '2026-03-12T14:15:00Z',
      },
      {
        id: 'msg_3',
        senderId: 'usr_emeka',
        receiverId: 'usr_chioma',
        content: 'Weather is wonderful up here in Maitama. I will share the presentation link shortly!',
        isRead: true,
        createdAt: '2026-03-12T14:20:00Z',
      },
    ];

    const notifications: Notification[] = [
      {
        id: 'notif_1',
        userId: 'usr_chioma',
        actorId: 'usr_emeka',
        type: 'post_like',
        title: 'New Like',
        message: 'Emeka Okonkwo liked your post about Lekki design meetup.',
        entityId: 'post_1',
        isRead: false,
        createdAt: '2026-03-12T09:35:00Z',
      },
      {
        id: 'notif_2',
        userId: 'usr_emeka',
        actorId: 'usr_chinedu',
        type: 'connection_request',
        title: 'Connection Request',
        message: 'Chinedu Eze sent you a connection request from Rivers State.',
        entityId: 'usr_chinedu',
        isRead: false,
        createdAt: '2026-03-14T09:00:00Z',
      },
      {
        id: 'notif_3',
        userId: 'usr_chioma',
        actorId: 'usr_admin',
        type: 'security_alert',
        title: 'Security Notice',
        message: 'Your account was successfully verified with NaijaConnect.',
        isRead: true,
        createdAt: '2026-02-10T11:05:00Z',
      },
    ];

    const reports: Report[] = [
      {
        id: 'rep_1',
        reporterId: 'usr_fatima',
        reportedPostId: 'post_1',
        reason: 'Verification Question',
        details: 'Sample review report: inquiring about venue safety for offline meetup.',
        status: 'reviewed',
        actionNotes: 'Reviewed by Admin Balogun. Event was confirmed verified.',
        createdAt: '2026-03-12T12:00:00Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log_1',
        adminId: 'usr_admin',
        action: 'COMMUNITY_CREATED',
        targetType: 'community',
        targetId: 'comm_lagos',
        details: 'Initialized Lagos State community hub',
        createdAt: '2026-01-05T00:00:00Z',
      },
    ];

    return {
      users,
      sessions: [],
      connections,
      messages,
      posts,
      likes,
      comments,
      communities,
      communityMembers,
      notifications,
      reports,
      auditLogs,
    };
  }
}

export const db = new Database();
