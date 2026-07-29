import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, TextField, Select, InputLabel,
  FormControl, MenuItem, Grid, CircularProgress, Alert, Chip, Autocomplete,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersAPI, subjectsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const TeacherFormPage = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<{ username: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '',
    gender: '', dateOfBirth: '', nationality: 'Ethiopian', maritalStatus: '',
    phoneNumber: '', altPhoneNumber: '', email: '',
    city: '', subcity: '', woreda: '', houseNumber: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    degree: '', field: '', institution: '', year: new Date().getFullYear(),
    specialization: '', teachingLicenseNumber: '',
    skills: [] as string[],
    selectedSubjects: [] as string[],
    yearsOfExperience: '', employmentDate: '',
    employmentType: 'Full-time', position: 'Subject Teacher',
    status: 'Active',
  });

  useEffect(() => {
    subjectsAPI.list({ limit: 100 }).then((r) => {
      const d = r.data.data?.subjects || [];
      setSubjectOptions(Array.isArray(d) ? d : []);
    }).catch(() => {});

    if (isEdit) {
      setLoading(true);
      teachersAPI.get(id!).then((r) => {
        const t = r.data.data;
        const q = t.qualifications?.[0] || {};
        setForm({
          firstName: t.firstName || '', middleName: t.middleName || '', lastName: t.lastName || '',
          gender: t.gender || '', dateOfBirth: t.dateOfBirth?.split('T')[0] || '',
          nationality: t.nationality || 'Ethiopian', maritalStatus: t.maritalStatus || '',
          phoneNumber: t.phoneNumber || '', altPhoneNumber: t.altPhoneNumber || '',
          email: t.email || (t.userId?.email) || '',
          city: t.residentialAddress?.city || '', subcity: t.residentialAddress?.subcity || '',
          woreda: t.residentialAddress?.woreda || '', houseNumber: t.residentialAddress?.houseNumber || '',
          emergencyName: t.emergencyContact?.name || '', emergencyRelationship: t.emergencyContact?.relationship || '',
          emergencyPhone: t.emergencyContact?.phone || '',
          degree: q.degree || '', field: q.field || '', institution: q.institution || '',
          year: q.year || new Date().getFullYear(),
          specialization: t.specialization || '', teachingLicenseNumber: t.teachingLicenseNumber || '',
          skills: t.skills || [],
          selectedSubjects: (t.subjects || []).map((s: any) => s._id || s),
          yearsOfExperience: String(t.yearsOfExperience ?? ''),
          employmentDate: t.employmentDate?.split('T')[0] || '',
          employmentType: t.employmentType || 'Full-time',
          position: t.position || 'Subject Teacher',
          status: t.status || 'Active',
        });
      }).catch(() => showError(tTeacher('failedToLoad'))).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        firstName: form.firstName, middleName: form.middleName, lastName: form.lastName,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        nationality: form.nationality, maritalStatus: form.maritalStatus || undefined,
        phoneNumber: form.phoneNumber, altPhoneNumber: form.altPhoneNumber || undefined,
        email: form.email,
        residentialAddress: {
          city: form.city, subcity: form.subcity,
          woreda: form.woreda, houseNumber: form.houseNumber,
        },
        emergencyContact: form.emergencyName ? {
          name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone,
        } : undefined,
        qualifications: form.degree ? [{
          degree: form.degree, field: form.field, institution: form.institution, year: form.year,
        }] : [],
        specialization: form.specialization, teachingLicenseNumber: form.teachingLicenseNumber,
        skills: form.skills,
        subjects: form.selectedSubjects,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        employmentDate: form.employmentDate,
        employmentType: form.employmentType, position: form.position,
        status: form.status,
      };

      if (isEdit) {
        await teachersAPI.update(id!, payload);
        showSuccess(tTeacher('teacherUpdated'));
        navigate('/teachers');
      } else {
        const resp = await teachersAPI.create(payload);
        const creds = resp.data.data?.credentials;
        if (creds) setCredentials(creds);
        else { showSuccess(tTeacher('teacherRegistered')); navigate('/teachers'); }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tTeacher('failedToSave');
      setError(msg);
      showError(msg);
    } finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;

  if (credentials) {
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} mb={1} color="#1B4F8A">{tTeacher('teacherRegisteredSuccess')}</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>{tTeacher('credentialsMessage')}</Typography>
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2.5, mb: 3, textAlign: 'left', fontFamily: 'monospace' }}>
            <Typography variant="caption" color="text.secondary">{tTeacher('username')}</Typography>
            <Typography variant="body1" fontWeight={700} mb={2}>{credentials.username}</Typography>
            <Typography variant="caption" color="text.secondary">{tTeacher('tempPassword')}</Typography>
            <Typography variant="body1" fontWeight={700}>{credentials.tempPassword}</Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate('/teachers')} sx={{ borderRadius: 2 }}>
            {tTeacher('goToTeachersList')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/teachers')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
          {isEdit ? tTeacher('edit') : tTeacher('register')}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('personalInfo')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={`${tTeacher('firstName')} *`} size="small" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('middleName')} size="small" value={form.middleName} onChange={(e) => handleChange('middleName', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={`${tTeacher('lastName')} *`} size="small" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{tTeacher('gender')}</InputLabel>
                <Select value={form.gender} label={tTeacher('gender')} onChange={(e) => handleChange('gender', e.target.value)}>
                  <MenuItem value="Male">{tCommon('male')}</MenuItem>
                  <MenuItem value="Female">{tCommon('female')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="date" label={tTeacher('dateOfBirth')} size="small" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('nationality')} size="small" value={form.nationality} onChange={(e) => handleChange('nationality', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{tTeacher('maritalStatus')}</InputLabel>
                <Select value={form.maritalStatus} label={tTeacher('maritalStatus')} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                  {[{ v: 'Single', l: tTeacher('single') }, { v: 'Married', l: tTeacher('married') }, { v: 'Divorced', l: tTeacher('divorced') }, { v: 'Widowed', l: tTeacher('widowed') }].map((s) => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('contactInfo')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={`${tTeacher('phoneNumber')} *`} size="small" value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={tTeacher('altPhoneNumber')} size="small" value={form.altPhoneNumber} onChange={(e) => handleChange('altPhoneNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label={`${tTeacher('email')} *`} type="email" size="small" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" fontWeight={600} mt={2} mb={1}>{tTeacher('residentialAddress')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('city')} size="small" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('subcity')} size="small" value={form.subcity} onChange={(e) => handleChange('subcity', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('woreda')} size="small" value={form.woreda} onChange={(e) => handleChange('woreda', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('houseNumber')} size="small" value={form.houseNumber} onChange={(e) => handleChange('houseNumber', e.target.value)} />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" fontWeight={600} mt={2} mb={1}>{tTeacher('emergencyContact')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tCommon('name')} size="small" value={form.emergencyName} onChange={(e) => handleChange('emergencyName', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('relationship')} size="small" value={form.emergencyRelationship} onChange={(e) => handleChange('emergencyRelationship', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('phone')} size="small" value={form.emergencyPhone} onChange={(e) => handleChange('emergencyPhone', e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('professionalInfo')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('specialization')} size="small" value={form.specialization} onChange={(e) => handleChange('specialization', e.target.value)} placeholder="e.g. Mathematics" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('teachingLicenseNumber')} size="small" value={form.teachingLicenseNumber} onChange={(e) => handleChange('teachingLicenseNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={form.skills}
                onChange={(_, newValue) => handleChange('skills', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip key={index} label={option} size="small" sx={{ bgcolor: 'rgba(27,79,138,0.08)' }} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label={tTeacher('skills')} size="small" placeholder={tTeacher('skillPlaceholder')} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label={tTeacher('yearsOfExperience')} type="number" size="small" value={form.yearsOfExperience} onChange={(e) => handleChange('yearsOfExperience', e.target.value)} inputProps={{ min: 0 }} />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" fontWeight={600} mt={2} mb={1}>{tTeacher('subjects')}</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>{tTeacher('subjectsQualified')}</InputLabel>
            <Select
              multiple
              value={form.selectedSubjects}
              label={tTeacher('subjectsQualified')}
              onChange={(e) => handleChange('selectedSubjects', e.target.value)}
              renderValue={(selected) => (
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {subjectOptions.filter((s) => selected.includes(s._id)).map((s) => (
                    <Typography key={s._id} variant="body2" sx={{ bgcolor: 'rgba(27,79,138,0.08)', px: 1, py: 0.25, borderRadius: 1 }}>{s.name}</Typography>
                  ))}
                </Box>
              )}
            >
              {subjectOptions.map((s) => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code || s.shortName})</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('qualification')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('degree')} size="small" value={form.degree} onChange={(e) => handleChange('degree', e.target.value)} placeholder="e.g. Bachelor, Master" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('fieldOfStudy')} size="small" value={form.field} onChange={(e) => handleChange('field', e.target.value)} placeholder="e.g. Mathematics" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label={tTeacher('institution')} size="small" value={form.institution} onChange={(e) => handleChange('institution', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth type="number" label={tTeacher('year')} size="small" value={form.year} onChange={(e) => handleChange('year', Number(e.target.value))} />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('employmentDetails')}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{tTeacher('employmentType')}</InputLabel>
                <Select value={form.employmentType} label={tTeacher('employmentType')} onChange={(e) => handleChange('employmentType', e.target.value)}>
                  {[{ v: 'Full-time', l: tTeacher('fullTime') }, { v: 'Part-time', l: tTeacher('partTime') }, { v: 'Contract', l: tTeacher('contract') }, { v: 'Permanent', l: tTeacher('permanent') }].map((t) => <MenuItem key={t.v} value={t.v}>{t.l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{tTeacher('position')}</InputLabel>
                <Select value={form.position} label={tTeacher('position')} onChange={(e) => handleChange('position', e.target.value)}>
                  {[{ v: 'Subject Teacher', l: tTeacher('subjectTeacher') }, { v: 'Department Head', l: tTeacher('departmentHead') }, { v: 'Vice Principal', l: tTeacher('vicePrincipal') }, { v: 'Principal', l: tTeacher('principal') }].map((p) => <MenuItem key={p.v} value={p.v}>{p.l}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="date" label={`${tTeacher('employmentDate')} *`} size="small" value={form.employmentDate} onChange={(e) => handleChange('employmentDate', e.target.value)} InputLabelProps={{ shrink: true }} required />
            </Grid>
            {isEdit && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tTeacher('status')}</InputLabel>
                  <Select value={form.status} label={tTeacher('status')} onChange={(e) => handleChange('status', e.target.value)}>
                    {[{ v: 'Active', l: tTeacher('active') }, { v: 'On Leave', l: tTeacher('onLeave') }, { v: 'Suspended', l: tTeacher('suspended') }, { v: 'Resigned', l: tTeacher('resigned') }, { v: 'Retired', l: tTeacher('retired') }, { v: 'Terminated', l: tTeacher('terminated') }].map((s) => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Box display="flex" gap={1.5}>
          <Button variant="outlined" onClick={() => navigate('/teachers')} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? tCommon('saving') : (isEdit ? tTeacher('edit') : tTeacher('register'))}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
