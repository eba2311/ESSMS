import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  ArrowBack, Add, Assignment, Edit, Visibility,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersAPI, assessmentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const MyTeacherSectionAssessments = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessDialog, setAssessDialog] = useState(false);
  const defaultTerm = new Date().getMonth() + 1 >= 1 && new Date().getMonth() + 1 <= 6 ? '2' : '1';
  const [assessForm, setAssessForm] = useState({ subject: '', title: '', type: 'Assignment', totalMarks: 10, term: defaultTerm });
  const [creating, setCreating] = useState(false);

  const loadData = () => {
    if (!sectionId) return;
    setLoading(true);
    teachersAPI.my.sectionAssessments(sectionId).then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [sectionId]);

  const handleCreateAssessment = async () => {
    if (!assessForm.subject || !assessForm.title) return;
    setCreating(true);
    try {
      const curYear = new Date().getFullYear();
      const year = data?.section?.academicYear || (new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`);
      await assessmentsAPI.create({
        sectionId,
        subjectId: assessForm.subject,
        title: assessForm.title,
        type: assessForm.type,
        totalMarks: Number(assessForm.totalMarks),
        date: new Date().toISOString().split('T')[0],
        academicYear: year,
        term: assessForm.term,
      });
      showSuccess(tTeacher('createAssessment'));
      setAssessDialog(false);
      setAssessForm({ subject: '', title: '', type: 'Assignment', totalMarks: 10, term: defaultTerm });
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || tTeacher('failedToLoad'));
    } finally {
      setCreating(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'success';
      case 'Approved': return 'info';
      case 'Verified': return 'primary';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const section = data.section || {};
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const assessments = Array.isArray(data.assessments) ? data.assessments : [];

  const grouped: Record<string, any[]> = {};
  for (const a of assessments) {
    const subId = a.subject?._id || 'unknown';
    if (!grouped[subId]) grouped[subId] = [];
    grouped[subId].push(a);
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/my-teacher/sections/${sectionId}/students`)} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tTeacher('assessmentsTitle', { grade: section.grade, name: section.name })}
        </Typography>
      </Box>

      <Button variant="contained" startIcon={<Add />} onClick={() => { setAssessForm({ subject: '', title: '', type: 'Assignment', totalMarks: 10, term: defaultTerm }); setAssessDialog(true); }} sx={{ borderRadius: 2, mb: 3 }}>
        {tTeacher('newAssessment')}
      </Button>

      {assessments.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tTeacher('noAssessmentsYet')}</Typography>
        </Paper>
      ) : (
        subjects.map((sub: any) => {
          const subAssessments = grouped[sub._id] || [];
          if (subAssessments.length === 0) return null;
          return (
            <Paper key={sub._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'rgba(27,79,138,0.04)', px: 3, py: 1.5, borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
                <Typography variant="subtitle1" fontWeight={700}>{sub.name} ({sub.code})</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tTeacher('title')}</TableCell>
                      <TableCell>{tTeacher('type')}</TableCell>
                      <TableCell>{tTeacher('totalMarks')}</TableCell>
                      <TableCell>{tCommon('date')}</TableCell>
                      <TableCell>{tTeacher('entered')}</TableCell>
                      <TableCell>{tTeacher('status')}</TableCell>
                      <TableCell align="right">{tCommon('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subAssessments.map((a: any) => (
                      <TableRow key={a._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={a.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>{a.totalMarks}</TableCell>
                        <TableCell>
                          <Typography variant="caption">{a.date?.split('T')[0]}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{a.markCount || 0}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={a.status} size="small" color={statusColor(a.status) as any} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/assessments/${a._id}/marks`)}
                            sx={{ borderRadius: 1.5, mr: 0.5, fontSize: '0.7rem' }}
                          >
                            {tTeacher('marks')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/assessments/${a._id}/edit`)}
                            sx={{ borderRadius: 1.5, fontSize: '0.7rem' }}
                          >
                            {tCommon('edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          );
        })
      )}

      <Dialog open={assessDialog} onClose={() => setAssessDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tTeacher('createAssessment')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth label={tTeacher('title')} size="small" value={assessForm.title}
              onChange={(e) => setAssessForm({ ...assessForm, title: e.target.value })} required />
            <FormControl fullWidth size="small" required>
              <InputLabel>{tTeacher('subject')}</InputLabel>
              <Select value={assessForm.subject} label={tTeacher('subject')}
                onChange={(e) => setAssessForm({ ...assessForm, subject: e.target.value })}>
                {subjects.map((sub: any) => (
                  <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" required>
              <InputLabel>{tTeacher('type')}</InputLabel>
              <Select value={assessForm.type} label={tTeacher('type')}
                onChange={(e) => {
                  const maxScores: Record<string, number> = { Assignment: 10, Quiz: 10, 'Class Work': 10, Project: 10, 'Mid Exam': 30, 'Final Exam': 40 };
                  setAssessForm({ ...assessForm, type: e.target.value, totalMarks: maxScores[e.target.value] || 10 });
                }}>
                {['Assignment', 'Quiz', 'Class Work', 'Project', 'Mid Exam', 'Final Exam'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label={tTeacher('totalMarks')} size="small" value={assessForm.totalMarks}
              onChange={(e) => setAssessForm({ ...assessForm, totalMarks: Number(e.target.value) })} required inputProps={{ min: 1 }} />
            <FormControl fullWidth size="small" required>
              <InputLabel>{tCommon('term')}</InputLabel>
              <Select value={assessForm.term} label={tCommon('term')}
                onChange={(e) => setAssessForm({ ...assessForm, term: e.target.value })}>
                <MenuItem value="1">{tCommon('term1')}</MenuItem>
                <MenuItem value="2">{tCommon('term2')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAssessDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleCreateAssessment} variant="contained" disabled={creating || !assessForm.title || !assessForm.subject} sx={{ borderRadius: 2 }}>
            {creating ? tTeacher('creating') : tCommon('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
