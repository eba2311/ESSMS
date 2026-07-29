import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert,
  Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, InputLabel, FormControl, MenuItem, Divider,
} from '@mui/material';
import {
  School, Group, Book, AccessTime, TrendingUp, EventNote,
  Assignment, CheckCircle, Schedule, Today, Assessment, CalendarMonth,
} from '@mui/icons-material';
import { AnnouncementWidget } from '../../components/AnnouncementWidget';
import { teachersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const MyTeacherDashboard = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ checkIn: '', checkOut: '', status: 'Present', notes: '' });
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    teachersAPI.my.dashboard().then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  }, []);

  const handleAttendance = async () => {
    try {
      await teachersAPI.my.attendance(attendanceForm);
      showSuccess(tTeacher('attendanceRecords'));
      setAttendanceDialog(false);
    } catch { showError(tTeacher('failedToLoad')); }
  };

  const handleLeaveRequest = async () => {
    try {
      await teachersAPI.leaves.request(data.teacher._id, leaveForm);
      showSuccess(tTeacher('requestLeave'));
      setLeaveDialog(false);
      setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
    } catch { showError(tTeacher('failedToLoad')); }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const stats = data.stats || {};
  const todaySchedule = Array.isArray(data.todaySchedule) ? data.todaySchedule : [];
  const recentAssessments = Array.isArray(data.recentAssessments) ? data.recentAssessments : [];
  const t = data.teacher;

  const statCards = [
    { label: tTeacher('subjects'), value: stats.totalSubjects, icon: <Book />, color: '#1B4F8A' },
    { label: tTeacher('sections'), value: stats.totalSections, icon: <Group />, color: '#C9920A' },
    { label: tTeacher('students'), value: stats.totalStudents, icon: <School />, color: '#2D7D3A' },
    { label: tTeacher('periodsWk'), value: stats.totalPeriods, icon: <AccessTime />, color: '#B45309' },
    { label: tTeacher('attendance'), value: `${stats.attendanceRate}%`, icon: <CheckCircle />, color: '#7C3AED' },
    { label: tTeacher('pendingMarks'), value: stats.pendingMarks, icon: <Assignment />, color: '#DC2626' },
  ];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tTeacher('myDashboard')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tTeacher('welcomeBack', { name: `${user?.firstName} ${user?.lastName}` })}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Chip label={t.position || tTeacher('subjectTeacher')} size="small" color="primary" sx={{ fontWeight: 600 }} />
          <Chip
            label={stats.workloadStatus}
            size="small"
            color={stats.workloadStatus === 'Normal' ? 'success' : stats.workloadStatus === 'Overloaded' ? 'error' : 'warning'}
            sx={{ fontWeight: 600 }}
          />
          <Button variant="outlined" size="small" startIcon={<EventNote />} onClick={() => setAttendanceDialog(true)} sx={{ borderRadius: 2 }}>
            {tTeacher('checkInOut')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.label}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, textAlign: 'center' }}>
              <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#111827' }}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
              <Today sx={{ fontSize: 20, color: '#C9920A' }} /> {tTeacher('todaySchedule')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {todaySchedule.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Schedule sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">{tTeacher('noClassesScheduledForToday')}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tTeacher('time')}</TableCell>
                      <TableCell>{tTeacher('subject')}</TableCell>
                      <TableCell>{tTeacher('section')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaySchedule.map((slot: any) => (
                      <TableRow key={slot._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace" fontSize="0.8rem">
                            {slot.startTime} - {slot.endTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C9920A' }} />
                            <Typography variant="body2">{slot.subject?.name || '—'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Grade ${slot.section?.grade || '—'} - ${slot.section?.name || '—'}`}
                            size="small" variant="outlined"
                            onClick={() => slot.section?._id && navigate(`/my-teacher/sections/${slot.section._id}/students`)}
                            sx={{ fontSize: '0.65rem', cursor: 'pointer' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
              <Assignment sx={{ fontSize: 20, color: '#C9920A' }} /> {tTeacher('recentAssessments')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {(!recentAssessments || recentAssessments.length === 0) ? (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">{tTeacher('noRecentAssessments')}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tTeacher('title')}</TableCell>
                      <TableCell>{tTeacher('subject')}</TableCell>
                      <TableCell>{tTeacher('section')}</TableCell>
                      <TableCell>{tTeacher('type')}</TableCell>
                      <TableCell>{tTeacher('status')}</TableCell>
                      <TableCell align="right">{tCommon('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAssessments.map((a: any) => (
                      <TableRow key={a._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                        </TableCell>
                        <TableCell>{a.subject?.name || '—'}</TableCell>
                        <TableCell>
                          <Chip label={`Grade ${a.section?.grade} - ${a.section?.name}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={a.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={a.status} size="small" color={a.status === 'Published' ? 'success' : a.status === 'Draft' ? 'warning' : 'info'} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => navigate(`/assessments/${a._id}/marks`)} sx={{ borderRadius: 1.5, fontSize: '0.7rem' }}>
                            {tTeacher('marks')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
              <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('myProfile')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', fontWeight: 700, fontSize: '1.2rem' }}>
                {t.fullName?.[0] || 'T'}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700}>{t.fullName}</Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{t.teacherId}</Typography>
              </Box>
            </Box>
            {[
              [tTeacher('employeeNumber'), t.employeeNumber],
              [tTeacher('position'), t.position],
              [tTeacher('status'), t.status],
              [tTeacher('workload'), `${stats.totalPeriods} ${tTeacher('periodsWk')} (${stats.workloadStatus})`],
            ].map(([label, value]) => (
              <Box key={String(label)} mb={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{String(label)}</Typography>
                <Typography variant="body2">{String(value)}</Typography>
              </Box>
            ))}
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1} display="flex" alignItems="center" gap={0.75}>
              <TrendingUp sx={{ fontSize: 18, color: '#C9920A' }} /> {tCommon('actions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" flexDirection="column" gap={1}>
              <Button variant="outlined" fullWidth startIcon={<Schedule />} onClick={() => navigate('/my-teacher/timetable')} sx={{ borderRadius: 2, justifyContent: 'flex-start' }}>
                {tTeacher('viewTimetable')}
              </Button>
              <Button variant="outlined" fullWidth startIcon={<Group />} onClick={() => navigate('/my-teacher/sections')} sx={{ borderRadius: 2, justifyContent: 'flex-start' }}>
                {tTeacher('mySections')}
              </Button>
              <Button variant="outlined" fullWidth startIcon={<Assignment />} onClick={() => navigate('/my-teacher/marks')} sx={{ borderRadius: 2, justifyContent: 'flex-start' }}>
                {tTeacher('enterMarks')}
              </Button>
              <Button variant="outlined" fullWidth startIcon={<Assessment />} onClick={() => navigate('/my-teacher/reports')} sx={{ borderRadius: 2, justifyContent: 'flex-start' }}>
                {tTeacher('viewReports')}
              </Button>
              <Button variant="outlined" fullWidth startIcon={<CalendarMonth />} onClick={() => setLeaveDialog(true)} sx={{ borderRadius: 2, justifyContent: 'flex-start' }}>
                {tTeacher('requestLeave')}
              </Button>
            </Box>
          </Paper>

          <Box mt={2.5}>
            <AnnouncementWidget limit={3} />
          </Box>
        </Grid>
      </Grid>

      <Dialog open={attendanceDialog} onClose={() => setAttendanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tTeacher('recordMyAttendance')}</DialogTitle>
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
