import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Card, CardContent, Divider, LinearProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  List, ListItem, ListItemText, IconButton, FormControl, InputLabel, Select,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack, Edit, People, School, TrendingUp, EventAvailable,
  SwapHoriz, Archive, Unarchive, Delete, Add, Block, Book, Person
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { sectionsAPI, studentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

export const SectionProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t: tSections } = useTranslation('sections');
  const { t: tCommon } = useTranslation('common');
  const role = user?.role;
  const isAdmin = role === 'system_admin';
  const isAcademicHead = role === 'academic_head';
  const isRegistrar = role === 'registrar';
  const canManage = isAdmin || isAcademicHead;
  const canTransfer = isAdmin || isAcademicHead || isRegistrar;

  const [section, setSection] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const curYear = new Date().getFullYear();
  const curAY = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
  const [selectedAY, setSelectedAY] = useState(curAY);

  // Transfer dialog
  const [transferStudentId, setTransferStudentId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferDialog, setTransferDialog] = useState(false);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [assignDialog, setAssignDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignLoadingStudents, setAssignLoadingStudents] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; studentId: string; studentName: string }>({ open: false, studentId: '', studentName: '' });
  const [homeroomDialog, setHomeroomDialog] = useState(false);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [bulkTransferDialog, setBulkTransferDialog] = useState(false);
  const [bulkTransferTarget, setBulkTransferTarget] = useState('');
  const [bulkTransferReason, setBulkTransferReason] = useState('');
  const [bulkTransferStudentIds, setBulkTransferStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      sectionsAPI.get(id),
      sectionsAPI.students(id),
      sectionsAPI.performance(id, { academicYear: selectedAY }).catch(() => ({ data: { data: null } })),
      sectionsAPI.attendance(id, { academicYear: selectedAY }).catch(() => ({ data: { data: null } })),
      sectionsAPI.transfers(id).catch(() => ({ data: { data: [] } })),
      sectionsAPI.history(id).catch(() => ({ data: { data: [] } })),
      sectionsAPI.list({ academicYear: selectedAY }).catch(() => ({ data: { data: [] } })),
    ]).then(([secRes, stuRes, perfRes, attRes, trRes, histRes, allSecRes]) => {
      setSection(secRes.data.data);
      const sd = stuRes.data.data;
      setStudents(Array.isArray(sd) ? sd : (sd?.students || []));
      setPerformance(perfRes.data.data);
      setAttendance(attRes.data.data);
      setTransfers(trRes.data.data || []);
      setHistory(histRes.data.data || []);
      const allSectionsData = allSecRes.data.data || [];
      setAllSections(Array.isArray(allSectionsData) ? allSectionsData.filter((s: any) => s._id !== id) : []);
    }).catch((err) => {
      setError(err.response?.data?.message || tSections('messages.failedToLoadSection'));
    }).finally(() => setLoading(false));
  }, [id, selectedAY, tSections]);

  const refreshStudents = async () => {
    if (!id) return;
    const stuRes = await sectionsAPI.students(id);
    const sd = stuRes.data.data;
    setStudents(Array.isArray(sd) ? sd : (sd?.students || []));
  };

  const handleAssignHomeroom = async () => {
    try {
      await sectionsAPI.assignHomeroomTeacher(id!, homeroomTeacherId || null);
      showSuccess(homeroomTeacherId ? tSections('messages.homeroomAssigned') : tSections('messages.homeroomRemoved'));
      setHomeroomDialog(false);
      // Refresh section data
      const secRes = await sectionsAPI.get(id!);
      setSection(secRes.data.data);
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.failedToAssignHomeroom'));
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await import('../../services/api').then(m => m.teachersAPI.list({}));
      const data = res.data.data;
      setTeachers(Array.isArray(data) ? data : (data?.teachers || []));
    } catch { /* ignore */ }
  };

  const handleBulkTransfer = async () => {
    if (bulkTransferStudentIds.length === 0) { showError(tSections('messages.selectAtLeastOneStudent')); return; }
    if (!bulkTransferTarget) { showError(tSections('messages.selectTargetSection')); return; }
    try {
      const res = await sectionsAPI.bulkTransfer({
        studentIds: bulkTransferStudentIds,
        targetSectionId: bulkTransferTarget,
        reason: bulkTransferReason || tSections('messages.bulkTransferDefault'),
      });
      showSuccess(res.data.message || tSections('messages.studentsTransferredCount', { count: bulkTransferStudentIds.length }));
      setBulkTransferDialog(false);
      setBulkTransferStudentIds([]);
      setBulkTransferTarget('');
      setBulkTransferReason('');
      await refreshStudents();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.transferFailed'));
    }
  };

  const toggleBulkTransferSelection = (studentId: string) => {
    setBulkTransferStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await sectionsAPI.removeStudent(id!, studentId);
      showSuccess(tSections('messages.studentRemoved'));
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
    } catch (err: any) {
      showError(err.response?.data?.message || tCommon('statusFailed'));
    }
    setRemoveDialog({ open: false, studentId: '', studentName: '' });
  };

  const handleTransfer = async () => {
    if (!transferStudentId || !targetSectionId) { showError(tSections('messages.selectStudentAndTarget')); return; }
    try {
      await sectionsAPI.transferStudent(transferStudentId, {
        targetSectionId,
        reason: transferReason || tSections('messages.sectionTransferDefault'),
      });
      showSuccess(tSections('messages.studentTransferred'));
      setTransferDialog(false);
      setTransferStudentId('');
      setTargetSectionId('');
      setTransferReason('');
      await refreshStudents();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.transferFailed'));
    }
  };

  const fetchAvailableStudents = async () => {
    if (!section?.grade) return;
    setAssignLoadingStudents(true);
    try {
      const res = await studentsAPI.list({ grade: section.grade, limit: 500, status: 'Active' });
      const all = res.data.data?.students || [];
      setAvailableStudents(all.filter((s: any) => !s.section));
    } catch { /* ignore */ }
    setAssignLoadingStudents(false);
  };

  const handleOpenAssign = () => {
    setSelectedStudentIds([]);
    setAssignSearch('');
    setAssignDialog(true);
    fetchAvailableStudents();
  };

  const handleAssign = async () => {
    if (selectedStudentIds.length === 0) { showError(tSections('messages.selectAtLeastOneStudent')); return; }
    const availableSeats = (section?.capacity || 0) - (section?.studentCount || students.length);
    if (selectedStudentIds.length > availableSeats) {
      showError(tSections('messages.seatsExceeded', { available: availableSeats, selected: selectedStudentIds.length }));
      return;
    }
    const sectionId = id!;
    try {
      await sectionsAPI.assignStudents(sectionId, { studentIds: selectedStudentIds });
      showSuccess(tSections('messages.studentsAssignedCount', { count: selectedStudentIds.length }));
      setAssignDialog(false);
      setSelectedStudentIds([]);
      await refreshStudents();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        tSections('messages.failedToAssign');
      showError(msg);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const filteredAvailable = availableStudents.filter(
    (s) =>
      !assignSearch ||
      `${s.firstName} ${s.lastName} ${s.studentId || ''}`.toLowerCase().includes(assignSearch.toLowerCase())
  );

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress size={36} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!section) return <Alert severity="info">{tSections('profile.notFound')}</Alert>;

  const pct = section.capacity > 0 ? Math.round(((section.studentCount || students.length) / section.capacity) * 100) : 0;
  const perfMetrics = performance?.metrics;
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/sections')} size="small" sx={{ borderRadius: 2 }}>{tCommon('actionBack')}</Button>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {section.name}
            {section.sectionCode && <Typography variant="caption" color="text.secondary" ml={1}>#{section.sectionCode}</Typography>}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tCommon('grade')} {section.grade} · {section.stream || tCommon('stream.common')} · {section.academicYear}
          </Typography>
          {section.assistantTeacher && (
            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
              <Person sx={{ fontSize: 14 }} />
              {tSections('profile.homeroom')}: {section.assistantTeacher.firstName} {section.assistantTeacher.lastName}
              {section.assistantTeacher.teacherId && <Typography variant="caption" color="text.secondary">({section.assistantTeacher.teacherId})</Typography>}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" size="small" startIcon={<TrendingUp />} onClick={() => navigate(`/sections/${id}/analytics`)} sx={{ borderRadius: 2 }}>
          {tSections('profile.analytics')}
        </Button>
        <Button variant="outlined" size="small" startIcon={<EventAvailable />} onClick={() => navigate(`/sections/${id}/reports`)} sx={{ borderRadius: 2 }}>
          {tSections('profile.reports')}
        </Button>
        {canManage && (
          <Button variant="outlined" size="small" startIcon={<Book />} onClick={() => navigate(`/assignments/section-assign?section=${id}`)} sx={{ borderRadius: 2 }}>
            {tSections('profile.teachersAndSubjects')}
          </Button>
        )}
        {canManage && (
          <Button variant="outlined" size="small" startIcon={<Person />} onClick={() => { setHomeroomTeacherId(section.assistantTeacher?._id || ''); fetchTeachers(); setHomeroomDialog(true); }} sx={{ borderRadius: 2 }}>
            {tSections('profile.homeroomTeacher')}
          </Button>
        )}
        {canManage && (
          <Button variant="outlined" size="small" startIcon={<Edit />} onClick={() => navigate('/sections')} sx={{ borderRadius: 2 }}>
            {tSections('profile.manageSections')}
          </Button>
        )}
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>{tSections('dialog.academicYear')}</InputLabel>
          <Select value={selectedAY} label={tSections('dialog.academicYear')} onChange={(e) => setSelectedAY(e.target.value)}>
            {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={1.5} mb={3}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color="primary">{students.length}</Typography>
            <Typography variant="caption" color="text.secondary">{tCommon('students')} / {section.capacity}</Typography>
            <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#DC2626' : pct >= 80 ? '#C9920A' : '#2D7D3A' } }} />
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color="secondary">{perfMetrics?.sectionAverage || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{tSections('profile.sectionAvg')}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color={perfMetrics?.rankPosition === 1 ? 'warning.main' : 'text.primary'}>
              {perfMetrics?.rankPosition ? `#${perfMetrics.rankPosition}` : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">{tSections('profile.ofSections', { count: perfMetrics?.totalSections || '—' })}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color="success.main">{attendance?.metrics?.dailyAttendanceRate ? `${attendance.metrics.dailyAttendanceRate}%` : '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{tSections('profile.attendanceRate')}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`${tCommon('students')} (${students.length})`} icon={<People fontSize="small" />} iconPosition="start" />
        <Tab label={tSections('profile.performance')} icon={<TrendingUp fontSize="small" />} iconPosition="start" />
        <Tab label={tSections('profile.attendance')} icon={<EventAvailable fontSize="small" />} iconPosition="start" />
        <Tab label={tSections('profile.transfers')} icon={<SwapHoriz fontSize="small" />} iconPosition="start" />
        <Tab label={tSections('profile.history')} icon={<School fontSize="small" />} iconPosition="start" />
      </Tabs>

      {/* Tab: Students */}
      {tab === 0 && (
        <Box>
          <Box display="flex" gap={1} mb={2}>
            {canTransfer && (
              <Button size="small" variant="contained" startIcon={<Add />} onClick={handleOpenAssign} sx={{ borderRadius: 2 }}>
                {tSections('profile.assignStudents')}
              </Button>
            )}
            {canTransfer && students.length > 0 && (
              <Button size="small" variant="outlined" startIcon={<SwapHoriz />} onClick={() => setTransferDialog(true)} sx={{ borderRadius: 2 }}>
                {tSections('profile.transferStudent')}
              </Button>
            )}
            {canTransfer && students.length > 1 && (
              <Button size="small" variant="outlined" color="secondary" startIcon={<SwapHoriz />} onClick={() => { setBulkTransferStudentIds([]); setBulkTransferTarget(''); setBulkTransferDialog(true); }} sx={{ borderRadius: 2 }}>
                {tSections('profile.bulkTransfer')}
              </Button>
            )}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            {students.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><People sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3 }} /><Typography color="text.muted">{tSections('profile.noStudentsAssigned')}</Typography></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{tSections('profile.studentId')}</TableCell>
                      <TableCell>{tSections('profile.name')}</TableCell>
                      <TableCell>{tSections('profile.gender')}</TableCell>
                      <TableCell align="right">{tSections('list.table.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((s: any, i: number) => (
                      <TableRow key={s._id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{s.studentId}</Typography></TableCell>
                        <TableCell><Typography fontWeight={600}>{s.firstName} {s.lastName}</Typography></TableCell>
                        <TableCell><Chip label={s.gender || '—'} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell align="right">
                          {canTransfer && (
                            <IconButton size="small" color="error" onClick={() => setRemoveDialog({ open: true, studentId: s._id, studentName: `${s.firstName} ${s.lastName}` })} title={tCommon('actionRemove')}><Delete fontSize="small" /></IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* Tab: Performance */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          {!perfMetrics ? (
            <Alert severity="info">{tSections('profile.noPerformanceData')}</Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="primary">{perfMetrics.sectionAverage}%</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.sectionAverage')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="success.main">{perfMetrics.highestAverage}%</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.highestAverage')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="error">{perfMetrics.lowestAverage}%</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.lowestAverage')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="warning.main">#{perfMetrics.rankPosition || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.rank', { total: perfMetrics.totalSections })}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {tSections('profile.totalStudents')}: {perfMetrics.totalStudents} · {tSections('profile.sectionGrade')}: {section.grade}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {/* Tab: Attendance */}
      {tab === 2 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          {!attendance?.metrics ? (
            <Alert severity="info">{tSections('profile.noAttendanceData')}</Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="success.main">{attendance.metrics.dailyAttendanceRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.attendanceRate')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800}>{attendance.metrics.presentRecords}</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.present')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color="error">{attendance.metrics.absentRecords}</Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.absent')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" fontWeight={800} color={attendance.metrics.chronicAbsenteeCount > 0 ? 'error' : 'success.main'}>
                    {attendance.metrics.chronicAbsenteeCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{tSections('profile.chronicAbsentees')}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {tSections('profile.totalRecords')}: {attendance.metrics.totalRecords} · {tCommon('students')}: {attendance.metrics.totalStudents}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {/* Tab: Transfers */}
      {tab === 3 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          {transfers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><SwapHoriz sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3 }} /><Typography color="text.muted">{tSections('profile.noTransfersRecorded')}</Typography></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tSections('profile.date')}</TableCell>
                    <TableCell>{tSections('profile.user')}</TableCell>
                    <TableCell>{tSections('profile.action')}</TableCell>
                    <TableCell>{tSections('profile.details')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t: any, i: number) => (
                    <TableRow key={t._id || i} hover>
                      <TableCell><Typography variant="caption">{new Date(t.createdAt).toLocaleDateString()}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{t.userId?.firstName || t.metadata?.transferredBy || '—'}</Typography></TableCell>
                      <TableCell><Chip label={t.activityType} size="small" color="info" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{t.description}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab: History */}
      {tab === 4 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          {history.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><School sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3 }} /><Typography color="text.muted">{tSections('profile.noHistoryRecorded')}</Typography></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tSections('profile.date')}</TableCell>
                    <TableCell>{tCommon('statusTitle')}</TableCell>
                    <TableCell>{tSections('profile.reason')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h: any, i: number) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="caption">{new Date(h.changedAt).toLocaleString()}</Typography></TableCell>
                      <TableCell><Chip label={h.status} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem' }} /></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{h.reason || '—'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('profile.transferStudent')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField fullWidth select label={tSections('profile.student')} value={transferStudentId} onChange={(e) => setTransferStudentId(e.target.value)}>
                {students.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label={tSections('merge.targetLabel')} value={targetSectionId} onChange={(e) => setTargetSectionId(e.target.value)}>
                {allSections.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} ({tCommon('grade')} {s.grade} · {s.stream || tCommon('stream.common')})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label={tSections('profile.reason')} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setTransferDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('actionCancel')}</Button>
          <Button onClick={handleTransfer} variant="contained" color="primary" sx={{ borderRadius: 2 }}>{tCommon('actionTransfer')}</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {tSections('profile.assignStudents')}
          <Typography variant="body2" color="text.secondary" fontWeight={400}>{tCommon('grade')} {section?.grade} · {section?.name}</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder={tSections('profile.searchStudents')} value={assignSearch}
            onChange={(e) => setAssignSearch(e.target.value)} sx={{ mb: 2 }} />
          {assignLoadingStudents ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
          ) : filteredAvailable.length === 0 ? (
            <Box py={3} textAlign="center"><Typography color="text.secondary" variant="body2">
              {assignSearch ? tSections('profile.noStudentsMatchSearch') : tSections('profile.noAvailableStudentsForGrade')}
            </Typography></Box>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderRadius: 2 }}>
              {filteredAvailable.map((s: any) => (
                <ListItem key={s._id} dense button onClick={() => toggleStudentSelection(s._id)}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <Checkbox edge="start" checked={selectedStudentIds.includes(s._id)} size="small" />
                  <ListItemText
                    primary={`${s.firstName} ${s.lastName}`}
                    secondary={`${s.studentId || ''} · ${s.gender || '—'}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto', ml: 1 }}>
            {tSections('profile.studentsSelectedCount', { count: selectedStudentIds.length })}
          </Typography>
          <Button onClick={() => setAssignDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('actionCancel')}</Button>
          <Button onClick={handleAssign} variant="contained" disabled={selectedStudentIds.length === 0} sx={{ borderRadius: 2 }}>
            {tCommon('actionAssign')} ({selectedStudentIds.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Student Confirmation */}
      <Dialog open={removeDialog.open} onClose={() => setRemoveDialog({ open: false, studentId: '', studentName: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('profile.removeStudent')}</DialogTitle>
        <DialogContent>
          <Typography>{tSections('profile.removeStudentConfirm', { name: removeDialog.studentName })}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRemoveDialog({ open: false, studentId: '', studentName: '' })} sx={{ borderRadius: 2 }}>{tCommon('actionCancel')}</Button>
          <Button onClick={() => handleRemoveStudent(removeDialog.studentId)} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('actionRemove')}</Button>
        </DialogActions>
      </Dialog>

      {/* Homeroom Teacher Dialog */}
      <Dialog open={homeroomDialog} onClose={() => setHomeroomDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('profile.assignHomeroomTeacher')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('profile.selectHomeroomTeacher', { name: section?.name })}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>{tSections('profile.homeroomTeacher')}</InputLabel>
            <Select
              value={homeroomTeacherId}
              label={tSections('profile.homeroomTeacher')}
              onChange={(e) => setHomeroomTeacherId(e.target.value)}
            >
              <MenuItem value="">
                <em>{tSections('profile.noneRemove')}</em>
              </MenuItem>
              {teachers.map((t: any) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.firstName} {t.lastName} ({t.teacherId || t.employeeId || 'N/A'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setHomeroomDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('actionCancel')}</Button>
          <Button onClick={handleAssignHomeroom} variant="contained" color="primary" sx={{ borderRadius: 2 }}>
            {homeroomTeacherId ? tCommon('actionAssign') : tCommon('actionRemove')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Transfer Dialog */}
      <Dialog open={bulkTransferDialog} onClose={() => { setBulkTransferDialog(false); setBulkTransferStudentIds([]); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {tSections('profile.bulkTransferStudents')}
          <Typography variant="body2" color="text.secondary" fontWeight={400}>{tSections('profile.from')} {section?.name}</Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField fullWidth select label={tSections('merge.targetLabel')} size="small" value={bulkTransferTarget}
                onChange={(e) => setBulkTransferTarget(e.target.value)}>
                {allSections.filter((s: any) => s.isActive && !s.isArchived && s._id !== id).map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} — {tCommon('grade')} {s.grade} ({s.stream || tCommon('stream.common')})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} mb={1}>{tSections('profile.selectStudentsToTransfer')}</Typography>
              <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto', borderRadius: 2 }}>
                {students.map((s: any) => (
                  <Box key={s._id} display="flex" alignItems="center" gap={1} py={0.5} px={1}
                    onClick={() => toggleBulkTransferSelection(s._id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <input type="checkbox" checked={bulkTransferStudentIds.includes(s._id)} readOnly />
                    <Typography variant="body2">{s.firstName} {s.lastName} ({s.studentId})</Typography>
                  </Box>
                ))}
              </Paper>
              <Typography variant="caption" color="text.secondary">{tSections('profile.studentsSelectedCount', { count: bulkTransferStudentIds.length })}</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label={tSections('archive.reasonOptional')} size="small" value={bulkTransferReason}
                onChange={(e) => setBulkTransferReason(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setBulkTransferDialog(false); setBulkTransferStudentIds([]); }} sx={{ borderRadius: 2 }}>{tCommon('actionCancel')}</Button>
          <Button onClick={handleBulkTransfer} variant="contained" color="secondary" disabled={bulkTransferStudentIds.length === 0} sx={{ borderRadius: 2 }}>
            {tCommon('actionTransfer')} ({bulkTransferStudentIds.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
