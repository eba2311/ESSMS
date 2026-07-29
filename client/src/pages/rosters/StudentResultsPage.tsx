import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Grid, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, FormControl, InputLabel, Button, LinearProgress,
} from '@mui/material';
import {
  School, TrendingUp, CheckCircle, Warning, Assessment, Person, ArrowBack,
} from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const StudentResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
  const [academicYear, setAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );

  useEffect(() => { fetchResults(); }, [academicYear]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await rosterAPI.getMyResults({ academicYear });
      setResults(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  if (!results) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} size="small" sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
          <Typography variant="h4" fontWeight="bold" color="primary">{tRoster('studentResults.title')}</Typography>
        </Box>
        <Alert severity="info">{tRoster('studentResults.noResults', { year: academicYear })}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} size="small" sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h4" fontWeight="bold" color="primary">{tRoster('studentResults.title')}</Typography>
        <FormControl size="small" sx={{ minWidth: 140, ml: 'auto' }}>
          <InputLabel>{tCommon('academicYear')}</InputLabel>
          <Select value={academicYear} label={tCommon('academicYear')} onChange={(e) => setAcademicYear(e.target.value)}>
            {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Print Header */}
      <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">{tRoster('studentResults.printTitle')}</Typography>
        <Typography variant="body1">{tCommon('academicYear')}: {academicYear}</Typography>
      </Box>

      {/* Student Info Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Person color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{results.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {results.studentId} · {tCommon('grade')} {results.grade} · {tCommon('section')}: {results.section} · {results.stream || tCommon('common')}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800} color="primary">{results.annual?.average || '—'}%</Typography>
              <Typography variant="caption" color="text.secondary">{tRoster('studentResults.annualAverage')}</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800} color="info.main">{results.annual?.schoolRank || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{tRoster('studentResults.schoolRank')}</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800} color="secondary">{results.attendance || '—'}%</Typography>
              <Typography variant="caption" color="text.secondary">{tRoster('studentResults.attendance')}</Typography>
            </Box>
            <Box textAlign="center">
              {results.annual?.promotionStatus && (
                <Chip label={results.annual.promotionStatus} size="small"
                  color={results.annual.promotionStatus === 'Promoted' ? 'success' : results.annual.promotionStatus === 'Repeat' ? 'error' : 'warning'}
                  sx={{ fontSize: '0.8rem', fontWeight: 700, mt: 0.5 }} />
              )}
              <Typography variant="caption" color="text.secondary" display="block">{tCommon('status')}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Semester 1 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Assessment color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>{tRoster('semester.semester1')}</Typography>
                {results.semester1?.result && (
                  <Chip label={results.semester1.result} size="small"
                    color={results.semester1.result === 'Fail' ? 'error' : 'success'} sx={{ ml: 1, fontSize: '0.65rem' }} />
                )}
              </Box>
              <Box display="flex" gap={3} mb={2}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>{results.semester1?.average || '—'}%</Typography>
                  <Typography variant="caption" color="text.secondary">{tCommon('average')}</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>{results.semester1?.total || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.total')}</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>#{results.semester1?.sectionRank || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.secRank')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Semester 2 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Assessment color="secondary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>{tRoster('semester.semester2')}</Typography>
                {results.semester2?.result && (
                  <Chip label={results.semester2.result} size="small"
                    color={results.semester2.result === 'Fail' ? 'error' : 'success'} sx={{ ml: 1, fontSize: '0.65rem' }} />
                )}
              </Box>
              <Box display="flex" gap={3} mb={2}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>{results.semester2?.average || '—'}%</Typography>
                  <Typography variant="caption" color="text.secondary">{tCommon('average')}</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>{results.semester2?.total || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.total')}</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={800}>#{results.semester2?.sectionRank || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{tRoster('studentResults.secRank')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject-wise Breakdown */}
      {results.subjectMarks && results.subjectMarks.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUp color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight={700}>{tRoster('studentResults.subjectPerformance')}</Typography>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell><b>{tCommon('subject')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('studentResults.sem1Mark')}</b></TableCell>
                    <TableCell sx={{ width: '35%' }}><b>{tRoster('studentResults.sem1Range')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('studentResults.sem1Grade')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('studentResults.sem2Mark')}</b></TableCell>
                    <TableCell sx={{ width: '35%' }}><b>{tRoster('studentResults.sem2Range')}</b></TableCell>
                    <TableCell align="center"><b>{tRoster('studentResults.sem2Grade')}</b></TableCell>
                    <TableCell align="center"><b>{tCommon('average')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.subjectMarks.map((sub: any, idx: number) => {
                    const sem1 = sub.semesters?.['1'];
                    const sem2 = sub.semesters?.['2'];
                    const sem1Mark = sem1?.mark ?? 0;
                    const sem2Mark = sem2?.mark ?? 0;
                    const avg = sem1 && sem2 ? ((sem1Mark + sem2Mark) / 2).toFixed(1) : (sem1?.mark ?? sem2?.mark ?? '—');

                    const getBarColor = (val: number) =>
                      val >= 80 ? '#10B981' : val >= 60 ? '#3B82F6' : val >= 50 ? '#F59E0B' : '#EF4444';

                    return (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{sub.subject}</Typography>
                          {sub.code && <Typography variant="caption" color="text.secondary"> ({sub.code})</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          {sem1 ? <Typography fontWeight={700} sx={{ color: getBarColor(sem1Mark) }}>{sem1Mark}%</Typography> : '—'}
                        </TableCell>
                        <TableCell>
                          {sem1 ? (
                            <Box sx={{ width: '100%', position: 'relative' }}>
                              <LinearProgress
                                variant="determinate"
                                value={sem1Mark}
                                sx={{
                                  height: 14,
                                  borderRadius: 7,
                                  bgcolor: 'rgba(0,0,0,0.06)',
                                  '& .MuiLinearProgress-bar': { borderRadius: 7, bgcolor: getBarColor(sem1Mark) },
                                }}
                              />
                              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: sem1Mark >= 50 ? 'rgba(0,0,0,0.7)' : '#fff', textShadow: sem1Mark < 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none' }}>
                                  {sem1Mark}/100
                                </Typography>
                              </Box>
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {sem1?.grade ? (
                            <Chip label={sem1.grade} size="small"
                              color={sem1.grade === 'F' ? 'error' : 'success'}
                              sx={{ fontSize: '0.6rem', fontWeight: 700 }} />
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {sem2 ? <Typography fontWeight={700} sx={{ color: getBarColor(sem2Mark) }}>{sem2Mark}%</Typography> : '—'}
                        </TableCell>
                        <TableCell>
                          {sem2 ? (
                            <Box sx={{ width: '100%', position: 'relative' }}>
                              <LinearProgress
                                variant="determinate"
                                value={sem2Mark}
                                sx={{
                                  height: 14,
                                  borderRadius: 7,
                                  bgcolor: 'rgba(0,0,0,0.06)',
                                  '& .MuiLinearProgress-bar': { borderRadius: 7, bgcolor: getBarColor(sem2Mark) },
                                }}
                              />
                              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: sem2Mark >= 50 ? 'rgba(0,0,0,0.7)' : '#fff', textShadow: sem2Mark < 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none' }}>
                                  {sem2Mark}/100
                                </Typography>
                              </Box>
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {sem2?.grade ? (
                            <Chip label={sem2.grade} size="small"
                              color={sem2.grade === 'F' ? 'error' : 'success'}
                              sx={{ fontSize: '0.6rem', fontWeight: 700 }} />
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700}>{avg}{avg !== '—' ? '%' : ''}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Print Footer */}
      <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Generated on {new Date().toLocaleString()} · {academicYear} · ESSMS
        </Typography>
      </Box>
    </Box>
  );
};
