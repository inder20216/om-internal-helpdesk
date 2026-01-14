import React, { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { Bell, Calendar, TrendingUp, Clock, Edit3, CheckCircle, AlertCircle, Menu, X, RefreshCw, FileText, Filter, Download } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import sharepointService from '../services/sharepointService';
import { loginRequest } from '../config/authConfig';
import StatusDetailsModal from './StatusDetailsModal';

// Professional color palette
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
  chart: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
};

const Dashboard = ({ department }) => {
  const { instance, accounts } = useMsal();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicketCount, setNewTicketCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
 // Filters - Default to CURRENT MONTH
const [startDate, setStartDate] = useState(() => {
  const now = new Date();
  return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
});
const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
const [statusFilter, setStatusFilter] = useState('All');
const statusFilterRef = useRef(statusFilter);

// Sync ref with state
useEffect(() => {
  statusFilterRef.current = statusFilter;
}, [statusFilter]);

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
    open: 0,
    inProgress: 0,
    onHold: 0,
    closed: 0,
    avgResolution: '0',
    byPriority: [],
    byStatus: [],
    byReason: []
  });

  // Fetch data
  const fetchData = async (showToast = true) => {
    if (showToast) setRefreshing(true);
    
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });

      sharepointService.setAccessToken(tokenResponse.accessToken);

const allData = await sharepointService.getTickets({
  department: department,
  startDate: null,
  endDate: null
});

const previousCount = tickets.length;
const newCount = allData.length;

setTickets(allData);


// Apply status filter to list (shows ALL history)
applyStatusFilter(allData, statusFilterRef.current);

if (newCount > previousCount && previousCount > 0) {
  const diff = newCount - previousCount;
  setNewTicketCount(diff);
  toast.success(`${diff} new ticket${diff > 1 ? 's' : ''} added!`);
}

// Filter data by dates for charts/cards ONLY
const dateFilteredData = allData.filter(t => {
  const ticketDate = new Date(t.createdDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59);
  return ticketDate >= start && ticketDate <= end;
});

const calculatedStats = calculateStats(dateFilteredData);
setStats(calculatedStats);
setLoading(false);
setRefreshing(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load tickets');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate TAT (Turn Around Time) for a ticket - HOURS ONLY
  const calculateTAT = (ticket) => {
    const created = new Date(ticket.createdDate);
    const endTime = (ticket.status === 'Resolved' || ticket.status === 'Closed') 
      ? new Date(ticket.modifiedDate) 
      : new Date();
    
    const diffMs = endTime - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    return `${diffHours}h`;
  };

  // Get TAT color based on time elapsed
  const getTATColor = (ticket) => {
    const created = new Date(ticket.createdDate);
    const endTime = (ticket.status === 'Resolved' || ticket.status === 'Closed') 
      ? new Date(ticket.modifiedDate) 
      : new Date();
    
    const diffHours = Math.floor((endTime - created) / (1000 * 60 * 60));
    
    // Green: < 24 hours
    if (diffHours < 24) return 'text-green-600 bg-green-50';
    // Yellow: 24-48 hours
    if (diffHours < 48) return 'text-yellow-600 bg-yellow-50';
    // Orange: 48-72 hours
    if (diffHours < 72) return 'text-orange-600 bg-orange-50';
    // Red: > 72 hours
    return 'text-red-600 bg-red-50';
  };

const applyStatusFilter = (data, filter) => {
  if (filter === 'All') {
    setFilteredTickets(data);
  } else {
    const filtered = data.filter(t => {
      // Handle "In-progress" to match both variations
      if (filter === 'In-progress') {
        return t.status === 'In-progress' || t.status === 'In Progress';
      }
      // Exact match for others
      return t.status === filter;
    });
    setFilteredTickets(filtered);
  }
};

 // Handle status filter change
const handleStatusFilterChange = (newFilter) => {
  setStatusFilter(newFilter);
  statusFilterRef.current = newFilter; // Update ref immediately
  applyStatusFilter(tickets, newFilter);
};

useEffect(() => {
  if (accounts.length > 0) {
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }
}, [accounts, startDate, endDate, department]);

  // Calculate statistics with status breakdown
  const calculateStats = (data) => {
    const resolvedCount = data.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return status === 'resolved' || status === 'closed';
    }).length;
    
    const pendingCount = data.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return status === 'new';
    }).length;

    const openCount = data.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return status === 'open';
    }).length;

