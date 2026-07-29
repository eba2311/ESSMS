import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, InputLabel, FormControl, MenuItem, Button, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack, Group, Person, Book, Refresh, Add, Delete,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { sectionAssignAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const SectionAssignPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSection = queryParams.get('section') || '';

  const [sections, setSections] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState(initialSection);
  const [data, setData] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);
  const [error, setError] = useState('');

  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; assignmentId: string; teacherLabel: string; subjectLabel: string }>({ open: false, assignmentId: '', teacherLabel: '', subjectLabel: '' });
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [periodsPerWeek, setPeriodsPerWeek] = useState(4);
  const [assigning, setAssigning] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const r = await sectionAssignAPI.sections({ limit: 200 });
      setSections(r.data.data || []);
    } catch { /* ignore */ }
    finally { setLoadingSections(false); }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const r = await sectionAssignAPI.teachers();
      setTeachers(r.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSections(); fetchTeachers(); }, [fetchSections, fetchTeachers]);

  const fetchSectionData = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const r = await sectionAssignAPI.sectionData(id);
      setData(r.data.data);
    } catch { setError(tCommon('failedToLoad')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedId) fetchSectionData(selectedId);
    else setData(null);
  }, [selectedId, fetchSectionData]);

  const handleOpenAssign = (subject: any) => {
    setSelectedSubject(subject);
    setSelectedTeacher('');
    setPeriodsPerWeek(4);
    setAssignDialog(true);
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject || !selectedId) return;
    setAssigning(true);
    try {
      const curYear = new Date().getFullYear();
      const year = data?.section?.academicYear || (new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`);
      const r = await sectionAssignAPI.assignTeacher({
        sectionId: selectedId,
        subjectId: selectedSubject._id,
        teacherId: selectedTeacher,
        periodsPerWeek,
        academicYear: year,
      });
      showSuccess(r.data.message || tAssign('teacherAssignedSuccessfully'));
      setAssignDialog(false);
      fetchSectionData(selectedId);
    } catch (err: any) {
      showError(err?.response?.data?.message || tAssign('failedToAssignTeacher'));
    }
    finally { setAssigning(false); }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await sectionAssignAPI.removeAssignment(assignmentId);
      showSuccess(tAssign('assignmentRemoved'));
      fetchSectionData(selectedId);
    } catch (err: any) {
      showError(err?.response?.data?.message || tAssign('failedToRemoveAssignment'));
    }
    setRemoveDialog({ open: false, assignmentId: '', teacherLabel: '', subjectLabel: '' });
  };

  const handleViewMarks = (subjectId: string) => {
    navigate(`/assignments/section-marks/${selectedId}/subject/${subjectId}`);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('sectionAssignment')}
        </Typography>
        {selectedId && (
          <Button size="small" variant="outlined" onClick={() => navigate(`/sections/${selectedId}`)} sx={{ borderRadius: 2 }}>
            {tAssign('viewSection')}
          </Button>
        )}
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => selectedId && fetchSectionData(selectedId)}><Refresh /></IconButton></Tooltip>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>{tCommon('selectSection')}</InputLabel>
          <Select
            value={selectedId}
            label={tCommon('selectSection')}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {sections.map((sec) => (
              <MenuItem key={sec._id} value={sec._id}>
                {sec.name} — {tCommon('grade')} {sec.grade} ({sec.enrolled}/{sec.capacity} {tAssign('enrolled')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : data ? (
        <Box display="flex" flexDirection="column" gap={3}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {data.section.name} — {tCommon('grade')} {data.section.grade}
                  {data.section.stream && data.section.stream !== 'Common' && (
                    <Chip size="small" label={data.section.stream} variant="outlined" sx={{ ml: 1, borderRadius: 1 }} />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tAssign('academicYear')}: {data.section.academicYear}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">{tAssign('students')}</Typography>
                  <Typography
                    fontWeight={700}
                    sx={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(27,79,138,0.3)', '&:hover': { color: '#1B4F8A' } }}
                    onClick={() => navigate(`/sections/${selectedId}`)}
                  >
                    {data.totalStudents} / {data.section.capacity}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={data.section.capacity ? (data.totalStudents / data.section.capacity) * 100 : 0}
                    sx={{ mt: 0.5, height: 4, borderRadius: 2, width: 160 }}
                  />
                </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{tAssign('subjects')}</Typography>
                <Typography fontWeight={700}>{data.totalSubjects}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{tCommon('assigned')}</Typography>
                <Typography fontWeight={700} color="success.main">{data.totalAssignedSubjects}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{tCommon('unassigned')}</Typography>
                <Typography fontWeight={700} color={data.unassignedSubjects?.length > 0 ? 'error.main' : 'success.main'}>
                  {data.unassignedSubjects?.length || 0}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={() => navigate(`/my-teacher/sections/${selectedId}/assessments`)} sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}>
                {tAssign('assessments')}
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate(`/assessments/new?section=${selectedId}`)} sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}>
                {tAssign('newAssessment')}
              </Button>
              {data.subjects?.length > 0 && (
                <Button size="small" variant="outlined" onClick={() => navigate(`/assignments/section-marks/${selectedId}/subject/${data.subjects[0]._id}`)} sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}>
                  {tAssign('sectionMarks')}
                </Button>
              )}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {tAssign('subjectTeacherMapping')}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('subject')}</TableCell>
                    <TableCell>{tCommon('code')}</TableCell>
                    <TableCell>{tCommon('teacher')}</TableCell>
                    <TableCell align="right">{tCommon('periodsPerWeek')}</TableCell>
                    <TableCell align="center">{tCommon('status')}</TableCell>
                    <TableCell align="center">{tCommon('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.subjects?.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>{tAssign('noSubjectsForGrade')}</TableCell></TableRow>
                  ) : (
                    data.subjects?.map((sub: any) => {
                      const teacherInfo = sub.teachers?.[0];
                      return (
                        <TableRow key={sub._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Book sx={{ fontSize: 16, color: '#9CA3AF' }} />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{sub.subjectType}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" fontFamily="monospace" color="text.secondary">{sub.code}</Typography></TableCell>
                          <TableCell>
                            {teacherInfo ? (
                              <Box display="flex" alignItems="center" gap={0.75}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.65rem', fontWeight: 700 }}>
                                  {teacherInfo.teacher?.firstName?.[0] || '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">
                                    {teacherInfo.teacher?.firstName} {teacherInfo.teacher?.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {teacherInfo.teacher?.employeeId || teacherInfo.teacher?.teacherId}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">{tCommon('unassigned')}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{teacherInfo?.periodsPerWeek || '\u2014'}</TableCell>
                          <TableCell align="center">
                            {teacherInfo ? (
                              <Chip size="small" label={tCommon('assigned')} color="success" variant="outlined" sx={{ borderRadius: 1 }} />
                            ) : (
                              <Chip size="small" label={tAssign('needsTeacher')} color="warning" variant="outlined" sx={{ borderRadius: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5} justifyContent="center">
                              {teacherInfo ? (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => handleViewMarks(sub._id)}
                                    sx={{ borderRadius: 1, textTransform: 'none', fontSize: '0.7rem' }}
                                  >
                                    {tAssign('marks')}
                                  </Button>
                                  <Tooltip title={tAssign('removeAssignment')}>
                                    <IconButton size="small" color="error" onClick={() => setRemoveDialog({
                                      open: true,
                                      assignmentId: teacherInfo.assignmentId,
                                      teacherLabel: teacherInfo.teacher ? `${teacherInfo.teacher.firstName} ${teacherInfo.teacher.lastName}` : tAssign('thisTeacher'),
                                      subjectLabel: sub.name,
                                    })}>
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Add />}
                                  onClick={() => handleOpenAssign(sub)}
                                  sx={{ borderRadius: 1, textTransform: 'none', fontSize: '0.7rem' }}
                                >
                                  {tCommon('assign')}
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Group sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tAssign('selectSectionToManage')}</Typography>
        </Paper>
      )}

      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {tAssign('assignTeacher')}
          {selectedSubject && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {tCommon('subject')}: {selectedSubject.name} ({selectedSubject.code})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('teacher')}</InputLabel>
              <Select
                value={selectedTeacher}
                label={tCommon('teacher')}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                {teachers
                  .filter((t) => t.subjects?.some((s: any) => String(s._id) === String(selectedSubject?._id)))
                  .map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.firstName} {t.lastName} ({t.employeeId || t.teacherId})
                  </MenuItem>
                ))}
                {teachers.filter((t) => t.subjects?.some((s: any) => String(s._id) === String(selectedSubject?._id))).length === 0 && (
                  <MenuItem disabled>{tAssign('noQualifiedTeachers')}</MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('periodsPerWeek')}</InputLabel>
              <Select
                value={periodsPerWeek}
                label={tCommon('periodsPerWeek')}
                onChange={(e) => setPeriodsPerWeek(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedTeacher || assigning}
            sx={{ borderRadius: 2 }}
          >
            {assigning ? <CircularProgress size={18} /> : tCommon('assign')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Assignment Confirmation */}
      <Dialog open={removeDialog.open} onClose={() => setRemoveDialog({ open: false, assignmentId: '', teacherLabel: '', subjectLabel: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tAssign('removeAssignment')}</DialogTitle>
        <DialogContent>
          <Typography>{tAssign('removeAssignmentConfirm', { teacher: removeDialog.teacherLabel, subject: removeDialog.subjectLabel })}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRemoveDialog({ open: false, assignmentId: '', teacherLabel: '', subjectLabel: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={() => handleRemoveAssignment(removeDialog.assignmentId)} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('remove')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
