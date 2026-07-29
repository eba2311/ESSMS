import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert, Chip, Paper,
} from '@mui/material';
import { CheckCircle, Cancel, Schedule, TrendingUp, Warning } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const AttendanceDashboardPage = () => {
  const { t: tAttend } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const role = user?.role;
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chronicAbsentees, setChronicAbsentees] = useState<any[]>([]);

  useEffect(() => {
    attendanceAPI.todayDashboard()
      .then((r) => setToday(r.data.data))
      .catch(() => setError(tAttend('failedToLoadDashboard')))
      .finally(() => setLoading(false));
  }, []);

  const loadChronic = useCallback(() => {
    if (role === 'system_admin' || role === 'school_director' || role === 'academic_head') {
      attendanceAPI.chronicAbsentees({ limit: 5 }).then((r) => {
        setChronicAbsentees(r.data.data || []);
      }).catch(() => {});
    }
  }, [role]);

  useEffect(() => { loadChronic(); }, [loadChronic]);

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

  const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={0.5}>{tAttend('attendanceDashboard')}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{tAttend('overviewOfToday')}</Typography>

      {today && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <StatCard icon={<CheckCircle />} label={tAttend('presentToday')} value={today.presentCount || 0} color="#059669" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<Cancel />} label={tAttend('absentToday')} value={today.absentCount || 0} color="#DC2626" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<Schedule />} label={tAttend('lateToday')} value={today.lateCount || 0} color="#D97706" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<TrendingUp />} label={tAttend('presentRate')} value={today.presentRate != null ? `${today.presentRate}%` : '—'} color="#1B4F8A" />
          </Grid>
        </Grid>
      )}

      {!today && (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
          {tAttend('noAttendanceToday')}
        </Alert>
      )}

      {(role === 'system_admin' || role === 'school_director' || role === 'academic_head') && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                <Warning sx={{ fontSize: 18, color: '#D97706' }} /> {tAttend('quickActions')}
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Chip label={tAttend('viewSectionReports')} component="a" href="/attendance/reports" clickable variant="outlined" sx={{ justifyContent: 'flex-start', borderRadius: 2, py: 2, '& .MuiChip-label': { display: 'block', width: '100%' } }} />
                {(role === 'system_admin' || role === 'academic_head') && (
                  <Chip label={tAttend('manageCorrectionRequests')} component="a" href="/attendance/corrections" clickable variant="outlined" sx={{ justifyContent: 'flex-start', borderRadius: 2, py: 2, '& .MuiChip-label': { display: 'block', width: '100%' } }} />
                )}
                <Chip label={tAttend('markTodaysAttendance')} component="a" href="/attendance" clickable variant="outlined" sx={{ justifyContent: 'flex-start', borderRadius: 2, py: 2, '& .MuiChip-label': { display: 'block', width: '100%' } }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                <Warning sx={{ fontSize: 18, color: '#DC2626' }} /> {tAttend('chronicAbsentees')}
              </Typography>
              {chronicAbsentees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{tAttend('noChronicAbsentees')}</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {chronicAbsentees.slice(0, 5).map((s: any) => (
                    <Box key={s._id} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={600}>{s.fullName || s.name || tCommon('unknown')}</Typography>
                      <Chip label={`${s.absenceRate || 0}% ${tAttend('absent')}`} size="small" color="error" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
