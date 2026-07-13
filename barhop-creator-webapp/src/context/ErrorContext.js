import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
const TOAST_TYPES = {
  error: { classes: 'border-danger/40 text-danger', Icon: XCircleIcon },
  success: { classes: 'border-success/40 text-success', Icon: CheckCircleIcon },
  warning: {
    classes: 'border-secondary/40 text-secondary',
    Icon: ExclamationTriangleIcon,
  },
};

function ErrorToast({ errors, removeError }) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-[1000] flex w-[min(380px,calc(100vw-3rem))] flex-col gap-3">
      {errors.map((error) => {
        const { classes, Icon } = TOAST_TYPES[error.type] || TOAST_TYPES.error;
        return (
          <div
            key={error.id}
            className={`flex animate-toast-in cursor-pointer items-start gap-3 rounded-xl border bg-surface-overlay px-4 py-3 shadow-card ${classes}`}
            onClick={() => removeError(error.id)}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="flex-1 text-sm text-content">{error.message}</div>
            <button
              className="text-content-faint transition-colors hover:text-content"
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation();
                removeError(error.id);
              }}
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
