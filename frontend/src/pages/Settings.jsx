/**
 * Guardian-Link — Settings Page
 * User profile, preferences, and security settings.
 */

import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Settings as SettingsIcon, Save, Moon, Bell, Mail, Globe, Shield, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark);
  };

  const userName = localStorage.getItem('user_name') || 'Guardian User';

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-2">
          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-5 h-5 text-slate-700" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 text-sm">Manage your account, preferences, and notification settings</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Profile Information</h3>
            <p className="text-sm text-slate-500">Update your personal details and contact information</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-3xl flex items-center justify-center rounded-full shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-slate-50">
                  ✏️
                </button>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{userName}</h4>
                <p className="text-sm text-slate-500">Member since 2024</p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Full Name</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none" defaultValue={userName} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Email</label>
                  <input type="email" readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 opacity-70 outline-none" defaultValue="user@guardianlink.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Mobile Number</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none" placeholder="Your mobile" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Gender</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none">
                    <option>Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Address</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none" placeholder="Your address" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50">Cancel</button>
                <button type="button" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Preferences</h3>
            <p className="text-sm text-slate-500">Customize your app experience</p>
          </div>
          <div className="p-2">
            {[
              { icon: Moon, title: 'Dark Mode', desc: 'Switch between light and dark theme', toggle: true, checked: darkMode, onChange: toggleDarkMode },
              { icon: Bell, title: 'Push Notifications', desc: 'Get alerts for new matches and reports', toggle: true, checked: true },
              { icon: Mail, title: 'Email Notifications', desc: 'Receive email updates for AI match results', toggle: true, checked: true },
            ].map(({ icon: Icon, title, desc, toggle, checked, onChange }, i) => (
              <div key={i} className={`flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
                {toggle && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange || (() => {})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Globe className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Language</h4>
                  <p className="text-xs text-slate-500">Select your preferred language</p>
                </div>
              </div>
              <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none bg-white">
                <option>English</option>
                <option>हिन्दी</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Security</h3>
            <p className="text-sm text-slate-500">Manage your password and account security</p>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Current Password</label>
                <input type="password" placeholder="Enter current password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none max-w-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex items-center gap-3 border-t border-slate-100 mt-6">
                <button type="button" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm flex items-center gap-2 hover:bg-blue-700">
                  <Shield className="w-4 h-4" /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-red-100 bg-red-50/30">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-red-400">Irreversible and destructive actions</p>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Delete Account</h4>
              <p className="text-xs text-slate-500">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium text-sm hover:bg-red-600 hover:text-white transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
