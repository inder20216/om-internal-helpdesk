import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { Bell, Calendar, TrendingUp, Clock, Edit3, CheckCircle, AlertCircle, Menu, X, RefreshCw } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import sharepointService from '../services/sharepointService';
import { loginRequest } from '../config/authConfig';
import StatusDetailsModal from './StatusDetailsModal';

// Light theme colors - Handle ALL status variations
const COLORS = {
  priority: {
    'High': '#ef4444',
    'Normal': '#f59e0b',
    'Low': '#10b981'
  },
  status: {
    'New': '#3b82f6',
    'Open': '#3b82f6',
    'In Progress': '#f59e0b',
    'In-progress': '#f59e0b',
    'Pending': '#8b5cf6',
    'Partially Resolved - Under Observation': '#a855f7',
    'Resolved': '#10b981',
    'Closed': '#6b7280'
  },
  reasons: '#4f46e5'
};

const Dashboard = ({ department }) => {
  const { instance, accounts } = useMsal();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicketCount, setNewTicketCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modal state
  const [statusDetailsModal, setStatusDetailsModal] = useState({
    isOpen: false,
    ticket: null
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    avgResolution: '0',
    byPriority: [],
    byReason: [],
    byStatus: []
  });

  // Fetch data
  const fetchData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      sharepointService.setAccessToken(response.accessToken);
      
      const data = await sharepointService.getTickets({
        department: department,
        startDate,
        endDate
      });

      // Check for new tickets
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const newTickets = data.filter(t => new Date(t.createdDate) > fiveMinutesAgo);
      if (newTickets.length > newTicketCount) {
        toast.success(`${newTickets.length} new ticket(s)!`, {
          icon: '🔔',
          duration: 3000,
        });
      }
      setNewTicketCount(newTickets.length);

      setTickets(data);
      setFilteredTickets(data);
      calculateStats(data);
      
      setLoading(false);
      setRefreshing(false);
      
      if (showRefreshToast) {
        toast.success('✅ Refreshed!', { duration: 1500 });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load tickets');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchData();
      const interval = setInterval(() => fetchData(false), 30000);
      return () => clearInterval(interval);
    }
  }, [accounts, startDate, endDate, department]);

  // Normalize status for display and grouping
  const normalizeStatus = (status) => {
    if (!status) return 'Unknown';
    const lower = status.toLowerCase();
    if (lower === 'in-progress') return 'In Progress';
    if (lower === 'new') return 'Open';
    return status;
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const resolvedCount = data.filter(t => {
      const status = normalizeStatus(t.status)?.toLowerCase() || '';
      return status === 'resolved' || status === 'closed';
    }).length;
    
    const pendingCount = data.filter(t => {
      const status = normalizeStatus(t.status)?.toLowerCase() || '';
      return status === 'pending' || status === 'open' || status === 'in progress';
    }).length;

    // Group by priority
    const priorityGroups = {};
    data.forEach(ticket => {
      const priority = ticket.priority || 'Normal';
      priorityGroups[priority] = (priorityGroups[priority] || 0) + 1;
    });
    const byPriority = Object.entries(priorityGroups).map(([name, value]) => ({ name, value }));

    // Group by status
    const statusGroups = {};
    data.forEach(ticket => {
      const status = normalizeStatus(ticket.status);
      statusGroups[status] = (statusGroups[status] || 0) + 1;
    });
    const byStatus = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));

    // Group by reason
    const reasonGroups = {};
    data.forEach(ticket => {
      if (ticket.ticketReason && ticket.ticketReason.trim()) {
        const reason = ticket.ticketReason.trim();
        reasonGroups[reason] = (reasonGroups[reason] || 0) + 1;
      }
    });
    const byReason = Object.entries(reasonGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setStats({
      total: data.length,
      resolved: resolvedCount,
      pending: pendingCount,
      avgResolution: sharepointService.calculateAvgResolutionTime(data),
      byPriority,
      byReason,
      byStatus
    });
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await sharepointService.updateTicketStatus(ticketId, newStatus);
      toast.success('✅ Updated!', { duration: 1500 });
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  // Handle status details update
  const handleStatusDetailsUpdate = async (ticketId, statusDetails) => {
    try {
      await sharepointService.updateStatusDetails(ticketId, statusDetails);
      toast.success('✅ Details updated!', { duration: 1500 });
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
      throw error;
    }
  };

  const openStatusDetailsModal = (ticket) => {
    setStatusDetailsModal({ isOpen: true, ticket: ticket });
  };

  const closeStatusDetailsModal = () => {
    setStatusDetailsModal({ isOpen: false, ticket: null });
  };

  // Priority badge color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'normal': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';
    const normalized = normalizeStatus(status);
    const statusLower = normalized.toLowerCase();
    
    if (statusLower === 'resolved' || statusLower === 'closed') {
      return 'bg-green-100 text-green-700 border-green-300';
    } else if (statusLower === 'in progress') {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    } else if (statusLower === 'pending' || statusLower?.includes('observation')) {
      return 'bg-purple-100 text-purple-700 border-purple-300';
    } else if (statusLower === 'open') {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-300 rounded-lg shadow-lg text-xs sm:text-sm">
          <p className="font-bold text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">Count: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-gray-600">
            {((payload[0].value / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Legend
  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 px-2">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              {entry.value}: {entry.payload.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Toaster position="top-center" toastOptions={{ style: { fontSize: '14px' } }} />
      
      {/* Mobile-Optimized Header */}
      <div className="bg-white shadow-lg border-b-4 border-indigo-600 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          {/* Top Row: Title & Actions */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                Open Mind's Internal Helpdesk
              </h1>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {department}
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Notification */}
              <div className="relative">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                {newTicketCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-pulse">
                    {newTicketCount}
                  </span>
                )}
              </div>
              
              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden p-2 bg-gray-100 rounded-lg"
              >
                {showFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Date Filters - Desktop Always Visible, Mobile Collapsible */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Calendar className="hidden sm:block w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 text-sm text-gray-700 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 text-sm text-gray-700 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Total Tickets */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Resolved</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.resolved}</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.pending}</p>
          </div>

          {/* Avg Resolution */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-shadow">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Avg Time</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.avgResolution}<span className="text-base sm:text-xl">h</span></p>
          </div>
        </div>

        {/* Charts - Stack on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Priority Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Priority</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byPriority}
                  cx="50%"
                  cy="40%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                >
                  {stats.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.priority[entry.name] || COLORS.priority.Normal} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="40%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                >
                  {stats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.status[entry.name] || COLORS.status['Open']} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Reasons */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Top Reasons</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byReason} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80} 
                  stroke="#6b7280" 
                  style={{ fontSize: '10px' }}
                  tick={{ fill: '#1f2937' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.reasons} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets List - Mobile Optimized Cards */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <h3 className="text-base sm:text-xl font-bold">Recent Tickets</h3>
            <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
              {filteredTickets.length}
            </span>
          </div>

          {/* Mobile: Card View, Desktop: Table */}
          <div className="divide-y divide-gray-200">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Raised By</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTickets.slice(0, 50).map((ticket, index) => {
                    const displayStatus = normalizeStatus(ticket.status);
                    return (
                      <tr key={ticket.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50`}>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-600">{ticket.ticketId || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 max-w-xs truncate">{ticket.ticketTitle || ticket.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{ticket.ticketReason || 'No reason'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority || 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={displayStatus}
                            onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border ${getStatusColor(displayStatus)} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          >
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Pending</option>
                            <option>Partially Resolved - Under Observation</option>
                            <option>Resolved</option>
                            <option>Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ticket.ticketRaisedBy || 'Not specified'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{format(new Date(ticket.createdDate), 'dd-MM-yyyy')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              {filteredTickets.slice(0, 50).map((ticket) => {
                const displayStatus = normalizeStatus(ticket.status);
                return (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-indigo-600">{ticket.ticketId || '-'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority || 'Normal'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                          {ticket.ticketTitle || ticket.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {ticket.ticketReason || 'No reason'}
                        </p>
                      </div>
                      <button
                        onClick={() => openStatusDetailsModal(ticket)}
                        className="ml-2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex-shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Raised By</p>
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {ticket.ticketRaisedBy || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Date</p>
                        <p className="text-sm font-medium text-gray-700">
                          {format(new Date(ticket.createdDate), 'dd-MM-yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={displayStatus}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-bold cursor-pointer border ${getStatusColor(displayStatus)} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Pending</option>
                      <option>Partially Resolved - Under Observation</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>

                    {/* Status Details Preview */}
                    {ticket.statusDetails && (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded">
                        {ticket.statusDetails}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Details Modal */}
      <StatusDetailsModal
        ticket={statusDetailsModal.ticket}
        isOpen={statusDetailsModal.isOpen}
        onClose={closeStatusDetailsModal}
        onSave={handleStatusDetailsUpdate}
      />
    </div>
  );
};

export default Dashboard;