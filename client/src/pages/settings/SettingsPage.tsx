import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, TextField, Button, Grid, Divider,
  CircularProgress, MenuItem, Switch, FormControlLabel, Chip,
  Alert, IconButton, Tooltip, Card, CardContent,
} from '@mui/material';
import {
  Save, Settings, School, Security, Email, Sms,
  Notifications, Timer, Refresh, Info, CheckCircle,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

interface SettingsForm {
  schoolName: string; schoolAddress: string; schoolPhone: string;
  schoolEmail: string; schoolWebsite: string; schoolLogo?: string;
  academicYear: string; term: string; gradingSystem: string;
  maxStudentsPerSection: number; semester: string;
  enableAutomaticPromotion: boolean; enableParentPortal: boolean;
  enableSmsNotifications: boolean; enableEmailNotifications: boolean;
  enableTeacherAttendance: boolean; enableGuardianInvite: boolean;
  enableOnlineRegistration: boolean;
  sessionTimeout: number; passMinLength: number;
  lockoutAttempts: number;
}

const defaultForm: SettingsForm = {
  schoolName: '', schoolAddress: '', schoolPhone: '', schoolEmail: '',
  schoolWebsite: '', schoolLogo: '', academicYear: '', term: '1',
  gradingSystem: 'Percentage', maxStudentsPerSection: 40, semester: '1',
  enableAutomaticPromotion: false, enableParentPortal: true,
  enableSmsNotifications: false, enableEmailNotifications: true,
  enableTeacherAttendance: true, enableGuardianInvite: true,
  enableOnlineRegistration: false, sessionTimeout: 60,
  passMinLength: 8, lockoutAttempts: 5,
};

export const SettingsPage = () => {
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [saved, setSaved] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data.data) {
        const s = res.data.data;
        setForm({ ...defaultForm, ...s });
      }
    } catch { /* first load */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/settings', form);
      showSuccess('Settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tSettings('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">{tSettings('subtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {saved && <Chip icon={<CheckCircle />} label={tSettings('saved')} color="success" size="small" variant="outlined" />}
          <Tooltip title={tCommon('refresh')}><IconButton onClick={fetch}><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, px: 4 }}>
            {saving ? <CircularProgress size={18} /> : tSettings('saveAll')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* School Information */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <School sx={{ fontSize: 20, color: '#1B4F8A' }} />
                <Typography variant="h6" fontWeight={700}>{tSettings('schoolInformation')}</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label={tSettings('schoolName')} size="small" value={form.schoolName}
                    onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('address')} size="small" value={form.schoolAddress}
                    onChange={(e) => setForm({ ...form, schoolAddress: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('phone')} size="small" value={form.schoolPhone}
                    onChange={(e) => setForm({ ...form, schoolPhone: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('email')} size="small" value={form.schoolEmail}
                    onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('website')} size="small" value={form.schoolWebsite}
                    onChange={(e) => setForm({ ...form, schoolWebsite: e.target.value })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Settings */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Info sx={{ fontSize: 20, color: '#C9920A' }} />
                <Typography variant="h6" fontWeight={700}>{tSettings('academicSettings')}</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('academicYear')} size="small" value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
                </Grid>
                <Grid item xs={3}>
                  <TextField select fullWidth label={tSettings('term')} size="small" value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}>
                    {['1', '2'].map((t) => <MenuItem key={t} value={t}>Term {t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={3}>
                  <TextField select fullWidth label={tSettings('semester')} size="small" value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    {['1', '2'].map((t) => <MenuItem key={t} value={t}>Semester {t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField select fullWidth label={tSettings('gradingSystem')} size="small" value={form.gradingSystem}
                    onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}>
                    {['Percentage', 'Letter Grade (A-F)', 'GPA 4.0', 'Descriptive'].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('maxStudentsPerSection')} type="number" size="small"
                    value={form.maxStudentsPerSection}
                    onChange={(e) => setForm({ ...form, maxStudentsPerSection: Number(e.target.value) })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Security sx={{ fontSize: 20, color: '#7C3AED' }} />
                <Typography variant="h6" fontWeight={700}>{tSettings('security')}</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('sessionTimeout')} type="number" size="small"
                    value={form.sessionTimeout}
                    onChange={(e) => setForm({ ...form, sessionTimeout: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('minPasswordLength')} type="number" size="small"
                    value={form.passMinLength}
                    onChange={(e) => setForm({ ...form, passMinLength: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label={tSettings('loginLockoutAttempts')} type="number" size="small"
                    value={form.lockoutAttempts}
                    onChange={(e) => setForm({ ...form, lockoutAttempts: Number(e.target.value) })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Toggles */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <Notifications sx={{ fontSize: 20, color: '#DC2626' }} />
                <Typography variant="h6" fontWeight={700}>{tSettings('featureToggles')}</Typography>
              </Box>
              <Grid container spacing={1}>
                {[
                  { key: 'enableParentPortal', label: 'Parent Portal', desc: 'Allow parents to view student records' },
                  { key: 'enableAutomaticPromotion', label: 'Auto Promotion', desc: 'Automatically promote students each year' },
                  { key: 'enableSmsNotifications', label: 'SMS Notifications', desc: 'Send SMS alerts for attendance & marks' },
                  { key: 'enableEmailNotifications', label: 'Email Notifications', desc: 'Send email notifications' },
                  { key: 'enableTeacherAttendance', label: 'Teacher Attendance', desc: 'Track teacher check-in/out' },
                  { key: 'enableGuardianInvite', label: 'Guardian Invite', desc: 'Allow guardian self-registration' },
                  { key: 'enableOnlineRegistration', label: 'Online Registration', desc: 'Allow online student registration' },
                ].map(({ key, label, desc }) => (
                  <Grid item xs={12} key={key}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" py={0.75}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{label}</Typography>
                        <Typography variant="caption" color="text.secondary">{desc}</Typography>
                      </Box>
                      <Switch
                        checked={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        size="small"
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <Save />}
          onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, px: 5, py: 1.2 }}>
          {saving ? 'Saving...' : tSettings('saveAllSettings')}
        </Button>
      </Box>
    </Box>
  );
};