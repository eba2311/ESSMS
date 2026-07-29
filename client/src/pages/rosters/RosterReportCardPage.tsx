import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Divider, Grid, LinearProgress,
} from '@mui/material';
import { Download, Print, ArrowBack, School, PictureAsPdf } from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { studentsAPI } from '../../services/api';

export const RosterReportCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportCard, setReportCard] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
  const [academicYear, setAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );

  useEffect(() => {
    if (isStudentOrParent) {
      studentsAPI.me.get().then((res) => {
        const student = res.data.data;
        setSelectedStudentId(student.studentId || student._id);
      }).catch(() => setError(tRoster('reportCard.failedToLoadStudent')));
    } else {
      fetchStudents();
    }
  }, [academicYear]);

  useEffect(() => {
    if (selectedStudentId) fetchReportCard();
  }, [selectedStudentId, academicYear]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await rosterAPI.getAnnualRoster({ academicYear });
      setStudents(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await rosterAPI.getReportCard({ studentId: selectedStudentId, academicYear });
      setReportCard(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report card');
      setReportCard(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'F') return 'error';
    if (grade?.startsWith('A')) return 'success';
    return 'default';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h4" fontWeight="bold" color="primary">{tRoster('reportCard.title')}</Typography>
      </Box>

      {/* Selection Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }} className="no-print">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={isStudentOrParent ? 6 : 4}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('academicYear')}</InputLabel>
              <Select value={academicYear} label={tCommon('academicYear')} onChange={(e) => setAcademicYear(e.target.value)}>
                {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {!isStudentOrParent && (
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel>{tRoster('reportCard.selectStudent')}</InputLabel>
                <Select value={selectedStudentId} label={tRoster('reportCard.selectStudent')} onChange={(e) => setSelectedStudentId(e.target.value)}>
                  <MenuItem value="">{tRoster('reportCard.chooseStudent')}</MenuItem>
                  {students.map((s: any) => (
                    <MenuItem key={s.studentId} value={s.studentId}>
                      {s.fullName} — {s.section} ({tCommon('grade')} {s.grade})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} sm={isStudentOrParent ? 6 : 3}>
            <Button variant="outlined" onClick={() => window.print()} fullWidth size="small" startIcon={<Print />} sx={{ borderRadius: 2 }}>
              {tRoster('reportCard.printReportCard')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}

      {/* Report Card */}
      {!loading && reportCard && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: 900, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            {/* School Header */}
            <Box textAlign="center" mb={3}>
              <School sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={800} color="primary">{reportCard.school?.name || 'School Name'}</Typography>
              {reportCard.school?.address && (
                <Typography variant="body2" color="text.secondary">{reportCard.school.address}</Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h5" fontWeight={700}>{tRoster('reportCard.printTitle')}</Typography>
              <Typography variant="body1" color="text.secondary">{tCommon('academicYear')}: {academicYear}</Typography>
            </Box>

            {/* Student Info */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'rgba(59,130,246,0.03)', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">{tCommon('studentName')}</Typography>
                  <Typography fontWeight={700}>{reportCard.student?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">{tCommon('studentId')}</Typography>
                  <Typography fontWeight={700}>{reportCard.student?.id}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">{tCommon('grade')}</Typography>
                  <Typography fontWeight={700}>{reportCard.student?.grade}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">{tCommon('section')}</Typography>
                  <Typography fontWeight={700}>{reportCard.student?.section} ({reportCard.student?.stream || tCommon('common')})</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">{tCommon('gender')}</Typography>
                  <Typography fontWeight={700}>{reportCard.student?.gender}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Semester 1 */}
            <Typography variant="h6" fontWeight={700} color="primary" mb={1} mt={2}>{tRoster('semester.semester1')}</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell><b>{tCommon('subject')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('reportCard.code')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('mark')}</b></TableCell>
                    <TableCell sx={{ width: '40%' }}><b>{tRoster('reportCard.percentage')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('grade')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportCard.semester1?.marks?.map((m: any, i: number) => {
                    const markVal = Number(m.mark) || 0;
                    const barColor = markVal >= 80 ? '#10B981' : markVal >= 60 ? '#3B82F6' : markVal >= 50 ? '#F59E0B' : '#EF4444';
                    return (
                      <TableRow key={i}>
                        <TableCell><Typography fontWeight={500}>{m.subject}</Typography></TableCell>
                        <TableCell align="center">{m.code || '—'}</TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} sx={{ color: barColor }}>{m.mark}%</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%', position: 'relative' }}>
                            <LinearProgress
                              variant="determinate"
                              value={markVal}
                              sx={{
                                height: 14,
                                borderRadius: 7,
                                bgcolor: 'rgba(0,0,0,0.06)',
                                '& .MuiLinearProgress-bar': { borderRadius: 7, bgcolor: barColor },
                              }}
                            />
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: markVal >= 50 ? 'rgba(0,0,0,0.7)' : '#fff', textShadow: markVal < 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none' }}>
                                {markVal}/100
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} color={getGradeColor(m.grade) + '.main'}>{m.grade}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!reportCard.semester1?.marks || reportCard.semester1.marks.length === 0) && (
                    <TableRow><TableCell colSpan={5} align="center">{tRoster('reportCard.noMarksAvailable')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" gap={3} mb={2} flexWrap="wrap">
              <Chip label={`${tCommon('average')}: ${reportCard.semester1?.average ?? '—'}%`} color="primary" variant="outlined" />
              <Chip label={`${tRoster('studentResults.total')}: ${reportCard.semester1?.total ?? '—'}`} variant="outlined" />
              <Chip label={`${tRoster('studentResults.secRank')}: #${reportCard.semester1?.sectionRank ?? '—'}`} variant="outlined" />
              <Chip label={`${tCommon('result')}: ${reportCard.semester1?.result ?? '—'}`}
                color={reportCard.semester1?.result === 'Fail' ? 'error' : 'success'} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Semester 2 */}
            <Typography variant="h6" fontWeight={700} color="secondary" mb={1}>{tRoster('semester.semester2')}</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell><b>{tCommon('subject')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('reportCard.code')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('mark')}</b></TableCell>
                    <TableCell sx={{ width: '40%' }}><b>{tRoster('reportCard.percentage')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('grade')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportCard.semester2?.marks?.map((m: any, i: number) => {
                    const markVal = Number(m.mark) || 0;
                    const barColor = markVal >= 80 ? '#10B981' : markVal >= 60 ? '#3B82F6' : markVal >= 50 ? '#F59E0B' : '#EF4444';
                    return (
                      <TableRow key={i}>
                        <TableCell><Typography fontWeight={500}>{m.subject}</Typography></TableCell>
                        <TableCell align="center">{m.code || '—'}</TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} sx={{ color: barColor }}>{m.mark}%</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%', position: 'relative' }}>
                            <LinearProgress
                              variant="determinate"
                              value={markVal}
                              sx={{
                                height: 14,
                                borderRadius: 7,
                                bgcolor: 'rgba(0,0,0,0.06)',
                                '& .MuiLinearProgress-bar': { borderRadius: 7, bgcolor: barColor },
                              }}
                            />
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: markVal >= 50 ? 'rgba(0,0,0,0.7)' : '#fff', textShadow: markVal < 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none' }}>
                                {markVal}/100
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} color={getGradeColor(m.grade) + '.main'}>{m.grade}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!reportCard.semester2?.marks || reportCard.semester2.marks.length === 0) && (
                    <TableRow><TableCell colSpan={5} align="center">{tRoster('reportCard.noMarksAvailable')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" gap={3} mb={2} flexWrap="wrap">
              <Chip label={`${tCommon('average')}: ${reportCard.semester2?.average ?? '—'}%`} color="secondary" variant="outlined" />
              <Chip label={`${tRoster('studentResults.total')}: ${reportCard.semester2?.total ?? '—'}`} variant="outlined" />
              <Chip label={`${tRoster('studentResults.secRank')}: #${reportCard.semester2?.sectionRank ?? '—'}`} variant="outlined" />
              <Chip label={`${tCommon('result')}: ${reportCard.semester2?.result ?? '—'}`}
                color={reportCard.semester2?.result === 'Fail' ? 'error' : 'success'} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Annual Summary */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(59,130,246,0.03)', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} color="primary" mb={2}>{tRoster('reportCard.annualSummary')}</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.annualAverage')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="primary">{reportCard.annual?.average ?? '—'}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.schoolRank')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="info.main">#{reportCard.annual?.schoolRank ?? '—'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.attendance')}</Typography>
                  <Typography variant="h5" fontWeight={800} color="secondary">{reportCard.attendance ?? '—'}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{tRoster('reportCard.finalResult')}</Typography>
                  <Typography variant="h5" fontWeight={800}
                    color={reportCard.annual?.finalResult === 'Fail' ? 'error' : 'success'}>
                    {reportCard.annual?.finalResult ?? '—'}
                  </Typography>
                </Grid>
              </Grid>
              {reportCard.annual?.promotionStatus && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">{tRoster('reportCard.promotionStatus')}: </Typography>
                  <Typography component="span" fontWeight={700}
                    color={reportCard.annual.promotionStatus === 'Promoted' ? 'success.main' : reportCard.annual.promotionStatus === 'Repeat' ? 'error.main' : 'warning.main'}>
                    {reportCard.annual.promotionStatus}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Print Footer */}
            <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, mt: 4, textAlign: 'center' }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Generated on {new Date().toLocaleString()} · {academicYear} · ESSMS
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {!loading && !reportCard && !error && (
        <Box textAlign="center" py={8}>
          <School sx={{ fontSize: 64, color: '#9CA3AF', opacity: 0.3 }} />
          <Typography color="text.secondary" mt={2}>{tRoster('reportCard.selectStudentHint')}</Typography>
        </Box>
      )}
    </Box>
  );
};
