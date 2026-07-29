import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Chip, CircularProgress, Alert, Grid,
  Card, CardContent, Divider, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Grade, Star, TrendingUp, Book } from '@mui/icons-material';
import { assessmentsAPI } from '../../services/api';

export const MyGradesPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchGrades = () => {
    setLoading(true);
    setError('');
    assessmentsAPI.myGrades()
      .then((res) => setGrades(res.data.data || []))
      .catch(() => setError(t('failedToLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGrades(); }, []);

  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  const pct = (score: number, max: number) => max > 0 ? Math.round((score / max) * 100) : 0;

  // Group by subject
  const bySubject: Record<string, any[]> = {};
  for (const g of grades) {
    const subjectName = g.assessment?.subject?.name || t('unknown');
    if (!bySubject[subjectName]) bySubject[subjectName] = [];
    bySubject[subjectName].push(g);
  }

  const totalScore = grades.reduce((s: number, g: any) => s + (g.marksObtained ?? g.score ?? 0), 0);
  const totalMax = grades.reduce((s: number, g: any) => s + (g.assessment?.totalMarks ?? g.totalMarks ?? 100), 0);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Grade sx={{ fontSize: 32, color: '#1B4F8A' }} />
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {t('myGrades')}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <Star sx={{ fontSize: 28, color: getAvgColor(overallPct), mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{overallPct}%</Typography>
            <Typography variant="caption" color="text.secondary">{t('overallAverage')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <TrendingUp sx={{ fontSize: 28, color: '#7C3AED', mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{grades.length}</Typography>
            <Typography variant="caption" color="text.secondary">{t('assessment')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
            <Book sx={{ fontSize: 28, color: '#1B4F8A', mb: 0.5 }} />
            <Typography variant="h4" fontWeight={800}>{Object.keys(bySubject).length}</Typography>
            <Typography variant="caption" color="text.secondary">{t('subject', { ns: 'common' })}</Typography>
          </Card>
        </Grid>
      </Grid>

      {grades.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Typography color="text.secondary">{t('noGradesPublished')}</Typography>
        </Paper>
      ) : (
        Object.entries(bySubject).map(([subjectName, marks]) => {
          const subTotal = marks.reduce((s: number, m: any) => s + (m.marksObtained ?? m.score ?? 0), 0);
          const subMax = marks.reduce((s: number, m: any) => s + (m.assessment?.totalMarks ?? m.totalMarks ?? 100), 0);
          const subPct = subMax > 0 ? Math.round((subTotal / subMax) * 100) : 0;
          return (
            <Paper key={subjectName} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2 }}>
              <Box px={2.5} pt={2} pb={1} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <Book sx={{ fontSize: 18, color: '#7C3AED' }} />
                  <Typography variant="subtitle1" fontWeight={700}>{subjectName}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight={800} color={getAvgColor(subPct)}>{subPct}%</Typography>
                  <Typography variant="caption" color="text.secondary">({subTotal}/{subMax})</Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={subPct}
                sx={{ mx: 2.5, height: 4, borderRadius: 2, bgcolor: 'rgba(229,231,235,0.6)', '& .MuiLinearProgress-bar': { bgcolor: getAvgColor(subPct) } }}
              />
              <Divider sx={{ mt: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('assessmentType')}</TableCell>
                      <TableCell>{t('term', { ns: 'common' })}</TableCell>
                      <TableCell align="right">{t('score')}</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((m: any, i: number) => {
                      const score = m.marksObtained ?? m.score ?? 0;
                      const max = m.assessment?.totalMarks ?? m.totalMarks ?? 100;
                      const p = pct(score, max);
                      return (
                        <TableRow key={m._id || i}>
                          <TableCell>
                            <Chip label={m.assessment?.type || m.type} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{m.assessment?.term || '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace">{score}/{max}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, bgcolor: `${getAvgColor(p)}15`, color: getAvgColor(p), fontWeight: 700, fontSize: '0.8rem' }}>
                              {p}%
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          );
        })
      )}
    </Box>
  );
};
