import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, PostItem, PostCommentItem } from '../../lib/api.ts';
import { NIGERIAN_STATES } from '../../data/nigeriaStates.ts';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Image as ImageIcon,
  Send,
  Flag,
  MapPin,
  Sparkles,
  ChevronDown,
  Check,
  ShieldAlert
} from 'lucide-react';

export const FeedView: React.FC<{ onNavigateToChat?: (userId: string) => void }> = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'connections' | 'my_state'>('all');
  const [selectedState, setSelectedState] = useState<string>('All');

  // New Post Form
  const [content, setContent] = useState('');
  const [postState, setPostState] = useState(user?.state || 'Lagos');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active comments accordion
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostCommentItem[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Report modal
  const [reportingPost, setReportingPost] = useState<PostItem | null>(null);
  const [reportReason, setReportReason] = useState('Spam or Inappropriate Content');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Fetch posts
  const loadPosts = async () => {
    try {
      let url = `/api/posts?filter=${filter}`;
      if (selectedState !== 'All') {
        url += `&state=${encodeURIComponent(selectedState)}`;
      }
      const res = await apiFetch<{ posts: PostItem[] }>(url);
      setPosts(res.posts);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filter, selectedState]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<{ post: PostItem }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          stateTag: postState,
        }),
      });

      setPosts([res.post, ...posts]);
      setContent('');
      setMediaUrl('');
      setShowImageInput(false);
    } catch (err: any) {
      alert(err.message || 'Could not publish post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await apiFetch<{ liked: boolean; likesCount: number }>(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: res.liked,
              likesCount: res.likesCount,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await apiFetch<{ comments: PostCommentItem[] }>(`/api/posts/${postId}/comments`);
        setCommentsMap(prev => ({ ...prev, [postId]: res.comments }));
      } catch (err) {
        console.error('Failed to load comments', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    try {
      const res = await apiFetch<{ comment: PostCommentItem; commentsCount: number }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));

      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, commentsCount: res.commentsCount } : p))
      );

      setCommentInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;

    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          reportedPostId: reportingPost.id,
          reportedUserId: reportingPost.authorId,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportingPost(null);
        setReportSubmitted(false);
        setReportDetails('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      
      {/* Feed Filters Segmented Control */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Nigeria 🇳🇬
          </button>
          <button
            onClick={() => setFilter('connections')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              filter === 'connections'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Connections
          </button>
          <button
            onClick={() => setFilter('my_state')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              filter === 'my_state'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {user?.state || 'My State'}
          </button>
        </div>

        {/* State Dropdown Selector */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#008751]"
        >
          <option value="All">All States (36+FCT)</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Post Composer Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <img
            src={user?.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
            alt={user?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
          />
          <div className="flex-1">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share what is happening in ${user?.city || 'Nigeria'}, ${user?.name?.split(' ')[0] || ''}...`}
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#008751] focus:ring-1 focus:ring-[#008751] resize-none"
            />
          </div>
        </div>

        {/* Image Attachment Input if toggled */}
        {showImageInput && (
          <div className="pl-13 pr-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Paste an image URL (e.g. /src/assets/images/lagos_city_vibe_1791742147929.jpg)"
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#008751]"
              />
              <button
                type="button"
                onClick={() => setMediaUrl('/src/assets/images/lagos_city_vibe_1791742147929.jpg')}
                className="text-[11px] bg-emerald-50 text-[#008751] px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium whitespace-nowrap"
              >
                Sample Photo
              </button>
            </div>
            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden max-h-48 border border-slate-200">
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Composer Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 pl-13">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#008751] p-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <ImageIcon className="w-4 h-4 text-[#008751]" />
              <span>{showImageInput ? 'Hide Photo' : 'Add Photo'}</span>
            </button>

            {/* State tag for the post */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={postState}
                onChange={(e) => setPostState(e.target.value)}
                className="text-xs bg-transparent border-0 text-slate-700 font-medium focus:ring-0 cursor-pointer"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={submitting || !content.trim()}
            className="px-4 py-2 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition disabled:opacity-50 shadow-xs flex items-center gap-1.5"
          >
            <span>{submitting ? 'Sharing...' : 'Publish'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-200 rounded" />
                  <div className="w-20 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 space-y-3">
          <div className="text-3xl">🇳🇬</div>
          <h3 className="text-base font-bold text-slate-800">No posts in this stream yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to share an update, business inquiry, or greeting from your state!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
            >
              {/* Post Header */}
              <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author?.avatar || '/src/assets/images/avatar_emeka_okonkwo_1791742170390.jpg'}
                    alt={post.author?.name || 'Member'}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{post.author?.name}</span>
                      {post.author?.verified && (
                        <span className="text-[#008751]" title="Verified Nigerian Profile">
                          ✓
                        </span>
                      )}
                    </div>
                    {/* Zero-Pill Metadata */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>@{post.author?.username}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium">{post.stateTag || post.author?.state}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Options: Delete if author/admin or Report */}
                <div className="flex items-center gap-1">
                  {post.authorId === user?.id || user?.role === 'admin' ? (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => setReportingPost(post)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    title="Report post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Post Body */}
              <div className="px-4 sm:px-5 pb-3 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {post.content}
              </div>

              {/* Post Media Attachment */}
              {post.mediaUrl && (
                <div className="w-full bg-slate-100 max-h-96 overflow-hidden border-y border-slate-100">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Engagement Stats & Actions Bar */}
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 font-medium transition ${
                      post.hasLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span className="tabular-nums">{post.likesCount}</span>
                  </button>

                  {/* Comment Toggle */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-[#008751] transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="tabular-nums">{post.commentsCount}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'NaijaConnect Post',
                          text: post.content,
                          url: window.location.href,
                        }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Post link copied to clipboard!');
                      }
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 p-1 rounded-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>

              {/* Comments Section Accordion */}
              {activeCommentPostId === post.id && (
                <div className="bg-slate-50/70 border-t border-slate-100 p-4 space-y-3">
                  {/* Comment Input */}
                  <div className="flex items-center gap-2">
                    <img
                      src={user?.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                      alt={user?.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      placeholder="Write a comment..."
                      className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-[#008751]"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={commentLoading || !commentInput.trim()}
                      className="p-2 rounded-xl bg-[#008751] text-white hover:bg-[#007043] transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Comment List */}
                  <div className="space-y-2.5 pt-2">
                    {commentsMap[post.id]?.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      commentsMap[post.id]?.map((cmt) => (
                        <div key={cmt.id} className="flex items-start gap-2 text-xs">
                          <img
                            src={cmt.author?.avatar || '/src/assets/images/avatar_emeka_okonkwo_1791742170390.jpg'}
                            alt={cmt.author?.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{cmt.author?.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">{cmt.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Safety Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Report Content to Moderation</span>
              </div>
              <button
                onClick={() => setReportingPost(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center text-xs text-[#008751] font-semibold">
                ✓ Report submitted. Thank you for protecting the NaijaConnect community.
              </div>
            ) : (
              <form onSubmit={submitReport} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Spam or Inappropriate Content">Spam or Inappropriate Content</option>
                    <option value="Hate Speech or Tribal Discrimination">Hate Speech or Tribal Discrimination</option>
                    <option value="Harassment or Impersonation">Harassment or Impersonation</option>
                    <option value="Fraud or Scams">Fraud or Scams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional details
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe why this content violates One Nigeria community standards..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingPost(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
