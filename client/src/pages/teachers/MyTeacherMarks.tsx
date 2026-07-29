import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  TextField, Select, InputLabel, FormControl, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import { ArrowBack, Save, Publish, Assignment, FilterList } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { teachersAPI, assessmentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const MyTeacherMarks = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState(searchParams.get('section') || '');
  const [sectionSubjects, setSectionSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState(searchParams.get('assessment') || '');
  const [selectedObj, setSelectedObj] = useState<any>(null);
  const [marksData, setMarksData] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDialog, setPublishDialog] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string, idx: number, students: any[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (saving) return;
      if (e.shiftKey) {
        const prevIdx = idx - 1;
        if (prevIdx >= 0) {
          const prevId = students[prevIdx]._id;
          inputRefs.current[prevId]?.focus();
        }
      } else {
        const nextIdx = idx + 1;
        if (nextIdx < students.length) {
          const nextId = students[nextIdx]._id;
          inputRefs.current[nextId]?.focus();
        } else {
          handleSave();
        }
      }
    }
  };

  useEffect(() => {
    teachersAPI.my.sectionSubjects().then((r) => {
      setSections(r.data.data?.sections || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSection) {
      setSectionSubjects([]);
      setSelectedSubject('');
      setAssessments([]);
      setSelectedAssessment('');
      setMarksData(null);
      return;
    }
    const sec = sections.find((s: any) => s._id === selectedSection);
    setSectionSubjects(sec?.subjects || []);
    setSelectedSubject('');
    setAssessments([]);
    setSelectedAssessment('');
    setMarksData(null);
  }, [selectedSection, sections]);

  useEffect(() => {
    if (!selectedSection || !selectedSubject) {
      setAssessments([]);
      setSelectedAssessment('');
      setMarksData(null);
      return;
    }
    teachersAPI.my.assessments({ section: selectedSection, subject: selectedSubject, limit: 200 }).then((r) => {
      setAssessments(r.data.data || []);
    }).catch(() => {});
  }, [selectedSection, selectedSubject]);

  const loadMarks = async (assessmentId: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await teachersAPI.my.marks({ assessment: assessmentId });
      setMarksData(r.data.data);
      const m: Record<string, number> = {};
      for (const entry of r.data.data.marks || []) {
        const s = entry.student;
        if (s?._id) m[s._id] = entry.marksObtained;
      }
      setMarks(m);
    } catch {
      setError(tTeacher('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAssessment) { setMarksData(null); setSelectedObj(null); return; }
    const obj = assessments.find((a) => a._id === selectedAssessment);
    setSelectedObj(obj || null);
    loadMarks(selectedAssessment);
  }, [selectedAssessment, assessments]);

  useEffect(() => {
    if (marksData?.students?.length > 0) {
      const students = marksData.students;
      const firstEmpty = students.find((s: any) => marks[s._id] === undefined);
      if (firstEmpty) {
        inputRefs.current[firstEmpty._id]?.focus();
      } else {
        inputRefs.current[students[0]._id]?.focus();
      }
    }
  }, [marksData]);

  const handleSave = async () => {
    if (!selectedAssessment || saving) return;
    setSaving(true);
    try {
      const entries = Object.entries(marks).map(([studentId, marksObtained]) => ({
        studentId, marksObtained,
      }));
      await teachersAPI.my.saveMarks({ assessment: selectedAssessment, marks: entries });
      showSuccess(tTeacher('saveMarks'));
      await loadMarks(selectedAssessment);
    } catch (err: any) {
      showError(err.response?.data?.message || tTeacher('failedToLoad'));
    }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!selectedAssessment) return;
    setPublishing(true);
    try {
      const entries = Object.entries(marks).map(([studentId, marksObtained]) => ({
        studentId, marksObtained,
      }));

      if (entries.length > 0) {
        try { await teachersAPI.my.saveMarks({ assessment: selectedAssessment, marks: entries }); }
        catch { showError(tTeacher('failedToLoad')); }
      }

      await assessmentsAPI.publish(selectedAssessment);
      showSuccess(tTeacher('publishResults'));
      setPublishDialog(false);
      await loadMarks(selectedAssessment);
    } catch (err: any) {
      showError(err.response?.data?.message || tTeacher('failedToLoad'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-teacher/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tTeacher('marksEntry')}</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
          <FilterList fontSize="small" /> {tTeacher('filterAssessments')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('section')}</InputLabel>
              <Select value={selectedSection} label={tTeacher('section')} onChange={(e) => setSelectedSection(e.target.value)}>
                {sections.map((sec: any) => (
                  <MenuItem key={sec._id} value={sec._id}>
                    {tCommon('grade')} {sec.grade} — {sec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!selectedSection}>
              <InputLabel>{tTeacher('subject')}</InputLabel>
              <Select value={selectedSubject} label={tTeacher('subject')} onChange={(e) => setSelectedSubject(e.target.value)}>
                {sectionSubjects.map((sub: any) => (
                  <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!selectedSubject}>
              <InputLabel>{tTeacher('assessment')}</InputLabel>
              <Select value={selectedAssessment} label={tTeacher('assessment')} onChange={(e) => setSelectedAssessment(e.target.value)}>
                {assessments.map((a: any) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.title} ({a.type}) — {a.date?.split('T')[0]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>}

      {marksData && !loading && (
        <>
          {marksData.assessment.status === 'Published' && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {tTeacher('publishedStudentsCanSee')}
            </Alert>
          )}
          {selectedObj?.isLocked && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {tTeacher('assessmentLocked')}
            </Alert>
          )}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{marksData.assessment.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {marksData.assessment.subject?.name} — {marksData.assessment.type} — {tTeacher('totalMarks')}: {marksData.assessment.totalMarks}
                </Typography>
                <Box mt={0.5}>
                  <Chip
                    label={selectedObj?.isLocked ? tCommon('locked') : marksData.assessment.status === 'Published' ? tCommon('published') : tCommon('draft')}
                    size="small"
                    color={selectedObj?.isLocked ? 'error' : marksData.assessment.status === 'Published' ? 'success' : 'warning'}
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                </Box>
              </Box>
              <Box display="flex" gap={2} textAlign="center">
                <Box>
                  <Typography variant="body1" fontWeight={700}>{marksData.totalEntered}</Typography>
                  <Typography variant="caption" color="text.secondary">{tTeacher('enteredLabel')}</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700}>{marksData.totalStudents}</Typography>
                  <Typography variant="caption" color="text.secondary">{tTeacher('totalLabel')}</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700} color={marksData.totalEntered >= marksData.totalStudents ? '#2D7D3A' : '#DC2626'}>
                    {marksData.totalStudents > 0 ? Math.round((marksData.totalEntered / marksData.totalStudents) * 100) : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{tTeacher('completeLabel')}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{tTeacher('student')}</TableCell>
                    <TableCell>{tTeacher('teacherId')}</TableCell>
                    <TableCell align="right">{tTeacher('markOutOf', { count: marksData.assessment.totalMarks })}</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marksData.students.map((s: any, idx: number) => {
                    const markVal = marks[s._id];
                    const pct = markVal !== undefined ? Math.round((markVal / marksData.assessment.totalMarks) * 100) : 0;
                    return (
                      <TableRow key={s._id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{s.studentId}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={markVal ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMarks((prev) => {
                                if (val === '') {
                                  const next = { ...prev };
                                  delete next[s._id];
                                  return next;
                                }
                                return { ...prev, [s._id]: Number(val) };
                              });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, s._id, idx, marksData.students)}
                            disabled={saving}
                            inputRef={(el) => { inputRefs.current[s._id] = el; }}
                            inputProps={{ min: 0, max: marksData.assessment.totalMarks, step: 0.5 }}
                            error={markVal !== undefined && (markVal > marksData.assessment.totalMarks || markVal < 0)}
                            helperText={
                              markVal !== undefined && markVal > marksData.assessment.totalMarks
                                ? tTeacher('maxMark', { count: marksData.assessment.totalMarks })
                                : ' '
                            }
                            sx={{ width: 140 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={markVal !== undefined ? `${pct}%` : '—'}
                            size="small"
                            color={pct >= 90 ? 'success' : pct >= 50 ? 'warning' : markVal !== undefined ? 'error' : 'default'}
                            sx={{ fontSize: '0.65rem', minWidth: 50 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box display="flex" justifyContent="flex-end" mt={2.5} gap={1}>
            {marksData.assessment.status !== 'Published' && !selectedObj?.isLocked && (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={publishing ? <CircularProgress size={16} /> : <Publish />}
                  onClick={() => setPublishDialog(true)}
                  disabled={saving || publishing || loading}
                  sx={{ borderRadius: 2 }}
                >
                  {tTeacher('publishResults')}
                </Button>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Save />} onClick={handleSave} disabled={saving || publishing || loading} sx={{ borderRadius: 2 }}>
                  {saving ? tCommon('saving') : tTeacher('saveMarks')}
                </Button>
              </>
            )}
            {marksData.assessment.status === 'Published' && (
              <Button variant="contained" onClick={() => navigate('/my-teacher/dashboard')} sx={{ borderRadius: 2 }}>
                {tTeacher('backToDashboard')}
              </Button>
            )}
          </Box>
        </>
      )}

      {!selectedAssessment && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tTeacher('selectAssessmentToEnterMarks')}</Typography>
        </Paper>
      )}

      <Dialog open={publishDialog} onClose={() => setPublishDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tTeacher('publishResults')}</DialogTitle>
        <DialogContent>
          <Typography>{tTeacher('publishResultsDesc')}</Typography>
          <Typography mt={1} variant="body2" color="text.secondary">
            {tTeacher('studentsEntered', { entered: marksData ? marksData.totalEntered : 0, total: marksData ? marksData.totalStudents : 0 })}
          </Typography>
          {marksData && marksData.totalEntered < marksData.totalStudents && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
              {tTeacher('studentSNoMarks', { count: marksData.totalStudents - marksData.totalEntered })}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPublishDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handlePublish} variant="contained" color="success" disabled={publishing} sx={{ borderRadius: 2 }}>
            {publishing ? tTeacher('publishing') : tTeacher('confirmPublish')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
