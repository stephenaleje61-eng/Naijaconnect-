import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, PostItem, UserProfile } from '../../lib/api.ts';
import { NIGERIAN_STATES, POPULAR_INTERESTS } from '../../data/nigeriaStates.ts';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Settings,
  Edit3,
  Users,
  Grid,
  Lock,
  Eye,
  MessageCircle,
  X,
  Check
} from 'lucide-react';

export const ProfileView: React.FC<{ onNavigateToChat?: (userId: string) => void }> = ({ onNavigateToChat }) => {
  const { user, updateProfile, updatePrivacy, refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'connections'>('posts');
  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editState, setEditState] = useState(user?.state || 'Lagos');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editInterests, setEditInterests] = useState<string[]>(user?.interests || []);
  const [savingProfile, setSavingProfile] = useState(false);

  // Privacy Settings Modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [profilePublic, setProfilePublic] = useState(user?.privacy?.profilePublic ?? true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(user?.privacy?.showOnlineStatus ?? true);
  const [allowDirectMessages, setAllowDirectMessages] = useState<'everyone' | 'connections_only'>(
    user?.privacy?.allowDirectMessages || 'everyone'
  );
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const loadData = async () => {
    try {
      const postsRes = await apiFetch<{ posts: PostItem[] }>('/api/posts?filter=all');
      setMyPosts(postsRes.posts.filter(p => p.authorId === user?.id));

      const connRes = await apiFetch<{ connected: any[] }>('/api/connections');
      setConnections(connRes.connected);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName,
        bio: editBio,
        state: editState,
        city: editCity,
        interests: editInterests,
      });
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrivacy(true);
    try {
      await updatePrivacy({
        profilePublic,
        showOnlineStatus,
        allowDirectMessages,
      });
      setShowPrivacyModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update privacy');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (editInterests.includes(interest)) {
      setEditInterests(editInterests.filter(i => i !== interest));
    } else {
      setEditInterests([...editInterests, interest]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 bg-slate-100 relative overflow-hidden">
          <img
            src={user?.coverImage || '/src/assets/images/lagos_city_vibe_1791742147929.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <img
                src={user?.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                alt={user?.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
              />
              {user?.verified && (
                <span
                  className="absolute bottom-1 right-1 bg-[#008751] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-xs"
                  title="Verified Nigerian Profile"
                >
                  ✓
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="p-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                title="Account Privacy Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Name & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.name}</h1>
              {user?.role === 'admin' && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Admin Officer
                </span>
              )}
            </div>

            {/* Zero-Pill Metadata */}
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span>@{user?.username}</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1 font-medium text-emerald-800">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user?.city}, {user?.state}</span>
              </div>
              <span aria-hidden="true">·</span>
              <span>Age {user?.age}</span>
              <span aria-hidden="true">·</span>
              <span>Joined {new Date(user?.createdAt || '').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-4 text-xs sm:text-sm text-slate-700 max-w-2xl leading-relaxed">
            {user?.bio || 'Proud Nigerian citizen on NaijaConnect.'}
          </p>

          {/* Interests */}
          {user?.interests && user.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Interests:</span>
              {user.interests.map((int) => (
                <span key={int} className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {int}
                </span>
              ))}
            </div>
          )}

          {/* Privacy badge indicator */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Profile visibility: {user?.privacy?.profilePublic ? 'Public' : 'Connections Only'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct messages: {user?.privacy?.allowDirectMessages === 'everyone' ? 'Everyone' : 'Connections Only'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: My Posts vs Connections */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'posts'
              ? 'border-[#008751] text-[#008751]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>My Posts ({myPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'connections'
              ? 'border-[#008751] text-[#008751]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Connections ({connections.length})</span>
        </button>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'posts' ? (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-xs text-slate-400">
              You haven't published any posts yet.
            </div>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-800">{post.stateTag}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">{post.content}</p>
                {post.mediaUrl && (
                  <div className="rounded-xl overflow-hidden max-h-64 mt-2">
                    <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="pt-2 text-xs text-slate-500 flex items-center gap-4">
                  <span>❤️ {post.likesCount} likes</span>
                  <span>💬 {post.commentsCount} comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {connections.length === 0 ? (
            <div className="col-span-2 bg-white rounded-2xl p-10 text-center border border-slate-200 text-xs text-slate-400">
              No approved connections yet. Visit Find People to build your circle!
            </div>
          ) : (
            connections.map((c) => (
              <div key={c.connectionId} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={c.user.avatar} alt={c.user.name} className="w-12 h-12 rounded-full object-cover border" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.user.name}</h4>
                    <p className="text-[11px] text-slate-500">{c.user.city}, {c.user.state}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToChat && onNavigateToChat(c.user.id)}
                  className="p-2 text-xs font-semibold text-[#008751] hover:bg-emerald-50 rounded-lg flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Biography</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <select
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Interests</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {POPULAR_INTERESTS.map((interest) => {
                    const isSelected = editInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-[#008751] text-white border-[#008751]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#008751] rounded-xl hover:bg-[#007043]"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#008751]" />
                Account Privacy Settings
              </h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrivacy} className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Public Profile</h4>
                  <p className="text-[11px] text-slate-500">Allow people across Nigeria to discover you</p>
                </div>
                <input
                  type="checkbox"
                  checked={profilePublic}
                  onChange={(e) => setProfilePublic(e.target.checked)}
                  className="w-4 h-4 accent-[#008751]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Show Online Status</h4>
                  <p className="text-[11px] text-slate-500">Display green indicator when you are active</p>
                </div>
                <input
                  type="checkbox"
                  checked={showOnlineStatus}
                  onChange={(e) => setShowOnlineStatus(e.target.checked)}
                  className="w-4 h-4 accent-[#008751]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Who can message you directly?</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="radio"
                      name="dmPolicy"
                      value="everyone"
                      checked={allowDirectMessages === 'everyone'}
                      onChange={() => setAllowDirectMessages('everyone')}
                      className="accent-[#008751]"
                    />
                    <span>Everyone on NaijaConnect</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="radio"
                      name="dmPolicy"
                      value="connections_only"
                      checked={allowDirectMessages === 'connections_only'}
                      onChange={() => setAllowDirectMessages('connections_only')}
                      className="accent-[#008751]"
                    />
                    <span>Approved connections only</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrivacy}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#008751] rounded-xl hover:bg-[#007043]"
                >
                  {savingPrivacy ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
