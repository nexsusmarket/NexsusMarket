// client/src/components/Toast.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toastInfo } = useAuth();
  if (!toastInfo.show) return null;

  return (
    <div 
      id="toast-notification" 
      className="toast-show"
      style={{
        backgroundColor: toastInfo.isError ? '#ef4444' : '#1f2937',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
    >
      <i className={`fas ${toastInfo.isError ? 'fa-exclamation-circle text-white' : 'fa-check-circle text-green-400'}`}></i>
      <span id="toast-message" className="font-medium text-sm">{toastInfo.message}</span>
    </div>
  );
}

