/**
 * Guardian-Link — ChildForm Component
 * Reusable form for reporting missing or found children.
 * Includes file upload and live camera capture functionality.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, MapPin, X, RefreshCw, AlertTriangle } from 'lucide-react';
import Input from '../common/Input';

/* ─── Camera Capture Modal ─── */
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState(null); // data URL of the snapshot
  const [error, setError] = useState(null);

  /* Start the camera stream */
  const startCamera = useCallback(async () => {
    setCaptured(null);
    setError(null);
    setCameraReady(false);

    try {
      // Stop any previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera access. Please use a modern browser (Chrome, Edge, or Firefox).');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => setCameraReady(true));
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please connect a camera or use the file upload option instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera and try again.');
      } else if (err.name === 'OverconstrainedError') {
        // Retry without constraints
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallback;
          if (videoRef.current) {
            videoRef.current.srcObject = fallback;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().then(() => setCameraReady(true));
            };
          }
          return;
        } catch {
          setError('Could not access camera with the required settings. Please try the file upload option.');
        }
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}. Please try the file upload option.`);
      }
    }
  }, []);

  /* Initialize on mount */
  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  /* Capture a frame */
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);

    // Pause the live preview
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  /* Retake — restart camera */
  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  /* Confirm — convert to File and pass up */
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, captured);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Camera className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Camera Capture</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error ? (
            /* Error state */
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm text-slate-600 mb-4 max-w-xs mx-auto leading-relaxed">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Use File Upload
                </button>
              </div>
            </div>
          ) : captured ? (
            /* Captured preview */
            <div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
                <img src={captured} alt="Captured" className="w-full h-auto object-contain max-h-80" />
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" /> Use This Photo
                </button>
              </div>
            </div>
          ) : (
            /* Live camera preview */
            <div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto object-contain max-h-80 mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-300">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 hover:border-blue-600 flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed group shadow-lg shadow-blue-500/20"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors" />
                </button>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">Tap the button to capture</p>
            </div>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

/* ─── Main Child Form ─── */
const ChildForm = ({ type = 'missing', onSubmit, loading = false }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [location, setLocation] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  /* Shared helper: set photo from any source (file input OR camera) */
  const setPhotoFromFile = useCallback((file, previewUrl = null) => {
    setPhotoFile(file);
    if (previewUrl) {
      setPhotoPreview(previewUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFromFile(file);
    }
  };

  const handleCameraCapture = (file, dataUrl) => {
    setPhotoFromFile(file, dataUrl);
    setShowCamera(false);
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
    <>
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
              onClick={() => setShowCamera(true)}
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

      {/* Camera Modal — rendered outside the form to avoid nested form issues */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
};

export default ChildForm;
