import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Tooltip, Chip, Avatar, Pagination,
  Select, InputLabel, FormControl, MenuItem, TextField,
} from '@mui/material';
import { ArrowBack, Refresh, History, School, Person, Group, GroupAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI } from '../../services/api';

export const AssignmentHistoryPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activityType, setActivityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const ACTIVITY_TYPES = [
    { value: '', label: tAssign('allActivities') },
    { value: 'TEACHER_ASSIGNMENT', label: tAssign('teacherAssigned'), icon: <Person sx={{ fontSize: 14 }} />, color: '#1B4F8A' },
    { value: 'TEACHER_UNASSIGNMENT', label: tAssign('teacherUnassigned'), icon: <Person sx={{ fontSize: 14 }} />, color: '#DC2626' },
    { value: 'TEACHER_BATCH_ASSIGNMENT', label: tAssign('batchTeacherAssign'), icon: <Group sx={{ fontSize: 14 }} />, color: '#7C3AED' },
    { value: 'STUDENT_BATCH_ASSIGNMENT', label: tAssign('batchStudentAssign'), icon: <GroupAdd sx={{ fontSize: 14 }} />, color: '#2D7D3A' },
  ];

  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'TEACHER_ASSIGNMENT': return { label: tAssign('teacherAssigned'), color: 'info' as const, icon: <Person sx={{ fontSize: 14 }} /> };
      case 'TEACHER_UNASSIGNMENT': return { label: tAssign('teacherUnassigned'), color: 'error' as const, icon: <Person sx={{ fontSize: 14 }} /> };
      case 'TEACHER_BATCH_ASSIGNMENT': return { label: tAssign('batchTeacher'), color: 'secondary' as const, icon: <Group sx={{ fontSize: 14 }} /> };
      case 'STUDENT_BATCH_ASSIGNMENT': return { label: tAssign('batchStudent'), color: 'success' as const, icon: <GroupAdd sx={{ fontSize: 14 }} /> };
      default: return { label: type, color: 'default' as const, icon: <History sx={{ fontSize: 14 }} /> };
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 25 };
      if (activityType) params.type = activityType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await assignmentsAPI.history(params);
      setData(r.data.data || []);
      setTotalPages(r.data.pagination?.pages || 1);
      setTotalCount(r.data.pagination?.total || 0);
    } catch {
      setError(tCommon('failedToLoad'));
    }
    finally { setLoading(false); }
  }, [page, activityType, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (d: string) => {
    if (!d) return '\u2014';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('assignmentHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary">{tAssign('records', { count: totalCount })}</Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{tAssign('activityType')}</InputLabel>
            <Select value={activityType} label={tAssign('activityType')} onChange={(e) => { setActivityType(e.target.value); setPage(1); }}>
              {ACTIVITY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={tAssign('startDate')}
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label={tAssign('endDate')}
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Button variant="outlined" onClick={() => { setPage(1); fetchData(); }} sx={{ borderRadius: 2 }}>{tCommon('filter')}</Button>
          <Button variant="text" onClick={() => { setActivityType(''); setStartDate(''); setEndDate(''); setPage(1); }} sx={{ borderRadius: 2 }}>{tCommon('clear')}</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tAssign('activity')}</TableCell>
                  <TableCell>{tAssign('description')}</TableCell>
                  <TableCell>{tAssign('performedBy')}</TableCell>
                  <TableCell>{tAssign('dateTime')}</TableCell>
                  <TableCell align="center">{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <History sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">{tAssign('noAssignmentHistoryFound')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((log: any) => {
                    const style = getActivityStyle(log.activityType);
                    return (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={style.icon}
                            label={style.label}
                            color={style.color}
                            variant="outlined"
                            sx={{ borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.description || '\u2014'}</Typography>
                        </TableCell>
                        <TableCell>
                          {log.performedBy ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.6rem', fontWeight: 700 }}>
                                {log.performedBy.name?.[0] || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{log.performedBy.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{log.performedBy.userId}</Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">{tCommon('system')}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{formatDate(log.timestamp)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {log.metadata && (
                            <Tooltip title={
                              <Box sx={{ p: 0.5, maxWidth: 300 }}>
                                <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </Box>
                            }>
                              <Chip size="small" label={tCommon('view')} variant="outlined" sx={{ cursor: 'pointer', borderRadius: 1 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" p={2}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
