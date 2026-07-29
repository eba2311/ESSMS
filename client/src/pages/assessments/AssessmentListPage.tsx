import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  CircularProgress, Alert,
} from '@mui/material';
import { Add, Edit, Grading, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assessmentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const statusColor: Record<string, any> = {
  Draft: 'default', Published: 'success',
};

const CAN_CREATE = ['system_admin', 'academic_head', 'teacher'];
const CAN_ENTER_MARKS = ['teacher', 'system_admin'];
const CAN_PUBLISH = ['teacher', 'academic_head', 'school_director', 'system_admin'];

export const AssessmentListPage: React.FC = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    assessmentsAPI.list({ status: statusFilter || undefined, limit: 50 })
      .then(r => setAssessments(r.data.data || []))
      .catch(() => setError(t('failedToLoad')))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handlePublish = async (id: string) => {
    try {
      await assessmentsAPI.publish(id);
      setAssessments(prev => prev.map(a => a._id === id ? { ...a, status: 'Published' } : a));
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedToPublish'));
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="700">{t('title')}</Typography>
        {user && CAN_CREATE.includes(user.role) && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/assessments/new')}>
            {t('create')}
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('filterStatus')}</InputLabel>
            <Select value={statusFilter} label={t('filterStatus')} onChange={e => setStatusFilter(e.target.value as string)}>
              <MenuItem value="">{t('allStatuses')}</MenuItem>
              {['Draft', 'Published'].map(s => (
                <MenuItem key={s} value={s}>{t(s.toLowerCase(), { ns: 'common' })}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('assessmentTitle')}</TableCell>
                <TableCell>{t('assessmentType')}</TableCell>
                <TableCell>{t('subject', { ns: 'common' })}</TableCell>
                <TableCell>{t('section', { ns: 'common' })}</TableCell>
                <TableCell>{t('term', { ns: 'common' })}</TableCell>
                <TableCell>{t('totalMarks')}</TableCell>
                <TableCell>{t('status', { ns: 'common' })}</TableCell>
                <TableCell align="center">{t('actions', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">{t('noAssessmentsFound')}</TableCell>
                </TableRow>
              ) : (
                assessments.map(a => (
                  <TableRow key={a._id} hover>
                    <TableCell><strong>{a.title}</strong></TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{a.subject?.name || a.subject || '—'}</TableCell>
                    <TableCell>{a.section?.name || '—'}</TableCell>
                    <TableCell>{a.term}</TableCell>
                    <TableCell>{a.totalMarks}</TableCell>
                    <TableCell>
                      <Chip label={t(a.status?.toLowerCase() || '', { ns: 'common' })} color={statusColor[a.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      {CAN_ENTER_MARKS.includes(user?.role || '') && a.status === 'Draft' && (
                        <IconButton size="small" onClick={() => navigate(`/assessments/${a._id}/marks`)} title={t('enterMarks')}>
                           <Grading />
                         </IconButton>
                       )}
                       {CAN_CREATE.includes(user?.role || '') && a.status === 'Draft' && (
                         <IconButton size="small" onClick={() => navigate(`/assessments/${a._id}/edit`)} title={tCommon('edit')}>
                           <Edit />
                         </IconButton>
                       )}
                       {CAN_PUBLISH.includes(user?.role || '') && a.status === 'Draft' && (
                         <IconButton size="small" onClick={() => handlePublish(a._id)} title={t('publish')} color="success">
                          <CheckCircle />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
