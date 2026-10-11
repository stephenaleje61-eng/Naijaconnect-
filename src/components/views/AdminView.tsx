import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, UserProfile } from '../../lib/api.ts';
import {
  ShieldAlert,
  Users,
  FileText,
  MessageSquare,
  Activity,
  CheckCircle,
  AlertTriangle,
  UserX,
  UserCheck,
  Trash2,
  Lock,
  Server
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalPosts: number;
  totalMessages: number;
  totalCommunities: number;
  pendingReports: number;
}

export const AdminView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'health'>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const overviewRes = await apiFetch<{
        metrics: AdminMetrics;
        recentUsers: UserProfile[];
        auditLogs: any[];
      }>('/api/admin/overview');

      setMetrics(overviewRes.metrics);
      setRecentUsers(overviewRes.recentUsers);
      setAuditLogs(overviewRes.auditLogs);

      const reportsRes = await apiFetch<{ reports: any[] }>('/api/admin/reports');
      setReports(reportsRes.reports);

      const healthRes = await apiFetch<any>('/api/admin/health');
      setHealthData(healthRes);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrative Access Required</h2>
        <p className="text-xs text-slate-500">
          This portal is restricted to authorized NaijaConnect safety and compliance administrators.
        </p>
      </div>
    );
  }

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ status, actionNotes: `Resolved by ${user.name}` }),
      });
      setReports(prev => prev.map(r => (r.id === reportId ? { ...r, status } : r)));
    } catch (err: any) {
      alert(err.message || 'Error resolving report');
    }
  };

  const handleSuspendUser = async (targetUserId: string) => {
    if (!confirm('Suspend this user account? They will be immediately logged out.')) return;
    try {
      await apiFetch(`/api/admin/users/${targetUserId}/suspend`, { method: 'POST' });
      setRecentUsers(prev => prev.map(u => (u.id === targetUserId ? { ...u, isSuspended: true } : u)));
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error suspending user');
    }
  };

  const handleRestoreUser = async (targetUserId: string) => {
    try {
      await apiFetch(`/api/admin/users/${targetUserId}/restore`, { method: 'POST' });
      setRecentUsers(prev => prev.map(u => (u.id === targetUserId ? { ...u, isSuspended: false } : u)));
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error restoring user');
    }
  };

  const handleDeleteViolatingPost = async (postId: string) => {
    if (!confirm('Delete this violating post permanently?')) return;
    try {
      await apiFetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      alert('Post deleted from database.');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error deleting post');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#008751] uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>NaijaConnect Trust & Safety Command</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Platform Moderation & Security</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Reports</span>
            {metrics && metrics.pendingReports > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                {metrics.pendingReports}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'health' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Health
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Users</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {metrics?.totalUsers ?? '...'}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Across 36 States + FCT</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Active Posts</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {metrics?.totalPosts ?? '...'}
              </div>
              <span className="text-[11px] text-slate-400">Community discussions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Direct Messages</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {metrics?.totalMessages ?? '...'}
              </div>
              <span className="text-[11px] text-slate-400">Persistent chats</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Pending Reports</span>
              <div className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums">
                {metrics?.pendingReports ?? '0'}
              </div>
              <span className="text-[11px] text-rose-600 font-medium">Requires audit review</span>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Administrative Audit Activity</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 py-4">No security audit actions recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-500 ml-2">{log.details}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Center */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Member Reports & Safety Claims</h3>
            <span className="text-xs text-slate-500">{reports.length} total reports</span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No reports filed. The community is healthy!
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{r.reason}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'pending' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{r.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Reported Targets */}
                  <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span>Reported by: <strong>{r.reporter?.name}</strong></span>
                      {r.reportedUser && (
                        <span className="ml-3">Target User: <strong>@{r.reportedUser.username}</strong></span>
                      )}
                      {r.reportedPost && (
                        <span className="ml-3">Post: "{r.reportedPost.content.substring(0, 30)}..."</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {r.reportedPost && (
                        <button
                          onClick={() => handleDeleteViolatingPost(r.reportedPost.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                        >
                          Delete Post
                        </button>
                      )}
                      {r.reportedUser && (
                        <button
                          onClick={() => handleSuspendUser(r.reportedUser.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50"
                        >
                          Suspend User
                        </button>
                      )}
                      <button
                        onClick={() => handleResolveReport(r.id, 'action_taken')}
                        className="px-3 py-1 text-[11px] font-bold text-white bg-[#008751] rounded-lg hover:bg-[#007043]"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Nigerian Members</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="text-slate-400">@{u.username}</span>
                      {u.isSuspended && (
                        <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {u.city}, {u.state} · Age {u.age} · {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.role !== 'admin' && (
                    u.isSuspended ? (
                      <button
                        onClick={() => handleRestoreUser(u.id)}
                        className="px-3 py-1 text-xs font-semibold text-[#008751] border border-emerald-300 rounded-lg hover:bg-emerald-50"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendUser(u.id)}
                        className="px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                      >
                        Suspend
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#008751]">
            <Server className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">Database & System Health Logs</h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
            <div>Status: <span className="text-[#008751] font-bold">{healthData?.status || 'OK'}</span></div>
            <div>Node Uptime: {Math.round(healthData?.uptime || 0)} seconds</div>
            <div>Server Timestamp: {healthData?.timestamp}</div>
            <div>Database Records: {JSON.stringify(healthData?.recordCounts || {})}</div>
          </div>
        </div>
      )}
    </div>
  );
};
