import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Chip, CircularProgress, Alert, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Tooltip, TextField, MenuItem, Select,
  InputLabel, FormControl, Grid, Pagination,
} from '@mui/material';
import {
  SwapHoriz, School, Delete, RestorePage, Refresh, FilterList,
} from '@mui/icons-material';
import { transferLogsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const TransferLogListPage = () => {
  const { t } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [type, setType] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (type) params.type = type;
      if (includeDeleted) params.includeDeleted = 'true';
      const res = await transferLogsAPI.list(params);
      setLogs(res.data.data?.logs || []);
      setTotal(res.data.data?.total || 0);
      setPages(res.data.data?.pages || 1);
    } catch {
      showError(t('failedToLoadTransferLogs'));
    } finally {
      setLoading(false);
    }
  }, [page, type, includeDeleted, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await transferLogsAPI.delete(id);
      showSuccess(t('transferLogSoftDeleted'));
      fetchData();
    } catch {
      showError(t('failedToDelete'));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await transferLogsAPI.restore(id);
      showSuccess(t('transferLogRestored'));
      fetchData();
    } catch {
      showError(t('failedToRestore'));
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'Section': return <SwapHoriz sx={{ fontSize: 16 }} />;
      case 'School': return <School sx={{ fontSize: 16 }} />;
      default: return <SwapHoriz sx={{ fontSize: 16 }} />;
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'Section': return 'primary';
      case 'School': return 'warning';
      case 'Withdrawal': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <SwapHoriz sx={{ fontSize: 32, color: '#7C3AED' }} />
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {t('transferLogs')}
        </Typography>
        <Button
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {t('filters')}
        </Button>
          <Tooltip title={t('refresh')}>
          <IconButton onClick={fetchData}><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {showFilters && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('type')}</InputLabel>
                <Select value={type} label={t('type')} onChange={e => { setType(e.target.value); setPage(1); }}>
                  <MenuItem value="">{t('allTypes')}</MenuItem>
                  <MenuItem value="Section">{t('sectionTransfer')}</MenuItem>
                  <MenuItem value="School">{t('schoolTransfer')}</MenuItem>
                  <MenuItem value="Withdrawal">{t('withdrawal')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('show')}</InputLabel>
                <Select value={includeDeleted ? 'true' : 'false'} label={t('show')} onChange={e => { setIncludeDeleted(e.target.value === 'true'); setPage(1); }}>
                  <MenuItem value="false">{t('activeOnly')}</MenuItem>
                  <MenuItem value="true">{t('includeDeleted')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colStudent')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colType')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colFrom')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colTo')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colDate')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('colBy')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('colActions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">{t('noTransferLogs')}</Typography></TableCell></TableRow>
                  ) : logs.map((log: any) => (
                    <TableRow key={log._id} hover sx={{ opacity: log.isDeleted ? 0.5 : 1 }}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {log.student?.firstName} {log.student?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.student?.studentId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(log.type)}
                          label={log.type}
                          size="small"
                          color={getTypeColor(log.type) as any}
                          sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {log.type === 'Section' || log.type === 'School' ? (
                          <Typography variant="body2">
                            {log.fromSection?.name || `Grade ${log.fromGrade}`}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                        {log.schoolName && (
                          <Typography variant="caption" color="text.secondary">
                            {log.schoolName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.toSection?.name || `Grade ${log.toGrade}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.transferredAt ? new Date(log.transferredAt).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.transferredBy?.firstName} {log.transferredBy?.lastName}
                        </Typography>
                        {log.transferredBy?.role && (
                          <Typography variant="caption" color="text.secondary">
                            {log.transferredBy.role.replace('_', ' ')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {log.isDeleted ? (
                          <Tooltip title={t('restore')}>
                            <IconButton size="small" onClick={() => handleRestore(log._id)} color="primary">
                              <RestorePage fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title={t('delete')}>
                            <IconButton size="small" onClick={() => handleDelete(log._id)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {pages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}

          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Typography variant="caption" color="text.secondary">{t('totalRecords', { count: total })}</Typography>
          </Box>
        </>
      )}
    </Box>
  );
};
