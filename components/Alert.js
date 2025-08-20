import React from 'react';
import '@/styles/Alert.css';

function Alert({ message, isVisible }) {
  if (!isVisible) return null;
  
  return (
    <div className="alert-overlay">
      <div className="alert-content">
        {message}
      </div>
    </div>
  );
}

export default Alert; 