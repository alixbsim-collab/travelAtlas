import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Shield, Clock, CheckCircle, XCircle, Users, FileText, Map,
  Eye, Search, AlertTriangle,
} from 'lucide-react';
import {
  getAdminStats, getPendingAtlasFiles, getPendingItineraries,
  getAllAtlasFiles, approveAtlasFile, rejectAtlasFile,
  approveItinerary, rejectItinerary, getUsers, updateUserRole,
} from '../api/admin';

const STATUS_BADGES = {
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
  draft: { bg: 'bg-platinum-100', text: 'text-platinum-600', label: 'Draft' },
};

function StatusBadge({ status }) {
  const config = STATUS_BADGES[status] || STATUS_BADGES.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {status === 'pending' && <Clock size={10} />}
      {status === 'approved' && <CheckCircle size={10} />}
      {status === 'rejected' && <XCircle size={10} />}
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-charcoal-500">{value}</p>
        <p className="text-sm text-platinum-600">{label}</p>
      </div>
    </Card>
  );
}

function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingAtlas, setPendingAtlas] = useState([]);
  const [pendingItins, setPendingItins] = useState([]);
  const [allAtlas, setAllAtlas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingA, pendingI] = await Promise.all([
        getAdminStats(),
        getPendingAtlasFiles(),
        getPendingItineraries(),
      ]);
      setStats(statsData);
      setPendingAtlas(pendingA || []);
      setPendingItins(pendingI || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
    setLoading(false);
  };

  const fetchAllContent = async () => {
    try {
      const data = await getAllAtlasFiles();
      setAllAtlas(data || []);
    } catch (err) {
      console.error('Error fetching all content:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'content' && allAtlas.length === 0) fetchAllContent();
    if (tab === 'users' && users.length === 0) fetchUsers();
  };

  const handleApproveAtlas = async (id) => {
    await approveAtlasFile(id);
    setPendingAtlas(prev => prev.filter(f => f.id !== id));
    setStats(prev => prev ? { ...prev, pending_atlas: prev.pending_atlas - 1, total_pending: prev.total_pending - 1 } : prev);
  };

  const handleRejectAtlas = async (id) => {
    await rejectAtlasFile(id);
    setPendingAtlas(prev => prev.filter(f => f.id !== id));
    setStats(prev => prev ? { ...prev, pending_atlas: prev.pending_atlas - 1, total_pending: prev.total_pending - 1 } : prev);
  };

  const handleApproveItin = async (id) => {
    await approveItinerary(id);
    setPendingItins(prev => prev.filter(f => f.id !== id));
    setStats(prev => prev ? { ...prev, pending_itineraries: prev.pending_itineraries - 1, total_pending: prev.total_pending - 1 } : prev);
  };

  const handleRejectItin = async (id) => {
    await rejectItinerary(id);
    setPendingItins(prev => prev.filter(f => f.id !== id));
    setStats(prev => prev ? { ...prev, pending_itineraries: prev.pending_itineraries - 1, total_pending: prev.total_pending - 1 } : prev);
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateUserRole(userId, newRole);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400" />
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin) return null;

  const filteredAtlas = allAtlas.filter(f => {
    const matchesSearch = !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.moderation_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tabs = [
    { id: 'pending', label: 'Pending Reviews', icon: Clock, count: stats?.total_pending },
    { id: 'content', label: 'All Content', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-charcoal-500 flex items-center justify-center">
            <Shield size={22} className="text-naples-400" />
          </div>
          <div>
            <h1 className="text-3xl text-charcoal-500">Admin Dashboard</h1>
            <p className="text-platinum-600">Manage content, users, and moderation</p>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard icon={AlertTriangle} label="Pending Review" value={stats.total_pending} color="bg-amber-100 text-amber-700" />
            <StatCard icon={FileText} label="Atlas Files" value={stats.total_atlas_files} color="bg-columbia-100 text-columbia-700" />
            <StatCard icon={Map} label="Itineraries" value={stats.total_itineraries} color="bg-coral-50 text-coral-600" />
            <StatCard icon={Users} label="Users" value={stats.total_users} color="bg-naples-100 text-naples-700" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-platinum-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-charcoal-500 shadow-sm'
                  : 'text-platinum-600 hover:text-charcoal-400'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-coral-400 text-white text-xs font-semibold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: Pending Reviews */}
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {/* Pending Atlas Files */}
            <div>
              <h2 className="text-lg font-semibold text-charcoal-500 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-columbia-500" />
                Pending Atlas Files ({pendingAtlas.length})
              </h2>
              {pendingAtlas.length === 0 ? (
                <Card><p className="text-platinum-600 text-center py-8">No pending atlas files</p></Card>
              ) : (
                <div className="space-y-3">
                  {pendingAtlas.map(file => (
                    <Card key={file.id} className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-charcoal-500 truncate">{file.title}</h3>
                          <StatusBadge status="pending" />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-platinum-600">
                          {file.destination && <span>{file.destination}</span>}
                          {file.author && <span>by {file.author}</span>}
                          <span>{new Date(file.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/atlas/${file.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Eye size={14} /> Preview
                          </Button>
                        </Link>
                        <Button size="sm" onClick={() => handleApproveAtlas(file.id)} className="gap-1.5 bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectAtlas(file.id)} className="gap-1.5 text-red-600 hover:bg-red-50">
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Itineraries */}
            <div>
              <h2 className="text-lg font-semibold text-charcoal-500 mb-4 flex items-center gap-2">
                <Map size={18} className="text-coral-400" />
                Pending Itineraries ({pendingItins.length})
              </h2>
              {pendingItins.length === 0 ? (
                <Card><p className="text-platinum-600 text-center py-8">No pending itineraries</p></Card>
              ) : (
                <div className="space-y-3">
                  {pendingItins.map(itin => (
                    <Card key={itin.id} className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-charcoal-500 truncate">{itin.title}</h3>
                          <StatusBadge status="pending" />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-platinum-600">
                          <span>{itin.destination}</span>
                          <span>{itin.trip_length}d</span>
                          <span>{new Date(itin.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/itinerary/${itin.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Eye size={14} /> Preview
                          </Button>
                        </Link>
                        <Button size="sm" onClick={() => handleApproveItin(itin.id)} className="gap-1.5 bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectItin(itin.id)} className="gap-1.5 text-red-600 hover:bg-red-50">
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: All Content */}
        {activeTab === 'content' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-platinum-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title or destination..."
                  className="w-full pl-9 pr-4 py-2.5 border border-platinum-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-300 text-sm transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-platinum-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-300"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredAtlas.length === 0 ? (
              <Card><p className="text-platinum-600 text-center py-8">No content found</p></Card>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-2 text-xs font-medium text-platinum-500 uppercase tracking-wider">
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Destination</div>
                  <div className="col-span-2">Author</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Updated</div>
                </div>
                {filteredAtlas.map(file => (
                  <Card key={file.id} className="!p-0">
                    <Link to={`/atlas/${file.id}`} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-platinum-50 transition-colors">
                      <div className="col-span-4 font-medium text-charcoal-500 truncate text-sm">{file.title}</div>
                      <div className="col-span-2 text-sm text-platinum-600 truncate">{file.destination}</div>
                      <div className="col-span-2 text-sm text-platinum-600 truncate">{file.author || '—'}</div>
                      <div className="col-span-2"><StatusBadge status={file.moderation_status || 'approved'} /></div>
                      <div className="col-span-2 text-sm text-platinum-500">{new Date(file.updated_at).toLocaleDateString()}</div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Users */}
        {activeTab === 'users' && (
          <div>
            {users.length === 0 ? (
              <Card><p className="text-platinum-600 text-center py-8">Loading users...</p></Card>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 px-5 py-2 text-xs font-medium text-platinum-500 uppercase tracking-wider">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Username</div>
                  <div className="col-span-1">Role</div>
                  <div className="col-span-1">Atlas</div>
                  <div className="col-span-1">Trips</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {users.map(user => (
                  <Card key={user.id} className="!p-0">
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-3 font-medium text-charcoal-500 truncate text-sm">{user.full_name || '—'}</div>
                      <div className="col-span-3 text-sm text-platinum-600 truncate">{user.username || '—'}</div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-naples-100 text-naples-700' : 'bg-platinum-100 text-platinum-600'
                        }`}>
                          {user.role === 'admin' && <Shield size={9} />}
                          {user.role}
                        </span>
                      </div>
                      <div className="col-span-1 text-sm text-platinum-600">{user.atlas_count}</div>
                      <div className="col-span-1 text-sm text-platinum-600">{user.itinerary_count}</div>
                      <div className="col-span-2 text-sm text-platinum-500">{new Date(user.created_at).toLocaleDateString()}</div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          className="text-xs font-medium text-coral-500 hover:text-coral-600 transition-colors"
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default AdminDashboardPage;
