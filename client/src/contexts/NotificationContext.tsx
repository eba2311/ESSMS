import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertProps } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertProps['severity']) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertProps['severity'];
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = useCallback((message: string, severity: AlertProps['severity'] = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  const showSuccess = useCallback((message: string) => showNotification(message, 'success'), [showNotification]);
  const showError = useCallback((message: string) => showNotification(message, 'error'), [showNotification]);
  const showWarning = useCallback((message: string) => showNotification(message, 'warning'), [showNotification]);
  const showInfo = useCallback((message: string) => showNotification(message, 'info'), [showNotification]);

  const handleClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};