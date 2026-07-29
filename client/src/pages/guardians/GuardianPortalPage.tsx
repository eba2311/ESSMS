import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, CircularProgress,
  Button, Avatar, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert,
} from '@mui/material';
import {
  School, Grade,
  CheckCircle, Book, Description, EventNote,
} from '@mui/icons-material';
import { guardiansAPI, assessmentsAPI, attendanceAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const GuardianPortalPage = () => {
  const { t: tGuard } = useTranslation('guardians');
  const navigate = useNavigate();
  const [guardian, setGuardian] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, any[]>>({});
  const [attendanceMap, setAttendanceMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await guardiansAPI.me.get();
        const g = res.data.data;
        setGuardian(g);
        const kids = g?.students || [];
        setStudents(kids);

        if (kids.length > 0) {
          try {
            const [marksRes, attRes] = await Promise.all([
              assessmentsAPI.myChildrenMarks().catch(() => ({ data: { data: [] } })),
              attendanceAPI.myChildrenAttendance().catch(() => ({ data: { data: [] } })),
            ]);
            const marksList = marksRes.data.data || [];
            const attList = attRes.data.data || [];

            const mM: Record<string, any[]> = {};
            const aM: Record<string, any[]> = {};
            for (const child of kids) {
              mM[child._id] = marksList.filter((m: any) =>
                m.student === child._id || m.studentId === child._id || m.student?._id === child._id
              );
              aM[child._id] = attList.filter((a: any) =>
                a.student === child._id || a.studentId === child._id || a.student?._id === child._id
              );
            }
            setMarksMap(mM);
            setAttendanceMap(aM);
          } catch { /* non-critical */ }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || tGuard('failedToLoad'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>{tGuard('pageTitle')}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <School sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">{tGuard('noChildren')}</Typography>
          <Typography variant="caption" color="text.secondary">{tGuard('contactRegistrar')}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {students.map(child => {
            const childMarks = marksMap[child._id] || [];
            const childAtt = attendanceMap[child._id] || [];
            const pct = (score: number, max: number) => max > 0 ? Math.round((score / max) * 100) : 0;
            const present = childAtt.filter((a: any) => a.status === 'Present').length;
            const attRate = childAtt.length > 0 ? Math.round((present / childAtt.length) * 100) : 0;

            return (
              <Grid item xs={12} key={child._id}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', fontSize: 24 }}>
                        {child.firstName?.[0]}{child.lastName?.[0]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight={600}>{child.firstName} {child.lastName}</Typography>
                        <Typography variant="body2" color="text.secondary">{child.studentId}</Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          {child.grade && <Chip label={`${tGuard('grade')} ${child.grade}`} size="small" />}
                          {child.section?.name && <Chip label={child.section.name} size="small" variant="outlined" />}
                          <Chip label={child.status} size="small" color={child.status === 'Active' ? 'success' : 'default'} />
                        </Box>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(27,79,138,0.04)', textAlign: 'center' }}>
                          <Grade sx={{ fontSize: 24, color: '#1B4F8A', mb: 0.5 }} />
                          <Typography variant="h4" fontWeight={800}>{childMarks.length}</Typography>
                          <Typography variant="caption" color="text.secondary">{tGuard('assessments')}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(45,125,58,0.04)', textAlign: 'center' }}>
                          <CheckCircle sx={{ fontSize: 24, color: '#2D7D3A', mb: 0.5 }} />
                          <Typography variant="h4" fontWeight={800}>{attRate}%</Typography>
                          <Typography variant="caption" color="text.secondary">{tGuard('attendance')}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(124,58,237,0.04)', textAlign: 'center' }}>
                          <Book sx={{ fontSize: 24, color: '#7C3AED', mb: 0.5 }} />
                          <Typography variant="h4" fontWeight={800}>{child.grade || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{tGuard('grade')}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    {childMarks.length > 0 && (
                      <TableContainer component={Paper} elevation={0} sx={{ mt: 2, border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{tGuard('colSubject')}</TableCell>
                              <TableCell>{tGuard('colType')}</TableCell>
                              <TableCell align="right">{tGuard('colScore')}</TableCell>
                              <TableCell align="right">%</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {childMarks.slice(0, 5).map((m: any, i: number) => {
                              const score = m.marksObtained ?? m.score ?? 0;
                              const max = m.assessment?.totalMarks ?? m.totalMarks ?? 100;
                              return (
                                <TableRow key={m._id || i}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{m.assessment?.subject?.name || m.subjectName || 'N/A'}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={m.assessment?.type || m.type} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.06)', color: '#6B7280' }} />
                                  </TableCell>
                                  <TableCell align="right"><Typography variant="body2" fontFamily="monospace">{score}/{max}</Typography></TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, bgcolor: `${getAvgColor(pct(score, max))}15`, color: getAvgColor(pct(score, max)), fontWeight: 700, fontSize: '0.8rem' }}>
                                      {pct(score, max)}%
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    <Box display="flex" gap={1} mt={2}>
                      <Button variant="outlined" size="small" startIcon={<Description />} onClick={() => navigate(`/assessments/report-card/${child._id}`)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {tGuard('reportCard')}
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<Grade />} onClick={() => navigate(`/my-dashboard`)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {tGuard('grades')}
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<EventNote />} onClick={() => navigate(`/attendance?studentId=${child._id}`)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                        {tGuard('attendance')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};
