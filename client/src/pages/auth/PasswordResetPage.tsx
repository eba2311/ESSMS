import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress, Stepper, Step, StepLabel,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { authAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
export const PasswordResetPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const { t: tAuth } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const [activeStep, setActiveStep] = useState(token ? 2 : 0);
  const steps = [tAuth('requestReset'), tAuth('checkEmail'), tAuth('resetPassword')];
  const [email, setEmail] = useState(emailParam || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError(tAuth('enterYourEmail')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.passwordReset({ email });
      const resetToken = res.data?.data?.resetToken;
      if (resetToken) {
        showSuccess(tAuth('resetCodeSent', { token: resetToken }));
        setCode(resetToken);
      } else {
        showSuccess(tAuth('resetCodeEmailSent'));
      }
      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.message || tAuth('failedToSendResetCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError(tAuth('enterYourEmail')); return; }
    if (password !== confirmPassword) { setError(tAuth('passwordsDoNotMatch')); return; }
    if (password.length < 8) { setError(tAuth('passwordMin8Chars')); return; }
    setLoading(true);
    setError('');
    try {
      await authAPI.passwordReset({
        email, token: code || token, newPassword: password,
      });
      showSuccess(tAuth('passwordResetSuccessful'));
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || tAuth('failedToResetPassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 460, width: '100%' }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
          <Lock sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
          <Typography variant="h4" fontWeight="700" color="primary">ESSMS</Typography>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {activeStep === 0 && (
          <Box component="form" onSubmit={handleRequestReset}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {tAuth('enterEmailForResetCode')}
            </Typography>
            <TextField fullWidth label={tAuth('email')} type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }} required sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : tAuth('sendResetCode')}
            </Button>
          </Box>
        )}
        {activeStep === 1 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {tAuth('resetCodeSentTo', { email })}
            </Typography>
            <TextField fullWidth label={tAuth('resetCode')} value={code}
              onChange={(e) => setCode(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label={tAuth('newPassword')} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label={tAuth('confirmPassword')} type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : tAuth('resetPassword')}
            </Button>
          </Box>
        )}
        {activeStep === 2 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {tAuth('enterEmailAndNewPassword')}
            </Typography>
            <TextField fullWidth label={tAuth('email')} type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }} required sx={{ mb: 2 }} />
            <TextField fullWidth label={tAuth('newPassword')} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label={tAuth('confirmPassword')} type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : tAuth('resetPassword')}
            </Button>
          </Box>
        )}
        <Box textAlign="center" mt={2}>
          <Button onClick={() => navigate('/login')}>{tAuth('backToLogin')}</Button>
        </Box>
      </Paper>
    </Box>
  );
};
