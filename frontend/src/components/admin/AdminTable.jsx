/**
 * Guardian-Link — AdminTable Component
 * User management table for the admin panel.
 */

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const AdminTable = ({ users = [], onDelete }) => {
  return (
    <table className="w-full text-left border-collapse text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 font-semibold text-slate-600">User</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
          <th className="px-6 py-4 font-semibold text-slate-600 hidden sm:table-cell">Joined</th>
          <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {users.map((u) => (
          <tr key={u.id || u.email} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-medium text-slate-800">{u.full_name || u.name}</div>
              <div className="text-slate-500 text-xs">{u.email}</div>
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                u.role === 'Admin' ? 'bg-purple-100 text-purple-700'
                : u.role === 'Authority' ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700'
              }`}>
                {u.role}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                Active
              </span>
            </td>
            <td className="px-6 py-4 hidden sm:table-cell text-slate-500 font-medium">
              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                  onClick={() => onDelete && onDelete(u.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminTable;
