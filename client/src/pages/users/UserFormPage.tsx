import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, TextField, Select, InputLabel,
  FormControl, MenuItem, Grid, CircularProgress, Alert, Chip, Avatar,
} from '@mui/material';
import { ArrowBack, Save, PersonAdd, ContentCopy, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const allRoles = [
  'system_admin', 'school_director', 'academic_head', 'registrar',
  'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent',
];

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

export const UserFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { t: tUsers } = useTranslation('users');
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [credentials, setCredentials] = useState<{ userId: string; username: string; email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'teacher',
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      usersAPI
        .get(id!)
        .then((r) => {
          const u = r.data.data;
          setForm({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            phone: u.phone || '',
            password: '',
            role: u.role || 'teacher',
          });
        })
        .catch(() => showError(tUsers('failedToLoadUser')))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const { firstName, lastName, email, phone } = form;
        await usersAPI.update(id!, { firstName, lastName, email, phone } as any);
        if (form.role !== undefined) {
          const userRes = await usersAPI.get(id!);
          if (userRes.data.data.role !== form.role) {
            await usersAPI.changeRole(id!, form.role);
          }
        }
        showSuccess(tUsers('userUpdated'));
        navigate('/users');
      } else {
        if (!form.password || form.password.length < 6) {
          setError(tUsers('passwordMinLength'));
          setSaving(false);
          return;
        }
        const res = await usersAPI.create(form as any);
        const data = res.data.data as any;
        if (data?.tempPassword) {
          setCredentials({
            userId: data.userId,
            username: data.username,
            email: data.email,
            tempPassword: data.tempPassword,
          });
        } else {
          showSuccess(tUsers('userCreated'));
          navigate('/users');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tUsers('failedToSaveUser');
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    const text = `${tUsers('username')}: ${credentials.username}\n${tUsers('email')}: ${credentials.email}\n${tUsers('password')}: ${credentials.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess(tUsers('credentialsCopied'));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (credentials) {
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(45,125,58,0.12)', color: '#2D7D3A', mx: 'auto', mb: 2 }}>
            <PersonAdd sx={{ fontSize: 28 }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700} mb={1} color="#2D7D3A">
            {tUsers('userCreatedSuccess')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {tUsers('credentialsGenerated')}
          </Typography>
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2.5, mb: 1, textAlign: 'left', fontFamily: 'monospace', border: '1px solid rgba(229,231,235,0.6)' }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">{tUsers('userId')}</Typography>
              <Typography variant="body2" fontWeight={600}>{credentials.userId}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">{tUsers('username')}</Typography>
              <Typography variant="body2" fontWeight={600}>{credentials.username}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">{tUsers('email')}</Typography>
              <Typography variant="body2" fontWeight={600}>{credentials.email}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">{tUsers('password')}</Typography>
              <Typography variant="body2" fontWeight={700} color="#B5251A">{credentials.tempPassword}</Typography>
            </Box>
          </Box>
          <Alert severity="info" sx={{ mt: 2, mb: 3, borderRadius: 2, textAlign: 'left', fontSize: '0.8rem' }}>
            {tUsers('mustChangePassword')}
          </Alert>
          <Box display="flex" gap={1.5} justifyContent="center">
            <Button variant="outlined" onClick={handleCopyCredentials} startIcon={copied ? <CheckCircle /> : <ContentCopy />} sx={{ borderRadius: 2 }}>
              {copied ? tUsers('copied') : tUsers('copyCredentials')}
            </Button>
            <Button variant="contained" onClick={() => navigate('/users')} sx={{ borderRadius: 2 }}>
              {tUsers('goToUsersList')}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/users')} sx={{ borderRadius: 2 }}>{tUsers('back')}</Button>
        <Box sx={{ width: 1 }} />
        <Chip
          icon={<PersonAdd sx={{ fontSize: 14 }} />}
          label={isEdit ? tUsers('editingUser') : tUsers('newUser')}
          sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', bgcolor: roleStyles[form.role]?.bg || 'rgba(107,114,128,0.12)', color: roleStyles[form.role]?.color || '#6B7280' }}
        />
      </Box>

      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={3}>
        {isEdit ? tUsers('editUser') : tUsers('createNewUser')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('personalInformation')}</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={2} display="flex" flexDirection="column" alignItems="center">
              <Avatar
                sx={{
                  width: 72, height: 72, mb: 1,
                  bgcolor: roleStyles[form.role]?.bg || 'rgba(107,114,128,0.12)',
                  color: roleStyles[form.role]?.color || '#6B7280',
                  fontSize: 28, fontWeight: 800,
                }}
              >
                {form.firstName?.[0]}{form.lastName?.[0]}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={10}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                   <TextField fullWidth label={`${tUsers('firstName')} *`} size="small" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label={`${tUsers('lastName')} *`} size="small" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>{tUsers('role')} *</InputLabel>
                    <Select value={form.role} label={`${tUsers('role')} *`} onChange={(e) => handleChange('role', e.target.value)}>
                      {allRoles.map((r) => (
                        <MenuItem key={r} value={r}>{roleLabels[r] || r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('contactInformation')}</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={`${tUsers('email')} *`} type="email" size="small" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tUsers('phone')} size="small" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="e.g. +251911223344" />
            </Grid>
          </Grid>
        </Paper>

        {!isEdit && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tUsers('accountSecurity')}</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label={`${tUsers('password')} *`} type="password" size="small"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  helperText={
                    form.password
                      ? form.password.length < 6
                        ? tUsers('minimum6Characters')
                        : tUsers('passwordStrengthOk')
                      : tUsers('leaveEmptyToAutoGenerate')
                  }
                  error={!!form.password && form.password.length < 6}
                />
              </Grid>
            </Grid>
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem' }}>
              {tUsers('autoGenerateInfo')}
            </Alert>
          </Paper>
        )}

        {isEdit && (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8rem' }}>
            {tUsers('roleChangeInfo')}
          </Alert>
        )}

        <Box display="flex" gap={1.5}>
          <Button variant="outlined" onClick={() => navigate('/users')} sx={{ borderRadius: 2 }}>{tUsers('cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            disabled={saving}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {saving ? tUsers('saving') : isEdit ? tUsers('updateUser') : tUsers('createUser')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
