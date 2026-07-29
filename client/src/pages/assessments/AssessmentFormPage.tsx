import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Card, CardContent, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assessmentsAPI, sectionsAPI, subjectsAPI, teachersAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const ASSESSMENT_TYPES = ['Assignment', 'Quiz', 'Class Work', 'Project', 'Mid Exam', 'Final Exam'];
const TYPE_MAX_SCORES: Record<string, number> = {
  Assignment: 10, Quiz: 10, 'Class Work': 10, Project: 10, 'Mid Exam': 30, 'Final Exam': 40,
};
const TERMS = ['1', '2'];

export const AssessmentFormPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const isTeacher = user?.role === 'teacher';
  const now = new Date();
  const defaultAY = now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;

  const [form, setForm] = useState({
    title: '', type: '', subject: '', subjectName: '', section: '',
    term: '', academicYear: defaultAY, totalMarks: '', date: '',
    description: '', teacherRemarks: '',
  });

  useEffect(() => {
    if (isTeacher) {
      teachersAPI.my.sectionSubjects().then((r) => {
        const secs = r.data.data?.sections || [];
        setSections(secs);
        const allSubs: any[] = [];
        const seen = new Set();
        for (const sec of secs) {
          for (const sub of sec.subjects || []) {
            if (!seen.has(sub._id)) {
              seen.add(sub._id);
              allSubs.push(sub);
            }
          }
        }
        setSubjects(allSubs);

        const secParam = searchParams.get('section');
        const subParam = searchParams.get('subject');
        if (secParam) {
          setForm((prev) => ({ ...prev, section: secParam }));
          const sec = secs.find((s: any) => s._id === secParam);
          if (sec) setFilteredSubjects(sec.subjects || []);
          if (subParam) {
            setForm((prev) => ({ ...prev, subject: subParam }));
          }
        }
      }).catch(() => {
        sectionsAPI.list({ isActive: true, limit: 100 }).then((r) => {
          setSections(Array.isArray(r.data.data) ? r.data.data : []);
        });
        subjectsAPI.list({ limit: 100 }).then((r) => {
          setSubjects(Array.isArray(r.data.data?.subjects) ? r.data.data.subjects : []);
        });
      });
    } else {
      sectionsAPI.list({ isActive: true, limit: 100 }).then((r) => {
        const d = r.data.data || [];
        setSections(Array.isArray(d) ? d : []);
      }).catch(() => setError(t('failedToLoadSections')));
      subjectsAPI.list({ limit: 100 }).then((r) => {
        const d = r.data.data?.subjects || [];
        setSubjects(Array.isArray(d) ? d : []);
      }).catch(() => setError(t('failedToLoadSubjects')));
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    assessmentsAPI.get(id)
      .then((r) => {
        const a = r.data.data;
        const subjectId = a.subject?._id || a.subject || '';
        const sectionId = a.section?._id || a.section || '';
        setForm({
          title: a.title || '',
          type: a.type || '',
          subject: subjectId,
          subjectName: a.subject?.name || '',
          section: sectionId,
          term: a.term || '1',
          academicYear: a.academicYear || '',
          totalMarks: String(a.totalMarks || ''),
          date: a.date ? a.date.split('T')[0] : '',
          description: a.description || '',
          teacherRemarks: a.teacherRemarks || '',
        });
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || t('failedToLoadAssessment'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field: string, value: string) => {
    if (field === 'subject' && value) {
      const sub = subjects.find((s: any) => s._id === value);
      setForm((prev) => ({ ...prev, subject: value, subjectName: sub?.name || '' }));
    } else if (field === 'type' && value) {
      const maxScore = TYPE_MAX_SCORES[value] || '';
      setForm((prev) => ({ ...prev, type: value, totalMarks: maxScore }));
    } else if (field === 'section' && value) {
      setForm((prev) => ({ ...prev, section: value, subject: '' }));
      if (isTeacher) {
        const sec = sections.find((s: any) => s._id === value);
        setFilteredSubjects(sec?.subjects || []);
      }
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        title: form.title,
        type: form.type,
        sectionId: form.section,
        subjectId: form.subject,
        term: form.term,
        academicYear: form.academicYear,
        totalMarks: Number(form.totalMarks),
        date: form.date,
      };
      if (form.description) payload.description = form.description;
      if (form.teacherRemarks) payload.teacherRemarks = form.teacherRemarks;

      if (isEdit) {
        await assessmentsAPI.update(id!, payload);
        showSuccess(t('assessmentUpdated'));
      } else {
        await assessmentsAPI.create(payload);
        showSuccess(t('assessmentCreated'));
      }
      navigate('/assessments');
    } catch (err: any) {
      const msg = err.response?.data?.message || t(isEdit ? 'failedToUpdate' : 'failedToCreate');
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>{t('back', { ns: 'common' })}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{isEdit ? t('editAssessment') : t('createAssessment')}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('assessmentDetails')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label={t('assessmentTitle')} value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('assessmentType')}</InputLabel>
                  <Select value={form.type} label={t('assessmentType')} onChange={(e) => handleChange('type', e.target.value)}>
                    {ASSESSMENT_TYPES.map((at) => <MenuItem key={at} value={at}>{at}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('subject', { ns: 'common' })}</InputLabel>
                  <Select value={form.subject} label={t('subject', { ns: 'common' })} onChange={(e) => handleChange('subject', e.target.value)}>
                    {isTeacher && form.section
                      ? filteredSubjects.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)
                      : subjects.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('section', { ns: 'common' })}</InputLabel>
                  <Select value={form.section} label={t('section', { ns: 'common' })} onChange={(e) => handleChange('section', e.target.value)}>
                    {isTeacher
                      ? sections.map((s: any) => <MenuItem key={s._id} value={s._id}>{tCommon('grade')} {s.grade} — {s.name}</MenuItem>)
                      : sections.map((s: any) => {
                          const secId = s._id || s;
                          const secName = s.name || s;
                          const secGrade = s.grade || '';
                          return <MenuItem key={secId} value={secId}>{tCommon('grade')} {secGrade} — {secName}</MenuItem>;
                        })
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('term', { ns: 'common' })}</InputLabel>
                  <Select value={form.term} label={t('term', { ns: 'common' })} onChange={(e) => handleChange('term', e.target.value)}>
                    {TERMS.map((termVal) => <MenuItem key={termVal} value={termVal}>{t('term', { ns: 'common' })} {termVal}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label={t('academicYear', { ns: 'common' })} value={form.academicYear} onChange={(e) => handleChange('academicYear', e.target.value)} required placeholder="2024/2025" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label={t('totalMarks')} value={form.totalMarks} onChange={(e) => handleChange('totalMarks', e.target.value)} required inputProps={{ min: 1 }} disabled={!!(form.type && TYPE_MAX_SCORES[form.type])} helperText={form.type ? `${t('autoSet', { type: form.type })}` : ''} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" label={t('date', { ns: 'common' })} value={form.date} onChange={(e) => handleChange('date', e.target.value)} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label={t('description', { ns: 'common' })} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label={t('teacherRemarks')} value={form.teacherRemarks} onChange={(e) => handleChange('teacherRemarks', e.target.value)} placeholder={t('teacherRemarksPlaceholder')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>{t('cancel', { ns: 'common' })}</Button>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? <CircularProgress size={20} /> : isEdit ? t('updateAssessment') : t('createAssessment')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
