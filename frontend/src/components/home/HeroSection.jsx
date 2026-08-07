/**
 * Guardian-Link — Hero Section Component
 * Premium enterprise-level hero with AI ecosystem illustration
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Brain, Users, Clock, Zap, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HeroIllustration from './HeroIllustration';
import FloatingStatCard from './FloatingStatCard';
import { publicApi } from '../../services/api';

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await publicApi.getStats();
      setStats(data);
      setStatsLoaded(true);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStatsLoaded(true);
    }
  };

  const handleReportClick = () => {
    if (isAuthenticated) {
      navigate('/report-lost');
    } else {
      navigate('/login');
    }
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPublicFeed = () => {
    const element = document.getElementById('public-feed');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-2xl animate-fadeIn">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-100">
              <span className="text-base">🛡</span>
              AI-Powered Missing Child Detection
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              Every Child Deserves<br />
              To Return Home Safely
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              Guardian Link helps families, volunteers, NGOs and authorities reunite missing children through AI-powered facial recognition and real-time reporting.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleReportClick}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                Report Missing Child
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={scrollToPublicFeed}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
              >
                Browse Public Cases
              </button>
            </div>

            {/* Small Link */}
            <button
              onClick={scrollToHowItWorks}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Learn How It Works
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Real-Time</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Nationwide</span>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative">
              <HeroIllustration />
              
              {/* Floating Stat Cards - Only render when stats are loaded */}
              {statsLoaded && (
                <>
                  <FloatingStatCard
                    icon={Brain}
                    label="AI Match Accuracy"
                    value="98.6%"
                    position="top-left"
                    delay={200}
                  />
                  <FloatingStatCard
                    icon={Users}
                    label="Live Cases"
                    value={stats?.total_cases || stats?.missing_children || '0'}
                    position="top-right"
                    delay={400}
                  />
                  <FloatingStatCard
                    icon={Users}
                    label="Children Reunited"
                    value={stats?.found_children || stats?.reunited || '0'}
                    position="bottom-left"
                    delay={600}
                  />
                  <FloatingStatCard
                    icon={Zap}
                    label="Avg Match Time"
                    value="< 2s"
                    position="bottom-right"
                    delay={800}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
