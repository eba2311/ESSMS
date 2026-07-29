import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Grid, Chip, CircularProgress, Alert,
  Divider, Avatar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, Tab, TextField, Select, InputLabel, FormControl, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Edit, School, Assignment, CalendarMonth, TrendingUp, UploadFile } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersAPI, documentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export const TeacherProfilePage = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const role = user?.role;
  const canManage = role === 'system_admin' || role === 'academic_head';
  const canEdit = role === 'system_admin';

  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ checkIn: '', checkOut: '', status: 'Present', notes: '' });

  const [leaveDialog, setLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    if (!id) return;
    teachersAPI.get(id).then((r) => {
      setTeacher(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!teacher) return null;

  const t = teacher;
  const q = t.qualifications?.[0] || {};
  const statusColor = t.status === 'Active' ? '#2D7D3A' : t.status === 'On Leave' ? '#B45309' : t.status === 'Terminated' ? '#DC2626' : '#6B7280';
  const statusBg = t.status === 'Active' ? 'rgba(45,125,58,0.12)' : t.status === 'On Leave' ? 'rgba(245,158,11,0.12)' : t.status === 'Terminated' ? 'rgba(220,38,38,0.12)' : 'rgba(107,114,128,0.1)';
  const assignments = t.assignments || [];
  const workload = t.workloadSummary || { totalPeriods: 0 };
  const attendanceRecords = t.attendance || [];
  const leaveRecords = t.leaves || [];
  const transferRecords = t.transfers || [];
  const perf = t.performanceMetrics || {};

  const handleAttendance = async () => {
    try {
      await teachersAPI.attendance.record(id!, attendanceForm);
      showSuccess(tTeacher('attendanceRecords'));
      setAttendanceDialog(false);
      const r = await teachersAPI.get(id!);
      setTeacher(r.data.data);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleLeaveRequest = async () => {
    try {
      await teachersAPI.leaves.request(id!, leaveForm);
      showSuccess(tTeacher('requestLeave'));
      setLeaveDialog(false);
      const r = await teachersAPI.get(id!);
      setTeacher(r.data.data);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleApproveLeave = async (leaveId: string, status: string) => {
    try {
      await teachersAPI.leaves.approve(id!, leaveId, { status });
      showSuccess(status.toLowerCase());
      const r = await teachersAPI.get(id!);
      setTeacher(r.data.data);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/teachers')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tTeacher('profile')}</Typography>
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/teachers/${id}/edit`)} sx={{ borderRadius: 2 }}>{tCommon('edit')}</Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', fontWeight: 700, fontSize: '1.5rem' }}>
            {t.firstName?.[0]}{t.lastName?.[0]}
          </Avatar>
          <Box flex={1} minWidth={180}>
            <Typography variant="h5" fontWeight={700}>{[t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ')}</Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="monospace" fontSize="0.85rem">{t.teacherId}</Typography>
            <Box mt={0.75} display="flex" gap={1} flexWrap="wrap">
              <Chip label={t.status || tTeacher('active')} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: statusBg, color: statusColor }} />
              <Chip label={t.position || tTeacher('subjectTeacher')} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
              <Chip label={t.employmentType || tTeacher('fullTime')} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
            </Box>
          </Box>
          <Box textAlign={{ xs: 'left', md: 'right' }}>
            <Typography variant="caption" color="text.secondary">{tTeacher('assignments')}</Typography>
            <Typography variant="h5" fontWeight={700}>{assignments.length}</Typography>
            <Typography variant="caption" color="text.secondary">{tTeacher('weeklyPeriods') || tTeacher('periodsWeek')}</Typography>
            <Typography variant="body1" fontWeight={600}>{workload.totalPeriods}</Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={tTeacher('details')} />
          <Tab label={tTeacher('teachingAssignments')} />
          <Tab label={tTeacher('attendance')} />
          <Tab label={tTeacher('leaves')} />
          <Tab label={tTeacher('performance')} />
          <Tab label={tTeacher('training')} />
          <Tab label={tTeacher('disciplinary')} />
          <Tab label={tTeacher('documents')} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
                <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('personalInfo')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                [tTeacher('fullName'), [t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ')],
                [tTeacher('gender'), t.gender || '—'],
                [tTeacher('dateOfBirth'), t.dateOfBirth?.split('T')[0] || '—'],
                [tTeacher('nationality'), t.nationality || '—'],
                [tTeacher('maritalStatus'), t.maritalStatus || '—'],
              ].map(([label, value]) => (
                <Box key={String(label)} mb={1.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                  <Typography variant="body1">{String(value)}</Typography>
                  <Divider sx={{ mt: 0.75 }} />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
                <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('contact')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                [tTeacher('phone'), t.phoneNumber || '—'],
                [tTeacher('altPhone'), t.altPhoneNumber || '—'],
                [tTeacher('email'), t.email || '—'],
                [tTeacher('address'), [t.residentialAddress?.city, t.residentialAddress?.subcity, t.residentialAddress?.woreda].filter(Boolean).join(', ') || '—'],
                [tTeacher('emergencyContact'), t.emergencyContact?.name ? `${t.emergencyContact.name} (${t.emergencyContact.relationship}) — ${t.emergencyContact.phone}` : '—'],
              ].map(([label, value]) => (
                <Box key={String(label)} mb={1.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                  <Typography variant="body1">{String(value)}</Typography>
                  <Divider sx={{ mt: 0.75 }} />
                </Box>
              ))}
            </Paper>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
                <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('professional')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                [tTeacher('specialization'), t.specialization || '—'],
                [tTeacher('teachingLicense'), t.teachingLicenseNumber || '—'],
                [tTeacher('degree'), q.degree || '—'],
                [tTeacher('fieldOfStudy'), q.field || '—'],
                [tTeacher('institution'), q.institution || '—'],
                [tTeacher('yearOfGraduation'), q.year || '—'],
                [tTeacher('yearsOfExperience'), `${t.yearsOfExperience ?? 0} years`],
                [tTeacher('employeeNumber'), t.employeeNumber || t.teacherId],
                [tTeacher('employmentDate'), t.employmentDate?.split('T')[0] || '—'],
              ].map(([label, value]) => (
                <Box key={String(label)} mb={1.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                  <Typography variant="body1">{String(value)}</Typography>
                  <Divider sx={{ mt: 0.75 }} />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={0.75}>
                  <Assignment sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('teachingAssignments')}
                </Typography>
              </Box>
              {assignments.length === 0 ? (
                <Typography color="text.secondary">{tTeacher('noAssignmentsYet')}</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{tTeacher('subject')}</TableCell>
                        <TableCell>{tTeacher('section')}</TableCell>
                        <TableCell>{tTeacher('periodsWeek')}</TableCell>
                        <TableCell>{tTeacher('status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((a: any) => (
                        <TableRow key={a._id}>
                          <TableCell>{a.subject?.name || a.subjectId || '—'}</TableCell>
                          <TableCell>{a.section?.name ? `Grade ${a.section.grade} - ${a.section.name}` : a.sectionId || '—'}</TableCell>
                          <TableCell>{a.periodsPerWeek || '—'}</TableCell>
                          <TableCell>
                            <Chip label={a.isActive ? tCommon('active') : tCommon('inactive')} size="small" color={a.isActive ? 'success' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
                <CalendarMonth sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('workloadSummary')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" gap={3} flexWrap="wrap">
                {[
                  [tTeacher('totalPeriodsWeek'), workload.totalPeriods],
                  [tTeacher('totalAssignments'), assignments.length],
                ].map(([label, value]) => (
                  <Box key={String(label)} textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="#1B4F8A">{String(value)}</Typography>
                    <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{tTeacher('attendanceRecords')}</Typography>
            {canManage && (
              <Button variant="contained" size="small" onClick={() => setAttendanceDialog(true)} sx={{ borderRadius: 2 }}>
                {tTeacher('recordAttendance')}
              </Button>
            )}
          </Box>
          {attendanceRecords.length === 0 ? (
            <Typography color="text.secondary">{tTeacher('noAttendanceRecords')}</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('date')}</TableCell>
                    <TableCell>{tTeacher('status')}</TableCell>
                    <TableCell>{tTeacher('checkIn')}</TableCell>
                    <TableCell>{tTeacher('checkOut')}</TableCell>
                    <TableCell>{tTeacher('notes')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((a: any) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.date?.split('T')[0] || '—'}</TableCell>
                      <TableCell>
                        <Chip label={a.status} size="small" color={a.status === 'Present' ? 'success' : a.status === 'Late' ? 'warning' : 'error'} sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell>{a.checkIn || '—'}</TableCell>
                      <TableCell>{a.checkOut || '—'}</TableCell>
                      <TableCell>{a.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tab === 3 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{tTeacher('leaveRequests')}</Typography>
            {canManage && (
              <Button variant="contained" size="small" onClick={() => setLeaveDialog(true)} sx={{ borderRadius: 2 }}>
                {tTeacher('requestLeave')}
              </Button>
            )}
          </Box>
          {leaveRecords.length === 0 ? (
            <Typography color="text.secondary">{tTeacher('noLeaveRequests')}</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tTeacher('type')}</TableCell>
                    <TableCell>{tTeacher('start')}</TableCell>
                    <TableCell>{tTeacher('end')}</TableCell>
                    <TableCell>{tTeacher('reason')}</TableCell>
                    <TableCell>{tTeacher('status')}</TableCell>
                    {canManage && <TableCell align="right">{tCommon('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRecords.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((l: any) => (
                    <TableRow key={l._id}>
                      <TableCell>{l.type}</TableCell>
                      <TableCell>{l.startDate?.split('T')[0]}</TableCell>
                      <TableCell>{l.endDate?.split('T')[0]}</TableCell>
                      <TableCell>{l.reason || '—'}</TableCell>
                      <TableCell>
                        <Chip label={l.status} size="small" color={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'error' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      {canManage && l.status === 'Pending' && (
                        <TableCell align="right">
                          <Button size="small" color="success" onClick={() => handleApproveLeave(l._id, 'Approved')} sx={{ fontSize: '0.7rem', minWidth: 0 }}>{tTeacher('approve')}</Button>
                          <Button size="small" color="error" onClick={() => handleApproveLeave(l._id, 'Rejected')} sx={{ fontSize: '0.7rem', minWidth: 0 }}>{tTeacher('reject')}</Button>
                        </TableCell>
                      )}
                      {canManage && l.status !== 'Pending' && <TableCell />}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
                <TrendingUp sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('academicPerformance')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {perf.academic ? (
                <>
                  {[
                    [tTeacher('studentAverage'), `${perf.academic.studentAverage ?? '—'}%`],
                    [tTeacher('subjectPerformance'), `${perf.academic.subjectPerformance ?? '—'}%`],
                    [tTeacher('resultTrend'), perf.academic.resultTrend || '—'],
                  ].map(([label, value]) => (
                    <Box key={String(label)} mb={1.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                      <Typography variant="body1">{String(value)}</Typography>
                      <Divider sx={{ mt: 0.75 }} />
                    </Box>
                  ))}
                </>
              ) : (
                <Typography color="text.secondary">{tTeacher('noAcademicPerformanceData')}</Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
                <TrendingUp sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('administrativePerformance')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {perf.administrative ? (
                <>
                  {[
                    [tTeacher('attendanceRate'), `${perf.administrative.attendanceRate ?? '—'}%`],
                    [tTeacher('timeliness'), `${perf.administrative.timeliness ?? '—'}%`],
                    [tTeacher('assignmentCompletion'), `${perf.administrative.assignmentCompletion ?? '—'}%`],
                    [tTeacher('reportSubmission'), `${perf.administrative.reportSubmission ?? '—'}%`],
                  ].map(([label, value]) => (
                    <Box key={String(label)} mb={1.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                      <Typography variant="body1">{String(value)}</Typography>
                      <Divider sx={{ mt: 0.75 }} />
                    </Box>
                  ))}
                </>
              ) : (
                <Typography color="text.secondary">{tTeacher('noAdministrativePerformanceData')}</Typography>
              )}
            </Paper>
          </Grid>
          {transferRecords.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('transferHistory')}</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{tCommon('date')}</TableCell>
                        <TableCell>{tTeacher('from')}</TableCell>
                        <TableCell>{tTeacher('to')}</TableCell>
                        <TableCell>{tTeacher('reason')}</TableCell>
                        <TableCell>{tTeacher('status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transferRecords.map((tr: any) => (
                        <TableRow key={tr._id}>
                          <TableCell>{tr.transferDate?.split('T')[0]}</TableCell>
                          <TableCell>{tr.fromSection?.name || tr.fromSubject?.name || '—'}</TableCell>
                          <TableCell>{tr.toSection?.name || tr.toSubject?.name || '—'}</TableCell>
                          <TableCell>{tr.reason || '—'}</TableCell>
                          <TableCell><Chip label={tr.status} size="small" color={tr.status === 'Approved' ? 'success' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {tab === 5 && <TrainingTab teacherId={id!} canManage={canManage} />}
      {tab === 6 && <DisciplinaryTab teacherId={id!} canManage={canManage} />}
      {tab === 7 && <DocumentsTab teacherId={id!} canManage={canManage} />}

      <Dialog open={attendanceDialog} onClose={() => setAttendanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('recordAttendance')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('status')}</InputLabel>
              <Select value={attendanceForm.status} label={tTeacher('status')} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                {[{ v: 'Present', l: tTeacher('present') }, { v: 'Late', l: tTeacher('late') }, { v: 'Early Departure', l: tTeacher('earlyDeparture') }, { v: 'Absent', l: tTeacher('absent') }, { v: 'On Leave', l: tTeacher('onLeave') }].map((s) => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={tTeacher('checkIn')} size="small" type="time" value={attendanceForm.checkIn} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={tTeacher('checkOut')} size="small" type="time" value={attendanceForm.checkOut} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={tTeacher('notes')} size="small" multiline rows={2} value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleAttendance}>{tCommon('save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={leaveDialog} onClose={() => setLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('requestLeave')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('leaveType')}</InputLabel>
              <Select value={leaveForm.type} label={tTeacher('leaveType')} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                {[{ v: 'Annual', l: tTeacher('annual') }, { v: 'Sick', l: tTeacher('sick') }, { v: 'Emergency', l: tTeacher('emergency') }, { v: 'Maternity', l: tTeacher('maternity') }, { v: 'Training', l: tTeacher('training') }].map((t) => <MenuItem key={t.v} value={t.v}>{t.l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth type="date" label={tTeacher('startDate')} size="small" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth type="date" label={tTeacher('endDate')} size="small" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={tTeacher('reason')} size="small" multiline rows={2} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleLeaveRequest}>{tCommon('submit')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const TrainingTab = ({ teacherId, canManage }: { teacherId: string; canManage: boolean }) => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ title: '', provider: '', startDate: '', endDate: '', duration: '', type: '', certificate: '' });

  useEffect(() => {
    teachersAPI.trainings.list(teacherId).then((r) => {
      setTrainings(r.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherId]);

  const handleSubmit = async () => {
    try {
      await teachersAPI.trainings.create(teacherId, form);
      showSuccess(tTeacher('addTraining'));
      setDialog(false);
      setForm({ title: '', provider: '', startDate: '', endDate: '', duration: '', type: '', certificate: '' });
      const r = await teachersAPI.trainings.list(teacherId);
      setTrainings(r.data.data || []);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>{tTeacher('trainingRecords')}</Typography>
          {canManage && (
            <Button variant="contained" size="small" onClick={() => setDialog(true)} sx={{ borderRadius: 2 }}>{tTeacher('addTraining')}</Button>
          )}
        </Box>
        {trainings.length === 0 ? (
          <Typography color="text.secondary">{tTeacher('noTrainingRecords')}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tTeacher('title')}</TableCell>
                  <TableCell>{tTeacher('provider')}</TableCell>
                  <TableCell>{tTeacher('startDate')}</TableCell>
                  <TableCell>{tTeacher('endDate')}</TableCell>
                  <TableCell>{tTeacher('duration')}</TableCell>
                  <TableCell>{tTeacher('type')}</TableCell>
                  <TableCell>{tTeacher('certificate')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trainings.map((tr: any) => (
                  <TableRow key={tr._id}>
                    <TableCell>{tr.title}</TableCell>
                    <TableCell>{tr.provider || '—'}</TableCell>
                    <TableCell>{tr.startDate?.split('T')[0] || '—'}</TableCell>
                    <TableCell>{tr.endDate?.split('T')[0] || '—'}</TableCell>
                    <TableCell>{tr.duration || '—'}</TableCell>
                    <TableCell>{tr.type || '—'}</TableCell>
                    <TableCell>{tr.certificate || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('addTraining')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth label={`${tTeacher('title')} *`} size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextField fullWidth label={tTeacher('provider')} size="small" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            <TextField fullWidth type="date" label={tTeacher('startDate')} size="small" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth type="date" label={tTeacher('endDate')} size="small" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={tTeacher('duration')} size="small" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 days" />
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('type')}</InputLabel>
              <Select value={form.type} label={tTeacher('type')} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {[{ v: 'Workshop', l: tTeacher('workshop') }, { v: 'Seminar', l: tTeacher('seminar') }, { v: 'Conference', l: tTeacher('conference') }, { v: 'Online Course', l: tTeacher('onlineCourse') }, { v: 'Certification', l: tTeacher('certification') }, { v: 'Other', l: tCommon('other') }].map((t) => <MenuItem key={t.v} value={t.v}>{t.l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={tTeacher('certificate')} size="small" value={form.certificate} onChange={(e) => setForm({ ...form, certificate: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}>{tCommon('save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const DisciplinaryTab = ({ teacherId, canManage }: { teacherId: string; canManage: boolean }) => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ incidentDate: '', nature: '', description: '', action: '', status: 'Pending' });

  useEffect(() => {
    teachersAPI.disciplinary.list(teacherId).then((r) => {
      setRecords(r.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [teacherId]);

  const handleSubmit = async () => {
    try {
      await teachersAPI.disciplinary.create(teacherId, form);
      showSuccess(tTeacher('addDisciplinaryRecord'));
      setDialog(false);
      setForm({ incidentDate: '', nature: '', description: '', action: '', status: 'Pending' });
      const r = await teachersAPI.disciplinary.list(teacherId);
      setRecords(r.data.data || []);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleStatusUpdate = async (recordId: string, status: string) => {
    try {
      await teachersAPI.disciplinary.update(teacherId, recordId, { status });
      showSuccess(tTeacher('status'));
      const r = await teachersAPI.disciplinary.list(teacherId);
      setRecords(r.data.data || []);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>{tTeacher('disciplinaryRecords')}</Typography>
          {canManage && (
            <Button variant="contained" size="small" onClick={() => setDialog(true)} sx={{ borderRadius: 2 }}>{tTeacher('addDisciplinaryRecord')}</Button>
          )}
        </Box>
        {records.length === 0 ? (
          <Typography color="text.secondary">{tTeacher('noDisciplinaryRecords')}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tTeacher('nature')}</TableCell>
                  <TableCell>{tTeacher('description')}</TableCell>
                  <TableCell>{tTeacher('actionTaken')}</TableCell>
                  <TableCell>{tTeacher('status')}</TableCell>
                  {canManage && <TableCell align="right">{tCommon('actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r: any) => (
                  <TableRow key={r._id}>
                    <TableCell>{r.incidentDate?.split('T')[0] || '—'}</TableCell>
                    <TableCell>{r.nature || '—'}</TableCell>
                    <TableCell>{r.description || '—'}</TableCell>
                    <TableCell>{r.action || '—'}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={r.status === 'Resolved' ? 'success' : r.status === 'Pending' ? 'warning' : 'info'} sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={r.status}
                            onChange={(e) => handleStatusUpdate(r._id, e.target.value)}
                            sx={{ fontSize: '0.75rem', height: 30 }}
                          >
                            {[{ v: 'Pending', l: tTeacher('pending') }, { v: 'Under Investigation', l: tTeacher('underInvestigation') }, { v: 'Resolved', l: tTeacher('resolved') }, { v: 'Dismissed', l: tTeacher('dismissed') }].map((s) => <MenuItem key={s.v} value={s.v} sx={{ fontSize: '0.75rem' }}>{s.l}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('addDisciplinaryRecord')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth type="date" label={tTeacher('incidentDate')} size="small" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('nature')}</InputLabel>
              <Select value={form.nature} label={tTeacher('nature')} onChange={(e) => setForm({ ...form, nature: e.target.value })}>
                {[{ v: 'Misconduct', l: tTeacher('misconduct') }, { v: 'Tardiness', l: tTeacher('tardiness') }, { v: 'Absenteeism', l: tTeacher('absenteeism') }, { v: 'Insubordination', l: tTeacher('insubordination') }, { v: 'Negligence', l: tTeacher('negligence') }, { v: 'Other', l: tCommon('other') }].map((n) => <MenuItem key={n.v} value={n.v}>{n.l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={tTeacher('description')} size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField fullWidth label={tTeacher('actionTaken')} size="small" multiline rows={2} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}>{tCommon('save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const DocumentsTab = ({ teacherId, canManage }: { teacherId: string; canManage: boolean }) => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    try {
      const r = await documentsAPI.list({ teacher: teacherId });
      setDocs(r.data.data?.documents || r.data.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [teacherId]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('documentType', form.type || 'Other');
      fd.append('notes', form.description);
      fd.append('teacher', teacherId);
      fd.append('file', file);
      await documentsAPI.upload(fd);
      showSuccess(tTeacher('uploadDocument'));
      setDialog(false);
      setForm({ title: '', type: '', description: '' });
      setFile(null);
      fetchDocs();
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentsAPI.delete(id);
      showSuccess(tCommon('delete'));
      fetchDocs();
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleVerify = async (id: string) => {
    try {
      await documentsAPI.verify(id);
      showSuccess(tTeacher('verified'));
      fetchDocs();
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const r = await documentsAPI.download(id);
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      a.click();
      URL.revokeObjectURL(url);
    } catch { showError(tCommon('download')); }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>{tTeacher('documentsCount', { count: docs.length })}</Typography>
          {canManage && (
            <Button variant="contained" size="small" startIcon={<UploadFile />} onClick={() => setDialog(true)} sx={{ borderRadius: 2 }}>
              {tCommon('upload')}
            </Button>
          )}
        </Box>
        {docs.length === 0 ? (
          <Typography color="text.secondary">{tTeacher('noDocumentsUploaded')}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tTeacher('title')}</TableCell>
                  <TableCell>{tTeacher('type')}</TableCell>
                  <TableCell>{tTeacher('notes')}</TableCell>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tTeacher('verified')}</TableCell>
                  <TableCell align="right">{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d: any) => (
                  <TableRow key={d._id}>
                    <TableCell>{d.title || '—'}</TableCell>
                    <TableCell><Chip label={d.documentType || 'Other'} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell>{d.notes || '—'}</TableCell>
                    <TableCell>{d.createdAt?.split('T')[0] || '—'}</TableCell>
                    <TableCell>
                      <Chip label={d.isVerified ? tCommon('yes') : tCommon('no')} size="small" color={d.isVerified ? 'success' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => handleDownload(d._id, d.title)} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tCommon('download')}</Button>
                        {canManage && !d.isVerified && (
                          <Button size="small" color="primary" onClick={() => handleVerify(d._id)} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tCommon('edit')}</Button>
                        )}
                        {canManage && (
                          <Button size="small" color="error" onClick={() => handleDelete(d._id)} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tCommon('delete')}</Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('uploadDocument')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth label={tTeacher('title')} size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <FormControl fullWidth size="small">
              <InputLabel>{tTeacher('type')}</InputLabel>
              <Select value={form.type} label={tTeacher('type')} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {[{ v: 'Birth Certificate', l: tTeacher('birthCertificate') }, { v: 'ID Card', l: tTeacher('idCard') }, { v: 'Transcript', l: tTeacher('transcript') }, { v: 'Medical Record', l: tTeacher('medicalRecord') }, { v: 'Transfer Letter', l: tTeacher('transferLetter') }, { v: 'Photo', l: tTeacher('photo') }, { v: 'Other', l: tCommon('other') }].map((t) => <MenuItem key={t.v} value={t.v}>{t.l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={tTeacher('description')} size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button variant="outlined" component="label" sx={{ textTransform: 'none' }}>
              {file ? file.name : tTeacher('chooseFile')}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!file}>{tCommon('upload')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
