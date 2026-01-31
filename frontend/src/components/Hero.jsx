import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from './ui/button';
import { heroImages } from '../data/mock';

const Hero = ({ hero, onCTAClick, onViewServices }) => {
  const heroContent = hero || {};
  const stats = heroContent.stats?.length
    ? heroContent.stats
    : [
        { value: '500+', label: 'Projects Delivered' },
        { value: '98%', label: 'Client Satisfaction' },
        { value: '5+', label: 'Years Experience' }
      ];
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <div className="inline-block mb-4 px-4 py-2 bg-red-50 rounded-full">
              <span className="text-red-600 font-semibold text-sm tracking-wide">
                RESULTS FIRST
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {heroContent.headline || (
                <>
                  Results-Driven <span className="text-red-600">SEO, Marketing</span> & Development Solutions
                </>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              {heroContent.subheadline || (
                <>
                  Helping brands grow through SEO, digital marketing, web & app development. 
                  Data-driven strategies that deliver measurable results.
                </>
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onCTAClick}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg transition-all hover:shadow-lg hover:scale-105"
              >
                {heroContent.cta_primary || 'Get a Free Consultation'}
                <ArrowRight className="ml-2" size={20} />
              </Button>
              
              <Button
                onClick={onViewServices}
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-red-600 text-gray-700 hover:text-red-600 px-8 py-6 text-lg transition-all"
              >
                {heroContent.cta_secondary || 'View Our Services'}
                <Play className="ml-2" size={20} />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-red-600 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Image Grid */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={heroImages[0]}
                    alt="Digital Agency Work"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={heroImages[1]}
                    alt="Team Collaboration"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
              <div className="pt-8">
                <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={heroImages[2]}
                    alt="Business Meeting"
                    className="w-full h-80 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
