/**
 * Guardian-Link — Hero Illustration Component
 * Custom SVG illustration showing AI Ecosystem with subtle animations
 */

import React from 'react';

const HeroIllustration = () => {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Glow */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Circle with soft glow */}
        <circle cx="200" cy="200" r="180" fill="url(#glow)" />

        {/* Connection Lines with subtle glow */}
        <g stroke="url(#lineGradient)" strokeWidth="2" fill="none" filter="url(#glowFilter)">
          {/* Center to Camera */}
          <path d="M200 200 L80 120" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" repeatCount="indefinite" />
          </path>
          {/* Center to AI */}
          <path d="M200 200 L320 120" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" begin="0.5s" repeatCount="indefinite" />
          </path>
          {/* Center to Face Recognition */}
          <path d="M200 200 L80 280" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" begin="1s" repeatCount="indefinite" />
          </path>
          {/* Center to Verified Match */}
          <path d="M200 200 L320 280" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </path>
          {/* Center to Family Reunion */}
          <path d="M200 200 L200 80" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" begin="2s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Center Shield with soft pulse */}
        <g transform="translate(200, 200)">
          <circle r="50" fill="url(#shieldGradient)" opacity="0.1">
            <animate attributeName="opacity" values="0.1;0.15;0.1" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="55" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.2">
            <animate attributeName="r" values="55;60;55" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0;0.2" dur="4s" repeatCount="indefinite" />
          </circle>
          <path
            d="M0 -35 L25 -25 L25 10 C25 30 15 40 0 45 C-15 40 -25 30 -25 10 L-25 -25 Z"
            fill="url(#shieldGradient)"
            stroke="#3B82F6"
            strokeWidth="2"
            filter="url(#glowFilter)"
          >
            <animate attributeName="opacity" values="1;0.95;1" dur="4s" repeatCount="indefinite" />
          </path>
          <path
            d="M-10 -5 L-3 8 L12 -12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Camera Icon (Top Left) with subtle pulse */}
        <g transform="translate(80, 120)">
          <circle r="30" fill="white" stroke="#3B82F6" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;2.5;2" dur="3s" repeatCount="indefinite" />
          </circle>
          <rect x="-12" y="-8" width="24" height="16" rx="2" fill="#3B82F6" />
          <circle cx="0" cy="0" r="4" fill="white" />
          <rect x="-8" y="-12" width="16" height="4" rx="1" fill="#3B82F6" />
        </g>

        {/* AI Icon (Top Right) with subtle pulse */}
        <g transform="translate(320, 120)">
          <circle r="30" fill="white" stroke="#8B5CF6" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;2.5;2" dur="3s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <path
            d="M-8 -8 L8 8 M8 -8 L-8 8 M-12 0 L12 0 M0 -12 L0 12"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle r="6" fill="#8B5CF6" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Face Recognition Icon (Bottom Left) with subtle pulse */}
        <g transform="translate(80, 280)">
          <circle r="30" fill="white" stroke="#3B82F6" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;2.5;2" dur="3s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="-8" cy="-5" r="4" fill="#3B82F6" />
          <circle cx="8" cy="-5" r="4" fill="#3B82F6" />
          <path
            d="M-8 8 Q0 16 8 8"
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="-15" y="-15" width="30" height="30" rx="4" stroke="#3B82F6" strokeWidth="1.5" fill="none" opacity="0.5" />
        </g>

        {/* Verified Match Icon (Bottom Right) with subtle pulse */}
        <g transform="translate(320, 280)">
          <circle r="30" fill="white" stroke="#10B981" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;2.5;2" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </circle>
          <path
            d="M-10 0 L-3 8 L12 -8"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle r="18" stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Family Reunion Icon (Top Center) with subtle pulse */}
        <g transform="translate(200, 80)">
          <circle r="30" fill="white" stroke="#F59E0B" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;2.5;2" dur="3s" begin="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="-8" cy="-2" r="5" fill="#F59E0B" />
          <circle cx="8" cy="-2" r="5" fill="#F59E0B" />
          <path
            d="M-8 8 Q0 16 8 8"
            stroke="#F59E0B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-12 10 Q0 20 12 10"
            stroke="#F59E0B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>

        {/* Floating Particles with gentle movement */}
        <circle cx="150" cy="150" r="3" fill="#3B82F6" opacity="0.4">
          <animate attributeName="cy" values="150;145;150" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="150" r="2" fill="#8B5CF6" opacity="0.4">
          <animate attributeName="cy" values="150;155;150" dur="4s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="250" r="2" fill="#3B82F6" opacity="0.4">
          <animate attributeName="cy" values="250;245;250" dur="4s" begin="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="250" r="3" fill="#10B981" opacity="0.4">
          <animate attributeName="cy" values="250;255;250" dur="4s" begin="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" begin="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="130" r="2" fill="#F59E0B" opacity="0.4">
          <animate attributeName="cy" values="130;125;130" dur="4s" begin="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" begin="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

export default HeroIllustration;
