import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, UserProfile } from '../../lib/api.ts';
import { NIGERIAN_STATES, POPULAR_INTERESTS } from '../../data/nigeriaStates.ts';
import {
  Search,
  MapPin,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Flag,
  Shield,
  Filter,
  X
} from 'lucide-react';

export const PeopleView: React.FC<{ onStartChat?: (userId: string) => void }> = ({ onStartChat }) => {
  const { user, refreshMe } = useAuth();
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(75);
  const [showFilters, setShowFilters] = useState(false);

  // Action status tracker
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Report Modal
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [reportReason, setReportReason] = useState('Suspicious Profile');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const fetchPeople = async () => {
    try {
      let query = `/api/people?search=${encodeURIComponent(search)}`;
      if (selectedState !== 'All') query += `&state=${encodeURIComponent(selectedState)}`;
      if (selectedInterest !== 'All') query += `&interest=${encodeURIComponent(selectedInterest)}`;
      query += `&minAge=${minAge}&maxAge=${maxAge}`;

      const res = await apiFetch<{ people: UserProfile[] }>(query);
      setPeople(res.people);
    } catch (err) {
      console.error('Failed to load people', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [selectedState, selectedInterest, minAge, maxAge]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPeople();
  };

  // Connection handlers
  const handleConnect = async (targetId: string) => {
    setActionInProgress(targetId);
    try {
      const res = await apiFetch<{ connection: any }>('/api/connections/request', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: targetId }),
      });
      setPeople(prev =>
        prev.map(p => (p.id === targetId ? { ...p, connectionStatus: 'pending_sent', connectionId: res.connection.id } : p))
      );
      await refreshMe();
    } catch (err: any) {
      alert(err.message || 'Error sending request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAccept = async (targetId: string, connectionId?: string) => {
    if (!connectionId) return;
    setActionInProgress(targetId);
    try {
      await apiFetch('/api/connections/accept', {
        method: 'POST',
        body: JSON.stringify({ connectionId }),
      });
      setPeople(prev =>
        prev.map(p => (p.id === targetId ? { ...p, connectionStatus: 'connected' } : p))
      );
      await refreshMe();
    } catch (err: any) {
      alert(err.message || 'Error accepting request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineOrCancel = async (targetId: string, connectionId?: string) => {
    if (!connectionId) return;
    setActionInProgress(targetId);
    try {
      await apiFetch('/api/connections/decline', {
        method: 'POST',
        body: JSON.stringify({ connectionId }),
      });
      setPeople(prev =>
        prev.map(p => (p.id === targetId ? { ...p, connectionStatus: 'none', connectionId: undefined } : p))
      );
      await refreshMe();
    } catch (err: any) {
      alert(err.message || 'Error updating request');
    } finally {
      setActionInProgress(null);
    }
  };

  const submitUserReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingUser) return;
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          reportedUserId: reportingUser.id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportingUser(null);
        setReportSubmitted(false);
        setReportDetails('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      
      {/* Header & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Find Love Across Nigeria 🇳🇬</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover verified singles ready for meaningful relationships, love, and companionship across all 36 states and the FCT.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, @username, or city (e.g. Lekki, Maitama, Warri)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#008751]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
              showFilters ? 'bg-emerald-50 border-[#008751] text-[#008751]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </form>

        {/* Expandable Filter Drawer */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* State Filter */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State / FCT</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="All">All 36 States & FCT</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Interest Filter */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interest / Sector</label>
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="All">All Interests</option>
                {POPULAR_INTERESTS.map((int) => (
                  <option key={int} value={int}>
                    {int}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Range */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Age Range</span>
                <span className="text-[#008751] font-mono">{minAge} - {maxAge} yrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={13}
                  max={60}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full accent-[#008751]"
                />
                <input
                  type="range"
                  min={25}
                  max={90}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-[#008751]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-24 mx-auto" />
              <div className="h-3 bg-slate-100 rounded w-32 mx-auto" />
            </div>
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-slate-800">No members match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your state filter, age range, or search keywords to explore more members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008751]/40 transition overflow-hidden flex flex-col justify-between"
            >
              {/* Card Body */}
              <div className="p-5 text-center">
                <div className="relative inline-block mb-3">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm mx-auto"
                  />
                  {p.verified && (
                    <span
                      className="absolute bottom-0 right-1 bg-[#008751] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
                      title="Verified Nigerian Profile"
                    >
                      ✓
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                
                {/* Zero-Pill Metadata */}
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  <span>@{p.username}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium text-emerald-800">{p.state}</span>
                </div>

                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 text-[#008751]" />
                  <span>{p.city}, {p.state}</span>
                  <span aria-hidden="true">·</span>
                  <span>{p.age} yrs</span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 text-left bg-slate-50 p-2.5 rounded-xl">
                  {p.bio || 'Proud Nigerian connecting on NaijaConnect.'}
                </p>

                {/* Interests Tags (Unboxed Text or subtle buttons) */}
                {p.interests && p.interests.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-500 text-left line-clamp-1">
                    <span className="font-semibold text-slate-700">Interests: </span>
                    {p.interests.slice(0, 3).join(' · ')}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                {/* Connect State Button */}
                {p.connectionStatus === 'connected' ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => onStartChat && onStartChat(p.id)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#008751] text-white text-xs font-semibold hover:bg-[#007043] transition flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                    <button
                      onClick={() => handleDeclineOrCancel(p.id, p.connectionId)}
                      className="py-1.5 px-2 text-slate-400 hover:text-slate-600 text-xs rounded-lg"
                      title="Disconnect"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : p.connectionStatus === 'pending_sent' ? (
                  <button
                    onClick={() => handleDeclineOrCancel(p.id, p.connectionId)}
                    disabled={actionInProgress === p.id}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Sent (Cancel)</span>
                  </button>
                ) : p.connectionStatus === 'pending_received' ? (
                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => handleAccept(p.id, p.connectionId)}
                      disabled={actionInProgress === p.id}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineOrCancel(p.id, p.connectionId)}
                      disabled={actionInProgress === p.id}
                      className="py-1.5 px-2 rounded-xl border border-slate-200 text-slate-600 text-xs hover:bg-slate-100"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => handleConnect(p.id)}
                      disabled={actionInProgress === p.id}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#008751] transition flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => setReportingUser(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 ml-1 rounded-lg"
                      title="Report account"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Report Modal for User */}
      {reportingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-rose-600" />
                Report @{reportingUser.username}
              </h3>
              <button onClick={() => setReportingUser(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center text-xs text-[#008751] font-semibold">
                ✓ Account reported. Our compliance officers will review within 24 hours.
              </div>
            ) : (
              <form onSubmit={submitUserReport} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Suspicious Profile / Impersonation">Suspicious Profile / Impersonation</option>
                    <option value="Financial Scam / Advance Fee Fraud">Financial Scam / Advance Fee Fraud</option>
                    <option value="Harassment / Unwanted Contact">Harassment / Unwanted Contact</option>
                    <option value="Inappropriate Content">Inappropriate Content</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Details</label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide details of the suspicious behavior..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingUser(null)}
                    className="px-3 py-1.5 text-xs text-slate-600"
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
