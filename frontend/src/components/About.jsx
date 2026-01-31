import React from 'react';
import { Target, TrendingUp, Users } from 'lucide-react';

const About = ({ about }) => {
  const aboutContent = about || {};
  const defaultValueProps = [
    {
      title: 'Results-Focused Execution',
      description: 'Every strategy and decision is tied to measurable business outcomes and KPIs that matter.'
    },
    {
      title: 'Scalable Solutions',
      description: 'Built with growth in mind—our solutions scale with your business from day one.'
    },
    {
      title: 'True Partnership',
      description: 'Transparent communication, regular updates, and a genuine commitment to your success.'
    }
  ];
  const valueProps = aboutContent.value_props?.length ? aboutContent.value_props : defaultValueProps;
  const icons = [Target, TrendingUp, Users];
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {aboutContent.title || (
              <>About <span className="text-red-600">IXA Digital</span></>
            )}
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {aboutContent.subtitle || 'Your long-term digital growth partner focused on execution, transparency, and ROI'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              {aboutContent.headline || 'Driving Measurable Growth Through Digital Excellence'}
            </h3>
            {(aboutContent.paragraphs?.length ? aboutContent.paragraphs : [
              "At IXA Digital, we don't just deliver projects—we deliver results. Our team combines technical expertise with strategic thinking to help businesses scale their digital presence and achieve sustainable growth.",
              "From startups to enterprises, we partner with businesses to create impactful digital solutions that drive real ROI. Our approach is simple: understand your goals, develop data-driven strategies, and execute with precision.",
              "Whether you need to dominate search rankings, scale your marketing campaigns, build high-converting websites, or develop cutting-edge applications—we're your growth partner for the long haul."
            ]).map((paragraph, index) => (
              <p key={index} className={`text-gray-600 leading-relaxed ${index < 2 ? 'mb-6' : ''}`}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Right Content - Value Props */}
          <div className="space-y-6">
            {valueProps.map((item, index) => {
              const Icon = icons[index] || Target;
              return (
                <div key={index} className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
