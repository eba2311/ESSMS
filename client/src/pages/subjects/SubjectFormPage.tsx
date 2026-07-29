import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, TextField, Select, InputLabel,
  FormControl, MenuItem, Grid, CircularProgress, Alert, Switch, FormControlLabel, Chip,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { subjectsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const SubjectFormPage = () => {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '', name: '', shortName: '', subjectType: 'Compulsory', department: '',
    grades: [] as number[], streams: [] as string[],
    isCore: true, description: '',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: 1, weeklyPeriods: 4,
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      subjectsAPI.get(id!).then((r) => {
        const s = r.data.data;
        setForm({
          code: s.code || '', name: s.name || '', shortName: s.shortName || '',
          subjectType: s.subjectType || (s.isCore ? 'Compulsory' : 'Elective'),
          department: s.department || '',
          grades: s.grades || [], streams: s.streams || [],
          isCore: s.isCore ?? true, description: s.description || '',
          academicYear: s.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          semester: s.semester ?? 1, weeklyPeriods: s.weeklyPeriods ?? 4,
        });
      }).catch(() => showError(t('failedToLoadSubject'))).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) { showError(t('codeAndNameRequired')); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) { await subjectsAPI.update(id!, form); showSuccess(t('subjectUpdated')); }
      else { await subjectsAPI.create(form); showSuccess(t('subjectCreated')); }
      navigate('/subjects');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('failedToSave');
      setError(msg); showError(msg);
    } finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/subjects')} sx={{ borderRadius: 2 }}>{t('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
          {isEdit ? t('editSubject') : t('addSubject')}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{t('subjectInformation')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={`${t('code')} *`} size="small" value={form.code} onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={isEdit} required placeholder="MATH" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={`${t('name')} *`} size="small" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required placeholder="Mathematics" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={t('shortName')} size="small" value={form.shortName} onChange={(e) => handleChange('shortName', e.target.value)} placeholder="Math" />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('subjectType')}</InputLabel>
                <Select value={form.subjectType} label={t('subjectType')} onChange={(e) => handleChange('subjectType', e.target.value)}>
                  {[{ v: 'Compulsory', k: t('compulsory') }, { v: 'Elective', k: t('elective') }, { v: 'Practical', k: t('practical') }].map((item) => <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={t('department')} size="small" value={form.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Mathematics Dept" />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('gradeLevels')}</InputLabel>
                <Select multiple value={form.grades} label={t('gradeLevels')}
                  onChange={(e) => handleChange('grades', typeof e.target.value === 'string' ? [] : e.target.value)}>
                  {[9, 10, 11, 12].map((g) => <MenuItem key={g} value={g}>{t('grade')} {g}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('streams')}</InputLabel>
                <Select multiple value={form.streams} label={t('streams')}
                  onChange={(e) => handleChange('streams', typeof e.target.value === 'string' ? [] : e.target.value)}>
                  {['Common', 'Natural Science', 'Social Science'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label={t('academicYear')} size="small" value={form.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)} placeholder="2026/2027" />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('semester')}</InputLabel>
                <Select value={form.semester} label={t('semester')} onChange={(e) => handleChange('semester', e.target.value as number)}>
                  <MenuItem value={1}>{t('semester1')}</MenuItem>
                  <MenuItem value={2}>{t('semester2')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label={t('weeklyPeriods')} type="number" size="small" value={form.weeklyPeriods}
                onChange={(e) => handleChange('weeklyPeriods', Number(e.target.value))} inputProps={{ min: 1, max: 40 }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControlLabel control={<Switch checked={form.isCore} onChange={(e) => handleChange('isCore', e.target.checked)} />} label={t('coreSubject')} sx={{ mt: 1.5 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('description')} multiline rows={3} size="small" value={form.description}
                onChange={(e) => handleChange('description', e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        <Box display="flex" gap={1.5}>
          <Button variant="outlined" onClick={() => navigate('/subjects')} sx={{ borderRadius: 2 }}>{t('cancel')}</Button>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? t('saving') : (isEdit ? t('updateSubject') : t('createSubject'))}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
