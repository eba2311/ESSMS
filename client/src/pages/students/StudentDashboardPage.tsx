import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  School,
  EmojiEvents,
  EventNote,
  CalendarToday,
  TrendingUp,
  ArrowForward,
  Book,
  CheckCircle,
  Cancel,
  Description,
  Star,
  Grade,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentsAPI, attendanceAPI, rankingsAPI } from '../../services/api';
import { AnnouncementWidget } from '../../components/AnnouncementWidget';

export const StudentDashboardPage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      assessmentsAPI.myGrades().catch(() => ({ data: { data: [] } })),
      attendanceAPI.myAttendance().catch(() => ({ data: { data: [] } })),
      rankingsAPI.myRanking().catch(() => ({ data: { data: null } })),
    ])
      .then(([gRes, aRes, rRes]) => {
        setGrades(gRes.data.data || []);
        setAttendance(aRes.data.data?.records || []);
        setRanking(rRes.data.data);
      })
      .catch(() => setError(tStudent('failedToLoadStudent')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const presentCount = attendance.filter((a: any) => a.status === 'Present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const average = ranking?.gpa || 0;
  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', width: 52, height: 52 }}>
          <School sx={{ fontSize: 28 }} />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tStudent('myDashboard')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.firstName} {user?.lastName} — {user?.userId}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <EmojiEvents sx={{ fontSize: 32, color: '#C9920A', mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{ranking?.rank || '—'}</Typography>
            <Typography variant="caption" color="text.muted">{tStudent('classRank')}</Typography>
            {ranking?.totalStudents && (
              <Typography variant="caption" display="block" color="text.muted">
                {tStudent('ofTotal', { count: ranking.totalStudents })}
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <Star sx={{ fontSize: 32, color: getAvgColor(average), mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{average || '—'}</Typography>
            <Typography variant="caption" color="text.muted">{tCommon('average')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <EventNote sx={{ fontSize: 32, color: '#2D7D3A', mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{attendanceRate}%</Typography>
            <Typography variant="caption" color="text.muted">{tStudent('myAttendance')}</Typography>
            <LinearProgress
              variant="determinate"
              value={attendanceRate}
              sx={{ mt: 1, mx: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(229,231,235,0.6)', '& .MuiLinearProgress-bar': { bgcolor: '#2D7D3A' } }}
            />
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <Book sx={{ fontSize: 32, color: '#7C3AED', mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{grades.length}</Typography>
            <Typography variant="caption" color="text.muted">{tStudent('assessments')}</Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
                {tStudent('recentAssessments')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/my-grades')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {tStudent('viewAll')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {grades.length === 0 ? (
              <Typography color="text.muted" py={2}>{tStudent('noAssessmentsYet')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tStudent('section')}</TableCell>
                      <TableCell>{tCommon('type')}</TableCell>
                      <TableCell align="right">{tCommon('mark') || 'Score'}</TableCell>
                      <TableCell align="right">{tCommon('average')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grades.slice(0, 5).map((g: any, i: number) => {
                      const score = g.marksObtained ?? g.score ?? 0;
                      const max = g.assessment?.totalMarks ?? g.totalMarks ?? 100;
                      const pct = max > 0 ? Math.round((score / max) * 100) : 0;
                      return (
                        <TableRow key={g._id || i}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{g.assessment?.subject?.name || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={g.assessment?.type || g.type} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.06)', color: '#6B7280' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace">{score}/{max}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1.25,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: `${getAvgColor(pct)}15`,
                                color: getAvgColor(pct),
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {pct}%
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
                {tStudent('recentAttendance')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/my-attendance')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {tStudent('viewAll')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {attendance.length === 0 ? (
              <Typography color="text.muted" py={2}>{tStudent('noAttendanceYet')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('date')}</TableCell>
                      <TableCell>{tStudent('status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.slice(0, 5).map((a: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Typography variant="body2">{a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={a.status === 'Present' ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                            label={a.status || 'N/A'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              bgcolor: a.status === 'Present' ? 'rgba(45,125,58,0.12)' : a.status === 'Absent' ? 'rgba(181,37,26,0.12)' : 'rgba(201,146,10,0.12)',
                              color: a.status === 'Present' ? '#2D7D3A' : a.status === 'Absent' ? '#B5251A' : '#C9920A',
                            }}
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
          <AnnouncementWidget limit={3} />
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('quickActions')}
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: tStudent('viewProfile'), path: '/my-profile', icon: <School /> },
                { label: tStudent('myTimetable'), path: '/my-timetable', icon: <CalendarToday /> },
                { label: tStudent('myGrades'), path: '/my-grades', icon: <Grade /> },
                { label: tStudent('myAttendance'), path: '/my-attendance', icon: <EventNote /> },
                { label: tStudent('reportCard'), path: '/reports/report-cards', icon: <Description /> },
                { label: tStudent('rankings'), path: '/rankings', icon: <EmojiEvents /> },
              ].map((item) => (
                <Grid item xs={6} sm={3} key={item.label}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    sx={{ py: 1.25, borderRadius: 2, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#1B4F8A', color: '#1B4F8A', bgcolor: 'rgba(27,79,138,0.04)' } }}
                  >
                    {item.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
