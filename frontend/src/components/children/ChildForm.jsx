/**
 * Guardian-Link — ChildForm Component
 * Reusable form for reporting missing or found children.
 * Includes file upload and live camera capture functionality.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, MapPin, X, RefreshCw, AlertTriangle } from 'lucide-react';
import Input from '../common/Input';
import { INDIAN_STATES } from '../../constants/indianStates';

const selectClassName =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm';

const todayDateValue = () => new Date().toISOString().slice(0, 10);

/* ─── Camera Capture Modal ─── */
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    setCaptured(null);
    setError(null);
    setCameraReady(false);

    try {
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

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

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

    // PHASE 1: Camera Capture Diagnostics
    console.log('[CAMERA_CAPTURE]');
    console.log('video.videoWidth=', video.videoWidth);
    console.log('video.videoHeight=', video.videoHeight);
    console.log('canvas.width=', canvas.width);
    console.log('canvas.height=', canvas.height);
    console.log('dataUrlLength=', dataUrl.length);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.log('[CAMERA_CAPTURE] Blob is null!');
          return;
        }
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // PHASE 1: Camera Capture Diagnostics - File/Blob info
        console.log('[CAMERA_CAPTURE]');
        console.log('fileType=', file.type);
        console.log('fileSize=', file.size);
        console.log('blobSize=', blob.size);
        console.log('dataUrlLength=', captured ? captured.length : 0);
        
        onCapture(file, captured);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
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

        <div className="p-5">
          {error ? (
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

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

/* ─── Main Child Form ─── */
const ChildForm = ({ type = 'missing', onSubmit, loading = false }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [formError, setFormError] = useState('');

  const dateFieldName = type === 'found' ? 'date_found' : 'date_missing';
  const dateLabel = type === 'found' ? 'Date Found' : 'Date Missing';

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
    setGeoStatus('Fetching location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setGeoStatus('GPS coordinates captured. Please confirm state and city below.');
      },
      () => {
        setGeoStatus('');
        alert('Location permission denied');
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const form = e.target;
    const formData = new FormData();

    const childName = form.child_name?.value?.trim();
    if (type === 'missing' && !childName) {
      setFormError('Child name is required.');
      return;
    }
    formData.set('child_name', type === 'found' ? (childName || 'Unknown') : childName);

    const ageValue = parseInt(form.age?.value, 10);
    if (Number.isNaN(ageValue) || ageValue < 0 || ageValue > 18) {
      setFormError('Age must be a whole number between 0 and 18.');
      return;
    }
    formData.set('age', String(ageValue));
    formData.set('gender', form.gender?.value || '');
    formData.set('country', 'India');
    formData.set('state', form.state?.value || '');
    formData.set('city', form.city?.value?.trim() || '');

    const district = form.district?.value?.trim();
    if (district) formData.set('district', district);

    const address = form.address?.value?.trim();
    if (address) formData.set('address', address);

    const pincode = form.pincode?.value?.trim();
    if (pincode) formData.set('pincode', pincode);

    if (latitude) formData.set('latitude', latitude);
    if (longitude) formData.set('longitude', longitude);

    const reportDate = form[dateFieldName]?.value;
    if (!reportDate) {
      setFormError(`${dateLabel} is required.`);
      return;
    }
    formData.set(dateFieldName, reportDate);

    const description = form.description?.value?.trim();
    if (!description || description.length < 5) {
      setFormError('Description must be at least 5 characters.');
      return;
    }
    formData.set('description', description);

    if (!photoFile) {
      setFormError('Photo is required.');
      return;
    }
    formData.set('photo', photoFile);

    onSubmit(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-6">
        {formError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Child Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={type === 'found' ? 'Name (if known)' : 'Child Full Name'}
              name="child_name"
              placeholder={type === 'found' ? 'Enter name or leave blank for Unknown' : "Enter child's full name"}
              required={type === 'missing'}
            />

            <Input
              label={type === 'found' ? 'Approximate Age (years)' : 'Age (years)'}
              name="age"
              type="number"
              min="0"
              max="18"
              step="1"
              placeholder="Age in years (0-18)"
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">
                Gender <span className="text-red-500">*</span>
              </label>
              <select name="gender" className={selectClassName} required defaultValue="">
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Input
              label={dateLabel}
              name={dateFieldName}
              type="date"
              defaultValue={todayDateValue()}
              max={todayDateValue()}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">
            {type === 'found' ? 'Found Location' : 'Last Seen Location'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">
                State <span className="text-red-500">*</span>
              </label>
              <select name="state" className={selectClassName} required defaultValue="">
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="City"
              name="city"
              placeholder="City or town"
              required
            />

            <Input
              label="District"
              name="district"
              placeholder="District (optional)"
            />

            <Input
              label="Area / Address"
              name="address"
              placeholder={type === 'found' ? 'Street, landmark, or shelter address' : 'Street, landmark, or locality'}
            />

            <Input
              label="PIN Code"
              name="pincode"
              placeholder="6-digit PIN (optional)"
              pattern="\d{6}"
              maxLength={6}
            />

            <input type="hidden" name="country" value="India" readOnly />
          </div>

          {(latitude || longitude) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                name="latitude_display"
                value={latitude}
                readOnly
              />
              <Input
                label="Longitude"
                name="longitude_display"
                value={longitude}
                readOnly
              />
            </div>
          )}

          {geoStatus && (
            <p className="mt-2 text-xs text-blue-600">{geoStatus}</p>
          )}
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
            minLength={5}
          />
        </div>

        <div className="space-y-1.5 mb-8">
          <label className="text-sm font-medium text-slate-700 block">
            Upload Photo <span className="text-red-500">*</span>
          </label>

          {!photoPreview ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all text-center p-8 relative cursor-pointer group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/*"
                onChange={handlePhotoUpload}
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
