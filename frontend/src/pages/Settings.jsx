/**
 * Guardian-Link — Settings Page
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi } from '../services/api';
import { Settings as SettingsIcon, Save, Moon, Bell, Mail, Shield, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [profile, setProfile] = useState({ full_name: '', email: '', mobile: '', gender: '', address: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [prefs, setPrefs] = useState({ push_notifications: true, email_notifications: true, match_alerts: true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prof, prefData] = await Promise.all([userApi.getProfile(), userApi.getPreferences()]);
      if (prof?.user) {
        setProfile({
          full_name: prof.user.full_name || '',
          email: prof.user.email || '',
          mobile: prof.user.mobile || '',
          gender: prof.user.gender || '',
          address: prof.user.address || '',
        });
      }
      if (prefData?.preferences) setPrefs(prefData.preferences);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await userApi.updateProfile({
        full_name: profile.full_name,
        mobile: profile.mobile,
        gender: profile.gender,
        address: profile.address,
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await userApi.changePassword(passwords.current, passwords.newPass);
      setMessage('Password updated successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await userApi.updatePreferences(updated);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account and all reports. Continue?')) return;
    await userApi.deleteAccount();
    await logout();
    window.location.href = '/login';
  };

  if (loading) return <Layout><Loader message="Loading settings..." /></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white mb-2">
          <SettingsIcon className="w-8 h-8" /> Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      {(message || error) && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <div className="space-y-6 max-w-4xl">
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Profile</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-field" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Full Name" required />
              <input className="input-field opacity-60" value={profile.email} readOnly />
              <input className="input-field" value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} placeholder="Mobile" />
              <select className="input-field" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                <option value="">Gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <input className="input-field" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Address" />
            <button type="submit" disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> Save Profile</button>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Preferences</h3>
          {[
            { key: 'push_notifications', icon: Bell, label: 'Push Notifications' },
            { key: 'email_notifications', icon: Mail, label: 'Email Notifications' },
            { key: 'match_alerts', icon: Shield, label: 'Match Alerts' },
          ].map(({ key, icon: Icon, label }) => (
            <label key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="flex items-center gap-2 text-sm dark:text-slate-200"><Icon className="w-4 h-4" /> {label}</span>
              <input type="checkbox" checked={prefs[key]} onChange={(e) => savePrefs(key, e.target.checked)} className="w-5 h-5" />
            </label>
          ))}
          <label className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm dark:text-slate-200"><Moon className="w-4 h-4" /> Dark Mode</span>
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="w-5 h-5" />
          </label>
        </section>

        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Security</h3>
          <form onSubmit={savePassword} className="space-y-3 max-w-md">
            <input type="password" className="input-field" placeholder="Current Password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
            <input type="password" className="input-field" placeholder="New Password (min 8 chars)" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} required minLength={8} />
            <input type="password" className="input-field" placeholder="Confirm New Password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
          {!user?.email_verified && localStorage.getItem('email_verified') !== 'true' && (
            <button onClick={() => authApi.resendVerification()} className="mt-4 text-sm text-blue-600 hover:underline">
              Resend verification email
            </button>
          )}
        </section>

        <section className="bg-white dark:bg-red-900/20 border border-red-200 rounded-xl p-6">
          <h3 className="font-bold text-red-600 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
          <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete Account</button>
        </section>
      </div>
    </Layout>
  );
};

export default Settings;
