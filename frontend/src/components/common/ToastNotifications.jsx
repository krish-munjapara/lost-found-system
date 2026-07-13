import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const toastStyles = {
  success: 'bg-green-600',
  alert: 'bg-red-600',
  info: 'bg-blue-600',
};

const ToastNotifications = () => {
  const { toasts, removeToast } = useNotifications();

  if (!toasts?.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white pointer-events-auto flex justify-between items-center max-w-sm animate-slideInRight ${toastStyles[toast.type] || 'bg-slate-800'}`}
        >
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-4 text-white/80 hover:text-white">&times;</button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications;
