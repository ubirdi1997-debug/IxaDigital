import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

const CTA = ({ ctaSection, onCTAClick }) => {
  const ctaContent = ctaSection || {};
  return (
    <section className="py-20 bg-red-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 border border-white rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 border border-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            {ctaContent.headline || "Let's Build Your Digital Growth Engine"}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            {ctaContent.description || (
              <>
                Ready to scale your business with data-driven strategies and cutting-edge solutions? 
                Let's start your journey today.
              </>
            )}
          </p>
          <Button
            onClick={onCTAClick}
            size="lg"
            className="bg-white hover:bg-gray-100 text-red-600 px-10 py-7 text-lg font-bold transition-all hover:shadow-2xl hover:scale-105"
          >
            {ctaContent.button_text || 'Start Your Project'}
            <ArrowRight className="ml-2" size={24} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
