import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

const ministryLogo = '/assets/image.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { t: ta } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { login, isAuthenticated } = useAuth();
  const { showSuccess } = useNotification();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result.passwordExpired) {
        navigate('/change-password');
        return;
      }
      showSuccess('Login successful!');
      setTimeout(() => navigate('/dashboard'), 100);
    } catch (error: any) {
      if (
        error.response?.data?.requireMfa ||
        error.response?.data?.requiresMFA ||
        error.response?.data?.data?.requireMfa ||
        error.response?.data?.data?.requiresMFA ||
        error.message === 'MFA Required'
      ) {
        localStorage.setItem('mfaEmail', formData.email);
        navigate('/mfa');
        return;
      }
      setError(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1B4F8A 50%, #16437A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          top: '-30%',
          right: '-15%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,146,10,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          bottom: '-25%',
          left: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,146,10,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1200px',
          height: '1200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 4,
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 2px 16px rgba(27,79,138,0.08)',
            border: '1px solid rgba(229,231,235,0.5)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #1B4F8A 0%, #3B82F6 50%, #1B4F8A 100%)',
            },
          }}
        >
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <LanguageSwitcher />
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
            <Box display="flex" justifyContent="center" mb={0.5}>
              <img src={ministryLogo} alt="Ministry of Education" style={{ width: 56, height: 56 }} />
            </Box>
            <Typography variant="h6" fontWeight="700" color="#1B4F8A" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
              {tc('ministryOfEducation', { defaultValue: 'ትምህርት ሚኒስቴር' })}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" fontWeight="800" color="#1B4F8A" letterSpacing="-0.025em" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>
                ESSMS
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 280, mx: 'auto', lineHeight: 1.5, mt: 0.5 }}
            >
              {tc('appTitle')} — {tc('appSubtitle')}
            </Typography>
          </Box>

          <Typography
            variant="h5"
            gutterBottom
            fontWeight="700"
            sx={{ color: '#111827', mb: 0.5 }}
          >
            {ta('loginTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            {ta('loginSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={ta('emailLabel')}
              name="email"
              type="text"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="email"
              autoFocus
              size="small"
            />

            <TextField
              fullWidth
              label={ta('passwordLabel')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              autoComplete="current-password"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 3,
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(27,79,138,0.3)',
                background: 'linear-gradient(135deg, #1B4F8A 0%, #2563EB 100%)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(27,79,138,0.4)',
                  background: 'linear-gradient(135deg, #16437A 0%, #1B4F8A 100%)',
                },
                '&:disabled': {
                  background: 'rgba(27,79,138,0.4)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                ta('signIn')
              )}
            </Button>
          </Box>

          <Box textAlign="center" mt={1}>
            <Button
              onClick={() => navigate('/reset-password')}
              sx={{ textTransform: 'none', fontSize: '0.8rem', color: '#1B4F8A' }}
            >
              {ta('forgotPassword')}
            </Button>
          </Box>

          {/* Demo accounts removed for production-ready UI */}
        </Paper>
      </Container>
    </Box>
  );
};
