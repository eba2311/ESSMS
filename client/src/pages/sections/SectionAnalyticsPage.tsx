import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, CircularProgress, Alert, Card, CardContent,
  Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  LinearProgress, Avatar, Divider, Button,
} from '@mui/material';
import {
  Group, School, Speed, Male, Female, TrendingUp, TrendingDown,
  Assignment, CalendarMonth, Person, ArrowBack,
} from '@mui/icons-material';
import { sectionsAPI } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SectionAnalyticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tSections } = useTranslation('sections');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    sectionsAPI.analytics(id)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || tSections('messages.failedToLoadAnalytics')))
      .finally(() => setLoading(false));
  }, [id, tSections]);

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress size={36} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!data) return <Alert severity="info" sx={{ m: 2 }}>{tSections('analytics.noData')}</Alert>;

  const overview = data.overview || {};
  const performance = data.performance || {};
  const attendance = data.attendance || {};
  const teachers = data.teachers || {};
  const section = data.section || {};

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button size="small" onClick={() => navigate(-1)} sx={{ minWidth: 'unset', p: 0.5 }}><ArrowBack /></Button>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">{tSections('analytics.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {section.name} — {tCommon('grade')} {section.grade} {section.stream} — {section.academicYear}
          </Typography>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{tCommon('students')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="#111827">{overview.totalStudents}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', width: 40, height: 40 }}><Group /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{tSections('analytics.male')}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Male sx={{ fontSize: 16, color: '#3B82F6' }} />
                    <Typography variant="h5" fontWeight={800} color="#111827">{overview.maleStudents}</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{tSections('analytics.female')}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Female sx={{ fontSize: 16, color: '#EC4899' }} />
                    <Typography variant="h5" fontWeight={800} color="#111827">{overview.femaleStudents}</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{tCommon('capacity')}</Typography>
                <Typography variant="h5" fontWeight={800} color="#111827">{overview.capacity}</Typography>
                <LinearProgress variant="determinate" value={Math.min(overview.capacityUtilization, 100)} sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: overview.capacityUtilization > 90 ? '#EF4444' : overview.capacityUtilization > 75 ? '#F59E0B' : '#10B981' } }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{tSections('analytics.utilization')}</Typography>
                <Typography variant="h5" fontWeight={800} color={overview.capacityUtilization > 90 ? '#EF4444' : '#F59E0B'}>{overview.capacityUtilization}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{tSections('reports.assessments')}</Typography>
                <Typography variant="h5" fontWeight={800} color="#111827">{performance.totalAssessments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)', p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tSections('analytics.performanceOverview')}</Typography>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'rgba(59,130,246,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{tSections('profile.sectionAverage')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="#3B82F6">{performance.sectionAverage}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{tSections('analytics.top10Avg')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="#10B981">
                    {performance.topPerformers?.length > 0
                      ? `${Math.round(performance.topPerformers.reduce((s: number, p: any) => s + p.average, 0) / performance.topPerformers.length)}%`
                      : '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'rgba(139,92,246,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{tSections('analytics.passRate')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="#8B5CF6">
                    {performance.distribution
                      ? `${Math.round(((performance.distribution.excellent + performance.distribution.good + performance.distribution.satisfactory) / Math.max(1,
                        performance.distribution.excellent + performance.distribution.good + performance.distribution.satisfactory + performance.distribution.needsImprovement + performance.distribution.poor)) * 100)}%`
                      : '—'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Distribution */}
            <Typography variant="body2" fontWeight={600} mb={1}>{tSections('analytics.gradeDistribution')}</Typography>
            <Box display="flex" gap={1} mb={2}>
              {[
                { label: tSections('analytics.excellent'), count: performance.distribution?.excellent || 0, color: '#10B981' },
                { label: tSections('analytics.good'), count: performance.distribution?.good || 0, color: '#3B82F6' },
                { label: tSections('analytics.satisfactory'), count: performance.distribution?.satisfactory || 0, color: '#F59E0B' },
                { label: tSections('analytics.needsImprovement'), count: performance.distribution?.needsImprovement || 0, color: '#F97316' },
                { label: tSections('analytics.poor'), count: performance.distribution?.poor || 0, color: '#EF4444' },
              ].map((d) => (
                <Chip key={d.label} label={`${d.label}: ${d.count}`} size="small" sx={{ bgcolor: `${d.color}15`, color: d.color, fontWeight: 600 }} />
              ))}
            </Box>

            {/* Top Performers */}
            {performance.topPerformers?.length > 0 && (
              <>
                <Typography variant="body2" fontWeight={600} mb={1}>{tSections('analytics.top10Students')}</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.name')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{tSections('analytics.average')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.topPerformers.map((s: any, i: number) => (
                        <TableRow key={s.studentId} hover>
                          <TableCell>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: i < 3 ? '#F59E0B' : 'rgba(59,130,246,0.1)', color: i < 3 ? '#fff' : '#3B82F6' }}>{i + 1}</Avatar>
                          </TableCell>
                          <TableCell>{s.firstName} {s.lastName}</TableCell>
                          <TableCell align="right">
                            <Chip label={`${s.average}%`} size="small" color={s.average >= 90 ? 'success' : s.average >= 75 ? 'primary' : 'warning'} variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>

          {/* Subject Performance */}
          {performance.subjectPerformance?.length > 0 && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tSections('analytics.subjectPerformance')}</Typography>
              {performance.subjectPerformance.map((subj: any) => (
                <Box key={subj.subjectId} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>{subj.subjectName}</Typography>
                    <Typography variant="body2" fontWeight={700} color={subj.average >= 75 ? '#10B981' : subj.average >= 50 ? '#F59E0B' : '#EF4444'}>{subj.average}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(subj.average, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: subj.average >= 75 ? '#10B981' : subj.average >= 50 ? '#F59E0B' : '#EF4444' } }} />
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Attendance and Info Section */}
        <Grid item xs={12} md={5}>
          {/* Attendance */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)', p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              <CalendarMonth sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              {tSections('analytics.attendanceAnalytics')}
            </Typography>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Box textAlign="center" p={1} sx={{ bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="#10B981">{attendance.attendanceRate}%</Typography>
                  <Typography variant="caption" color="text.secondary">{tSections('analytics.overallRate')}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" p={1} sx={{ bgcolor: 'rgba(239,68,68,0.05)', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="#EF4444">{attendance.absentCount}</Typography>
                  <Typography variant="caption" color="text.secondary">{tSections('analytics.totalAbsences')}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="space-around" mb={2}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight={700} color="#10B981">{attendance.presentCount}</Typography>
                <Typography variant="caption" color="text.secondary">{tSections('profile.present')}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight={700} color="#EF4444">{attendance.absentCount}</Typography>
                <Typography variant="caption" color="text.secondary">{tSections('profile.absent')}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight={700} color="#F59E0B">{attendance.lateCount}</Typography>
                <Typography variant="caption" color="text.secondary">{tSections('reports.late')}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" fontWeight={600} mb={1}>{tSections('analytics.monthlyAttendanceTrend')}</Typography>
            {attendance.monthlyTrend?.map((m: any) => (
              <Box key={m.month} display="flex" alignItems="center" gap={1} mb={0.75}>
                <Typography variant="caption" sx={{ minWidth: 30, fontWeight: 600 }}>{m.month}</Typography>
                <LinearProgress variant="determinate" value={m.rate} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: m.rate >= 90 ? '#10B981' : m.rate >= 75 ? '#F59E0B' : '#EF4444' } }} />
                <Typography variant="caption" fontWeight={600} sx={{ minWidth: 35, textAlign: 'right' }}>{m.rate}%</Typography>
              </Box>
            ))}
          </Paper>

          {/* Teacher Info */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              <Assignment sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              {tSections('analytics.teacherInformation')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Assignment sx={{ color: '#6B7280', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">{tSections('analytics.subjectTeacherAssignments')}</Typography>
                <Typography variant="body2" fontWeight={600}>{teachers.totalAssignments} {tSections('reports.assignments').toLowerCase()}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
