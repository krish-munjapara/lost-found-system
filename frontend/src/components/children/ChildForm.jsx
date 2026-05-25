/**
 * Guardian-Link — ChildForm Component
 * Reusable form for reporting missing or found children.
 */

import React, { useState } from 'react';
import { Camera, Upload, MapPin } from 'lucide-react';
import Input from '../common/Input';

const ChildForm = ({ type = 'missing', onSubmit, loading = false }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState('');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removePreview = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`),
      () => alert('Location permission denied')
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (photoFile) {
      formData.set('photo', photoFile);
    }
    formData.set('location', location || formData.get('location'));
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Input
          label={type === 'found' ? 'Name (if known)' : 'Child Name'}
          name="child_name"
          placeholder={type === 'found' ? 'Enter name or Unknown' : "Enter child's full name"}
          required={type === 'missing'}
        />

        <Input
          label={type === 'found' ? 'Approximate Age' : 'Age'}
          name="age"
          type={type === 'found' ? 'text' : 'number'}
          placeholder={type === 'found' ? 'e.g. 5-7 years' : 'Age in years'}
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <Input
          label={type === 'found' ? 'Found Location' : 'Last Seen Location'}
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={type === 'found' ? 'Exact found location' : 'Last known location'}
          required
        />
      </div>

      <div className="space-y-1.5 mb-6">
        <label className="text-sm font-medium text-slate-700 block">
          {type === 'found' ? 'Condition & Description' : 'Description'} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          placeholder={type === 'found'
            ? "Describe the child's clothing, state, spoken language, or any details they shared..."
            : "Describe clothing, distinguishing marks, hair color, height, and any other identifying details..."
          }
          required
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-1.5 mb-8">
        <label className="text-sm font-medium text-slate-700 block">
          Upload Photo <span className="text-red-500">*</span>
        </label>

        {!photoPreview ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all text-center p-8 relative cursor-pointer group">
            <input
              type="file"
              name="photo"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept="image/*"
              onChange={handlePhotoUpload}
              required
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">Click to upload or drag & drop</h4>
            <p className="text-xs text-slate-500">PNG, JPG, JPEG up to 10MB</p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 w-full max-w-sm inline-block">
            <img src={photoPreview} alt="Preview" className="w-full h-auto object-cover" />
            <button
              type="button"
              onClick={removePreview}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 transition-colors"
          >
            <Camera className="w-4 h-4" /> Capture from Camera
          </button>
          <button
            type="button"
            onClick={fetchLocation}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Use My Location
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 ${
            type === 'missing'
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
          }`}
        >
          {loading ? 'Submitting...' : type === 'missing' ? 'Submit Missing Report' : 'Submit Found Report'}
        </button>
      </div>
    </form>
  );
};

export default ChildForm;
