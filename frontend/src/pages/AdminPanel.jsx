import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Users, FileText, Trash2, Shield, ShieldOff, BarChart3, Bug,
  FolderOpen, MessageSquare, Zap, Activity, Settings,
  Cpu, AlertCircle, Save, CheckCircle, Clock, X, Brain,
  UserX, UserCheck, Lock, History, Database, Mail, Eye
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ReviewInspectorModal from '../components/ReviewInspectorModal';

const AdminPanel = () => {
  const { theme } = useContext(ThemeContext);
  const { user: currentUser } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'stats';
  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Unified Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [fetchingReview, setFetchingReview] = useState(false);

  const fetchData = async () => {
    try {
      if (tab === 'stats') {
        const { data } = await axios.get('/api/admin/stats');
        setStats(data);
      } else if (tab === 'users') {
        const { data } = await axios.get('/api/admin/users');
        setUsers(data);
      } else if (tab === 'reviews') {
        const { data } = await axios.get('/api/admin/reviews');
        setReviews(data);
      } else if (tab === 'settings') {
        const { data } = await axios.get('/api/admin/settings');
        setSettings(data);
      } else if (tab === 'ai-insights') {
        const { data: statsData } = await axios.get('/api/admin/stats');
        setStats(statsData);
        try {
          const { data: logData } = await axios.get('/api/ai-logs');
          setAiLogs(logData.logs || logData || []);
        } catch (e) {
          console.warn('Could not fetch AI logs feed');
        }
      } else if (tab === 'audit') {
        setLoadingAudit(true);
        const { data } = await axios.get('/api/admin/audit-logs');
        setAuditLogs(data);
        setLoadingAudit(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [tab]);

  const handleUpdateSettings = async (updates) => {
    setSavingSettings(true);
    try {
      const { data } = await axios.put('/api/admin/settings', { ...settings, ...updates });
      setSettings(data);
    } catch (err) {
      console.error('Settings update error:', err);
      alert('Failed to update system settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleSuspension = async (id, currentStatus) => {
    try {
      const { data } = await axios.put(`/api/admin/users/${id}/suspend`);
      setUsers(users.map(u => u._id === id ? { ...u, isSuspended: data.isSuspended } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Suspension failed');
    }
  };

  const handleDeleteUser = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete User?",
      message: "This will permanently delete the user account and ALL their associated data. This action is irreversible.",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/admin/users/${id}`);
          setUsers(users.filter((u) => u._id !== id));
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { data } = await axios.put(`/api/admin/users/${id}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === id ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteReview = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Review?",
      message: "Are you sure you want to remove this review?",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/admin/reviews/${id}`);
          setReviews(reviews.filter((r) => r._id !== id));
        } catch (err) {
          alert(err.response?.data?.message || 'Error');
        }
      }
    });
  };

  const handleInspectReview = async (id) => {
    try {
      setFetchingReview(true);
      const { data } = await axios.get(`/api/reviews/${id}`);
      setSelectedReview(data);
      setIsInspectorOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Unauthorized: Access restricted to Sovereign Admin.');
    } finally {
      setFetchingReview(false);
    }
  };

  const tabs = [
    { key: 'stats', label: 'Overview', icon: BarChart3 },
    { key: 'ai-insights', label: 'AI Logs', icon: Brain },
    { key: 'audit', label: 'Audit Trail', icon: History },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'reviews', label: 'Reviews', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const colorClasses = {
    primary: { bg: 'bg-primary-500/10', text: theme === 'dark' ? 'text-primary-400' : 'text-primary-600' },
    emerald: { bg: 'bg-emerald-500/10', text: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600' },
    purple: { bg: 'bg-purple-500/10', text: theme === 'dark' ? 'text-purple-400' : 'text-purple-600' },
    yellow: { bg: 'bg-yellow-500/10', text: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600' },
    red: { bg: 'bg-red-500/10', text: theme === 'dark' ? 'text-red-400' : 'text-red-600' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="h-10 mb-2 hidden lg:block"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Governance Node</h1>
          </div>
          <p className="text-sec font-medium">System-level controls and platform intelligence.</p>
        </div>

        {/* Rapid Health Overview */}
        <div className="flex gap-4">
          <div className="glass-panel py-2 px-4 flex items-center gap-3 border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Core Active</span>
          </div>
          <div className="glass-panel py-2 px-4 flex items-center gap-3 border-primary-500/20">
            <div className="h-2 w-2 rounded-full bg-primary-500"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">AI Stable</span>
          </div>
        </div>
      </div>

      {/* Navigation Nodes */}
      <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-col overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.key
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'text-sec hover:text-main'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sec font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizing Data Node...</p>
        </div>
      ) : (
        <>
          {/* Stats Tab */}
          {tab === 'stats' && stats && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Platform Users', value: stats.totalUsers, icon: Users, color: 'primary' },
                  { label: 'Analyses Run', value: stats.totalReviews, icon: Activity, color: 'emerald' },
                  { label: 'Logic Summaries', value: stats.totalFiles, icon: FolderOpen, color: 'purple' },
                  { label: 'Bugs Caught', value: stats.totalBugs, icon: Bug, color: 'red' },
                ].map((s, i) => (
                  <div key={i} className="glass-panel p-6 relative overflow-hidden group hover:border-primary-500/30 transition-all">
                    <div className={`absolute top-0 right-0 p-8 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                      <s.icon className="h-24 w-24" />
                    </div>
                    <p className="text-[10px] text-sec font-black uppercase tracking-[0.2em] mb-3">{s.label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-black text-main">{s.value.toLocaleString()}</p>
                      <div className={`h-10 w-10 ${colorClasses[s.color]?.bg || 'bg-ter'} rounded-xl flex items-center justify-center`}>
                        <s.icon className={`h-5 w-5 ${colorClasses[s.color]?.text || 'text-sec'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Quick Stats Overlay */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" /> Platform Throughput
                    </h3>
                    <span className="text-[10px] font-bold text-sec uppercase tracking-widest">Real-time Metrics</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-sec uppercase">AI Accuracy Rate</p>
                        <p className="text-2xl font-black text-emerald-500">98.4%</p>
                      </div>
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98.4%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-sec uppercase">Token Utilization</p>
                        <p className="text-2xl font-black text-primary-500">{(stats.aiMetrics?.totalTokens / 1000000).toFixed(2)}M</p>
                      </div>
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 border-primary-500/20 bg-primary-500/[0.02]">
                  <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary-500" /> AI Infrastructure
                  </h3>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center text-xs font-bold border-b border-col pb-3">
                      <span className="text-sec uppercase tracking-wider">Primary Model</span>
                      <span className="text-main">Llama 3.3 (70B)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold border-b border-col pb-3">
                      <span className="text-sec uppercase tracking-wider">Avg Latency</span>
                      <span className="text-main">{Math.round(stats.aiMetrics?.avgResponseTime || 1200)}ms</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-sec uppercase tracking-wider">Gateway Status</span>
                      <span className="text-emerald-500 flex items-center gap-1.5 font-black uppercase tracking-widest">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Healthy
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health Section */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-sec uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary-500" />
                  System Vital Signs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'AI Core Bridge', status: 'Operational', icon: Cpu, color: 'text-emerald-500' },
                    { label: 'Database Node', status: 'Connected', icon: Database, color: 'text-blue-500' },
                    { label: 'Mailing Relay', status: 'Active', icon: Mail, color: 'text-purple-500' },
                  ].map((s) => (
                    <div key={s.label} className="glass-panel p-4 flex items-center justify-between border-white/5 bg-white/2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${s.color}`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-main">{s.label}</p>
                          <p className="text-[10px] text-sec font-medium">Status: {s.status}</p>
                        </div>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {tab === 'ai-insights' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-8">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary-500" /> Advanced AI Telemetry & Logs
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {aiLogs.length > 0 ? aiLogs.map((log, i) => (
                      <div key={log._id || i} className="p-4 bg-sec/20 border border-col rounded-xl hover:border-primary-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-main">{log.user?.name || 'System'}</p>
                          </div>
                          <span className="text-[9px] font-bold text-sec bg-dark-600 px-2 py-0.5 rounded">{log.tokensUsed || 0} tkn</span>
                        </div>
                        <p className="text-xs text-sec line-clamp-2 italic mb-3">"{log.prompt.substring(0, 100)}..."</p>
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-sec">
                          <span>{log.model}</span>
                          <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 text-sec text-xs font-bold tracking-widest uppercase">No active intelligence streams</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-panel p-8 bg-black/20">
                    <h3 className="text-xl font-black mb-6">Execution Efficiency</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-dark-700/50 rounded-2xl border border-white/5">
                        <p className="text-3xl font-black text-main">{stats?.aiMetrics?.successCount || 0}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Successful Runs</p>
                      </div>
                      <div className="p-6 bg-dark-700/50 rounded-2xl border border-white/5">
                        <p className="text-3xl font-black text-rose-500">{stats?.aiMetrics?.errorCount || 0}</p>
                        <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest mt-1">Fault Detected</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-panel p-8">
                    <h3 className="text-xl font-black mb-4">Model Heatmap</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-sec/30 p-3 rounded-xl border border-col">
                        <span className="text-xs font-bold text-main uppercase">Llama 3.3 70B</span>
                        <span className="text-xs font-black text-primary-500">92% Usage</span>
                      </div>
                      <div className="flex justify-between items-center bg-sec/30 p-3 rounded-xl border border-col">
                        <span className="text-xs font-bold text-main uppercase">Mixtral 8x7B</span>
                        <span className="text-xs font-black text-sec">8% Usage</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {tab === 'settings' && settings && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="glass-panel overflow-hidden border-orange-500/20">
                <div className="bg-orange-500/10 p-4 border-b border-orange-500/20 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">Global Configuration Node</h3>
                </div>

                <div className="p-8 space-y-10">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between gap-10 pb-10 border-b border-col">
                    <div>
                      <h4 className="text-lg font-black text-main mb-1">Sector Lock (Maintenance)</h4>
                      <p className="text-sm text-sec font-medium leading-relaxed">
                        When active, the platform shifts to read-only status. AI Analysis and Summaries are immediately disabled across all interfaces.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdateSettings({ maintenanceMode: !settings.maintenanceMode })}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all ring-offset-bg duration-300 focus:outline-none ${settings.maintenanceMode ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-dark-600'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* AI Model Selection */}
                  <div className="space-y-4 pb-10 border-b border-col">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-black text-main">System Intelligence Core</h4>
                        <p className="text-sm text-sec font-medium">Define the primary LLM used for platform-wide logic processing.</p>
                      </div>
                    </div>
                    <select
                      value={settings.defaultAiModel}
                      onChange={(e) => handleUpdateSettings({ defaultAiModel: e.target.value })}
                      className="bg-sec border border-col text-main text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block w-full p-3 font-bold uppercase tracking-widest"
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B (32k)</option>
                      <option value="gemma2-9b-it">Gemma 2 9B IT</option>
                    </select>
                  </div>

                  {/* Quotas & Registration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-sec uppercase tracking-[0.2em]">Token Limit (Hard)</h4>
                      <input
                        type="number"
                        value={settings.maxTokensPerReview}
                        onChange={(e) => setSettings({ ...settings, maxTokensPerReview: parseInt(e.target.value) })}
                        onBlur={(e) => handleUpdateSettings({ maxTokensPerReview: parseInt(e.target.value) })}
                        className="bg-sec border border-col text-main text-xl font-black rounded-xl w-full p-4"
                      />
                      <p className="text-[10px] text-sec font-medium">Max completion tokens allowed per individual analysis node.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-sec uppercase tracking-[0.2em]">External Entry (Reg)</h4>
                      <div className="flex items-center justify-between h-14 bg-sec border border-col rounded-xl px-4">
                        <span className="text-xs font-bold text-main uppercase">Registration Enabled</span>
                        <button
                          onClick={() => handleUpdateSettings({ registrationEnabled: !settings.registrationEnabled })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${settings.registrationEnabled ? 'bg-primary-500' : 'bg-dark-600'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <p className="text-[10px] text-sec font-medium">Control if new users can synchronize their profiles with the platform.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && !loading && (
            <div className="glass-panel overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-col text-left bg-sec/30">
                      <th className="p-4 text-sec font-medium uppercase tracking-widest text-[9px]">Name / Intelligence Node</th>
                      <th className="p-4 text-sec font-medium uppercase tracking-widest text-[9px]">Vector Profile</th>
                      <th className="p-4 text-sec font-medium uppercase tracking-widest text-[9px]">Administrative Tier</th>
                      <th className="p-4 text-sec font-medium uppercase tracking-widest text-[9px]">Account Status</th>
                      <th className="p-4 text-sec font-medium uppercase tracking-widest text-[9px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className={`border-b border-col/50 hover:bg-sec/50 transition-colors ${currentUser?._id === u._id ? 'bg-primary-500/[0.03]' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-main flex items-center gap-2">
                                {u.name}
                                {u.isMaster ? (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-500 rounded uppercase border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Sovereign Master</span>
                                ) : currentUser?._id === u._id && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary-500/10 text-primary-500 rounded uppercase border border-primary-500/20">You</span>
                                )}
                              </p>
                              {u.isSuspended && (
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                  <Lock className="h-2 w-2" /> Blocked
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sec font-medium">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'bg-sec text-sec border border-col'}`}>{u.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${u.isSuspended ? 'text-rose-500' : u.isVerified ? 'text-emerald-500' : 'text-orange-500'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${u.isSuspended ? 'bg-rose-500 animate-pulse' : u.isVerified ? 'bg-emerald-500' : 'bg-orange-500 active-pulse'}`}></div>
                            {u.isSuspended ? 'Suspended' : u.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {/* Suspension Toggle */}
                            <button onClick={() => handleToggleSuspension(u._id, u.isSuspended)}
                              disabled={u.isMaster || (u.role === 'admin' && !currentUser?.isMaster)}
                              className={`p-1.5 rounded-lg transition-all ${u.isSuspended ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-rose-500 hover:bg-rose-500/10'} disabled:opacity-20 disabled:cursor-not-allowed`}
                              title={u.isSuspended ? 'Restore Account' : 'Suspend Account'}>
                              {u.isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </button>

                            {/* Role Toggle */}
                            <button onClick={() => handleToggleRole(u._id, u.role)}
                              disabled={u.isMaster || !currentUser?.isMaster}
                              className="p-1.5 text-sec hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                              title={u.role === 'admin' ? 'Demote' : 'Promote'}>
                              {u.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </button>

                            {/* Delete Action */}
                            <button onClick={() => handleDeleteUser(u._id)}
                              disabled={u.isMaster || !currentUser?.isMaster}
                              className="p-1.5 text-sec hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {tab === 'reviews' && (
            <div className="glass-panel overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-col text-left bg-sec/30">
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Title / Workspace</th>
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Lead Analyst</th>
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Syntax Core</th>
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Anomalies Detected</th>
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Date</th>
                      <th className="p-4 text-sec font-black uppercase tracking-widest text-[9px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r._id} className="border-b border-col/50 hover:bg-sec/50 transition-colors">
                        <td className="p-4 font-bold text-main">{r.title}</td>
                        <td className="p-4 text-sec font-medium uppercase text-[10px] tracking-tight">{r.user?.name || 'Unknown Analyst'}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded text-[9px] font-black uppercase">{r.language}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${r.bugsFound > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {r.bugsFound > 0 ? `${r.bugsFound} Major Issues` : 'Clean Core'}
                          </span>
                        </td>
                        <td className="p-4 text-sec font-medium text-[10px]">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleInspectReview(r._id)}
                              className="p-1.5 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all"
                              title="Inspect Code Trace">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteReview(r._id)}
                              className="p-1.5 text-sec hover:text-red-600 hover:bg-red-600/10 rounded-lg transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Audit Trail Tab */}
          {tab === 'audit' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-main">Sovereign Audit Trail</h2>
                  <p className="text-sec font-medium text-sm">Immutable ledger of all administrative activity</p>
                </div>
                <button onClick={fetchData} className="p-2 hover:bg-sec rounded-lg transition-colors text-sec" title="Refresh Logs">
                  <History className={`h-5 w-5 ${loadingAudit ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="glass-panel p-1 border-white/5">
                {auditLogs.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="h-12 w-12 text-sec/20 mx-auto mb-4" />
                    <p className="text-sec font-bold">No audit entries found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${log.action.includes('DELETE') ? 'bg-rose-500/10 text-rose-500' :
                                log.action.includes('SUSPEND') ? 'bg-amber-500/10 text-amber-500' :
                                  log.action.includes('SETTINGS') ? 'bg-primary-500/10 text-primary-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                              }`}>
                              {log.action.includes('DELETE') ? <Trash2 className="h-4 w-4" /> :
                                log.action.includes('UPDATE_ROLE') ? <Shield className="h-4 w-4" /> :
                                  log.action.includes('SETTINGS') ? <Settings className="h-4 w-4" /> :
                                    <Activity className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-main leading-relaxed">
                                {log.details}
                                <span className="ml-3 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-sec tracking-widest">
                                  {log.action.replace('_', ' ')}
                                </span>
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-sec font-medium">
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3 text-primary-500" />
                                  <span className="text-primary-500 font-bold">{log.actor?.name || 'System'}</span>
                                </span>
                                {log.targetUser && (
                                  <>
                                    <span className="h-1 w-1 bg-white/10 rounded-full"></span>
                                    <span>Target Index: {log.targetUser.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <p className="text-[10px] text-sec font-black uppercase tracking-[0.15em] whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-sec/40 font-mono tracking-tighter">NODE_IP: {log.ipAddress || 'INTERNAL'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />

      <ReviewInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        review={selectedReview}
      />
    </div>
  );
};

export default AdminPanel;
