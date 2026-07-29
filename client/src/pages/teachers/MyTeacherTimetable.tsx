import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert, Grid, Avatar, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
} from '@mui/material';
import { ArrowBack, Schedule, School } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export const MyTeacherTimetable = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teachersAPI.my.timetable().then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const timetable = data.timetable || {};
  const totalPeriods = data.totalPeriods || 0;
  const workloadStatus = data.workloadStatus || '';
  const assignments = Array.isArray(data.assignments) ? data.assignments : [];
  const t = data.teacher;

  const getSlotForDayHour = (day: string, hour: string) => {
    const slots = timetable[day] || [];
    return slots.find((s: any) => s.startTime === hour);
  };

  const isCurrentDay = (day: string) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[new Date().getDay()] === day;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-teacher/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tTeacher('myTimetableTitle')}</Typography>
        <Chip
          label={`${totalPeriods} ${tTeacher('periodsWk')}`}
          size="small"
          color={workloadStatus === 'Overloaded' ? 'error' : workloadStatus === 'Underloaded' ? 'warning' : 'success'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, mb: 3, overflow: 'auto' }}>
        <Box sx={{ minWidth: 900 }}>
          <Grid container>
            <Grid item xs={1.5}>
              <Box sx={{ p: 1, borderBottom: '1px solid #E5E7EB', height: 48, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">{tTeacher('time')}</Typography>
              </Box>
              {HOURS.map((hour) => (
                <Box key={hour} sx={{ p: 1, height: 72, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" fontFamily="monospace" fontWeight={600} color="text.secondary">{hour}</Typography>
                </Box>
              ))}
            </Grid>
            {DAYS.map((day) => (
              <Grid item xs key={day}>
                <Box sx={{
                  p: 1, borderBottom: '1px solid #E5E7EB', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isCurrentDay(day) ? 'rgba(27,79,138,0.06)' : 'transparent',
                }}>
                  <Typography variant="caption" fontWeight={700} color={isCurrentDay(day) ? '#1B4F8A' : 'text.secondary'}>
                    {day}
                  </Typography>
                </Box>
                {HOURS.map((hour) => {
                  const slot = getSlotForDayHour(day, hour);
                  return (
                    <Box key={hour} sx={{
                      height: 72, borderBottom: '1px solid #F1F5F9', p: 0.5,
                      bgcolor: isCurrentDay(day) ? 'rgba(27,79,138,0.03)' : 'transparent',
                    }}>
                      {slot ? (
                        <Box sx={{
                          bgcolor: 'rgba(27,79,138,0.08)', borderRadius: 1.5, p: 0.75, height: '100%',
                          borderLeft: '3px solid #C9920A',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        }}>
                          <Typography variant="caption" fontWeight={700} fontSize="0.7rem" noWrap>
                            {slot.subject?.shortName || slot.subject?.name}
                          </Typography>
                          <Typography variant="caption" fontSize="0.6rem" color="text.secondary" noWrap>
                            G{slot.section?.grade}-{slot.section?.name}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
              <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('teachingAssignments')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tTeacher('subject')}</TableCell>
                    <TableCell>{tTeacher('section')}</TableCell>
                    <TableCell>{tTeacher('periodsWeek')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.subject?.name || '—'}</TableCell>
                      <TableCell>{a.section?.name ? `Grade ${a.section.grade} - ${a.section.name}` : '—'}</TableCell>
                      <TableCell>{a.periodsPerWeek || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
              <Schedule sx={{ fontSize: 18, color: '#C9920A' }} /> {tTeacher('workloadSummary')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" gap={3} flexWrap="wrap">
              {[
                [tTeacher('totalPeriodsWeek'), totalPeriods],
                [tTeacher('totalSections'), [...new Set(assignments.map((a: any) => a.section?._id?.toString()))].length],
                [tTeacher('totalSubjects'), [...new Set(assignments.map((a: any) => a.subject?._id?.toString()))].length],
                [tTeacher('status'), workloadStatus],
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
    </Box>
  );
};
