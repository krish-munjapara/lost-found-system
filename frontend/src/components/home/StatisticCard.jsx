/**
 * Guardian-Link — Statistic Card Component
 * Premium card with animated number and helper description
 */

import React, { useState, useEffect, useRef, memo } from 'react';

const StatisticCard = memo(({ icon: Icon, label, value, description, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && value !== undefined && value !== null) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isVisible, value]);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7" />
      </div>

      {/* Animated Number */}
      <div className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2">
        {value !== undefined && value !== null ? count.toLocaleString() : '0'}
      </div>

      {/* Label */}
      <div className="text-sm font-semibold text-slate-700 mb-2">
        {label}
      </div>

      {/* Helper Description */}
      <div className="text-xs text-slate-500 leading-relaxed">
        {description}
      </div>
    </div>
  );
});

StatisticCard.displayName = 'StatisticCard';

export default StatisticCard;
