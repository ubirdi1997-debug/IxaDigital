import React from 'react';
import { Mail, Phone, Linkedin, Twitter, Facebook, Instagram, Ticket, Search } from 'lucide-react';
import { contactInfo } from '../data/mock';
import { useBranding } from '../hooks/useBranding';

const Footer = ({ footer, onCTAClick, onTicketClick }) => {
  const { branding } = useBranding();
  const footerContent = footer || {};
  const socialLinks = footerContent.social_links || {};
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="h-12 w-auto mb-4 bg-white p-2 rounded"
            />
            <p className="text-gray-400 mb-4 leading-relaxed">
              {footerContent.company_description ||
                'Results-driven digital growth partner delivering SEO, marketing, web & app development solutions.'}
            </p>
            <div className="flex space-x-3">
              <a href={socialLinks.facebook || '#'} className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook size={18} />
              </a>
              <a href={socialLinks.twitter || '#'} className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Twitter size={18} />
              </a>
              <a href={socialLinks.linkedin || '#'} className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Linkedin size={18} />
              </a>
              <a href={socialLinks.instagram || '#'} className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-red-600 transition-colors">
                  SEO Services
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-red-600 transition-colors">
                  Digital Marketing
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-red-600 transition-colors">
                  Web Development
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-red-600 transition-colors">
                  App Development
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-red-600 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('process')} className="text-gray-400 hover:text-red-600 transition-colors">
                  Our Process
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('industries')} className="text-gray-400 hover:text-red-600 transition-colors">
                  Industries
                </button>
              </li>
              <li>
                <button onClick={onCTAClick} className="text-gray-400 hover:text-red-600 transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Get In Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-red-600 flex-shrink-0" />
                <a href={`mailto:${contactInfo.email}`} className="text-gray-400 hover:text-red-600 transition-colors break-all">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-red-600 flex-shrink-0" />
                <a href={`tel:${contactInfo.phone}`} className="text-gray-400 hover:text-red-600 transition-colors">
                  {contactInfo.phone}
                </a>
              </li>
            </ul>
            <button
              onClick={onCTAClick}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-2"
            >
              Request Consultation
            </button>
            <button
              onClick={onTicketClick}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center mb-2"
            >
              <Ticket size={18} className="mr-2" />
              Create Support Ticket
            </button>
            <a
              href="/track-ticket"
              className="w-full bg-white border-2 border-gray-300 hover:border-red-600 text-gray-700 hover:text-red-600 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
            >
              <Search size={18} className="mr-2" />
              Track Existing Ticket
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {branding.company_name}. All rights reserved. Results First.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
