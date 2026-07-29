import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, TextField, Button, Grid, Avatar, Divider, Alert, CircularProgress } from '@mui/material';
import { Person, Edit, Lock, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api, { authAPI } from '../../services/api';

export const ProfilePage = () => {
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { showSuccess } = useNotification();

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    try {
      await api.put('/auth/profile', formData);
      showSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSuccess('Password changed successfully');
      setChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>{tProfile('title')}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6">{user.firstName} {user.lastName}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" color="primary" sx={{ mt: 1, textTransform: 'capitalize' }}>
              {user.role.replace(/_/g, ' ')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              {tCommon('id')}: {user.userId}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{tProfile('personalInformation')}</Typography>
              <Button
                startIcon={editing ? <Cancel /> : <Edit />}
                onClick={() => setEditing(!editing)}
                color={editing ? 'error' : 'primary'}
              >
                {editing ? tCommon('cancel') : tCommon('edit')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label={tCommon('firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label={tCommon('lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label={tCommon('email')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              {editing && (
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveProfile} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : tCommon('saveChanges')}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{tProfile('changePassword')}</Typography>
              <Button
                startIcon={changingPassword ? <Cancel /> : <Lock />}
                onClick={() => setChangingPassword(!changingPassword)}
                color={changingPassword ? 'error' : 'primary'}
              >
                {changingPassword ? tCommon('cancel') : tCommon('change')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {changingPassword && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth type="password" label={tProfile('currentPassword')}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth type="password" label={tProfile('newPassword')}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth type="password" label={tProfile('confirmNewPassword')}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Lock />} onClick={handleChangePassword} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : tProfile('updatePassword')}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
