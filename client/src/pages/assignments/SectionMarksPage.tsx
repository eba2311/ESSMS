import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Tooltip, TextField, Chip, Tabs, Tab,
} from '@mui/material';
import { ArrowBack, Refresh, Save, Edit } from '@mui/icons-material';
import { sectionAssignAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const SectionMarksPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const { sectionId, subjectId } = useParams<{ sectionId: string; subjectId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [activeTab, setActiveTab] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string, idx: number, students: any[], assessmentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (saving) return;
      if (e.shiftKey) {
        const prevIdx = idx - 1;
        if (prevIdx >= 0) {
          const prevId = `${assessmentId}-${students[prevIdx]._id}`;
          inputRefs.current[prevId]?.focus();
        }
      } else {
        const nextIdx = idx + 1;
        if (nextIdx < students.length) {
          const nextId = `${assessmentId}-${students[nextIdx]._id}`;
          inputRefs.current[nextId]?.focus();
        } else {
          handleSave();
        }
      }
    }
  };

  const fetchMarks = useCallback(async () => {
    if (!sectionId || !subjectId) return;
    setLoading(true);
    setError('');
    try {
      const r = await sectionAssignAPI.subjectMarks(sectionId, subjectId);
      setData(r.data.data);

      const m: Record<string, Record<string, number>> = {};
      for (const student of r.data.data.students || []) {
        m[student._id] = {};
        for (const mark of student.marks || []) {
          const asmtId = (mark.assessment as any)?._id || mark.assessment;
          m[student._id][asmtId] = mark.marksObtained;
        }
      }
      setMarks(m);
    } catch {
      setError(tCommon('failedToLoad'));
    }
    finally { setLoading(false); }
  }, [sectionId, subjectId]);

  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  useEffect(() => {
    if (!loading && students?.length > 0) {
      const asmtId = assessments?.[activeTab]?._id;
      if (!asmtId) return;
      const firstEmpty = students.find((s: any) => marks[s._id]?.[asmtId] === undefined);
      const refKey = `${asmtId}-${(firstEmpty || students[0])._id}`;
      inputRefs.current[refKey]?.focus();
    }
  }, [loading, activeTab]);

  const handleMarkChange = (studentId: string, assessmentId: string, value: string) => {
    if (value === '') {
      setMarks((prev) => {
        const next = { ...prev };
        if (next[studentId]) {
          const updated = { ...next[studentId] };
          delete updated[assessmentId];
          if (Object.keys(updated).length === 0) {
            delete next[studentId];
          } else {
            next[studentId] = updated;
          }
        }
        return next;
      });
      return;
    }
    const num = parseFloat(value);
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentId]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSave = async () => {
    if (!sectionId || !subjectId || !data?.assessments?.length || saving) return;
    setSaving(true);
    try {
      const entries: { assessmentId: string; studentId: string; marksObtained: number }[] = [];

      for (const asmt of data.assessments) {
        for (const student of data.students || []) {
          const markValue = marks[student._id]?.[asmt._id];
          if (markValue !== undefined) {
            entries.push({
              assessmentId: asmt._id,
              studentId: student._id,
              marksObtained: markValue,
            });
          }
        }
      }

      if (entries.length === 0) {
        showError(tAssign('noMarksToSave'));
        return;
      }

      const r = await sectionAssignAPI.saveSubjectMarks(sectionId, subjectId, { entries });
      showSuccess(r.data.message || tAssign('marksSavedSuccessfully'));
      fetchMarks();
    } catch (err: any) {
      showError(err?.response?.data?.message || tAssign('failedToSaveMarks'));
    }
    finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const section = data.section || {};
  const subject = data.subject || {};
  const assessments = Array.isArray(data.assessments) ? data.assessments : [];
  const students = Array.isArray(data.students) ? data.students : [];
  const currentAssessment = assessments[activeTab];
  const isPublished = currentAssessment?.status === 'Published';
  const isLocked = currentAssessment?.isLocked;

  const getExistingMark = (studentId: string, assessmentId: string) => {
    const student = students.find((s: any) => s._id === studentId);
    return student?.marks?.find(
      (m: any) => (m.assessment as any)?._id === assessmentId || m.assessment === assessmentId
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/section-assign')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('marks')} — {subject?.name}
        </Typography>
        <Chip label={`${section?.name} | ${tCommon('grade')} ${section?.grade}`} variant="outlined" sx={{ borderRadius: 1 }} />
        <Tooltip title={tCommon('refresh')}><IconButton onClick={fetchMarks}><Refresh /></IconButton></Tooltip>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving || !assessments?.length || isPublished || isLocked}
          sx={{ borderRadius: 2 }}
        >
          {saving ? <CircularProgress size={18} /> : tAssign('saveAllMarks')}
        </Button>
      </Box>

      {!assessments?.length ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Edit sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary" mb={1}>{tAssign('noPublishedAssessments')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {tAssign('createPublishAssessmentFirst')}
          </Typography>
        </Paper>
      ) : (
        <>
          {assessments.length > 1 && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ px: 1, minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 } }}
              >
                {assessments.map((a: any, i: number) => (
                  <Tab
                    key={a._id}
                    label={
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <span>{a.name}</span>
                        <Chip size="small" label={a.type} variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Paper>
          )}

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            {currentAssessment && (
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {currentAssessment.name} ({currentAssessment.type})
                  </Typography>
                  <Chip size="small" label={`${tCommon('total')}: ${currentAssessment.totalMarks}`} variant="outlined" />
                  {currentAssessment.term && (
                    <Chip size="small" label={currentAssessment.term} variant="outlined" />
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  {isPublished && <Chip size="small" label={tCommon('published')} color="success" />}
                  {isLocked && <Chip size="small" label={tCommon('locked')} color="error" />}
                </Box>
              </Box>
            )}

            {isLocked && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {tAssign('assessmentLockedMessage')}
              </Alert>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('hash')}</TableCell>
                    <TableCell>{tCommon('studentId')}</TableCell>
                    <TableCell>{tCommon('name')}</TableCell>
                    <TableCell align="right">{tAssign('marks')} (/{currentAssessment?.totalMarks})</TableCell>
                    <TableCell align="center">{tCommon('grade')}</TableCell>
                    <TableCell align="center">{tCommon('status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students?.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>{tAssign('noStudentsEnrolled')}</TableCell></TableRow>
                  ) : (
                    students?.map((student: any, idx: number) => {
                      const asmtId = currentAssessment._id;
                      const markValue = marks[student._id]?.[asmtId];
                      const existingMark = getExistingMark(student._id, asmtId);
                      const refKey = `${asmtId}-${student._id}`;
                      return (
                        <TableRow key={student._id} hover>
                          <TableCell><Typography variant="body2" color="text.secondary">{idx + 1}</Typography></TableCell>
                          <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{student.studentId}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {student.firstName} {student.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ width: 160 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={markValue ?? ''}
                              onChange={(e) => handleMarkChange(student._id, asmtId, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, student._id, idx, students, asmtId)}
                              disabled={saving || isPublished || isLocked}
                              inputRef={(el) => { inputRefs.current[refKey] = el; }}
                              inputProps={{ min: 0, max: currentAssessment.totalMarks, step: 0.5 }}
                              error={markValue !== undefined && (markValue > currentAssessment.totalMarks || markValue < 0)}
                              helperText={
                                markValue !== undefined && markValue > currentAssessment.totalMarks
                                  ? `${tCommon('max')} ${currentAssessment.totalMarks}`
                                  : ' '
                              }
                              sx={{ width: 140, '& input': { textAlign: 'right', fontSize: '0.85rem' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {existingMark ? (
                              <Box display="flex" flexDirection="column" alignItems="center" gap={0.25}>
                                <Typography variant="body2" fontWeight={600}>
                                  {existingMark.percentage?.toFixed(1)}%
                                </Typography>
                                <Chip
                                  size="small"
                                  label={existingMark.letterGrade || '\u2014'}
                                  color={existingMark.percentage >= 60 ? 'success' : 'error'}
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">{tAssign('notGraded')}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {existingMark ? (
                              <Chip
                                size="small"
                                label={tCommon('graded')}
                                color="success"
                                variant="outlined"
                                sx={{ borderRadius: 1, height: 18, fontSize: '0.65rem' }}
                              />
                            ) : markValue !== undefined ? (
                              <Chip
                                size="small"
                                label={tCommon('editing')}
                                color="warning"
                                variant="outlined"
                                sx={{ borderRadius: 1, height: 18, fontSize: '0.65rem' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">{'\u2014'}</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};
