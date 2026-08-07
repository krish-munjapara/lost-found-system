/**
 * Guardian-Link — India Child Safety Intelligence Map
 * Production-grade interactive SVG map of India with state-level child safety data
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const IndiaMap = ({ states, onStateClick, onStateHover, selectedState, hoveredState }) => {
  const getHeatColor = (heatLevel) => {
    const colors = {
      gray: '#E5E7EB',
      green: '#10B981',
      yellow: '#F59E0B',
      orange: '#F97316',
      red: '#EF4444'
    };
    return colors[heatLevel] || colors.gray;
  };

  const handleStateClick = useCallback((stateId) => {
    const state = states.find(s => s.id === stateId);
    if (state) {
      onStateClick(state);
    }
  }, [states, onStateClick]);

  const handleStateHover = useCallback((stateId, isHovering) => {
    const state = states.find(s => s.id === stateId);
    if (state) {
      onStateHover(state, isHovering);
    }
  }, [states, onStateHover]);

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 800 900"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Jammu & Kashmir */}
        <motion.path
          id="JK"
          d="M280,50 L320,40 L350,60 L380,50 L400,70 L420,60 L450,80 L440,120 L420,140 L380,150 L340,140 L300,120 L280,90 Z"
          fill={getHeatColor(states.find(s => s.id === 'JK')?.heat_level)}
          stroke={selectedState === 'JK' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'JK' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('JK')}
          onMouseEnter={() => handleStateHover('JK', true)}
          onMouseLeave={() => handleStateHover('JK', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Himachal Pradesh */}
        <motion.path
          id="HP"
          d="M300,120 L340,140 L380,150 L400,180 L380,220 L340,210 L300,190 L280,160 Z"
          fill={getHeatColor(states.find(s => s.id === 'HP')?.heat_level)}
          stroke={selectedState === 'HP' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'HP' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('HP')}
          onMouseEnter={() => handleStateHover('HP', true)}
          onMouseLeave={() => handleStateHover('HP', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Punjab */}
        <motion.path
          id="PB"
          d="M280,160 L300,190 L340,210 L360,240 L340,270 L300,260 L260,240 L240,200 z"
          fill={getHeatColor(states.find(s => s.id === 'PB')?.heat_level)}
          stroke={selectedState === 'PB' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'PB' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('PB')}
          onMouseEnter={() => handleStateHover('PB', true)}
          onMouseLeave={() => handleStateHover('PB', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Uttarakhand */}
        <motion.path
          id="UK"
          d="M380,150 L420,140 L440,160 L450,200 L420,220 L400,180 z"
          fill={getHeatColor(states.find(s => s.id === 'UK')?.heat_level)}
          stroke={selectedState === 'UK' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'UK' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('UK')}
          onMouseEnter={() => handleStateHover('UK', true)}
          onMouseLeave={() => handleStateHover('UK', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Haryana */}
        <motion.path
          id="HR"
          d="M300,260 L340,270 L380,280 L400,320 L360,340 L320,330 L280,310 z"
          fill={getHeatColor(states.find(s => s.id === 'HR')?.heat_level)}
          stroke={selectedState === 'HR' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'HR' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('HR')}
          onMouseEnter={() => handleStateHover('HR', true)}
          onMouseLeave={() => handleStateHover('HR', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Delhi */}
        <motion.path
          id="DL"
          d="M340,270 L360,280 L370,300 L350,310 L330,295 z"
          fill={getHeatColor(states.find(s => s.id === 'DL')?.heat_level)}
          stroke={selectedState === 'DL' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'DL' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('DL')}
          onMouseEnter={() => handleStateHover('DL', true)}
          onMouseLeave={() => handleStateHover('DL', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Rajasthan */}
        <motion.path
          id="RJ"
          d="M200,280 L280,310 L320,330 L340,380 L300,450 L240,480 L180,440 L160,380 L180,320 z"
          fill={getHeatColor(states.find(s => s.id === 'RJ')?.heat_level)}
          stroke={selectedState === 'RJ' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'RJ' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('RJ')}
          onMouseEnter={() => handleStateHover('RJ', true)}
          onMouseLeave={() => handleStateHover('RJ', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Uttar Pradesh */}
        <motion.path
          id="UP"
          d="M360,340 L400,320 L440,340 L480,380 L500,420 L460,480 L400,500 L340,480 L320,440 L340,380 z"
          fill={getHeatColor(states.find(s => s.id === 'UP')?.heat_level)}
          stroke={selectedState === 'UP' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'UP' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('UP')}
          onMouseEnter={() => handleStateHover('UP', true)}
          onMouseLeave={() => handleStateHover('UP', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Bihar */}
        <motion.path
          id="BR"
          d="M460,480 L500,420 L540,440 L560,480 L540,520 L500,540 L460,520 z"
          fill={getHeatColor(states.find(s => s.id === 'BR')?.heat_level)}
          stroke={selectedState === 'BR' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'BR' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('BR')}
          onMouseEnter={() => handleStateHover('BR', true)}
          onMouseLeave={() => handleStateHover('BR', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Sikkim */}
        <motion.path
          id="SK"
          d="M480,380 L500,370 L510,390 L500,410 L480,400 z"
          fill={getHeatColor(states.find(s => s.id === 'SK')?.heat_level)}
          stroke={selectedState === 'SK' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'SK' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('SK')}
          onMouseEnter={() => handleStateHover('SK', true)}
          onMouseLeave={() => handleStateHover('SK', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Arunachal Pradesh */}
        <motion.path
          id="AR"
          d="M540,320 L580,300 L620,320 L640,360 L620,400 L580,420 L540,400 z"
          fill={getHeatColor(states.find(s => s.id === 'AR')?.heat_level)}
          stroke={selectedState === 'AR' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'AR' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('AR')}
          onMouseEnter={() => handleStateHover('AR', true)}
          onMouseLeave={() => handleStateHover('AR', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Nagaland */}
        <motion.path
          id="NL"
          d="M580,420 L620,400 L640,440 L620,480 L580,470 z"
          fill={getHeatColor(states.find(s => s.id === 'NL')?.heat_level)}
          stroke={selectedState === 'NL' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'NL' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('NL')}
          onMouseEnter={() => handleStateHover('NL', true)}
          onMouseLeave={() => handleStateHover('NL', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Manipur */}
        <motion.path
          id="MN"
          d="M540,480 L580,470 L600,510 L580,540 L540,530 z"
          fill={getHeatColor(states.find(s => s.id === 'MN')?.heat_level)}
          stroke={selectedState === 'MN' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'MN' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('MN')}
          onMouseEnter={() => handleStateHover('MN', true)}
          onMouseLeave={() => handleStateHover('MN', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Mizoram */}
        <motion.path
          id="MZ"
          d="M540,540 L580,540 L600,580 L560,600 L520,580 z"
          fill={getHeatColor(states.find(s => s.id === 'MZ')?.heat_level)}
          stroke={selectedState === 'MZ' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'MZ' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('MZ')}
          onMouseEnter={() => handleStateHover('MZ', true)}
          onMouseLeave={() => handleStateHover('MZ', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Tripura */}
        <motion.path
          id="TR"
          d="M580,580 L620,570 L640,600 L620,630 L580,620 z"
          fill={getHeatColor(states.find(s => s.id === 'TR')?.heat_level)}
          stroke={selectedState === 'TR' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'TR' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('TR')}
          onMouseEnter={() => handleStateHover('TR', true)}
          onMouseLeave={() => handleStateHover('TR', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Meghalaya */}
        <motion.path
          id="ML"
          d="M540,440 L580,420 L600,460 L580,500 L540,480 z"
          fill={getHeatColor(states.find(s => s.id === 'ML')?.heat_level)}
          stroke={selectedState === 'ML' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'ML' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('ML')}
          onMouseEnter={() => handleStateHover('ML', true)}
          onMouseLeave={() => handleStateHover('ML', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Assam */}
        <motion.path
          id="AS"
          d="M500,440 L540,400 L580,420 L600,460 L580,500 L540,520 L500,500 z"
          fill={getHeatColor(states.find(s => s.id === 'AS')?.heat_level)}
          stroke={selectedState === 'AS' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'AS' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('AS')}
          onMouseEnter={() => handleStateHover('AS', true)}
          onMouseLeave={() => handleStateHover('AS', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* West Bengal */}
        <motion.path
          id="WB"
          d="M500,540 L540,520 L560,580 L540,640 L500,620 L480,580 z"
          fill={getHeatColor(states.find(s => s.id === 'WB')?.heat_level)}
          stroke={selectedState === 'WB' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'WB' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('WB')}
          onMouseEnter={() => handleStateHover('WB', true)}
          onMouseLeave={() => handleStateHover('WB', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Jharkhand */}
        <motion.path
          id="JH"
          d="M440,480 L480,500 L500,540 L460,560 L420,540 z"
          fill={getHeatColor(states.find(s => s.id === 'JH')?.heat_level)}
          stroke={selectedState === 'JH' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'JH' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('JH')}
          onMouseEnter={() => handleStateHover('JH', true)}
          onMouseLeave={() => handleStateHover('JH', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Odisha */}
        <motion.path
          id="OR"
          d="M400,540 L440,520 L480,560 L500,620 L460,660 L420,640 L380,600 z"
          fill={getHeatColor(states.find(s => s.id === 'OR')?.heat_level)}
          stroke={selectedState === 'OR' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'OR' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('OR')}
          onMouseEnter={() => handleStateHover('OR', true)}
          onMouseLeave={() => handleStateHover('OR', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Chhattisgarh */}
        <motion.path
          id="CT"
          d="M340,440 L380,420 L420,460 L440,520 L400,560 L360,540 L320,500 z"
          fill={getHeatColor(states.find(s => s.id === 'CT')?.heat_level)}
          stroke={selectedState === 'CT' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'CT' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('CT')}
          onMouseEnter={() => handleStateHover('CT', true)}
          onMouseLeave={() => handleStateHover('CT', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Madhya Pradesh */}
        <motion.path
          id="MP"
          d="M240,380 L300,360 L340,380 L360,440 L320,500 L280,520 L220,480 L200,420 z"
          fill={getHeatColor(states.find(s => s.id === 'MP')?.heat_level)}
          stroke={selectedState === 'MP' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'MP' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('MP')}
          onMouseEnter={() => handleStateHover('MP', true)}
          onMouseLeave={() => handleStateHover('MP', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Gujarat */}
        <motion.path
          id="GJ"
          d="M120,380 L180,360 L220,400 L240,480 L200,540 L140,520 L100,460 z"
          fill={getHeatColor(states.find(s => s.id === 'GJ')?.heat_level)}
          stroke={selectedState === 'GJ' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'GJ' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('GJ')}
          onMouseEnter={() => handleStateHover('GJ', true)}
          onMouseLeave={() => handleStateHover('GJ', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Maharashtra */}
        <motion.path
          id="MH"
          d="M140,520 L200,540 L240,600 L220,680 L160,720 L100,680 L80,600 L100,540 z"
          fill={getHeatColor(states.find(s => s.id === 'MH')?.heat_level)}
          stroke={selectedState === 'MH' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'MH' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('MH')}
          onMouseEnter={() => handleStateHover('MH', true)}
          onMouseLeave={() => handleStateHover('MH', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Telangana */}
        <motion.path
          id="TS"
          d="M300,560 L340,540 L380,580 L360,620 L320,600 z"
          fill={getHeatColor(states.find(s => s.id === 'TS')?.heat_level)}
          stroke={selectedState === 'TS' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'TS' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('TS')}
          onMouseEnter={() => handleStateHover('TS', true)}
          onMouseLeave={() => handleStateHover('TS', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Andhra Pradesh */}
        <motion.path
          id="AP"
          d="M320,600 L360,620 L400,680 L360,720 L320,700 L280,660 z"
          fill={getHeatColor(states.find(s => s.id === 'AP')?.heat_level)}
          stroke={selectedState === 'AP' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'AP' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('AP')}
          onMouseEnter={() => handleStateHover('AP', true)}
          onMouseLeave={() => handleStateHover('AP', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Karnataka */}
        <motion.path
          id="KA"
          d="M160,680 L220,680 L260,720 L240,780 L180,800 L140,760 z"
          fill={getHeatColor(states.find(s => s.id === 'KA')?.heat_level)}
          stroke={selectedState === 'KA' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'KA' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('KA')}
          onMouseEnter={() => handleStateHover('KA', true)}
          onMouseLeave={() => handleStateHover('KA', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Goa */}
        <motion.path
          id="GA"
          d="M140,680 L160,680 L170,700 L150,710 L130,700 z"
          fill={getHeatColor(states.find(s => s.id === 'GA')?.heat_level)}
          stroke={selectedState === 'GA' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'GA' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('GA')}
          onMouseEnter={() => handleStateHover('GA', true)}
          onMouseLeave={() => handleStateHover('GA', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Kerala */}
        <motion.path
          id="KL"
          d="M180,800 L220,800 L240,840 L220,880 L180,860 L160,820 z"
          fill={getHeatColor(states.find(s => s.id === 'KL')?.heat_level)}
          stroke={selectedState === 'KL' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'KL' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('KL')}
          onMouseEnter={() => handleStateHover('KL', true)}
          onMouseLeave={() => handleStateHover('KL', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Tamil Nadu */}
        <motion.path
          id="TN"
          d="M280,660 L320,700 L360,720 L380,780 L340,820 L300,800 L260,760 z"
          fill={getHeatColor(states.find(s => s.id === 'TN')?.heat_level)}
          stroke={selectedState === 'TN' ? '#2563EB' : '#ffffff'}
          strokeWidth={selectedState === 'TN' ? 3 : 1}
          className="cursor-pointer transition-all duration-300 hover:opacity-80"
          onClick={() => handleStateClick('TN')}
          onMouseEnter={() => handleStateHover('TN', true)}
          onMouseLeave={() => handleStateHover('TN', false)}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </svg>
    </div>
  );
};

export default IndiaMap;
