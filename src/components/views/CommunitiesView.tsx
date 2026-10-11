import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, CommunityItem, PostItem } from '../../lib/api.ts';
import {
  Users,
  Compass,
  Plus,
  Check,
  MessageSquare,
  Sparkles,
  MapPin,
  ArrowRight,
  Send,
  X
} from 'lucide-react';

export const CommunitiesView: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([]);
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New post in community
  const [postContent, setPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const CATEGORIES = ['All', 'States', 'Professional', 'Entertainment', 'Education'];

  const loadCommunities = async () => {
    try {
      const res = await apiFetch<{ communities: CommunityItem[] }>('/api/communities');
      setCommunities(res.communities);
    } catch (err) {
      console.error('Failed to load communities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoin = async (comm: CommunityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiFetch<{ membersCount: number }>(`/api/communities/${comm.id}/join`, {
        method: 'POST',
      });
      setCommunities(prev =>
        prev.map(c => (c.id === comm.id ? { ...c, isMember: true, membersCount: res.membersCount } : c))
      );
      if (selectedCommunity?.id === comm.id) {
        setSelectedCommunity(prev => (prev ? { ...prev, isMember: true, membersCount: res.membersCount } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Could not join');
    }
  };

  const handleLeave = async (comm: CommunityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiFetch<{ membersCount: number }>(`/api/communities/${comm.id}/leave`, {
        method: 'POST',
      });
      setCommunities(prev =>
        prev.map(c => (c.id === comm.id ? { ...c, isMember: false, membersCount: res.membersCount } : c))
      );
      if (selectedCommunity?.id === comm.id) {
        setSelectedCommunity(prev => (prev ? { ...prev, isMember: false, membersCount: res.membersCount } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Could not leave');
    }
  };

  const openCommunityDetail = async (comm: CommunityItem) => {
    setSelectedCommunity(comm);
    setLoadingDetails(true);
    try {
      const res = await apiFetch<{ community: CommunityItem; posts: PostItem[]; members: any[] }>(
        `/api/communities/${comm.slug}`
      );
      setSelectedCommunity(res.community);
      setCommunityPosts(res.posts);
      setCommunityMembers(res.members);
    } catch (err) {
      console.error('Failed to load community details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateCommunityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !selectedCommunity) return;

    setSubmittingPost(true);
    try {
      const res = await apiFetch<{ post: PostItem }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: postContent.trim(),
          communityId: selectedCommunity.id,
          stateTag: selectedCommunity.stateTag || user?.state,
        }),
      });

      setCommunityPosts([res.post, ...communityPosts]);
      setPostContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to post in community');
    } finally {
      setSubmittingPost(false);
    }
  };

  const filteredCommunities =
    selectedCategory === 'All'
      ? communities
      : communities.filter(c => c.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Nigerian Communities 🇳🇬</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect around shared roots, professions, universities, and passions across Nigeria.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#008751] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-48 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommunities.map((comm) => (
            <div
              key={comm.id}
              onClick={() => openCommunityDetail(comm)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008751]/60 transition overflow-hidden cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Banner */}
                <div className="h-28 bg-slate-100 relative overflow-hidden">
                  {comm.banner ? (
                    <img src={comm.banner} alt={comm.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-[#008751] flex items-center justify-center text-white text-3xl">
                      🇳🇬
                    </div>
                  )}
                  <span className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {comm.category}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#008751] transition">
                    {comm.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {comm.description}
                  </p>
                </div>
              </div>

              {/* Bottom Metadata & Join Action */}
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {comm.membersCount} members
                </span>

                {comm.isMember ? (
                  <button
                    onClick={(e) => handleLeave(comm, e)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-[#008751] border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                  >
                    Joined ✓
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleJoin(comm, e)}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-[#008751] text-white hover:bg-[#007043] transition shadow-2xs"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="relative h-36 bg-emerald-900 shrink-0">
              {selectedCommunity.banner ? (
                <img src={selectedCommunity.banner} alt={selectedCommunity.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#008751]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-4 text-white">
                <div>
                  <h2 className="text-lg font-bold">{selectedCommunity.name}</h2>
                  <p className="text-xs text-emerald-200">{selectedCommunity.membersCount} active members</p>
                </div>
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedCommunity.description}
              </p>

              {/* Discussion Composer */}
              <form onSubmit={handleCreateCommunityPost} className="space-y-2">
                <textarea
                  rows={2}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`Start a discussion in ${selectedCommunity.name}...`}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#008751] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingPost || !postContent.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#008751] hover:bg-[#007043] rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Post Discussion</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Discussions List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Community Discussions
                </h4>

                {loadingDetails ? (
                  <div className="text-center py-6 text-xs text-slate-400">Loading discussions...</div>
                ) : communityPosts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No discussions posted yet. Start one above!
                  </div>
                ) : (
                  communityPosts.map((post) => (
                    <div key={post.id} className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author?.avatar || '/src/assets/images/avatar_emeka_okonkwo_1791742170390.jpg'}
                          alt={post.author?.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-900">{post.author?.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
