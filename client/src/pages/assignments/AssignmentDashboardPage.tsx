import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  School, Group, Person, TrendingUp, Warning, CheckCircle,
  People, Assignment,
} from '@mui/icons-material';
import { assignmentsAPI } from '../../services/api';

export const AssignmentDashboardPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    assignmentsAPI.dashboard().then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tCommon('failedToLoad')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const students = data.students || {};
  const sections = data.sections || {};
  const teachers = data.teachers || {};
  const enrollment = data.enrollment || {};

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={0.5}>
        {tAssign('dashboard')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {tAssign('dashboardSubtitle')}
      </Typography>

      <Grid container spacing={2.5} mb={3}>
        {[
          { label: tAssign('totalStudents'), value: students.total, icon: <School />, color: '#1B4F8A', sub: `${students.assigned} ${tCommon('assigned')}` },
          { label: tAssign('unassigned'), value: students.unassigned, icon: <Warning />, color: students.unassigned > 0 ? '#DC2626' : '#2D7D3A', sub: `${students.assignmentRate}% ${tCommon('rate')}` },
          { label: tAssign('sections'), value: sections.total, icon: <Group />, color: '#C9920A', sub: `${sections.full} ${tAssign('full')}` },
          { label: tAssign('capacity'), value: `${enrollment.utilization}%`, icon: <TrendingUp />, color: '#7C3AED', sub: `${enrollment.total}/${enrollment.capacity}` },
          { label: tAssign('teachers'), value: teachers.total, icon: <Person />, color: '#B45309', sub: `${teachers.assigned} ${tCommon('assigned')}` },
          { label: tAssign('overloaded'), value: teachers.overloaded, icon: <Warning />, color: teachers.overloaded > 0 ? '#DC2626' : '#2D7D3A', sub: `${teachers.assignmentRate}% ${tCommon('rate')}` },
        ].map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.label}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, textAlign: 'center' }}>
              <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
              <Typography variant="h5" fontWeight={800}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              <Typography variant="caption" display="block" color="text.secondary" fontSize="0.6rem">{card.sub}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Student Assignment Stats */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
              <School sx={{ fontSize: 18, color: '#C9920A' }} /> {tAssign('studentAssignment')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[
                [tAssign('totalStudents'), students.total],
                [tCommon('assigned'), students.assigned],
                [tAssign('unassigned'), students.unassigned],
                [tAssign('assignmentRate'), `${students.assignmentRate}%`],
              ].map(([label, value]) => (
                <Box key={String(label)} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{String(label)}</Typography>
                  <Typography variant="body2" fontWeight={700}>{String(value)}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Section Stats */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
              <Group sx={{ fontSize: 18, color: '#C9920A' }} /> {tAssign('sectionStatistics')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[
                [tAssign('totalSections'), sections.total],
                [tAssign('fullSections'), sections.full],
                [tAssign('availableSeats'), sections.availableSeats],
                [tAssign('utilization'), `${sections.utilization}%`],
              ].map(([label, value]) => (
                <Box key={String(label)} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{String(label)}</Typography>
                  <Typography variant="body2" fontWeight={700}>{String(value)}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Teacher Assignment Stats */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.75}>
              <Person sx={{ fontSize: 18, color: '#C9920A' }} /> {tAssign('teacherAssignment')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[
                [tAssign('totalTeachers'), teachers.total],
                [tCommon('assigned'), teachers.assigned],
                [tAssign('unassigned'), teachers.unassigned],
                [tAssign('overloaded'), teachers.overloaded],
              ].map(([label, value]) => (
                <Box key={String(label)} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{String(label)}</Typography>
                  <Typography variant="body2" fontWeight={700}>{String(value)}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Enrollment by Grade */}
        {(enrollment.byGrade || []).length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('enrollmentByGrade')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('grade')}</TableCell>
                      <TableCell align="right">{tAssign('students')}</TableCell>
                      <TableCell align="right">{tAssign('sections')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollment.byGrade.map((g: any) => {
                      const sec = (sections.byGrade || []).find((sg: any) => sg._id === g._id);
                      return (
                        <TableRow key={g._id}>
                          <TableCell><Typography fontWeight={600}>{tCommon('grade')} {g._id}</Typography></TableCell>
                          <TableCell align="right">{g.count}</TableCell>
                          <TableCell align="right">{sec?.count || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
