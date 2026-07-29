import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Block, ArrowBack, Home } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" px={2}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 480,
          borderRadius: 4,
          border: '1px solid #E5E7EB',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Block sx={{ fontSize: 40, color: '#DC2626' }} />
        </Box>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          {tAuth('accessDenied', { defaultValue: 'Access Denied' })}
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={1}>
          {tAuth('noPermission', { defaultValue: 'You do not have permission to access this page.' })}
        </Typography>

        {user && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            {tAuth('loggedInAs', { defaultValue: 'Logged in as' })}{' '}
            <strong>{user.firstName} {user.lastName}</strong> ({user.role})
          </Typography>
        )}

        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            {t('goBack', { defaultValue: 'Go Back' })}
          </Button>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate('/dashboard')}
          >
            {t('dashboard')}
          </Button>
        </Box>

        <Button
          variant="text"
          color="error"
          size="small"
          sx={{ mt: 3 }}
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          {tAuth('logout', { defaultValue: 'Logout' })}
        </Button>
      </Paper>
    </Box>
  );
};
