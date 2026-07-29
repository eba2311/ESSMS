import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import { Security } from '@mui/icons-material';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export const MfaVerificationPage = () => {
  const navigate = useNavigate();
  const { t: tAuth } = useTranslation('auth');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = localStorage.getItem('mfaEmail') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) { setError(tAuth('pleaseEnterVerificationCode')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/mfa/verify', { email, token: token.trim() });
      const { accessToken, refreshToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.removeItem('mfaEmail');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || tAuth('invalidVerificationCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Box display="flex" justifyContent="center" mb={2}>
          <Security sx={{ fontSize: 48, color: 'primary.main' }} />
        </Box>
        <Typography variant="h5" fontWeight="700" gutterBottom>{tAuth('twoFactorAuth')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {tAuth('enterSixDigitCode')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label={tAuth('verificationCode')} value={token}
            onChange={(e) => { setToken(e.target.value); setError(''); }}
            placeholder="000000" inputProps={{ maxLength: 6, style: { fontSize: 24, letterSpacing: 8, textAlign: 'center' } }}
            sx={{ mb: 3 }} />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : tAuth('verify')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
