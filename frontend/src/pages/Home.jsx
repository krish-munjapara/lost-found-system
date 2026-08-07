/**
 * Guardian-Link — Home Page
 * Modern landing page combining all sections
 */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import HowItWorks from '../components/home/HowItWorks';
import PublicFeedSection from '../components/home/PublicFeedSection';
import IndiaMapSection from '../components/home/IndiaMapSection';
import FeaturesSection from '../components/home/FeaturesSection';
import SuccessStories from '../components/home/SuccessStories';
import FAQSection from '../components/home/FAQSection';
import Footer from '../components/home/Footer';
import { publicApi } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await publicApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <HeroSection />
      <StatsSection stats={stats} />
      <HowItWorks />
      <PublicFeedSection />
      <IndiaMapSection />
      <FeaturesSection />
      <SuccessStories />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Home;
