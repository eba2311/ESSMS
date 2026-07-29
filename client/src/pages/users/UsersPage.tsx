import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Tooltip, Avatar,
  TablePagination, InputAdornment, Alert,
} from '@mui/material';
import {
  Add, Edit, Block, CheckCircle, Refresh, AdminPanelSettings, LockReset,
  Search, Delete, PersonOff, GppGood, VpnKey, Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersAPI, getApiErrorMessage } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import type { User, UserRole } from '../../types';

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

const allRoles = Object.keys(roleStyles);

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

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const UsersPage = () => {
  const { t: tUsers } = useTranslation('users');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 0, limit: 25, total: 0, pages: 0 });

  // Search & filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dialogs
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);

  const [resetDialog, setResetDialog] = useState<{ open: boolean; user: User | null; password: string }>({ open: false, user: null, password: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; user: User | null; activate: boolean }>({ open: false, user: null, activate: false });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await usersAPI.list(params as any);
      setUsers(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, pagination.limit]);

  useEffect(() => { fetchUsers(1); }, []); // eslint-disable-line

  const handleSearch = () => { fetchUsers(1); };

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'teacher' });
    setDialog(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', password: '', role: u.role });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      showError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Only send profile fields (no role, no password)
        const { firstName, lastName, email, phone } = form;
        await usersAPI.update(editing._id, { firstName, lastName, email, phone } as any);
        showSuccess('User profile updated');

        // If role changed, use the dedicated endpoint
        if (form.role !== editing.role) {
          await usersAPI.changeRole(editing._id, form.role);
          showSuccess('User role updated');
        }
      } else {
        if (!form.password || form.password.length < 6) {
          showError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        await usersAPI.create(form as any);
        showSuccess('User created successfully');
      }
      setDialog(false);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const { user, password } = resetDialog;
    if (!user || !password) return;
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      showError('Password must include uppercase, lowercase, number, and special character');
      return;
    }
    try {
      await usersAPI.resetPassword(user._id, password);
      showSuccess(`Password reset for ${user.firstName} ${user.lastName}. New password: ${password}`);
      setResetDialog({ open: false, user: null, password: '' });
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to reset password'));
    }
  };

  const handleToggleStatus = async () => {
    const { user, activate } = statusDialog;
    if (!user) return;
    try {
      await usersAPI.changeStatus(user._id, activate);
      showSuccess(`User ${activate ? 'activated' : 'suspended'} successfully`);
      setStatusDialog({ open: false, user: null, activate: false });
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleDeleteUser = async () => {
    const { user } = deleteDialog;
    if (!user) return;
    try {
      await usersAPI.delete(user._id);
      showSuccess(`User ${user.firstName} ${user.lastName} deleted`);
      setDeleteDialog({ open: false, user: null });
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to delete user'));
    }
  };

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pw = 'Admin';
    for (let i = 0; i < 7; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  };

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={1.5}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tUsers('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {tUsers('subtitle')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/users/new')} sx={{ borderRadius: 2, px: 3 }}>
            {tUsers('create')}
          </Button>
          <Tooltip title={tCommon('refresh')}>
            <IconButton onClick={() => fetchUsers(pagination.page)} size="small" sx={{ borderRadius: 2 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search & Filter Bar */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder={tCommon('searchByNameEmailId')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label={tCommon('role')}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">{tCommon('allRoles')}</MenuItem>
              {allRoles.map((r) => (
                <MenuItem key={r} value={r}>{roleLabels[r] || r}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label={tCommon('status')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">{tCommon('allStatus')}</MenuItem>
              <MenuItem value="true">{tCommon('active')}</MenuItem>
              <MenuItem value="false">{tCommon('suspended')}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
              sx={{ borderRadius: 2, py: '7px' }}
            >
              {tCommon('filter')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('user')}</TableCell>
                  <TableCell>{tCommon('email')}</TableCell>
                  <TableCell>{tCommon('phone')}</TableCell>
                  <TableCell>{tCommon('role')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                  <TableCell>{tCommon('lastLogin')}</TableCell>
                  <TableCell align="right">{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <AdminPanelSettings sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">{tUsers('noUsers')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: User) => (
                    <TableRow key={u._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'pointer' }} onClick={() => navigate(`/users/${u._id}`)}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 32, height: 32,
                              bgcolor: roleStyles[u.role]?.bg || 'rgba(107,114,128,0.12)',
                              color: roleStyles[u.role]?.color || '#6B7280',
                              fontSize: '0.75rem', fontWeight: 700,
                            }}
                          >
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {u.firstName} {u.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {u.userId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.phone || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={roleLabels[u.role] || u.role}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: roleStyles[u.role]?.bg || 'rgba(107,114,128,0.12)',
                            color: roleStyles[u.role]?.color || '#6B7280',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={u.isActive !== false ? <GppGood sx={{ fontSize: 14 }} /> : <PersonOff sx={{ fontSize: 14 }} />}
                          label={u.isActive !== false ? 'Active' : 'Suspended'}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: u.isActive !== false ? 'rgba(45,125,58,0.12)' : 'rgba(181,37,26,0.1)',
                            color: u.isActive !== false ? '#2D7D3A' : '#B5251A',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={tCommon('viewProfile')}>
                          <IconButton size="small" onClick={() => navigate(`/users/${u._id}`)} sx={{ borderRadius: 1.5 }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tCommon('editProfile')}>
                          <IconButton size="small" onClick={() => navigate(`/users/${u._id}/edit`)} sx={{ borderRadius: 1.5 }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tUsers('resetPassword')}>
                          <IconButton size="small" onClick={() => setResetDialog({ open: true, user: u, password: '' })} sx={{ borderRadius: 1.5 }}>
                            <LockReset fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.isActive !== false ? tUsers('suspend') : tUsers('activate')}>
                          <IconButton
                            size="small"
                            onClick={() => setStatusDialog({ open: true, user: u, activate: u.isActive === false })}
                            sx={{ borderRadius: 1.5, color: u.isActive !== false ? '#B5251A' : '#2D7D3A' }}
                          >
                            {u.isActive !== false ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tUsers('deleteUser')}>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, user: u })}
                            sx={{ borderRadius: 1.5, color: '#B5251A' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {pagination.total > 0 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            rowsPerPage={pagination.limit}
            onPageChange={(_, newPage) => fetchUsers(newPage + 1)}
            rowsPerPageOptions={[25, 50, 100]}
            onRowsPerPageChange={(e) => {
              setPagination((p) => ({ ...p, limit: parseInt(e.target.value) }));
              fetchUsers(1);
            }}
          />
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {editing ? tUsers('editUserProfile') : tUsers('createNewUser')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={6}>
              <TextField fullWidth label={`${tCommon('firstName')} *`} size="small" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={`${tCommon('lastName')} *`} size="small" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={`${tCommon('email')} *`} size="small" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tCommon('phone')} size="small" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +251911223344" />
            </Grid>
            {!editing && (
              <Grid item xs={12}>
                <TextField
                  fullWidth label={`${tCommon('password')} *`} type="password" size="small"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  helperText={form.password && form.password.length < 6 ? 'Minimum 6 characters' : ''}
                  error={!!form.password && form.password.length < 6}
                />
              </Grid>
            )}
            {!editing && (
              <Grid item xs={12}>
                <TextField
                  select fullWidth label={tCommon('role')} size="small"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {allRoles.map((r) => (
                    <MenuItem key={r} value={r}>{roleLabels[r] || r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {editing && (
              <Grid item xs={12}>
                <TextField
                  select fullWidth label={tCommon('role')} size="small"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {allRoles.map((r) => (
                    <MenuItem key={r} value={r}>{roleLabels[r] || r}</MenuItem>
                  ))}
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Role changes take effect immediately.
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? tCommon('saving') : editing ? tUsers('saveChanges') : tUsers('createUser')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, user: null, password: '' })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          <VpnKey sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
          Reset Password
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {tUsers('resetPasswordWarning')}
          </Alert>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tUsers('resetPasswordDescription')} <strong>{resetDialog.user?.firstName} {resetDialog.user?.lastName}</strong> ({resetDialog.user?.email}).
          </Typography>
          <TextField
            fullWidth
            label={tUsers('newPassword')}
            type="password"
            size="small"
            value={resetDialog.password}
            onChange={(e) => setResetDialog({ ...resetDialog, password: e.target.value })}
            placeholder={tCommon('passwordPlaceholder')}
            error={resetDialog.password.length > 0 && resetDialog.password.length < 6}
            helperText={
              resetDialog.password.length >= 6
                ? tCommon('passwordStrengthOk')
                : resetDialog.password ? tCommon('minimumSixChars') : ''
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setResetDialog({ open: false, user: null, password: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={resetDialog.password.length < 6} sx={{ borderRadius: 2 }}>
          {tUsers('resetPassword')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, user: null, activate: false })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {statusDialog.activate ? tUsers('activateUser') : tUsers('suspendUser')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {statusDialog.activate
              ? <>{tUsers('activateConfirm')} <strong>activate</strong> <strong>{statusDialog.user?.firstName} {statusDialog.user?.lastName}</strong>{tUsers('activateConfirmEnd')}</>
              : <>{tUsers('suspendConfirm')} <strong>suspend</strong> <strong>{statusDialog.user?.firstName} {statusDialog.user?.lastName}</strong>{tUsers('suspendConfirmEnd')}</>
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setStatusDialog({ open: false, user: null, activate: false })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button
            onClick={handleToggleStatus}
            variant="contained"
            sx={{ borderRadius: 2, bgcolor: statusDialog.activate ? '#2D7D3A' : '#B5251A', '&:hover': { bgcolor: statusDialog.activate ? '#246830' : '#9A1E15' } }}
          >
            {statusDialog.activate ? tUsers('activate') : tUsers('suspend')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#B5251A' }}>
          <Delete sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20, color: '#B5251A' }} />
          {tUsers('deleteUserPermanently')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            This action cannot be undone. All data associated with this user will be permanently removed.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{deleteDialog.user?.firstName} {deleteDialog.user?.lastName}</strong> ({deleteDialog.user?.email})?
            This user has role <strong>{deleteDialog.user ? roleLabels[deleteDialog.user.role] : ''}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleDeleteUser} variant="contained" sx={{ borderRadius: 2, bgcolor: '#B5251A', '&:hover': { bgcolor: '#9A1E15' } }}>
            {tUsers('deletePermanently')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
