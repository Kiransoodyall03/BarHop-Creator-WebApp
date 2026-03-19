import React, { createContext, useContext, useState } from 'react';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const showError = (message, type = 'error') => {
    const id = Date.now();
    const newError = { id, message, type };
    
    setErrors(prev => [...prev, newError]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(id);
    }, 5000);
  };

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const showSuccess = (message) => {
    showError(message, 'success');
  };

  const showWarning = (message) => {
    showError(message, 'warning');
  };

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning }}>
      {children}
      <ErrorToast errors={errors} removeError={removeError} />
    </ErrorContext.Provider>
  );
};

// Toast component
function ErrorToast({ errors, removeError }) {
  if (errors.length === 0) return null;

  return (
    <div className="toast-container">
      {errors.map((error) => (
        <div 
          key={error.id} 
          className={`toast toast-${error.type}`}
          onClick={() => removeError(error.id)}
        >
          <div className="toast-icon">
            {error.type === 'error' && '❌'}
            {error.type === 'success' && '✅'}
            {error.type === 'warning' && '⚠️'}
          </div>
          <div className="toast-message">{error.message}</div>
          <button 
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeError(error.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}