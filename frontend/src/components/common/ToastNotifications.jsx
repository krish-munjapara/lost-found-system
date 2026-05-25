import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const ToastNotifications = () => {
  const { toasts, removeToast } = useNotifications();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white pointer-events-auto flex justify-between items-center bg-slate-800`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-300 focus:outline-none"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications;
