import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

let toastId = 0;
let toastListeners = [];

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
};

const showToast = (message, type) => {
  const id = ++toastId;
  const newToast = { id, message, type };
  toastListeners.forEach(listener => listener(newToast));
  
  setTimeout(() => {
    toastListeners.forEach(listener => listener(null, id));
  }, 4000);
};

function SimpleToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (newToast, removeId) => {
      if (removeId) {
        setToasts(prev => prev.filter(t => t.id !== removeId));
      } else if (newToast) {
        setToasts(prev => [...prev, newToast]);
      }
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-75 max-w-md animate-slide-in ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default SimpleToast;