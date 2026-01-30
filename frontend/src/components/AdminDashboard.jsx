import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  LogOut,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Trash2,
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Settings,
  Ticket,
  Edit
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ 
    submissions: { total: 0, new: 0, read: 0, contacted: 0 },
    tickets: { total: 0, open: 0, in_progress: 0, resolved: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [submissionsRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/submissions`, { headers }),
        axios.get(`${BACKEND_URL}/api/admin/stats`, { headers })
      ]);

      setSubmissions(submissionsRes.data.submissions);
      if (statsRes.data.stats.submissions) {
        setStats(statsRes.data.stats);
      } else {
        // Backward compatibility
        setStats({
          submissions: statsRes.data.stats,
          tickets: { total: 0, open: 0, in_progress: 0, resolved: 0 }
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const updateStatus = async (submissionId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${BACKEND_URL}/api/admin/submissions/${submissionId}/status?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${BACKEND_URL}/api/admin/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Submission deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete submission');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.new;
  };

  const filteredSubmissions = filterStatus === 'all'
    ? submissions
    : submissions.filter(s => s.status === filterStatus);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src="https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg"
                alt="IXA Digital"
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/admin/content')} variant="outline" size="sm">
                <Edit size={16} className="mr-2" />
                Edit Content
              </Button>
              <Button onClick={() => navigate('/admin/tickets')} variant="outline" size="sm">
                <Ticket size={16} className="mr-2" />
                Tickets
              </Button>
              <Button onClick={() => navigate('/admin/settings')} variant="outline" size="sm">
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Inquiries</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.submissions.total}</p>
                </div>
                <Users className="text-red-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">New Inquiries</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.submissions.new}</p>
                </div>
                <Clock className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Support Tickets</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.tickets.total}</p>
                </div>
                <Ticket className="text-purple-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Open Tickets</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.tickets.open}</p>
                </div>
                <MessageSquare className="text-orange-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            All ({submissions.length})
          </Button>
          <Button
            onClick={() => setFilterStatus('new')}
            variant={filterStatus === 'new' ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === 'new' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            New ({stats.submissions.new})
          </Button>
          <Button
            onClick={() => setFilterStatus('read')}
            variant={filterStatus === 'read' ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === 'read' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Read ({stats.submissions.read})
          </Button>
          <Button
            onClick={() => setFilterStatus('contacted')}
            variant={filterStatus === 'contacted' ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === 'contacted' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Contacted ({stats.submissions.contacted})
          </Button>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No submissions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{submission.name}</h3>
                      <Badge className={getStatusBadge(submission.status)}>
                        {submission.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(submission.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-700">
                      <Mail size={16} className="mr-2 text-red-600" />
                      <a href={`mailto:${submission.email}`} className="hover:text-red-600">
                        {submission.email}
                      </a>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone size={16} className="mr-2 text-red-600" />
                      <a href={`tel:${submission.phone}`} className="hover:text-red-600">
                        {submission.phone}
                      </a>
                    </div>
                  </div>

                  {submission.service && (
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-gray-600">Service: </span>
                      <span className="text-sm text-gray-900">{submission.service}</span>
                    </div>
                  )}

                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Message:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{submission.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => updateStatus(submission.id, 'read')}
                      variant="outline"
                      size="sm"
                      disabled={submission.status === 'read'}
                    >
                      Mark as Read
                    </Button>
                    <Button
                      onClick={() => updateStatus(submission.id, 'contacted')}
                      variant="outline"
                      size="sm"
                      disabled={submission.status === 'contacted'}
                    >
                      Mark as Contacted
                    </Button>
                    <Button
                      onClick={() => updateStatus(submission.id, 'closed')}
                      variant="outline"
                      size="sm"
                      disabled={submission.status === 'closed'}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => deleteSubmission(submission.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
