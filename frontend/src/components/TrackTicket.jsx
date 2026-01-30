import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { Search, Ticket, Calendar, MessageSquare, Send, AlertCircle, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const TrackTicket = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    ticket_number: '',
    customer_email: ''
  });
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setTicket(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/track-ticket`, null, {
        params: {
          ticket_number: searchData.ticket_number,
          customer_email: searchData.customer_email
        }
      });
      setTicket(response.data.ticket);
      toast.success('Ticket found!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ticket not found. Please check your ticket number and email.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;

    setIsSending(true);
    try {
      await axios.post(`${BACKEND_URL}/api/ticket/${ticket.id}/customer-reply`, null, {
        params: {
          reply_message: reply,
          customer_email: searchData.customer_email
        }
      });
      toast.success('Reply sent! Our team will respond soon.');
      setReply('');
      
      // Refresh ticket data
      const response = await axios.post(`${BACKEND_URL}/api/track-ticket`, null, {
        params: {
          ticket_number: searchData.ticket_number,
          customer_email: searchData.customer_email
        }
      });
      setTicket(response.data.ticket);
    } catch (error) {
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
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

  const getStatusIcon = (status) => {
    if (status === 'resolved' || status === 'closed') {
      return <CheckCircle className="text-green-600" size={24} />;
    }
    return <AlertCircle className="text-blue-600" size={24} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg"
            alt="IXA Digital"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Support Ticket</h1>
          <p className="text-gray-600">Enter your ticket number and email to view status and updates</p>
        </div>

        {/* Search Form */}
        {!ticket && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 text-red-600" size={24} />
                Find Your Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="ticket_number">Ticket Number *</Label>
                  <Input
                    id="ticket_number"
                    value={searchData.ticket_number}
                    onChange={(e) => setSearchData({ ...searchData, ticket_number: e.target.value.toUpperCase() })}
                    placeholder="TKT-000001"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: TKT-XXXXXX (e.g., TKT-000001)
                  </p>
                </div>

                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={searchData.customer_email}
                    onChange={(e) => setSearchData({ ...searchData, customer_email: e.target.value })}
                    placeholder="your-email@example.com"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use the same email you provided when creating the ticket
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6"
                >
                  <Search size={18} className="mr-2" />
                  {isSearching ? 'Searching...' : 'Track Ticket'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  ← Back to Homepage
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        {ticket && (
          <div className="space-y-6">
            <Button
              onClick={() => {
                setTicket(null);
                setSearchData({ ticket_number: '', customer_email: '' });
              }}
              variant="outline"
              className="mb-4"
            >
              ← Search Another Ticket
            </Button>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center text-2xl">
                      <Ticket className="mr-2 text-red-600" size={28} />
                      #{ticket.ticket_number}
                    </CardTitle>
                    <p className="text-lg font-semibold mt-2">{ticket.subject}</p>
                  </div>
                  {getStatusIcon(ticket.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status & Priority */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                    <Badge className={getStatusBadge(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Priority</p>
                    <Badge className={getPriorityBadge(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Category</p>
                    <p className="text-gray-900">{ticket.category}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      Created:
                    </p>
                    <p className="font-semibold text-gray-900">
                      {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      Last Updated:
                    </p>
                    <p className="font-semibold text-gray-900">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Original Description */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Your Request</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>

                {/* Conversation */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                    <MessageSquare size={16} className="mr-2" />
                    Conversation ({ticket.replies?.length || 0})
                  </p>
                  
                  {ticket.replies && ticket.replies.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {ticket.replies.map((r, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg ${
                            r.is_admin
                              ? 'bg-red-50 border-l-4 border-red-600'
                              : 'bg-blue-50 border-l-4 border-blue-600'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-semibold">
                              {r.is_admin ? 'IXA Digital Team' : 'You'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(r.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageSquare className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-600">No replies yet. Our team will respond soon!</p>
                    </div>
                  )}
                </div>

                {/* Reply Section */}
                {ticket.status !== 'closed' && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Add a Reply</p>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your message here..."
                      rows={4}
                      className="mb-2"
                    />
                    <Button
                      onClick={handleReply}
                      disabled={isSending || !reply.trim()}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Send size={16} className="mr-2" />
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                )}

                {ticket.status === 'closed' && (
                  <div className="p-4 bg-gray-100 rounded-lg text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                    <p className="text-gray-900 font-semibold">This ticket has been closed</p>
                    <p className="text-sm text-gray-600 mt-1">
                      If you need further assistance, please create a new ticket.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Need more help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have additional questions or need urgent assistance, you can reach us:
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    📧 Email: <a href="mailto:ixadigitalcom@gmail.com" className="text-blue-600 hover:underline">
                      ixadigitalcom@gmail.com
                    </a>
                  </p>
                  <p className="text-gray-700">
                    📞 Phone: <a href="tel:+919436481775" className="text-blue-600 hover:underline">
                      +919436481775
                    </a>
                  </p>
                  <p className="text-gray-700">
                    💬 WhatsApp: <a 
                      href="https://wa.me/919436481775" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Chat with us
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackTicket;
