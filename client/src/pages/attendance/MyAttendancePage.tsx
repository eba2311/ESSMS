import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Chip, CircularProgress, Alert, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, InputLabel, FormControl, MenuItem,
  LinearProgress, Divider,
} from '@mui/material';
import {
  CheckCircle, Cancel, Schedule, EventNote, Refresh,
  Edit, History,
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const MyAttendancePage = () => {
  const { t: tAttend } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [corrDialog, setCorrDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [corrReason, setCorrReason] = useState('');
  const [corrStatus, setCorrStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, corrRes] = await Promise.all([
        attendanceAPI.myAttendance(),
        attendanceAPI.corrections.list({ limit: 50 }),
      ]);
      setRecords(attRes.data.data?.records || []);
      setCorrections(corrRes.data.data?.records || []);
    } catch {
      setError(tAttend('failedToLoadAttendanceData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCorrection = (record: any) => {
    setSelectedRecord(record);
    setCorrReason('');
    setCorrStatus('');
    setCorrDialog(true);
  };

  const handleSubmitCorrection = async () => {
    if (!selectedRecord || !corrReason || !corrStatus) return;
    setSubmitting(true);
    try {
      await attendanceAPI.corrections.request({
        attendance: selectedRecord._id,
        reason: corrReason,
        requestedStatus: corrStatus,
      });
      showSuccess(tAttend('correctionRequestSubmitted'));
      setCorrDialog(false);
      fetchData();
    } catch {
      showError(tAttend('failedToSubmitCorrectionRequest'));
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = records.filter((r: any) => r.status === 'Present').length;
  const lateCount = records.filter((r: any) => r.status === 'Late').length;
  const absentCount = records.filter((r: any) => r.status === 'Absent').length;
  const totalCount = records.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Present': return { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A', icon: <CheckCircle sx={{ fontSize: 14 }} /> };
      case 'Absent': return { bg: 'rgba(181,37,26,0.12)', color: '#B5251A', icon: <Cancel sx={{ fontSize: 14 }} /> };
      case 'Late': return { bg: 'rgba(201,146,10,0.12)', color: '#C9920A', icon: <Schedule sx={{ fontSize: 14 }} /> };
      default: return { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', icon: null };
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <EventNote sx={{ fontSize: 32, color: '#1B4F8A' }} />
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAttend('myAttendance')}
        </Typography>
        <Button startIcon={<Refresh />} onClick={fetchData} sx={{ borderRadius: 2, textTransform: 'none' }}>
          {tAttend('refresh')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={4} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={800} color="#2D7D3A">{presentCount}</Typography>
            <Typography variant="caption" color="text.secondary">{tAttend('status.Present')}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={800} color="#C9920A">{lateCount}</Typography>
            <Typography variant="caption" color="text.secondary">{tAttend('status.Late')}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={800} color="#B5251A">{absentCount}</Typography>
            <Typography variant="caption" color="text.secondary">{tAttend('status.Absent')}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h3" fontWeight={800}>{rate}%</Typography>
            <Typography variant="caption" color="text.secondary">{tAttend('rate')}</Typography>
            <LinearProgress variant="determinate" value={rate} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(229,231,235,0.6)', '& .MuiLinearProgress-bar': { bgcolor: rate >= 80 ? '#2D7D3A' : rate >= 60 ? '#C9920A' : '#B5251A' } }} />
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <Box display="flex" alignItems="center" px={2.5} pt={2} pb={1}>
          <EventNote sx={{ fontSize: 18, color: '#1B4F8A', mr: 1 }} />
          <Typography variant="subtitle1" fontWeight={700}>{tAttend('attendanceRecords')}</Typography>
        </Box>
        <Divider sx={{ mb: 0 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{tCommon('date')}</TableCell>
                <TableCell>{tCommon('status')}</TableCell>
                <TableCell>{tCommon('section')}</TableCell>
                <TableCell align="right">{tCommon('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">{tAttend('noAttendanceRecords')}</Typography></TableCell></TableRow>
              ) : records.map((r: any, i: number) => {
                const sc = getStatusColor(r.status);
                return (
                  <TableRow key={r._id || i} hover>
                    <TableCell>
                      <Typography variant="body2">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip icon={sc.icon} label={r.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.color }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.section?.name || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<Edit />} onClick={() => openCorrection(r)} sx={{ borderRadius: 2, fontSize: '0.7rem', textTransform: 'none' }}>
                        {tAttend('requestCorrection')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {corrections.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Box display="flex" alignItems="center" px={2.5} pt={2} pb={1}>
            <History sx={{ fontSize: 18, color: '#7C3AED', mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>{tAttend('myCorrectionRequests')}</Typography>
          </Box>
          <Divider sx={{ mb: 0 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tAttend('original')}</TableCell>
                  <TableCell>{tAttend('requested')}</TableCell>
                  <TableCell>{tAttend('reason')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {corrections.map((c: any, i: number) => (
                  <TableRow key={c._id || i} hover>
                    <TableCell><Typography variant="body2">{c.date ? new Date(c.date).toLocaleDateString() : '—'}</Typography></TableCell>
                    <TableCell><Chip label={c.originalStatus} size="small" /></TableCell>
                    <TableCell><Chip label={c.requestedStatus} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reason}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        color={c.status === 'Approved' ? 'success' : c.status === 'Rejected' ? 'error' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={corrDialog} onClose={() => setCorrDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tAttend('requestAttendanceCorrection')}</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box mb={2} mt={1}>
              <Typography variant="body2" color="text.secondary">
                {tCommon('date')}: {selectedRecord.date ? new Date(selectedRecord.date).toLocaleDateString() : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tAttend('currentStatus')}: <Chip label={selectedRecord.status} size="small" />
              </Typography>
            </Box>
          )}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{tAttend('requestedStatus')}</InputLabel>
            <Select value={corrStatus} label={tAttend('requestedStatus')} onChange={(e) => setCorrStatus(e.target.value)}>
              <MenuItem value="Present">{tAttend('status.Present')}</MenuItem>
              <MenuItem value="Absent">{tAttend('status.Absent')}</MenuItem>
              <MenuItem value="Late">{tAttend('status.Late')}</MenuItem>
              <MenuItem value="Excused">{tAttend('status.Excused')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth label={tAttend('reasonForCorrection')} multiline rows={3}
            value={corrReason} onChange={(e) => setCorrReason(e.target.value)}
            placeholder={tAttend('reasonPlaceholder')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCorrDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleSubmitCorrection} disabled={!corrReason || !corrStatus || submitting} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {submitting ? <CircularProgress size={20} /> : tAttend('submitRequest')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
