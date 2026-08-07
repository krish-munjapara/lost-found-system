/**
 * Guardian-Link — How It Works Component
 * Premium process visualization showing the 5-step process
 */

import React, { useState, useCallback } from 'react';
import { FileText, Scan, Target, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import ProcessCard from './ProcessCard';
import ProcessModal from './ProcessModal';
import LatestUpdatesSection from './LatestUpdatesSection';

const HowItWorks = () => {
  const [selectedStep, setSelectedStep] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    {
      icon: FileText,
      title: 'Report Child',
      description: 'Users submit a missing or found child report.',
      detailedDescription: 'Users can submit detailed reports through our secure platform, providing essential information including the child\'s photo, physical description, last known location, and contact details. The report is immediately logged in our system and becomes part of the searchable database.',
      step: 1,
      keyPoints: [
        'Secure report submission with photo upload',
        'Physical description and last known location',
        'Immediate database integration',
        'Contact information for verification'
      ]
    },
    {
      icon: Scan,
      title: 'AI Face Recognition',
      description: 'DeepFace generates secure facial embeddings.',
      detailedDescription: 'Our advanced AI system uses DeepFace technology to analyze uploaded photos and generate unique facial embeddings. These biometric profiles are stored securely and used for rapid matching against existing records in our database.',
      step: 2,
      keyPoints: [
        'DeepFace facial recognition technology',
        'Secure biometric profile generation',
        'Privacy-protected embeddings',
        'Rapid processing capability'
      ]
    },
    {
      icon: Target,
      title: 'Smart Matching',
      description: 'AI compares new reports against existing records.',
      detailedDescription: 'The AI continuously scans through all reports and databases, comparing facial embeddings to find potential matches. Our sophisticated algorithms analyze multiple features to ensure high-accuracy matching while minimizing false positives.',
      step: 3,
      keyPoints: [
        'Continuous database scanning',
        'Multi-feature analysis',
        'High-accuracy matching algorithms',
        'Real-time potential match alerts'
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Verification',
      description: 'Administrators review and verify AI matches.',
      detailedDescription: 'When the AI identifies a potential match, our team of administrators and partner NGOs conduct thorough verification. This includes cross-referencing details, contacting relevant authorities, and confirming the match through additional investigation.',
      step: 4,
      keyPoints: [
        'Human review of AI suggestions',
        'Multi-source verification',
        'NGO and authority collaboration',
        'Detailed investigation process'
      ]
    },
    {
      icon: Heart,
      title: 'Safe Reunion',
      description: 'Verified matches help reunite children with their families.',
      detailedDescription: 'Once a match is verified, families are immediately notified through secure channels. Our team facilitates the safe reunion process, providing support and ensuring the child\'s safe return to their family.',
      step: 5,
      keyPoints: [
        'Immediate family notification',
        'Secure communication channels',
        'Reunion facilitation support',
        'Post-reunion follow-up care'
      ]
    }
  ];

  const handleCardClick = useCallback((step) => {
    setSelectedStep(step);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStep(null);
  }, []);

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            How Guardian Link Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            From reporting a child to successful reunion, Guardian Link uses AI and secure verification to simplify the entire journey.
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: How It Works (60%) */}
          <div className="lg:col-span-3">
            {/* Process Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step, index) => (
                <ProcessCard
                  key={index}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  step={step.step}
                  onClick={() => handleCardClick(step)}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Right: Latest Updates (40%) */}
          <div className="lg:col-span-2">
            <LatestUpdatesSection />
          </div>
        </div>
      </div>

      {/* Process Modal */}
      <ProcessModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        step={selectedStep}
      />
    </section>
  );
};

export default HowItWorks;
