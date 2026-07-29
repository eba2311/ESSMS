import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Button, TextField, Select, InputLabel, FormControl, MenuItem,
  IconButton, Tooltip, Stepper, Step, StepLabel, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { ArrowBack, ArrowForward, Person, Refresh, CheckCircle, Add, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI, teachersAPI, sectionsAPI, subjectsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

interface AssignmentRow {
  teacherId: string;
  teacherLabel: string;
  sectionId: string;
  subjectId: string;
  periodsPerWeek: number;
}

export const TeacherBatchAssignPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [resultDetails, setResultDetails] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tR, sR, subR] = await Promise.all([
        teachersAPI.list({ limit: 200 }),
        sectionsAPI.list({ limit: 200 }),
        subjectsAPI.list({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      ]);
      setTeachers(tR.data.data || []);
      setSections(sR.data.data || []);
      setSubjects(subR.data.data?.subjects || []);
    } catch { setError(tCommon('failedToLoad')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addRow = () => {
    setAssignments([...assignments, { teacherId: '', teacherLabel: '', sectionId: '', subjectId: '', periodsPerWeek: 0 }]);
  };

  const updateRow = (index: number, field: keyof AssignmentRow, value: any) => {
    const updated = [...assignments];
    if (field === 'teacherId') {
      const teacher = teachers.find((t) => t._id === value);
      updated[index] = { ...updated[index], teacherId: value, teacherLabel: teacher ? `${teacher.firstName} ${teacher.lastName}` : '' };
    } else {
      (updated[index] as any)[field] = value;
    }
    setAssignments(updated);
  };

  const removeRow = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const valid = assignments.filter((a) => a.teacherId && a.sectionId && a.subjectId && a.periodsPerWeek > 0);
    if (valid.length === 0) { showError(tAssign('addAtLeastOneValidAssignment')); return; }

    setLoading(true);
    setError('');
    setResultDetails([]);

    try {
      const curYear = new Date().getFullYear();
      const academicYear = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
      const groups: Record<string, { teacherId: string; subjectId: string; periodsPerWeek: number; sectionIds: string[] }> = {};

      for (const a of valid) {
        const key = `${a.teacherId}|${a.subjectId}|${a.periodsPerWeek}`;
        if (!groups[key]) {
          groups[key] = { teacherId: a.teacherId, subjectId: a.subjectId, periodsPerWeek: a.periodsPerWeek, sectionIds: [] };
        }
        groups[key].sectionIds.push(a.sectionId);
      }

      const allResults: any[] = [];
      let overallMessage = '';

      for (const g of Object.values(groups)) {
        try {
          const r = await assignmentsAPI.batchAssignTeacher({
            teacherId: g.teacherId,
            subjectId: g.subjectId,
            sectionIds: g.sectionIds,
            periodsPerWeek: g.periodsPerWeek,
            academicYear,
          });
          const data = r.data.data || r.data;
          overallMessage = r.data.message || '';
          if (data?.results) {
            for (const res of data.results) {
              const t = teachers.find((x) => x._id === g.teacherId);
              const sub = subjects.find((x) => x._id === g.subjectId);
              const sec = sections.find((x) => x._id === res.sectionId);
              allResults.push({
                teacherName: t ? `${t.firstName} ${t.lastName}` : tCommon('unknown'),
                sectionName: sec?.name || tCommon('unknown'),
                sectionId: res.sectionId,
                subjectName: sub?.name || tCommon('unknown'),
                periods: g.periodsPerWeek,
                success: res.status === 'assigned',
                reason: res.status === 'skipped' ? tAssign('alreadyAssigned') : res.status === 'assigned' ? '' : res.message,
              });
            }
          }
        } catch (err: any) {
          const t = teachers.find((x) => x._id === g.teacherId);
          const sub = subjects.find((x) => x._id === g.subjectId);
          for (const sid of g.sectionIds) {
            const sec = sections.find((x) => x._id === sid);
            allResults.push({
              teacherName: t ? `${t.firstName} ${t.lastName}` : tCommon('unknown'),
              sectionName: sec?.name || tCommon('unknown'),
              subjectName: sub?.name || tCommon('unknown'),
              periods: g.periodsPerWeek,
              success: false,
              reason: err?.response?.data?.message || tCommon('requestFailed'),
            });
          }
        }
      }

      setResultDetails(allResults);
      const successCount = allResults.filter((r) => r.success).length;
      setResult({ message: overallMessage || tAssign('sectionsAssigned', { count: successCount }) });
      showSuccess(tAssign('sectionsAssignedSuccessfully', { count: successCount }));
      setStep(2);
    } catch (err: any) {
      showError(err?.response?.data?.message || tAssign('batchAssignmentFailed'));
      setError(err?.response?.data?.message || tCommon('anErrorOccurred'));
    }
    finally { setLoading(false); }
  };

  if (loading && teachers.length === 0) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('batchAssignTeachers')}
        </Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <Stepper activeStep={step} sx={{ p: 3, px: 4 }}>
          <Step><StepLabel>{tAssign('assignments')}</StepLabel></Step>
          <Step><StepLabel>{tAssign('confirm')}</StepLabel></Step>
          <Step><StepLabel>{tAssign('results')}</StepLabel></Step>
        </Stepper>
      </Paper>

      {step === 0 && (
        <>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700}>{tAssign('assignmentEntries')}</Typography>
              <Button startIcon={<Add />} variant="outlined" onClick={addRow} sx={{ borderRadius: 2 }}>
                {tAssign('addEntry')}
              </Button>
            </Box>
            {assignments.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Person sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary" mb={2}>{tAssign('noAssignmentsYet')}</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={addRow} sx={{ borderRadius: 2 }}>{tAssign('addEntry')}</Button>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {assignments.map((row, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>{tCommon('teacher')}</InputLabel>
                        <Select value={row.teacherId} label={tCommon('teacher')} onChange={(e) => updateRow(i, 'teacherId', e.target.value)}>
                          {teachers.map((t) => (
                            <MenuItem key={t._id} value={t._id}>
                              {t.firstName} {t.lastName} ({t.employeeId})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>{tCommon('section')}</InputLabel>
                        <Select value={row.sectionId} label={tCommon('section')} onChange={(e) => updateRow(i, 'sectionId', e.target.value)}>
                          {sections.map((sec) => (
                            <MenuItem key={sec._id} value={sec._id}>{sec.name} ({tCommon('gradeShort')} {sec.grade})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>{tCommon('subject')}</InputLabel>
                        <Select value={row.subjectId} label={tCommon('subject')} onChange={(e) => updateRow(i, 'subjectId', e.target.value)}>
                          {(subjects || []).map((sub) => (
                            <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label={tCommon('periodsPerWeek')}
                        type="number"
                        size="small"
                        value={row.periodsPerWeek || ''}
                        onChange={(e) => updateRow(i, 'periodsPerWeek', parseInt(e.target.value) || 0)}
                        sx={{ width: 120 }}
                        inputProps={{ min: 0, max: 30 }}
                      />
                      <IconButton color="error" onClick={() => removeRow(i)} size="small"><Delete /></IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => setStep(1)}
              disabled={assignments.filter((a) => a.teacherId && a.sectionId && a.subjectId).length === 0}
              sx={{ borderRadius: 2 }}
            >
              {tAssign('reviewAndConfirm')}
            </Button>
          </Box>
        </>
      )}

      {step === 1 && (
        <>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('confirmAssignments', { count: assignments.length })}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('teacher')}</TableCell>
                    <TableCell>{tCommon('section')}</TableCell>
                    <TableCell>{tCommon('subject')}</TableCell>
                    <TableCell align="right">{tCommon('periodsPerWeek')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.filter((a) => a.teacherId && a.sectionId && a.subjectId).map((row, i) => {
                    const t = teachers.find((x) => x._id === row.teacherId);
                    const sec = sections.find((x) => x._id === row.sectionId);
                    const sub = subjects.find((x) => x._id === row.subjectId);
                    return (
                      <TableRow key={i}>
                        <TableCell>{t?.firstName} {t?.lastName}</TableCell>
                        <TableCell>{sec?.name}</TableCell>
                        <TableCell>{sub?.name}</TableCell>
                        <TableCell align="right">{row.periodsPerWeek}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box display="flex" gap={1.5} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => setStep(0)} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ borderRadius: 2 }}>
              {loading ? <CircularProgress size={20} /> : tAssign('submitAssignments')}
            </Button>
          </Box>
        </>
      )}

      {step === 2 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Box textAlign="center" mb={3}>
            <CheckCircle sx={{ fontSize: 48, color: '#2D7D3A', mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>{tAssign('assignmentComplete')}</Typography>
            <Typography variant="body2" color="text.secondary">{result?.message}</Typography>
          </Box>

          {resultDetails.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('teacher')}</TableCell>
                    <TableCell>{tCommon('section')}</TableCell>
                    <TableCell>{tCommon('subject')}</TableCell>
                    <TableCell align="right">{tCommon('periods')}</TableCell>
                    <TableCell>{tCommon('status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultDetails.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{r.teacherName}</TableCell>
                      <TableCell>{r.sectionName}</TableCell>
                      <TableCell>{r.subjectName}</TableCell>
                      <TableCell align="right">{r.periods}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.success ? tCommon('assigned') : r.reason || tCommon('failed')}
                          color={r.success ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box display="flex" gap={1.5} justifyContent="center" mt={3}>
            <Button variant="outlined" onClick={() => { setStep(0); setAssignments([]); setResult(null); setResultDetails([]); }} sx={{ borderRadius: 2 }}>
              {tAssign('newBatch')}
            </Button>
            <Button variant="contained" onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>
              {tAssign('backToDashboard')}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
