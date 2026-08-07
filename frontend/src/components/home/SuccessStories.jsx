/**
 * Guardian-Link — Success Stories Component
 * Testimonial layout for reunification stories
 */

import React from 'react';
import { Quote, Star } from 'lucide-react';

const TestimonialCard = ({ name, location, story, daysMissing }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900">{name}</h4>
          <p className="text-sm text-slate-500">{location}</p>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-200" />
        <p className="text-slate-600 leading-relaxed pl-6 italic">
          "{story}"
        </p>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-sm text-slate-500 ml-auto">
          Reunited after {daysMissing} days
        </span>
      </div>
    </div>
  );
};

const SuccessStories = () => {
  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Mumbai, Maharashtra',
      story: 'Thanks to Guardian Link\'s AI matching system, my son was found within 72 hours. The team was incredibly supportive throughout the process.',
      daysMissing: 3
    },
    {
      name: 'Rajesh Kumar',
      location: 'Delhi',
      story: 'The facial recognition technology identified my daughter from a found child report in another state. We are forever grateful for this platform.',
      daysMissing: 14
    },
    {
      name: 'Anita Patel',
      location: 'Ahmedabad, Gujarat',
      story: 'After 45 days of searching, Guardian Link helped us locate our child. The instant alert system notified us immediately when a match was found.',
      daysMissing: 45
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real stories of families reunited through our AI-powered platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              name={testimonial.name}
              location={testimonial.location}
              story={testimonial.story}
              daysMissing={testimonial.daysMissing}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
