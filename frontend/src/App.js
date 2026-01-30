import React, { useState, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useSEO } from "./hooks/useSEO";

// Eager load critical components
import Header from "./components/Header";
import Hero from "./components/Hero";
import WhatsAppButton from "./components/WhatsAppButton";

// Lazy load non-critical components
const About = lazy(() => import("./components/About"));
const Services = lazy(() => import("./components/Services"));
const WhyChooseUs = lazy(() => import("./components/WhyChooseUs"));
const Process = lazy(() => import("./components/Process"));
const Industries = lazy(() => import("./components/Industries"));
const CTA = lazy(() => import("./components/CTA"));
const Footer = lazy(() => import("./components/Footer"));
const ContactModal = lazy(() => import("./components/ContactModal"));
const SupportTicketModal = lazy(() => import("./components/SupportTicketModal"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const AdminSettings = lazy(() => import("./components/AdminSettings"));
const AdminTickets = lazy(() => import("./components/AdminTickets"));
const ContentEditor = lazy(() => import("./components/ContentEditor"));
const TrackTicket = lazy(() => import("./components/TrackTicket"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const Home = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleCTAClick = () => {
    setIsContactModalOpen(true);
  };

  const handleTicketClick = () => {
    setIsTicketModalOpen(true);
  };

  const handleViewServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onCTAClick={handleCTAClick} />
      <Hero onCTAClick={handleCTAClick} onViewServices={handleViewServices} />
      
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
        <About />
        <Services onCTAClick={handleCTAClick} />
        <WhyChooseUs />
        <Process />
        <Industries />
        <CTA onCTAClick={handleCTAClick} />
        <Footer onCTAClick={handleCTAClick} onTicketClick={handleTicketClick} />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        <SupportTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
      </Suspense>
      
      <WhatsAppButton />
      <Toaster />
    </div>
  );
};

function App() {
  useSEO();
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/track-ticket" element={<TrackTicket />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/content" element={<ContentEditor />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
