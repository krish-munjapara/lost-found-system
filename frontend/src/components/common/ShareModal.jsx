/**
 * Guardian-Link — Share Modal Component
 * ──────────────────────────────────────
 * Social sharing dialog for missing child reports.
 * Supports WhatsApp, Facebook, Twitter/X, Email, and Copy Link.
 */

import React, { useState } from 'react';
import { X, Share2, Copy, Check, Mail, ExternalLink } from 'lucide-react';
import { shareUtils } from '../../services/api';

const ShareModal = ({ child, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !child) return null;

  const handleCopy = async () => {
    const result = await shareUtils.copyLink(child);
    if (result) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'bg-[#25D366] hover:bg-[#20BD5B]',
      action: () => shareUtils.shareWhatsApp(child),
    },
    {
      name: 'Facebook',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-[#1877F2] hover:bg-[#166FE5]',
      action: () => shareUtils.shareFacebook(child),
    },
    {
      name: 'Twitter / X',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-[#0F1419] hover:bg-[#272C30]',
      action: () => shareUtils.shareTwitter(child),
    },
    {
      name: 'Email',
      icon: () => <Mail className="w-5 h-5" />,
      color: 'bg-[#EA4335] hover:bg-[#D33426]',
      action: () => shareUtils.shareEmail(child),
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Share This Alert</h3>
              <p className="text-white/80 text-xs">Help spread the word!</p>
            </div>
          </div>
        </div>

        {/* Child Preview */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {child.image ? (
              <img
                src={`/uploads/lost/${child.image}`}
                alt={child.name}
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
                👤
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-800">{child.name}</h4>
              <p className="text-sm text-slate-500">Age: {child.age} • {child.gender}</p>
              <p className="text-xs text-slate-400 mt-0.5">📍 {child.location}</p>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Share via</p>
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className={`${option.color} text-white rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95`}
              >
                <option.icon />
                {option.name}
              </button>
            ))}
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`w-full mt-2 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all border-2 ${
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Share Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
