import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Lock, Save, CheckCircle, Cancel } from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const validatePassword = (pw: string, t: (key: string) => string): { valid: boolean; checks: { label: string; pass: boolean }[] } => {
  const checks = [
    { label: t('atLeast8Chars'), pass: pw.length >= 8 },
    { label: t('containsUppercase'), pass: /[A-Z]/.test(pw) },
    { label: t('containsLowercase'), pass: /[a-z]/.test(pw) },
    { label: t('containsNumber'), pass: /[0-9]/.test(pw) },
    { label: t('containsSpecialChar'), pass: /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];
  return { valid: checks.every((c) => c.pass), checks };
};

export const ChangePasswordPage = () => {
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { t: tAuth } = useTranslation('auth');
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pwValidation = validatePassword(form.newPassword, tAuth);
  const passwordsMatch = form.newPassword === form.confirmPassword;
  const canSubmit = form.currentPassword && pwValidation.valid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError(tAuth('allFieldsRequired'));
      return;
    }
    if (!pwValidation.valid) {
      setError(tAuth('passwordDoesNotMeetRequirements'));
      return;
    }
    if (!passwordsMatch) {
      setError(tAuth('passwordsDoNotMatch'));
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword(form.currentPassword, form.newPassword);
      showSuccess(tAuth('passwordChangedSuccessfully'));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || tAuth('failedToChangePassword'));
      showError(err.response?.data?.message || tAuth('failedToChangePassword'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', maxWidth: 440, width: '100%' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(27,79,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock sx={{ color: '#1B4F8A', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#111827' }}>{tAuth('changePassword')}</Typography>
            <Typography variant="body2" color="text.secondary">{tAuth('setStrongPassword')}</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {form.newPassword && (
          <Alert severity={pwValidation.valid ? 'success' : 'info'} sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
            <List dense disablePadding>
              {pwValidation.checks.map((c) => (
                <ListItem key={c.label} disableGutters sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {c.pass ? <CheckCircle sx={{ fontSize: 16, color: '#2D7D3A' }} /> : <Cancel sx={{ fontSize: 16, color: '#9CA3AF' }} />}
                  </ListItemIcon>
                  <ListItemText primary={c.label} primaryTypographyProps={{ variant: 'caption', color: c.pass ? 'success.main' : 'text.secondary' }} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label={tAuth('currentPassword')} type="password" size="small" value={form.currentPassword}
            onChange={e => setForm({ ...form, currentPassword: e.target.value })} required sx={{ mb: 2 }} />
          <TextField fullWidth label={tAuth('newPassword')} type="password" size="small" value={form.newPassword}
            onChange={e => setForm({ ...form, newPassword: e.target.value })} required sx={{ mb: 2 }}
            error={form.newPassword.length > 0 && !pwValidation.valid} />
          <TextField fullWidth label={tAuth('confirmNewPassword')} type="password" size="small" value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required sx={{ mb: 3 }}
            error={form.confirmPassword.length > 0 && !passwordsMatch}
            helperText={form.confirmPassword.length > 0 && !passwordsMatch ? tAuth('passwordsDoNotMatch') : ''} />
          <Button type="submit" variant="contained" fullWidth disabled={!canSubmit || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            sx={{ borderRadius: 2, py: 1.2 }}>
            {saving ? tAuth('changing') : tAuth('changePassword')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
