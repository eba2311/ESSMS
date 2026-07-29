import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Alert, Avatar, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  ArrowBack, Edit, Person, Email, Phone, Shield, CalendarToday,
  Block, CheckCircle, LockReset, Delete, GppGood, PersonOff,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { usersAPI, auditAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const roleLabels: Record<string, string> = {
  system_admin: 'System Admin',
  school_director: 'School Director',
  academic_head: 'Academic Head',
  registrar: 'Registrar',
  finance_officer: 'Finance Officer',
  teacher: 'Teacher',
  counselor: 'Counselor',
  librarian: 'Librarian',
  student: 'Student',
  parent: 'Parent',
};

const roleStyles: Record<string, { bg: string; color: string }> = {
  system_admin: { bg: 'rgba(181,37,26,0.12)', color: '#B5251A' },
  school_director: { bg: 'rgba(27,79,138,0.12)', color: '#1B4F8A' },
  academic_head: { bg: 'rgba(15,118,110,0.12)', color: '#0F766E' },
  registrar: { bg: 'rgba(27,79,138,0.08)', color: '#1B4F8A' },
  finance_officer: { bg: 'rgba(201,146,10,0.12)', color: '#C9920A' },
  teacher: { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A' },
  counselor: { bg: 'rgba(27,79,138,0.08)', color: '#1B4F8A' },
  librarian: { bg: 'rgba(15,118,110,0.12)', color: '#0F766E' },
  student: { bg: 'rgba(27,79,138,0.08)', color: '#1B4F8A' },
  parent: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
};

export const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t: tUsers } = useTranslation('users');
  const { showError, showSuccess } = useNotification();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [resetDialog, setResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; activate: boolean }>({ open: false, activate: false });
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchUser = async () => {
    try {
      const [uRes, logRes] = await Promise.all([
        usersAPI.get(id!),
        auditAPI.list({ userId: id, limit: 20 }).catch(() => ({ data: { data: { logs: [] } } })),
      ]);
      setUser(uRes.data.data);
      setAuditLogs(logRes.data.data?.logs || logRes.data.data || []);
    } catch {
      showError(tUsers('failedToLoadUser'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      showError(tUsers('passwordMinLength'));
      return;
    }
    try {
      await usersAPI.resetPassword(id!, resetPassword);
      showSuccess(tUsers('passwordResetSuccess'));
      setResetDialog(false);
      setResetPassword('');
      fetchUser();
    } catch (err: any) {
      showError(err.response?.data?.message || tUsers('failedToResetPassword'));
    }
  };

  const handleToggleStatus = async () => {
    try {
      await usersAPI.changeStatus(id!, statusDialog.activate);
      showSuccess(`${tUsers('user')} ${statusDialog.activate ? tUsers('activated') : tUsers('suspended')} ${tUsers('successfully')}`);
      setStatusDialog({ open: false, activate: false });
      fetchUser();
    } catch (err: any) {
      showError(err.response?.data?.message || tUsers('failedToUpdateStatus'));
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(id!);
      showSuccess(tUsers('userDeletedSuccess'));
      navigate('/users');
    } catch (err: any) {
      showError(err.response?.data?.message || tUsers('failedToDeleteUser'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Alert severity="error" sx={{ borderRadius: 2 }}>{tUsers('userNotFound')}</Alert>;

  const isActive = user.isActive !== false;
  const isSelf = currentUser?.id === user._id;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/users')} sx={{ borderRadius: 2 }}>
          {tUsers('back')}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(`/users/${id}/edit`)}
          sx={{ borderRadius: 2 }}
        >
          Edit
        </Button>
        {!isSelf && (
          <>
            <Button
              variant="outlined"
              startIcon={<LockReset />}
              onClick={() => setResetDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              {tUsers('resetPassword')}
            </Button>
            <Button
              variant="outlined"
              startIcon={isActive ? <Block /> : <CheckCircle />}
              color={isActive ? 'error' : 'success'}
              onClick={() => setStatusDialog({ open: true, activate: !isActive })}
              sx={{ borderRadius: 2 }}
            >
              {isActive ? tUsers('suspend') : tUsers('activate')}
            </Button>
            {currentUser?.role === 'system_admin' && (
              <Button
                variant="outlined"
                startIcon={<Delete />}
                color="error"
                onClick={() => setDeleteDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </Box>

      {/* User Header Card */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 72, height: 72,
                    bgcolor: roleStyles[user.role]?.bg || 'rgba(107,114,128,0.12)',
                    color: roleStyles[user.role]?.color || '#6B7280',
                    fontSize: 28, fontWeight: 800,
                  }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.025em' }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {user.userId}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">·</Typography>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary" fontSize="0.8rem">
                      @{user.username}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip
                  icon={<Shield sx={{ fontSize: 14 }} />}
                  label={roleLabels[user.role] || user.role}
                  sx={{
                    borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem',
                    bgcolor: roleStyles[user.role]?.bg || 'rgba(107,114,128,0.12)',
                    color: roleStyles[user.role]?.color || '#6B7280',
                  }}
                />
                <Chip
                  icon={isActive ? <GppGood sx={{ fontSize: 14 }} /> : <PersonOff sx={{ fontSize: 14 }} />}
                  label={isActive ? tUsers('active') : tUsers('suspended')}
                  sx={{
                    borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem',
                    bgcolor: isActive ? 'rgba(45,125,58,0.12)' : 'rgba(181,37,26,0.1)',
                    color: isActive ? '#2D7D3A' : '#B5251A',
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
                {user.mfaEnabled && (
                  <Chip
                    label={tUsers('mfaEnabled')}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(45,125,58,0.08)', color: '#2D7D3A' }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        {/* Contact Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('contactInformation')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Email sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('email')}</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.email}</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Phone sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('phone')}</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.phone || '—'}</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Person sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('username')}</Typography>
                  <Typography variant="body2" fontWeight={500} fontFamily="monospace">{user.username}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Account Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('accountDetails')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <CalendarToday sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('created')}</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <CalendarToday sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('lastLogin')}</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : tUsers('never')}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <LockReset sx={{ fontSize: 18, color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{tUsers('passwordChanged')}</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Activity Log */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('recentActivity')}</Typography>
            <Divider sx={{ mb: 2 }} />
            {auditLogs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>{tUsers('noActivity')}</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {auditLogs.map((log: any) => (
                  <Box key={log._id} display="flex" alignItems="flex-start" gap={1.5} py={0.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1B4F8A', mt: 0.75, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{log.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                        {log.ipAddress && ` · ${log.ipAddress}`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog} onClose={() => { setResetDialog(false); setResetPassword(''); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          <LockReset sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
          {tUsers('resetPassword')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {tUsers('resetPasswordWarning')}
          </Alert>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tUsers('setNewPasswordFor')} <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
          </Typography>
          <TextField
            fullWidth label={tUsers('newPassword')} type="password" size="small"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            error={resetPassword.length > 0 && resetPassword.length < 6}
            helperText={resetPassword.length >= 6 ? tUsers('passwordStrengthOk') : resetPassword ? tUsers('minimum6Characters') : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setResetDialog(false); setResetPassword(''); }} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={resetPassword.length < 6} sx={{ borderRadius: 2 }}>
            {tUsers('resetPassword')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, activate: false })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {statusDialog.activate ? tUsers('activateUser') : tUsers('suspendUser')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {statusDialog.activate
              ? <>{tUsers('confirmActivate')} <strong>{user.firstName} {user.lastName}</strong>? {tUsers('willBeAbleToLogin')}</>
              : <>{tUsers('confirmSuspend')} <strong>{user.firstName} {user.lastName}</strong>? {tUsers('willNotBeAbleToLogin')}</>
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setStatusDialog({ open: false, activate: false })} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button
            onClick={handleToggleStatus}
            variant="contained"
            sx={{ borderRadius: 2, bgcolor: statusDialog.activate ? '#2D7D3A' : '#B5251A', '&:hover': { bgcolor: statusDialog.activate ? '#246830' : '#9A1E15' } }}
          >
            {statusDialog.activate ? tUsers('activate') : tUsers('suspend')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#B5251A' }}>
          <Delete sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20, color: '#B5251A' }} />
          {tUsers('deleteUserPermanently')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {tUsers('actionCannotBeUndone')}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {tUsers('confirmDelete')} <strong>{user.firstName} {user.lastName}</strong> ({user.email})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" sx={{ borderRadius: 2, bgcolor: '#B5251A', '&:hover': { bgcolor: '#9A1E15' } }}>
            {tUsers('deletePermanently')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
