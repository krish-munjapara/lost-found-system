/**
 * Guardian-Link — Report Image Component
 * Lazy-loaded image with professional placeholder
 */

import React, { useState, memo } from 'react';
import { User, ImageOff } from 'lucide-react';

const ReportImage = memo(({ src, alt, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-3">
          <ImageOff className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400 font-medium">No Image Available</p>
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </>
  );
});

ReportImage.displayName = 'ReportImage';

export default ReportImage;
