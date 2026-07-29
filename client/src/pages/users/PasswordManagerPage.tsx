import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, Tooltip, Avatar, Alert, IconButton,
  TextField, MenuItem, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Refresh, LockReset, ContentCopy, CheckCircle, Visibility, VisibilityOff,
  Search, VpnKey, Warning, InfoOutlined,
} from '@mui/icons-material';
import { usersAPI, getApiErrorMessage } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import type { User } from '../../types';

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

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*?';
  const all = upper + lower + digits + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = pwd.length; i < 12; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

interface UserPassword {
  userId: string;
  email: string;
  fullName: string;
  password: string;
  copied: boolean;
  revealedAt: Date;
}

export const PasswordManagerPage = () => {
  const { t: tUsers } = useTranslation('users');
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, UserPassword>>({});
  const [resetting, setResetting] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; user: User | null; password: string }>({
    open: false, user: null, password: '',
  });

  const [hideAllDialog, setHideAllDialog] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({ limit: 500 });
      setUsers(res.data.data || []);
    } catch {
      showError(tUsers('failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetch(); }, [fetch]);

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.userId || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = statusFilter === '' || statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive !== false) ||
      (statusFilter === 'suspended' && u.isActive === false);
    return matchSearch && matchRole && matchStatus;
  });

  const handleGenerateAndConfirm = (u: User) => {
    if (revealed[u._id]) {
      setRevealed((p) => {
        const next = { ...p };
        delete next[u._id];
        return next;
      });
      return;
    }
    const pwd = generatePassword();
    setConfirmDialog({ open: true, user: u, password: pwd });
  };

  const handleConfirmReset = async () => {
    const { user, password } = confirmDialog;
    if (!user || !password) return;

    setResetting((p) => ({ ...p, [user._id]: true }));
    setConfirmDialog({ open: false, user: null, password: '' });

    try {
      await usersAPI.resetPassword(user._id, password);
      setRevealed((p) => ({
        ...p,
        [user._id]: {
          userId: user._id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          password,
          copied: false,
          revealedAt: new Date(),
        },
      }));
      showSuccess(tUsers('passwordResetFor', { name: `${user.firstName} ${user.lastName}` }));
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, tUsers('failedToResetPassword')));
    } finally {
      setResetting((p) => ({ ...p, [user._id]: false }));
    }
  };

  const handleCopy = (id: string) => {
    const entry = revealed[id];
    if (!entry) return;
    navigator.clipboard.writeText(entry.password);
    setRevealed((p) => ({ ...p, [id]: { ...p[id], copied: true } }));
    showSuccess(tUsers('passwordCopied'));
    setTimeout(() => {
      setRevealed((p) => {
        if (p[id]) return { ...p, [id]: { ...p[id], copied: false } };
        return p;
      });
    }, 2000);
  };

  const handleCopyAll = () => {
    const passwords = Object.values(revealed)
      .map((r) => `${r.fullName} (${r.email}): ${r.password}`)
      .join('\n');
    navigator.clipboard.writeText(passwords);
    showSuccess(tUsers('copiedAll', { count: Object.keys(revealed).length }));
  };

  const handleHideAll = () => {
    setRevealed({});
    setHideAllDialog(false);
    showSuccess(tUsers('allPasswordsHidden'));
  };

  const revealedCount = Object.keys(revealed).length;

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tUsers('pageTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {tUsers('pageSubtitle')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {revealedCount > 0 && (
            <>
              <Button variant="outlined" size="small" startIcon={<ContentCopy />} onClick={handleCopyAll} sx={{ borderRadius: 2 }}>
                {tUsers('copyAll', { count: revealedCount })}
              </Button>
              <Button variant="outlined" size="small" color="warning" startIcon={<VisibilityOff />} onClick={() => setHideAllDialog(true)} sx={{ borderRadius: 2 }}>
                {tUsers('hideAll')}
              </Button>
            </>
          )}
          <Tooltip title={tUsers('refresh')}>
            <IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Alert severity="warning" icon={<Warning />} sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
        <strong>{tUsers('securityNotice')}</strong> {tUsers('securityNoticeMessage')}
      </Alert>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth size="small" placeholder={tUsers('searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ fontSize: 18, color: '#9CA3AF', mr: 1 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth size="small" label={tUsers('role')} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">{tUsers('allRoles')}</MenuItem>
              {Object.keys(roleStyles).map((r) => (
                <MenuItem key={r} value={r}>{roleLabels[r] || r}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth size="small" label={tUsers('status')} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">{tUsers('allStatus')}</MenuItem>
              <MenuItem value="active">{tUsers('active')}</MenuItem>
              <MenuItem value="suspended">{tUsers('suspended')}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button fullWidth variant="outlined" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }} sx={{ borderRadius: 2, py: '7px' }}>
              {tUsers('clear')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tUsers('colUser')}</TableCell>
                  <TableCell>{tUsers('colEmail')}</TableCell>
                  <TableCell>{tUsers('colRole')}</TableCell>
                  <TableCell>{tUsers('colStatus')}</TableCell>
                  <TableCell>{tUsers('colPassword')}</TableCell>
                  <TableCell align="right">{tUsers('colAction')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <InfoOutlined sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">
                        {users.length === 0 ? tUsers('noUsers') : tUsers('noUsersMatch')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u: User) => {
                    const r = revealed[u._id];
                    return (
                      <TableRow key={u._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: roleStyles[u.role]?.bg || 'rgba(107,114,128,0.12)', color: roleStyles[u.role]?.color || '#6B7280', fontSize: '0.75rem', fontWeight: 700 }}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {u.firstName} {u.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace" fontSize="0.7rem">
                                {u.username || u.userId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" color="text.secondary">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={roleLabels[u.role] || u.role} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: roleStyles[u.role]?.bg || 'rgba(107,114,128,0.12)', color: roleStyles[u.role]?.color || '#6B7280' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={u.isActive !== false ? tUsers('active') : tUsers('suspended')} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: u.isActive !== false ? 'rgba(45,125,58,0.12)' : 'rgba(181,37,26,0.1)', color: u.isActive !== false ? '#2D7D3A' : '#B5251A' }} />
                        </TableCell>
                        <TableCell>
                          {r ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Box sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B4F8A', bgcolor: 'rgba(27,79,138,0.06)', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.8rem', border: '1px solid rgba(27,79,138,0.12)' }}>
                                {r.password}
                              </Box>
                              <Tooltip title={r.copied ? tUsers('copied') : tUsers('copyPassword')}>
                                <IconButton size="small" onClick={() => handleCopy(u._id)} color={r.copied ? 'success' : 'default'} sx={{ borderRadius: 1 }}>
                                  {r.copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant={r ? 'outlined' : 'contained'}
                            size="small"
                            startIcon={r ? <VisibilityOff /> : <VpnKey />}
                            onClick={() => handleGenerateAndConfirm(u)}
                            disabled={resetting[u._id]}
                            color={r ? 'warning' : 'primary'}
                            sx={{ borderRadius: 2, fontSize: '0.7rem', minWidth: 110 }}
                          >
                            {resetting[u._id] ? '...' : r ? tUsers('hide') : tUsers('resetAndReveal')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {revealedCount > 0 && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem' }}>
          <strong>{tUsers('passwordsRevealed', { count: revealedCount })}</strong> {tUsers('passwordsRevealedMessage')}
        </Alert>
      )}

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, user: null, password: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          <VpnKey sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
          {tUsers('confirmPasswordReset')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {tUsers('confirmResetWarning')}
          </Alert>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tUsers('generateNewFor')} <strong>{confirmDialog.user?.firstName} {confirmDialog.user?.lastName}</strong> ({confirmDialog.user?.email})?
          </Typography>
          {confirmDialog.password && (
            <Box sx={{ bgcolor: 'rgba(27,79,138,0.04)', border: '1px solid rgba(27,79,138,0.12)', borderRadius: 2, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{tUsers('newPassword')}:</Typography>
              <Typography variant="body2" fontFamily="monospace" fontWeight={700} sx={{ color: '#1B4F8A', fontSize: '1rem', letterSpacing: '0.05em' }}>
                {confirmDialog.password}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmDialog({ open: false, user: null, password: '' })} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button onClick={handleConfirmReset} variant="contained" sx={{ borderRadius: 2 }}>
            {tUsers('resetAndReveal')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={hideAllDialog} onClose={() => setHideAllDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{tUsers('hideAllPasswords')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {tUsers('hideAllMessage', { count: revealedCount })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setHideAllDialog(false)} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button onClick={handleHideAll} variant="contained" color="warning" sx={{ borderRadius: 2 }}>{tUsers('hideAll')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
