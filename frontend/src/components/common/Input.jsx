/**
 * Guardian-Link — Reusable Input Component
 * Form input with label, icon support, and error state.
 */

import React from 'react';

const Input = ({
  label,
  type = 'text',
  icon: Icon,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700 block">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          className={`
            w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all
            placeholder:text-slate-400
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
