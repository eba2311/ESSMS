import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  TextField, IconButton, Tooltip, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  ArrowBack, Group, School, Search, Visibility, Assignment, Add,
  Edit, Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersAPI, assessmentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const MyTeacherSectionStudents = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [assessDialog, setAssessDialog] = useState(false);
  const defaultTerm = new Date().getMonth() + 1 >= 1 && new Date().getMonth() + 1 <= 6 ? '2' : '1';
  const [assessForm, setAssessForm] = useState({ subject: '', title: '', type: 'Assignment', totalMarks: 10, term: defaultTerm });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    teachersAPI.my.sectionStudents(sectionId).then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  }, [sectionId]);

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
    } catch (err: any) {
      showError(err.response?.data?.message || tTeacher('failedToLoad'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const section = data.section || {};
  const studentsList = Array.isArray(data.students) ? data.students : Array.isArray(data.studentsList) ? data.studentsList : [];
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const totalStudents = data.totalStudents || studentsList.length;

  const filtered = studentsList.filter((s: any) =>
    !search || `${s.firstName} ${s.lastName} ${s.studentId}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-teacher/sections')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tCommon('grade')} {section.grade} - {section.name}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Group sx={{ color: '#C9920A' }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>{totalStudents}</Typography>
              <Typography variant="caption" color="text.secondary">{tTeacher('students')}</Typography>
            </Box>
          </Box>
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {subjects.map((sub: any) => (
              <Chip key={sub._id} label={sub.name} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
            ))}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} mb={2.5}>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth variant="contained" startIcon={<Add />}
            onClick={() => setAssessDialog(true)}
            sx={{ borderRadius: 2, height: '100%', minHeight: 44 }}
          >
            {tTeacher('newAssessment')}
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth variant="outlined" startIcon={<Assignment />}
            onClick={() => navigate(`/my-teacher/sections/${sectionId}/assessments`)}
            sx={{ borderRadius: 2, height: '100%', minHeight: 44 }}
          >
            {tTeacher('viewAssessments')}
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth variant="outlined" startIcon={<Edit />}
            onClick={() => navigate(`/my-teacher/marks?section=${sectionId}`)}
            sx={{ borderRadius: 2, height: '100%', minHeight: 44 }}
          >
            {tTeacher('enterMarks')}
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth variant="outlined" startIcon={<AssessmentIcon />}
            onClick={() => navigate(`/my-teacher/reports`)}
            sx={{ borderRadius: 2, height: '100%', minHeight: 44 }}
          >
            {tTeacher('reports')}
          </Button>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <TextField
          fullWidth
          label={tTeacher('searchStudents')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{ endAdornment: <Search color="action" /> }}
        />
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tTeacher('teacherId')}</TableCell>
                <TableCell>{tCommon('name')}</TableCell>
                <TableCell>{tTeacher('gender')}</TableCell>
                <TableCell align="right">{tCommon('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <School sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.secondary">{tTeacher('noStudentsFound')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s: any) => (
                  <TableRow key={s._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={700} fontSize="0.8rem">{s.studentId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontWeight: 700, fontSize: '0.7rem' }}>
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.8rem">{s.gender || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={tTeacher('viewProfile')}>
                        <IconButton size="small" onClick={() => navigate(`/students/${s._id}`)} sx={{ borderRadius: 1.5 }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={tTeacher('viewReportCard')}>
                        <IconButton size="small" onClick={() => navigate(`/assessments/report-card/${s._id}`)} sx={{ borderRadius: 1.5 }}>
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
