import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRecaptcha } from '../hooks/useRecaptcha';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const { config: recaptchaConfig } = useRecaptcha();

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
      
      const url = `${BACKEND_URL}/api/contact${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.post(url, formData);
      toast.success(response.data.message);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
      setRecaptchaToken('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Get a Free Consultation
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Fill out the form below and we'll get back to you within 24 hours
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="service">Service Interested In</Label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">Select a service</option>
              <option value="seo">SEO</option>
              <option value="digital-marketing">Digital Marketing</option>
              <option value="web-development">Web Development</option>
              <option value="app-development">App Development</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your project..."
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
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
            {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
