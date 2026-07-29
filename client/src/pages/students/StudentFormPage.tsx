import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import { ArrowBack, Save, School, PhotoCamera } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { studentsAPI, sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canEditStudents, canCreateStudents } from '../../utils/permissions';

const nationalities = ['Ethiopian', 'Eritrean', 'Somali', 'Kenyan', 'Sudanese', 'Djiboutian', 'Other'];

export const StudentFormPage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<any[]>([]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Ethiopian',
    email: '',
    phone: '',
    address: { city: '', subcity: '', woreda: '', houseNumber: '' },
    section: '',
    stream: '',
    enrollmentDate: '',
    academicYear: new Date().getMonth() + 1 >= 9 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    previousSchool: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    sectionsAPI.list({ isActive: true }).then((r) => setSections(r.data.data || []));
    if (isEdit) {
      setLoading(true);
      studentsAPI
        .get(id!)
        .then((r) => {
          const s = r.data.data;
          setForm({
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
            gender: s.gender || '',
            nationality: s.nationality || 'Ethiopian',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || { city: '', subcity: '', woreda: '', houseNumber: '' },
            section: s.section?._id || '',
            stream: s.stream || '',
            enrollmentDate: s.enrollmentDate?.split('T')[0] || '',
            academicYear: s.academicYear || '',
            guardianName: '',
            guardianPhone: '',
            guardianEmail: '',
            guardianRelationship: '',
            emergencyContactName: s.emergencyContact?.name || '',
            emergencyContactPhone: s.emergencyContact?.phone || '',
            emergencyContactRelationship: s.emergencyContact?.relationship || '',
            previousSchool: s.previousSchool || '',
            bloodType: s.medicalInfo?.bloodType || '',
            allergies: s.medicalInfo?.allergies?.join(', ') || '',
            chronicConditions: s.medicalInfo?.chronicConditions?.join(', ') || '',
            medications: s.medicalInfo?.medications?.join(', ') || '',
          });
          if (s.photo) setPhotoPreview(s.photo);
        })
        .catch(() => showError(tStudent('failedToLoadStudent')))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (!canCreateStudents(user?.role) && !isEdit) {
    navigate('/students');
    return null;
  }
  if (isEdit && !canEditStudents(user?.role)) {
    navigate('/students');
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const selectedSection = sections.find((s) => s._id === form.section);
  const grade = selectedSection?.grade;
  const needsStream = grade && grade >= 11;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const medicalInfo: Record<string, any> = {};
      if (form.bloodType) medicalInfo.bloodType = form.bloodType;
      if (form.allergies) medicalInfo.allergies = form.allergies.split(',').map((s: string) => s.trim());
      if (form.chronicConditions) medicalInfo.chronicConditions = form.chronicConditions.split(',').map((s: string) => s.trim());
      if (form.medications) medicalInfo.medications = form.medications.split(',').map((s: string) => s.trim());

      const payload: Record<string, any> = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        nationality: form.nationality,
        grade,
        phone: form.phone,
        sectionId: form.section,
        address: form.address,
        academicYear: form.academicYear,
        previousSchool: form.previousSchool,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relationship: form.emergencyContactRelationship,
        },
        guardianName: form.guardianName || undefined,
        guardianPhone: form.guardianPhone || undefined,
        guardianEmail: form.guardianEmail || undefined,
        guardianRelationship: form.guardianRelationship || undefined,
      };
      if (Object.keys(medicalInfo).length > 0) payload.medicalInfo = medicalInfo;
      if (form.stream) payload.stream = form.stream;
      if (form.enrollmentDate) payload.enrollmentDate = form.enrollmentDate;

      if (isEdit) {
        await studentsAPI.update(id!, payload);
        showSuccess(tStudent('studentUpdated'));
        navigate('/students');
      } else {
        const res = await studentsAPI.create(payload);
        const stuId = res.data.data?._id;
        showSuccess(tStudent('studentRegistered', { status: res.data.data?.status || tStudent('pendingApproval') }));
        if (stuId) {
          navigate(`/students/${stuId}`);
        } else {
          navigate('/students');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tStudent('failedToSaveStudent');
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')} sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Box sx={{ width: 1 }} />
        <Chip
          icon={<School sx={{ fontSize: 14 }} />}
          label={isEdit ? tStudent('editingStudent') : tStudent('newRegistration')}
          sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }}
        />
      </Box>

      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={3}>
        {isEdit ? tStudent('editStudent') : tStudent('registerNewStudent')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('personalInformation')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={1.5} display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start">
                <Avatar
                  src={photoPreview || undefined}
                  sx={{ width: 72, height: 72, mb: 1, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: 28, fontWeight: 800 }}
                >
                  {form.firstName?.[0]}{form.lastName?.[0]}
                </Avatar>
                <IconButton size="small" component="label" sx={{ bgcolor: 'rgba(27,79,138,0.08)', '&:hover': { bgcolor: 'rgba(27,79,138,0.15)' } }}>
                  <PhotoCamera sx={{ fontSize: 18 }} />
                  <input hidden accept="image/*" type="file" onChange={handlePhotoChange} />
                </IconButton>
              </Grid>
              <Grid item xs={12} md={5}>
                <Grid container spacing={2.5}>
                  <Grid item xs={6}>
                    <TextField fullWidth label={tStudent('firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label={tStudent('lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth type="date" label={tStudent('dateOfBirth')} value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} required size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth required size="small">
                      <InputLabel>{tStudent('gender')}</InputLabel>
                      <Select value={form.gender} label={tStudent('gender')} onChange={(e) => handleChange('gender', e.target.value as string)}>
                        <MenuItem value="Male">{tCommon('male')}</MenuItem>
                        <MenuItem value="Female">{tCommon('female')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={5.5}>
                <Grid container spacing={2.5}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{tStudent('nationality')}</InputLabel>
                      <Select value={form.nationality} label={tStudent('nationality')} onChange={(e) => handleChange('nationality', e.target.value as string)}>
                        {nationalities.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label={tStudent('email')} type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label={tStudent('phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label={tStudent('previousSchool')} value={form.previousSchool} onChange={(e) => handleChange('previousSchool', e.target.value)} size="small" />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('address')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tCommon('city') || 'City'} value={form.address.city} onChange={(e) => handleAddressChange('city', e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tCommon('subcity') || 'Subcity'} value={form.address.subcity} onChange={(e) => handleAddressChange('subcity', e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tCommon('woreda') || 'Woreda'} value={form.address.woreda} onChange={(e) => handleAddressChange('woreda', e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tCommon('houseNumber') || 'House Number'} value={form.address.houseNumber} onChange={(e) => handleAddressChange('houseNumber', e.target.value)} size="small" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('academicInformation')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{tStudent('section')}</InputLabel>
                  <Select value={form.section} label={tStudent('section')} onChange={(e) => handleChange('section', e.target.value as string)}>
                    {sections.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {tCommon('grade')} {s.grade} — {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {needsStream && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>{tStudent('stream')}</InputLabel>
                    <Select value={form.stream} label={tStudent('stream')} onChange={(e) => handleChange('stream', e.target.value as string)}>
                      <MenuItem value="Natural Science">{tStudent('naturalScience')}</MenuItem>
                      <MenuItem value="Social Science">{tStudent('socialScience')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField fullWidth label={tStudent('academicYear')} value={form.academicYear} onChange={(e) => handleChange('academicYear', e.target.value)} required size="small" placeholder={tStudent('academicYearPlaceholder')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" label={tStudent('enrollmentDate')} value={form.enrollmentDate} onChange={(e) => handleChange('enrollmentDate', e.target.value)} InputLabelProps={{ shrink: true }} required size="small" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
                {tStudent('guardianInformation')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label={tStudent('guardianFullName')} value={form.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label={tStudent('guardianPhone')} value={form.guardianPhone} onChange={(e) => handleChange('guardianPhone', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label={tStudent('guardianEmail')} type="email" value={form.guardianEmail} onChange={(e) => handleChange('guardianEmail', e.target.value)} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{tStudent('relationship')}</InputLabel>
                    <Select value={form.guardianRelationship} label={tStudent('relationship')} onChange={(e) => handleChange('guardianRelationship', e.target.value as string)}>
                      {[tStudent('father'), tStudent('mother'), tStudent('guardian'), tStudent('sibling'), tStudent('other')].map((r, i) => (
                        <MenuItem key={['Father', 'Mother', 'Guardian', 'Sibling', 'Other'][i]} value={['Father', 'Mother', 'Guardian', 'Sibling', 'Other'][i]}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('emergencyContact')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label={tStudent('contactName')} value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label={tStudent('contactPhone')} value={form.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tStudent('relationship')}</InputLabel>
                  <Select value={form.emergencyContactRelationship} label={tStudent('relationship')} onChange={(e) => handleChange('emergencyContactRelationship', e.target.value as string)}>
                    {[tStudent('father'), tStudent('mother'), tStudent('guardian'), tStudent('sibling'), tStudent('relative'), tStudent('other')].map((r, i) => (
                      <MenuItem key={['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other'][i]} value={['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other'][i]}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('medicalInformation')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tStudent('bloodType')}</InputLabel>
                  <Select value={form.bloodType} label={tStudent('bloodType')} onChange={(e) => handleChange('bloodType', e.target.value as string)}>
                    {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                      <MenuItem key={b} value={b}>{b || tCommon('select')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tStudent('allergiesLabel')} value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} size="small" placeholder={tStudent('allergiesPlaceholder')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tStudent('chronicConditions')} value={form.chronicConditions} onChange={(e) => handleChange('chronicConditions', e.target.value)} size="small" placeholder={tStudent('chronicConditionsPlaceholder')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label={tStudent('medications')} value={form.medications} onChange={(e) => handleChange('medications', e.target.value)} size="small" placeholder={tStudent('medicationsPlaceholder')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/students')} sx={{ borderRadius: 2 }}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            disabled={saving}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {saving ? tCommon('saving') : isEdit ? tStudent('updateStudent') : tStudent('registerStudent')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
