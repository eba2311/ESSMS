import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, CircularProgress, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import { ArrowBack, Save, Publish, Download, ClearAll, CheckCircle, Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentsAPI, studentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export const MarksEntryPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [publishDialog, setPublishDialog] = useState(false);
  const [clearDialog, setClearDialog] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      const aRes = await assessmentsAPI.get(id!);
      const ass = aRes.data.data;
      setAssessment(ass);

      if (ass.section) {
        const sectionId = ass.section?._id || ass.section;
        const [sRes, mRes] = await Promise.all([
          studentsAPI.list({ section: sectionId, status: 'Active', limit: 100 }),
          assessmentsAPI.get(id! + '/marks').catch(() => ({ data: { data: { marks: [] } } })),
        ]);
        const studentList = sRes.data.data?.students || [];
        setStudents(Array.isArray(studentList) ? studentList : []);

        const marksData = mRes.data.data?.marks || mRes.data?.marks || [];
        if (Array.isArray(marksData) && marksData.length) {
          const existing: Record<string, string> = {};
          marksData.forEach((m: any) => {
            const sid = m.student?._id || m.student;
            if (sid) existing[sid] = String(m.marksObtained);
          });
          setMarks(existing);
        }
      }
    } catch {
      setError(t('failedToLoadAssessment'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && students.length > 0) {
      const firstEmpty = students.find((s) => !marks[s._id] && marks[s._id] !== '');
      const target = firstEmpty ? firstEmpty._id : students[0]._id;
      setTimeout(() => inputRefs.current[target]?.focus(), 100);
    }
  }, [loading]);

  const enteredCount = students.filter((s) => marks[s._id] !== undefined && marks[s._id] !== '').length;

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string, idx: number) => {
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

  const buildMarksArray = () =>
    students
      .filter((s) => marks[s._id] !== undefined && marks[s._id] !== '')
      .map((s) => ({ studentId: s._id, marksObtained: Number(marks[s._id]) }));

  const handleClearAll = () => {
    setMarks({});
    setClearDialog(false);
    showSuccess(t('allMarksCleared'));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const marksArray = buildMarksArray();
      if (marksArray.length === 0) {
        showError(t('enterAtLeastOneMark'));
        return;
      }
      const res = await assessmentsAPI.enterMarks(id!, { marks: marksArray });
      const body = res.data;
      if (body?.data?.failed > 0) {
        const firstErr = body?.data?.errors?.[0]?.error || t('unknownError');
        setError(t('failedToSaveMarksWithDetail', { count: body.data.failed, error: firstErr }));
        showError(t('marksSavedFailed', { saved: body.data.successful, failed: body.data.failed }));
      } else {
          showSuccess(t('marksSaved', { count: marksArray.length }));
      }
      // Reload marks to show computed percentages
      const mRes = await assessmentsAPI.get(id! + '/marks').catch(() => null);
      const marksData = mRes?.data?.data?.marks || mRes?.data?.marks || [];
      if (Array.isArray(marksData) && marksData.length) {
        const updated: Record<string, string> = {};
        marksData.forEach((m: any) => {
          const sid = m.student?._id || m.student;
          if (sid) updated[sid] = String(m.marksObtained);
        });
        setMarks(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t('failedToSaveMarks');
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    try {
      const marksArray = buildMarksArray();
      if (marksArray.length > 0) {
        try { await assessmentsAPI.enterMarks(id!, { marks: marksArray }); }
        catch {
          showError(t('autoSaveFailed'));
          setPublishing(false);
          setPublishDialog(false);
          return;
        }
      }
      await assessmentsAPI.publish(id!);
      showSuccess(t('resultsPublished'));
      setPublishDialog(false);
      // Reload assessment to reflect Published status
      const aRes = await assessmentsAPI.get(id!);
      setAssessment(aRes.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('failedToPublish');
      setError(msg);
      showError(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await assessmentsAPI.exportMarks(id!);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${assessment?.title?.replace(/\s+/g, '_') || 'marks'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { showError(t('failedToExport')); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>;

  if (error && !assessment) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  const role = user?.role || '';
  const canEnterMarks = ['teacher', 'system_admin'].includes(role);
  const canPublish = ['teacher', 'academic_head', 'school_director', 'system_admin'].includes(role);
  const isDraft = assessment?.status === 'Draft' && !assessment?.isLocked;
  const isPublished = assessment?.status === 'Published';
  const isLocked = assessment?.isLocked;
  const readOnly = !canEnterMarks || !isDraft;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assessments')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{t('marksEntry')}</Typography>
          {assessment && (
            <Typography variant="body2" color="text.secondary">
              {assessment.title} &middot; {assessment.type} &middot; {t('mark', { ns: 'common' })}: {assessment.totalMarks}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            <strong>{enteredCount}</strong>/{students.length} {t('studentsEntered')}
          </Typography>
          <Chip
            label={isLocked ? t('locked', { ns: 'common' }) : isPublished ? t('published', { ns: 'common' }) : t('draft', { ns: 'common' })}
            color={isLocked ? 'error' : isPublished ? 'success' : 'warning'}
            size="small" sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {assessment?.rejectionReason && !isPublished && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>{t('previouslyRejected')}: {assessment.rejectionReason}</Typography>
          <Typography variant="caption">{t('pleaseCorrectAndSave')}</Typography>
        </Alert>
      )}

      {isLocked && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {t('assessmentLockedByAdmin')}
        </Alert>
      )}

      {isPublished && !isLocked && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} icon={<CheckCircle />}>
          {t('publishedStudentsCanSee')}
        </Alert>
      )}

      {!canEnterMarks && !isPublished && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {t('viewOnlyAccess')}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('studentId')}</TableCell>
                <TableCell>{tCommon('name')}</TableCell>
                <TableCell>{t('marks')} (max {assessment?.totalMarks})</TableCell>
                <TableCell>%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('noStudentsInSection')}</TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => {
                  const val = marks[student._id];
                  const num = val !== undefined && val !== '' ? Number(val) : null;
                  const pct = num !== null && assessment?.totalMarks > 0
                    ? Math.round((num / assessment.totalMarks) * 100)
                    : null;
                  return (
                    <TableRow key={student._id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary" fontFamily="monospace">{student.studentId}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{student.firstName} {student.lastName}</Typography></TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={marks[student._id] ?? ''}
                          onChange={(e) => handleMarkChange(student._id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, student._id, idx)}
                          disabled={readOnly || saving}
                          inputRef={(el) => { inputRefs.current[student._id] = el; }}
                          inputProps={{ min: 0, max: assessment?.totalMarks, step: 0.5 }}
                          error={val !== undefined && val !== '' && (Number(val) > (assessment?.totalMarks || 0) || Number(val) < 0)}
                          helperText={
                            val !== undefined && val !== '' && Number(val) > (assessment?.totalMarks || 0)
                              ? `Max ${assessment?.totalMarks}`
                              : ' '
                          }
                          sx={{ width: 140 }}
                        />
                      </TableCell>
                      <TableCell>
                        {pct !== null && (
                          <Chip label={`${pct}%`} size="small" color={pct >= 50 ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {students.length > 0 && (
          <Box display="flex" justifyContent="flex-end" alignItems="center" p={2} gap={1}>
            {!readOnly && (
              <>
                <Tooltip title={t('clearAllMarks')}>
                  <Button size="small" startIcon={<ClearAll />} onClick={() => setClearDialog(true)} sx={{ borderRadius: 2, color: 'text.secondary' }}>
                    {tCommon('clear')}
                  </Button>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving || publishing}
                  sx={{ borderRadius: 2 }}
                >
                  {saving ? t('savingMarks') : t('saveMarks')}
                </Button>
              </>
            )}
            {canPublish && isDraft && (
              <Button
                variant="outlined"
                color="success"
                startIcon={publishing ? <CircularProgress size={16} /> : <Publish />}
                onClick={() => setPublishDialog(true)}
                disabled={saving || publishing}
                sx={{ borderRadius: 2 }}
              >
                {t('publish')}
              </Button>
            )}
            {(isPublished || isLocked) && (
              <Button size="small" startIcon={<Download />} onClick={handleExport} sx={{ borderRadius: 2 }}>
                {t('exportMarks')}
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Clear Confirmation Dialog */}
      <Dialog open={clearDialog} onClose={() => setClearDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('deleteAllMarks')}</DialogTitle>
        <DialogContent>
          <Typography>{t('marksEntryTitle')} {students.length} {t('totalStudents')}?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setClearDialog(false)} sx={{ borderRadius: 2 }}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleClearAll} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('delete', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialog} onClose={() => setPublishDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('publishAssessment')}</DialogTitle>
        <DialogContent>
          <Typography>{t('publishConfirm')}</Typography>
          <Typography mt={1} variant="body2" color="text.secondary">
            {t('studentsEntered')}: {enteredCount} / {students.length}
          </Typography>
          {enteredCount < students.length && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
              {t('marksEntered', { count: students.length - enteredCount })}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPublishDialog(false)} sx={{ borderRadius: 2 }}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handlePublish} variant="contained" color="success" disabled={publishing} sx={{ borderRadius: 2 }}>
            {publishing ? t('publishing') : t('confirmPublish')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};