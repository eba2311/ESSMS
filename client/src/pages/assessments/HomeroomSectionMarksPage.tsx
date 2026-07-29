import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const HomeroomSectionMarksPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const curYear = new Date().getFullYear();
  const curAY = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
  const [selectedAY, setSelectedAY] = useState(curAY);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    assessmentsAPI.homeroomSectionMarks(sectionId, { academicYear: selectedAY })
      .then((r) => setData(r.data.data))
      .catch((err) => {
        const msg = err.response?.data?.message || t('failedToLoad');
        setError(msg);
        showError(msg);
      })
      .finally(() => setLoading(false));
  }, [sectionId, selectedAY]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!data) return <Alert severity="info">{t('noData', { ns: 'common' })}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assessments')} sx={{ borderRadius: 2 }}>{t('back', { ns: 'common' })}</Button>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {t('tabSectionOverview')} — {data.section?.name || t('section', { ns: 'common' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">{tCommon('grade')} {data.section?.grade} | {t('homeroomView')}</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('academicYear', { ns: 'common' })}</InputLabel>
          <Select value={selectedAY} label={t('academicYear', { ns: 'common' })} onChange={(e) => setSelectedAY(e.target.value)}>
            <MenuItem value={`${curYear - 1}/${curYear}`}>{`${curYear - 1}/${curYear}`}</MenuItem>
            <MenuItem value={`${curYear}/${curYear + 1}`}>{`${curYear}/${curYear + 1}`}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {data.students?.length === 0 ? (
        <Alert severity="info">{t('noStudentsFound')}</Alert>
      ) : (
        data.students.map((entry: any, i: number) => (
          <Paper key={i} elevation={0} sx={{ mb: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={700}>{entry.student?.firstName} {entry.student?.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{entry.student?.studentId}</Typography>
                </Box>
                <Chip label={`${tCommon('avg')}: ${entry.overallAverage}%`} color={entry.overallAverage >= 50 ? 'success' : 'error'} size="small" sx={{ fontWeight: 600 }} />
              </Box>
            </Box>
            {entry.subjects?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('subject', { ns: 'common' })}</TableCell>
                      <TableCell>{t('title')}</TableCell>
                      <TableCell>{t('score')}</TableCell>
                      <TableCell>{t('average', { ns: 'common' })}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entry.subjects.map((sub: any, j: number) => (
                      <TableRow key={j}>
                        <TableCell><Typography fontWeight={600}>{sub.subjectName}</Typography></TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {sub.assessments.map((a: any, k: number) => (
                              <Chip key={k} label={`${a.marksObtained}/${a.totalMarks}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell><Typography fontWeight={600}>{sub.totalObtained} / {sub.totalPossible}</Typography></TableCell>
                        <TableCell>
                          <Chip label={`${sub.average}%`} size="small" color={sub.average >= 50 ? 'success' : 'error'} sx={{ fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">{t('noMarksEntered')}</Typography></Box>
            )}
          </Paper>
        ))
      )}
    </Box>
  );
};
