import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Ticket,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Send,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const AdminTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchTickets();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${BACKEND_URL}/api/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data.tickets);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch tickets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${BACKEND_URL}/api/admin/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(response.data.ticket);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${BACKEND_URL}/api/admin/tickets/${selectedTicket.id}/reply`,
        { message: reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reply sent successfully');
      setReply('');
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const updateTicketStatus = async (ticketId, status, priority = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ status });
      if (priority) params.append('priority', priority);
      
      await axios.patch(
        `${BACKEND_URL}/api/admin/tickets/${ticketId}/status?${params}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ticket updated');
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${BACKEND_URL}/api/admin/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket deleted');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.open;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return variants[priority] || variants.medium;
  };

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  if (isLoading) {
    return <div className="p-8 text-center">Loading tickets...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Ticket className="mr-3 text-red-600" size={32} />
            Support Tickets
          </h1>
          <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tickets ({filteredTickets.length})</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    onClick={() => setFilterStatus('all')}
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className={filterStatus === 'all' ? 'bg-red-600' : ''}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('open')}
                    variant={filterStatus === 'open' ? 'default' : 'outline'}
                    size="sm"
                    className={filterStatus === 'open' ? 'bg-red-600' : ''}
                  >
                    Open
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('in_progress')}
                    variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                    size="sm"
                    className={filterStatus === 'in_progress' ? 'bg-red-600' : ''}
                  >
                    In Progress
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('resolved')}
                    variant={filterStatus === 'resolved' ? 'default' : 'outline'}
                    size="sm"
                    className={filterStatus === 'resolved' ? 'bg-red-600' : ''}
                  >
                    Resolved
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tickets found</p>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => fetchTicketDetails(ticket.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTicket?.id === ticket.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-gray-900">
                          #{ticket.ticket_number}
                        </span>
                        <Badge className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.subject}</p>
                      <p className="text-xs text-gray-600 mb-2">{ticket.customer_name}</p>
                      <div className="flex justify-between items-center">
                        <Badge className={getStatusBadge(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {ticket.replies?.length || 0} replies
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>#{selectedTicket.ticket_number}</CardTitle>
                      <p className="text-lg font-semibold mt-2">{selectedTicket.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusBadge(selectedTicket.status)}>
                        {selectedTicket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityBadge(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Customer</p>
                      <p className="text-gray-900">{selectedTicket.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Category</p>
                      <p className="text-gray-900">{selectedTicket.category}</p>
                    </div>
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2 text-red-600" />
                      <a href={`mailto:${selectedTicket.customer_email}`} className="text-sm text-blue-600">
                        {selectedTicket.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-red-600" />
                      <a href={`tel:${selectedTicket.customer_phone}`} className="text-sm text-blue-600">
                        {selectedTicket.customer_phone}
                      </a>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Description</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Conversation</p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                        selectedTicket.replies.map((r, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              r.is_admin ? 'bg-red-50 border-l-4 border-red-600' : 'bg-blue-50 border-l-4 border-blue-600'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-semibold">
                                {r.is_admin ? `Admin (${r.author})` : 'Customer'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(r.created_at).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{r.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4">No replies yet</p>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Send Reply</p>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your response..."
                      rows={4}
                      className="mb-2"
                    />
                    <Button
                      onClick={sendReply}
                      disabled={isSending || !reply.trim()}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Send size={16} className="mr-2" />
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                      variant="outline"
                      size="sm"
                      disabled={selectedTicket.status === 'in_progress'}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                      variant="outline"
                      size="sm"
                      disabled={selectedTicket.status === 'resolved'}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                      variant="outline"
                      size="sm"
                      disabled={selectedTicket.status === 'closed'}
                    >
                      Close Ticket
                    </Button>
                    <Button
                      onClick={() => updateTicketStatus(selectedTicket.id, selectedTicket.status, 'high')}
                      variant="outline"
                      size="sm"
                      className="text-orange-600"
                    >
                      Priority: High
                    </Button>
                    <Button
                      onClick={() => deleteTicket(selectedTicket.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 ml-auto"
                    >
                      Delete Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">Select a ticket to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
