/**
 * Guardian-Link — FAQ Section Component
 * Modern accordion for frequently asked questions
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 pt-0">
          <p className="text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'How does Guardian Link use AI to find missing children?',
      answer: 'Guardian Link uses advanced facial recognition technology and machine learning algorithms to analyze photos of missing children and match them against found children reports. Our AI system identifies unique facial features and creates biometric profiles for accurate matching.'
    },
    {
      question: 'Is my personal information secure on the platform?',
      answer: 'Yes, we take data security very seriously. All personal information is encrypted and stored in secure cloud servers. We follow strict data protection protocols and comply with privacy regulations to ensure your information remains confidential.'
    },
    {
      question: 'How long does it typically take to find a missing child?',
      answer: 'The time varies depending on various factors, but our AI-powered system has significantly reduced search times. Many cases are resolved within days, especially when there is clear photo documentation and recent sighting information.'
    },
    {
      question: 'Can I report a missing child if I\'m not a family member?',
      answer: 'Yes, anyone can report a missing child if they have relevant information. However, we verify all reports to ensure accuracy and prevent false information. Family members are given priority in case resolution.'
    },
    {
      question: 'What happens after a potential match is found?',
      answer: 'When our AI system identifies a potential match, it triggers an alert to our verification team and partner NGOs. We then conduct a thorough verification process including contacting both parties involved before confirming the match.'
    },
    {
      question: 'Is Guardian Link free to use?',
      answer: 'Yes, Guardian Link is completely free for families reporting missing children. We work with NGOs and government agencies to ensure that cost is never a barrier to reuniting families.'
    }
  ];

  return (
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Common questions about our platform and how it works
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
