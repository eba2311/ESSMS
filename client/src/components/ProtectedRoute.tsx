import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return children;
};
