/**
 * Guardian-Link — Features Section Component
 * AI-powered feature cards
 */

import React from 'react';
import { Scan, Target, Bell, ShieldCheck, Cloud, Zap } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Scan,
      title: 'Face Recognition',
      description: 'Advanced facial recognition technology that analyzes unique biometric features for accurate identification.'
    },
    {
      icon: Target,
      title: 'AI Matching',
      description: 'Intelligent algorithms that match missing children reports with found children across our database.'
    },
    {
      icon: Bell,
      title: 'Instant Alerts',
      description: 'Real-time notifications sent to registered users when potential matches are identified.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Verification',
      description: 'Multi-step verification process involving NGOs and authorities to confirm matches.'
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'Secure, encrypted cloud storage for all child data and reports with enterprise-grade security.'
    },
    {
      icon: Zap,
      title: 'Real-Time Detection',
      description: 'Continuous monitoring and detection system that processes new reports instantly.'
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
            AI-Powered Features
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Cutting-edge technology that makes finding missing children faster and more effective
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
