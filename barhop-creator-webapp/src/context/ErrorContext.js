import React, { createContext, useContext, useState, useCallback } from 'react';

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

  const showError = useCallback((message, type = 'error') => {
    const id = Date.now();
    const newError = { id, message, type };

    setErrors((prev) => [...prev, newError]);
  }, []);

  const removeError = (id) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
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
const TOAST_TYPE_CLASSES = {
  error: 'border-red-400/40 text-red-300',
  success: 'border-emerald-400/40 text-emerald-300',
  warning: 'border-accent/40 text-accent',
};

function ErrorToast({ errors, removeError }) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-[1000] flex w-[min(380px,calc(100vw-3rem))] flex-col gap-3">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`flex animate-toast-in cursor-pointer items-start gap-3 rounded-xl border bg-surface-card px-4 py-3 shadow-2xl ${
            TOAST_TYPE_CLASSES[error.type] || TOAST_TYPE_CLASSES.error
          }`}
          onClick={() => removeError(error.id)}
        >
          <div className="text-base">
            {error.type === 'error' && '❌'}
            {error.type === 'success' && '✅'}
            {error.type === 'warning' && '⚠️'}
          </div>
          <div className="flex-1 text-sm text-gray-200">{error.message}</div>
          <button
            className="text-gray-500 transition hover:text-white"
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
