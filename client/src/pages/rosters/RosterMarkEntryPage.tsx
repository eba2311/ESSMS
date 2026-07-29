import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, IconButton, Tooltip, TextField, Grid, Chip, Snackbar,
} from '@mui/material';
import { Save, ArrowBack, Refresh, CheckCircle, Warning } from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI, subjectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

interface MarkEntry {
  studentId: string;
  studentName: string;
  studentCode: string;
  mark: number | '';
}

export const RosterMarkEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
  const [academicYear, setAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );
  const [semester, setSemester] = useState<'1' | '2'>('1');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => { fetchSections(); }, [academicYear]);

  const fetchSections = async () => {
    try {
      const res = await sectionsAPI.list({ academicYear });
      const data = res.data.data;
      setSections(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const fetchSectionData = async (sectionId: string) => {
    if (!sectionId) return;
    try {
      setLoading(true);
      setError('');
      setSubjects([]);
      setStudents([]);
      setMarks([]);
      setHasChanges(false);

      const res = await sectionsAPI.subjects(sectionId);
      const subData = res.data.data;
      setSubjects(Array.isArray(subData) ? subData : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load section data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSubject = async () => {
    if (!selectedSectionId || !selectedSubjectId) return;
    try {
      setLoading(true);
      setError('');
      const stuRes = await sectionsAPI.students(selectedSectionId);
      const stuData = stuRes.data.data;
      const stuList = Array.isArray(stuData) ? stuData : (stuData?.students || []);

      const existingRes = await rosterAPI.getSemesterRoster({ semester, academicYear, sectionId: selectedSectionId });
      const existingRoster = existingRes.data.data || [];

      const markEntries: MarkEntry[] = stuList.map((s: any) => {
        const existing = existingRoster.find((r: any) => r.studentId === s.studentId || r.studentId === s._id);
        const subjectMarks = existing?.marks?.find((m: any) => m.subjectId === selectedSubjectId);
        return {
          studentId: s._id,
          studentName: `${s.firstName} ${s.lastName}`,
          studentCode: s.studentId || s.admissionNumber || '—',
          mark: subjectMarks?.mark ?? '',
        };
      });

      setMarks(markEntries);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSectionId) fetchSectionData(selectedSectionId);
  }, [selectedSectionId]);

  useEffect(() => {
    fetchStudentsForSubject();
  }, [selectedSubjectId]);

  const handleMarkChange = (studentId: string, value: string) => {
    const parsed = Number(value);
    const num = value === '' || isNaN(parsed) ? '' : Math.min(100, Math.max(0, Math.round(parsed)));
    setMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, mark: num } : m));
    setHasChanges(true);
  };

  const getGrade = (mark: number): string => {
    if (mark >= 90) return 'A+';
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    return 'F';
  };

  const handleSave = async () => {
    if (!selectedSectionId || !selectedSubjectId) { showError('Select section and subject'); return; }
    const marksToSave = marks.filter(m => m.mark !== '' && m.mark !== undefined);
    if (marksToSave.length === 0) { showError('Enter at least one mark'); return; }

    try {
      setSaving(true);
      await rosterAPI.bulkSaveMarks({
        sectionId: selectedSectionId,
        semester,
        subjectId: selectedSubjectId,
        academicYear,
        marks: marksToSave.map(m => ({ studentId: m.studentId, mark: Number(m.mark), grade: getGrade(Number(m.mark)) })),
      });
      showSuccess(`${marksToSave.length} marks saved successfully`);
      setHasChanges(false);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = (value: number) => {
    setMarks(prev => prev.map(m => ({ ...m, mark: value })));
    setHasChanges(true);
  };

  const stats = {
    total: marks.length,
    entered: marks.filter(m => m.mark !== '').length,
    avg: marks.filter(m => m.mark !== '').length > 0
      ? (marks.filter(m => m.mark !== '').reduce((sum, m) => sum + Number(m.mark), 0) / marks.filter(m => m.mark !== '').length).toFixed(1)
      : '—',
    pass: marks.filter(m => m.mark !== '' && Number(m.mark) >= 50).length,
    fail: marks.filter(m => m.mark !== '' && Number(m.mark) < 50).length,
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2} className="no-print">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('markEntry.title')}
        </Typography>
        {hasChanges && <Chip icon={<Warning />} label={tRoster('markEntry.unsavedChanges')} color="warning" size="small" />}
      </Box>

      {/* Selection Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }} className="no-print">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('academicYear')}</InputLabel>
              <Select value={academicYear} label={tCommon('academicYear')} onChange={(e) => setAcademicYear(e.target.value)}>
                {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('semester')}</InputLabel>
              <Select value={semester} label={tCommon('semester')} onChange={(e) => setSemester(e.target.value as '1' | '2')}>
                <MenuItem value="1">{tRoster('semester.semester1')}</MenuItem>
                <MenuItem value="2">{tRoster('semester.semester2')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('section')}</InputLabel>
              <Select value={selectedSectionId} label={tCommon('section')} onChange={(e) => setSelectedSectionId(e.target.value)}>
                <MenuItem value="">{tRoster('markEntry.selectSection')}</MenuItem>
                {sections.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} ({tCommon('grade')} {s.grade} - {s.stream || tCommon('common')})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('subject')}</InputLabel>
              <Select value={selectedSubjectId} label={tCommon('subject')} onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={subjects.length === 0}>
                <MenuItem value="">{tRoster('markEntry.selectSubject')}</MenuItem>
                {subjects.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} ({s.code || '—'})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="contained" onClick={handleSave} disabled={saving || !hasChanges} fullWidth size="small"
              startIcon={saving ? <CircularProgress size={16} /> : <Save />} sx={{ borderRadius: 2 }}>
              {saving ? tRoster('markEntry.saving') : tRoster('markEntry.saveMarks')}
            </Button>
          </Grid>
        </Grid>

        {marks.length > 0 && (
          <Box display="flex" gap={2} mt={2} flexWrap="wrap" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {stats.entered}/{stats.total} {tRoster('markEntry.entered')} · {tCommon('average')}: {stats.avg} · {tRoster('semester.pass')}: {stats.pass} · {tRoster('semester.fail')}: {stats.fail}
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button size="small" variant="text" onClick={() => handleAutoFill(0)}>{tRoster('markEntry.setAll')} 0</Button>
              <Button size="small" variant="text" onClick={() => handleAutoFill(50)}>{tRoster('markEntry.setAll')} 50</Button>
            </Box>
          </Box>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Marks Table */}
      {marks.length > 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>
              {tRoster('markEntry.enterMarks')} — {subjects.find(s => s._id === selectedSubjectId)?.name || ''}
              <Typography variant="caption" color="text.secondary" ml={1}>
                ({semester === '1' ? tRoster('semester.semester1') : tRoster('semester.semester2')} · {academicYear})
              </Typography>
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell><b>#</b></TableCell>
                    <TableCell><b>{tCommon('studentId')}</b></TableCell>
                    <TableCell><b>{tCommon('name')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('markEntry.markRange')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('grade')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('status')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marks.map((entry, idx) => {
                    const markNum = entry.mark !== '' ? Number(entry.mark) : null;
                    const grade = markNum !== null ? getGrade(markNum) : '—';
                    const passed = markNum !== null && markNum >= 50;
                    return (
                      <TableRow key={entry.studentId} hover sx={{ bgcolor: entry.mark === '' ? 'rgba(255,235,59,0.05)' : 'transparent' }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{entry.studentCode}</Typography></TableCell>
                        <TableCell><Typography fontWeight={600}>{entry.studentName}</Typography></TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small" type="number" value={entry.mark}
                            onChange={(e) => handleMarkChange(entry.studentId, e.target.value)}
                            inputProps={{ min: 0, max: 100, style: { textAlign: 'center', width: 80 } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={grade} size="small"
                            color={grade === 'F' ? 'error' : grade.startsWith('A') ? 'success' : 'default'}
                            sx={{ fontSize: '0.65rem', fontWeight: 700, minWidth: 40 }} />
                        </TableCell>
                        <TableCell align="center">
                          {markNum !== null && (
                            passed
                              ? <CheckCircle color="success" sx={{ fontSize: 18 }} />
                              : <Warning color="error" sx={{ fontSize: 18 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!loading && marks.length === 0 && selectedSectionId && selectedSubjectId && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">{tRoster('markEntry.noStudentsForSection')}</Typography>
        </Box>
      )}

      {!selectedSectionId && (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" variant="h6">{tRoster('markEntry.selectSectionHint')}</Typography>
        </Box>
      )}
    </Box>
  );
};
