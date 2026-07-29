import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  Tabs, Tab, Divider, Grid,
} from '@mui/material';
import {
  ArrowBack, Assignment, School, TrendingUp, EventNote,
  Book, Group, CheckCircle, Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

export const MyTeacherReports = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  const reportTypes = [
    { label: tTeacher('subjectAssignment'), value: 'subject-assignment' },
    { label: tTeacher('workload'), value: 'workload' },
    { label: tTeacher('attendance'), value: 'attendance' },
    { label: tTeacher('academicPerformance'), value: 'academic-performance' },
  ];

  const loadReport = async (type: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await teachersAPI.my.reports(type);
      setData(r.data.data);
    } catch {
      setError(tTeacher('failedToLoad'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: any, v: number) => {
    setTab(v);
    loadReport(reportTypes[v].value);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-teacher/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tTeacher('myReports')}</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {reportTypes.map((r, i) => <Tab key={i} label={r.label} />)}
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>}

      {!loading && !data && !error && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tTeacher('selectReportType')}</Typography>
        </Paper>
      )}

      {data && tab === 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('subjectAssignmentReport')}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" mb={2}>{tTeacher('teacherLabel')}: {data.teacher?.name}</Typography>
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
                {data.assignments?.map((a: any) => (
                  <TableRow key={a._id}>
                    <TableCell>{a.subject?.name || '—'} ({a.subject?.code || '—'})</TableCell>
                    <TableCell>{tCommon('grade')} {a.section?.grade || '—'} - {a.section?.name || '—'}</TableCell>
                    <TableCell>{a.periodsPerWeek || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {data && tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('workloadReport')}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" gap={4} flexWrap="wrap" mb={3}>
                {[
                  [tTeacher('subjects'), data.totalSubjects],
                  [tTeacher('sections'), data.totalSections],
                  [tTeacher('students'), data.totalStudents],
                  [tTeacher('periodsWeek'), data.totalPeriods],
                ].map(([label, value]) => (
                  <Box key={String(label)} textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="#1B4F8A">{String(value)}</Typography>
                    <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                  </Box>
                ))}
                <Box textAlign="center">
                  <Chip label={data.status} color={data.status === 'Normal' ? 'success' : data.status === 'Overloaded' ? 'error' : 'warning'} sx={{ fontWeight: 600 }} />
                  <Typography variant="caption" display="block" color="text.secondary">{tTeacher('status')}</Typography>
                </Box>
              </Box>
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
                    {data.assignments?.map((a: any) => (
                      <TableRow key={a._id}>
                        <TableCell>{a.subject?.name || '—'}</TableCell>
                        <TableCell>{tCommon('grade')} {a.section?.grade} - {a.section?.name}</TableCell>
                        <TableCell>{a.periodsPerWeek}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {data && tab === 2 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('attendanceReport')}</Typography>
          <Divider sx={{ mb: 2 }} />
          {data.summary && (
            <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
              {[
                [tTeacher('totalDays'), data.summary.totalDays],
                [tTeacher('presentDays'), data.summary.presentDays],
                [tTeacher('lateDays'), data.summary.lateDays],
                [tTeacher('absentDays'), data.summary.absentDays],
                [tTeacher('leaveDays'), data.summary.leaveDays],
                [tTeacher('rate'), `${data.summary.attendanceRate}%`],
              ].map(([label, value]) => (
                <Box key={String(label)} textAlign="center">
                  <Typography variant="h4" fontWeight={700} color="#1B4F8A">{String(value)}</Typography>
                  <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                </Box>
              ))}
            </Box>
          )}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tTeacher('status')}</TableCell>
                  <TableCell>{tTeacher('checkIn')}</TableCell>
                  <TableCell>{tTeacher('checkOut')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.records?.map((r: any) => (
                  <TableRow key={r._id}>
                    <TableCell>{r.date?.split('T')[0]}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'error'} sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell>{r.checkIn || '—'}</TableCell>
                    <TableCell>{r.checkOut || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {data && tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tTeacher('academicPerformanceReport')}</Typography>
              <Divider sx={{ mb: 2 }} />
              {data.overall && (
                <Box display="flex" gap={4} flexWrap="wrap" mb={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="#1B4F8A">{data.overall.totalAssessments}</Typography>
                    <Typography variant="caption" color="text.secondary">{tTeacher('assessmentsCount')}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="#1B4F8A">{data.overall.totalMarks}</Typography>
                    <Typography variant="caption" color="text.secondary">{tTeacher('marksEntered')}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color={data.overall.passRate >= 50 ? '#2D7D3A' : '#DC2626'}>{data.overall.passRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">{tTeacher('passRate')}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color={data.overall.failureRate >= 50 ? '#DC2626' : '#2D7D3A'}>{data.overall.failureRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">{tTeacher('failureRate')}</Typography>
                  </Box>
                </Box>
              )}
              <Typography variant="subtitle2" fontWeight={600} mb={1}>{tTeacher('subjectAverages')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tTeacher('subject')}</TableCell>
                      <TableCell align="right">{tTeacher('average')}</TableCell>
                      <TableCell align="right">{tTeacher('passRate')}</TableCell>
                      <TableCell align="right">{tTeacher('students')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subjectAverages?.map((sa: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{sa.subject?.name || '—'}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${sa.average}%`} size="small" color={sa.average >= 70 ? 'success' : sa.average >= 50 ? 'warning' : 'error'} sx={{ fontSize: '0.65rem', minWidth: 50 }} />
                        </TableCell>
                        <TableCell align="right">{sa.passRate}%</TableCell>
                        <TableCell align="right">{sa.totalStudents}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