const inProgressCount = data.filter(t => {
  const status = t.status || '';
  return status === 'In-progress' || status === 'In Progress';
}).length;

    const onHoldCount = data.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return status === 'on-hold';
    }).length;

    const closedCount = data.filter(t => {
      const status = t.status?.toLowerCase() || '';
      return status === 'closed';
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
      const status = ticket.status || 'Unknown';
      statusGroups[status] = (statusGroups[status] || 0) + 1;
    });
    const byStatus = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));

    // Group by reason - TOP 10
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
      .slice(0, 10);

    const avgResolution = sharepointService.calculateAvgResolutionTime(data);

    return {
      total: data.length,
      resolved: resolvedCount,
      pending: pendingCount,
      open: openCount,
      inProgress: inProgressCount,
      onHold: onHoldCount,
      closed: closedCount,
      avgResolution,
      byPriority,
      byStatus,
      byReason
    };
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await sharepointService.updateTicketStatus(ticketId, newStatus);
      toast.success('✅ Updated!');
      fetchData(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle status details update
  const handleStatusDetailsUpdate = async (ticketId, statusDetails) => {
    try {
      await sharepointService.updateStatusDetails(ticketId, statusDetails);
      toast.success('✅ Details updated!');
      setStatusDetailsModal({ isOpen: false, ticket: null });
      fetchData(false);
    } catch (error) {
      console.error('Error updating status details:', error);
      toast.error('Failed to update details');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const lower = status?.toLowerCase() || '';
    if (lower === 'resolved') return 'bg-green-100 text-green-800';
    if (lower === 'in-progress') return 'bg-orange-100 text-orange-800';
    if (lower === 'pending') return 'bg-purple-100 text-purple-800';
    if (lower === 'on-hold') return 'bg-yellow-100 text-yellow-800';
    if (lower === 'open' || lower === 'new') return 'bg-blue-100 text-blue-800';
    if (lower === 'closed') return 'bg-gray-100 text-gray-800';
    if (lower === 'closed-wrong dept.') return 'bg-gray-100 text-gray-800';
    if (lower.includes('partially')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-800';
    if (priority === 'Low') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Download CSV function
const downloadCSV = () => {
  const headers = ['ID', 'Ticket', 'Reason', 'Priority', 'Status', 'Status Details', 'Raised By', 'TAT', 'Date'];
  
  const rows = filteredTickets.map(ticket => [
    ticket.ticketId,
    `"${ticket.ticketTitle.replace(/"/g, '""')}"`,
    `"${ticket.ticketReason.replace(/"/g, '""')}"`,
    ticket.priority,
    ticket.status,
    `"${(ticket.statusDetails || '').replace(/"/g, '""')}"`,
    ticket.ticketRaisedBy,
    calculateTAT(ticket),
    format(new Date(ticket.createdDate), 'dd-MM-yyyy')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tickets_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toaster position="top-right" />
      
      {/* PROFESSIONAL HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Single Row - 3 Columns */}
          <div className="flex items-center justify-between gap-6">
            
            {/* LEFT: Logo + Titles */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <img 
                src="https://raw.githubusercontent.com/inder20216/openmind-assets/main/logo.png" 
                alt="Open Mind" 
                className="h-10 w-auto flex-shrink-0"
                onError={(e) => e.target.style.display = 'none'}
              />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  Internal Helpdesk Dashboard
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  Team – {department}
                </p>
              </div>
            </div>

            {/* CENTER: Filters */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {/* Date Range */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 w-32"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 w-32"
                />
              </div>


            </div>

            {/* RIGHT: User + Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* User Name */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-700">
                  {accounts[0]?.name || accounts[0]?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500">Logged in</p>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Notification Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {newTicketCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {newTicketCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {showFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="In-progress">In-progress</option>
                <option value="On-Hold">On-Hold</option>
                <option value="Resolved">Resolved</option>
                <option value="Partially Resolved - Under Observation">Partially Resolved - Under Observation</option>
                <option value="Closed-Wrong Dept.">Closed-Wrong Dept.</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
         {[
  { label: 'Total', value: stats.total, icon: TrendingUp, color: 'from-slate-500 to-slate-600', filter: 'All' },
  { label: 'New', value: stats.pending, icon: AlertCircle, color: 'from-blue-500 to-cyan-600', filter: 'New' },
  { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'from-orange-500 to-amber-600', filter: 'In-progress' },
  { label: 'On-Hold', value: stats.onHold, icon: FileText, color: 'from-yellow-500 to-orange-600', filter: 'On-Hold' },
  { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'from-green-500 to-emerald-600', filter: 'Resolved' },
  { label: 'Avg Time', value: `${stats.avgResolution}h`, icon: Clock, color: 'from-violet-500 to-purple-600', filter: null },
].map((stat, index) => (  
            <div
              key={index}
              onClick={() => stat.filter && handleStatusFilterChange(stat.filter)}
              className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all ${stat.filter ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts - 2 charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Priority Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.byPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.priority[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 Reasons - VERTICAL COLUMN CHART */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Top 10 Ticket Reasons</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={stats.byReason} margin={{ bottom: 140, left: 10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-50}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 9, fill: '#374151' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {stats.byReason.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

   {/* Tickets List */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200">
<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
  <h2 className="text-lg font-bold text-gray-800">
    {statusFilter === 'All' ? 'All Tickets' : `${statusFilter} Tickets`}
  </h2>
  <div className="flex items-center gap-3">
    <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
      {filteredTickets.length}
    </span>
    <select
      value={statusFilter}
      onChange={(e) => handleStatusFilterChange(e.target.value)}
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="All">All Statuses</option>
      <option value="New">New</option>
      <option value="In-progress">In-progress</option>
      <option value="On-Hold">On-Hold</option>
      <option value="Resolved">Resolved</option>
      <option value="Partially Resolved - Under Observation">Partially Resolved</option>
      <option value="Closed-Wrong Dept.">Closed-Wrong Dept.</option>
    </select>
    <button
      onClick={downloadCSV}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Download CSV
    </button>
  </div>
</div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raised By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-indigo-600">{ticket.ticketId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.ticketTitle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">{ticket.ticketReason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                        className={`text-sm px-3 py-1.5 rounded-full font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${getStatusColor(ticket.status)}`}
                      >
                        <option value="New">New</option>
                        <option value="In-progress">In-progress</option>
                        <option value="On-Hold">On-Hold</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Partially Resolved - Under Observation">Partially Resolved - Under Observation</option>
                        <option value="Closed-Wrong Dept.">Closed-Wrong Dept.</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setStatusDetailsModal({ isOpen: true, ticket })}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {ticket.statusDetails ? (
                          <span className="max-w-[200px] truncate">{ticket.statusDetails}</span>
                        ) : (
                          <span className="text-gray-400">Add details</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.ticketRaisedBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTATColor(ticket)}`}>
                        {calculateTAT(ticket)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(ticket.createdDate), 'dd-MM-yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-indigo-600">{ticket.ticketId}</span>
                    <span className={`ml-2 px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => setStatusDetailsModal({ isOpen: true, ticket })}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2">{ticket.ticketTitle}</h3>
                <p className="text-sm text-gray-600 mb-3">{ticket.ticketReason}</p>
                
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">Raised By:</span>
                  <span className="font-medium text-gray-900">{ticket.ticketRaisedBy}</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-700">{format(new Date(ticket.createdDate), 'dd-MM-yyyy')}</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">TAT:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTATColor(ticket)}`}>
                    {calculateTAT(ticket)}
                  </span>
                </div>

                <div className="mb-3">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                    className={`w-full text-sm px-3 py-2 rounded-lg font-medium border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(ticket.status)}`}
                  >
                    <option value="New">New</option>
                    <option value="In-progress">In-progress</option>
                    <option value="On-Hold">On-Hold</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Partially Resolved - Under Observation">Partially Resolved - Under Observation</option>
                    <option value="Closed-Wrong Dept.">Closed-Wrong Dept.</option>
                  </select>
                </div>

                {ticket.statusDetails && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    {ticket.statusDetails}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tickets found for the selected filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Details Modal */}
      <StatusDetailsModal
        isOpen={statusDetailsModal.isOpen}
        ticket={statusDetailsModal.ticket}
        onClose={() => setStatusDetailsModal({ isOpen: false, ticket: null })}
        onSave={handleStatusDetailsUpdate}
      />
    </div>
  );
};

export default Dashboard;