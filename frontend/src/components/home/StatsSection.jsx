/**
 * Guardian-Link — Stats Section Component
 * Premium real-time dashboard statistics
 */

import React, { useState, useEffect } from 'react';
import { Users, Heart, Target, MapPin, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import StatisticCard from './StatisticCard';
import StatisticsSkeleton from './StatisticsSkeleton';
import { publicApi } from '../../services/api';

const StatsSection = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await publicApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statItems = [
    {
      icon: AlertCircle,
      label: 'Missing Reports',
      value: stats?.missing_count || stats?.total_cases || 0,
      description: 'Children currently reported as missing',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Heart,
      label: 'Found Reports',
      value: stats?.found_count || 0,
      description: 'Children reported as found',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Target,
      label: 'AI Matches',
      value: stats?.match_count || 0,
      description: 'Potential matches identified by AI',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Users,
      label: 'Successfully Reunited',
      value: stats?.resolved_count || stats?.reunited || 0,
      description: 'Children successfully reunited with families',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: MapPin,
      label: 'States Covered',
      value: stats?.states_covered || 28,
      description: 'Indian states with Guardian Link presence',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: Calendar,
      label: "Today's Reports",
      value: stats?.today_reports || 0,
      description: 'New reports received today',
      color: 'bg-teal-100 text-teal-600'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
            Live Platform Statistics
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time insights from the Guardian Link ecosystem, powered by live data and AI-driven case tracking.
          </p>
        </div>

        {/* Loading State */}
        {loading && <StatisticsSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Unable to load statistics
            </h3>
            <p className="text-slate-600 mb-6">
              There was a problem fetching the latest data. Please try again.
            </p>
            <button
              onClick={loadStats}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Statistics Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statItems.map((stat, index) => (
              <StatisticCard
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                description={stat.description}
                color={stat.color}
                delay={index * 100}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsSection;
