import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { Ticket, X } from 'lucide-react';
import { useRecaptcha } from '../hooks/useRecaptcha';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const SupportTicketModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    category: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const { config: recaptchaConfig } = useRecaptcha();

  const categories = [
    'Technical Support',
    'Billing',
    'General Inquiry',
    'Service Request',
    'Bug Report',
    'Feature Request'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (recaptchaConfig.enabled && !recaptchaToken) {
      toast.error('Please complete the reCAPTCHA verification');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      if (recaptchaToken) {
        params.append('recaptcha_token', recaptchaToken);
      }
      
      const url = `${BACKEND_URL}/api/support-ticket${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.post(url, formData);
      setTicketNumber(response.data.ticket_number);
      setShowSuccess(true);
      toast.success(`Ticket created: ${response.data.ticket_number}`);
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        category: '',
        subject: '',
        description: ''
      });
      setRecaptchaToken('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setTicketNumber('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Ticket className="mr-2 text-red-600" size={24} />
                Create Support Ticket
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                Need help? Create a ticket and our team will get back to you soon.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Phone Number *</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief summary of your issue"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Please provide detailed information about your request..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              {recaptchaConfig.enabled && recaptchaConfig.site_key && (
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={recaptchaConfig.site_key}
                    onChange={(token) => setRecaptchaToken(token || '')}
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 transition-colors"
              >
                {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="text-green-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created Successfully!</h3>
            <p className="text-gray-600 mb-4">Your ticket number is:</p>
            <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4 mb-6">
              <p className="text-3xl font-bold text-red-600">{ticketNumber}</p>
            </div>
            <p className="text-gray-600 mb-6">
              We've received your request and will respond within 24 hours. 
              You'll receive updates via email.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/track-ticket'}
                className="block w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
              >
                Track Your Ticket
              </button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Save your ticket number ({ticketNumber}) for future reference
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketModal;
