import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { CheckCircle, Cancel, Pending } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export const AttendanceCorrectionPage = () => {
  const { t: tAttend } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const role = user?.role;
  const canReview = role === 'system_admin' || role === 'school_director';

  const [tab, setTab] = useState(0);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewModal, setReviewModal] = useState<{ open: boolean; correction: any; status: string; notes: string }>({
    open: false, correction: null, status: 'Approved', notes: '',
  });

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const statusFilter = tab === 0 ? 'Pending' : tab === 1 ? 'Approved' : 'Rejected';
      const res = await attendanceAPI.corrections.list({ status: statusFilter, limit: 100 });
      setCorrections(res.data.data?.records || []);
    } catch {
      setError(tAttend('failedToLoadCorrections'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCorrections(); }, [tab]);

  const handleReview = async () => {
    if (!reviewModal.correction) return;
    try {
      await attendanceAPI.corrections.review(reviewModal.correction._id, {
        status: reviewModal.status,
        reviewNotes: reviewModal.notes,
      });
      showSuccess(`${tAttend('correction')} ${reviewModal.status.toLowerCase()}`);
      setReviewModal({ open: false, correction: null, status: 'Approved', notes: '' });
      fetchCorrections();
    } catch {
      showError(tAttend('failedToReviewCorrection'));
    }
  };

  const statusChip = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      Pending: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
      Approved: { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
      Rejected: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
    };
    const m = map[status] || { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
    return <Chip label={status} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: m.bg, color: m.color }} />;
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={0.5}>{tAttend('attendanceCorrections')}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{tAttend('manageCorrectionRequests')}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}>
        <Tab icon={<Pending sx={{ fontSize: 18 }} />} label={tAttend('status.Pending')} iconPosition="start" />
        <Tab icon={<CheckCircle sx={{ fontSize: 18 }} />} label={tAttend('status.Approved')} iconPosition="start" />
        <Tab icon={<Cancel sx={{ fontSize: 18 }} />} label={tAttend('status.Rejected')} iconPosition="start" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress size={32} /></Box>
      ) : (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tAttend('student')}</TableCell>
                  <TableCell>{tAttend('original')}</TableCell>
                  <TableCell>{tAttend('requested')}</TableCell>
                  <TableCell>{tAttend('reason')}</TableCell>
                  <TableCell>{tAttend('requestedBy')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                  {canReview && tab === 0 && <TableCell>{tCommon('action')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {corrections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canReview && tab === 0 ? 8 : 7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">{tAttend('noCorrectionRequests')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  corrections.map((c: any) => (
                    <TableRow key={c._id} hover>
                      <TableCell>{c.date?.split('T')[0]}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {c.attendance?.student?.firstName} {c.attendance?.student?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{c.attendance?.student?.studentId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.originalStatus} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={c.requestedStatus} size="small"
                          sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20,
                            bgcolor: c.requestedStatus === 'Present' ? 'rgba(5,150,105,0.1)' : c.requestedStatus === 'Absent' ? 'rgba(220,38,38,0.1)' : c.requestedStatus === 'Late' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)',
                            color: c.requestedStatus === 'Present' ? '#059669' : c.requestedStatus === 'Absent' ? '#DC2626' : c.requestedStatus === 'Late' ? '#D97706' : '#6B7280',
                          }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{c.reason}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{c.requestedBy?.firstName} {c.requestedBy?.lastName}</Typography>
                      </TableCell>
                      <TableCell>{statusChip(c.status)}</TableCell>
                      {canReview && tab === 0 && (
                        <TableCell>
                          <Button size="small" variant="outlined" sx={{ fontSize: '0.65rem', borderRadius: 1.5 }}
                            onClick={() => setReviewModal({ open: true, correction: c, status: 'Approved', notes: '' })}>
                            {tAttend('review')}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={reviewModal.open} onClose={() => setReviewModal((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>{tAttend('reviewCorrectionRequest')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {reviewModal.correction && (
              <>
                <Typography variant="body2">
                  <strong>{tAttend('student')}:</strong> {reviewModal.correction.attendance?.student?.firstName} {reviewModal.correction.attendance?.student?.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>{tCommon('date')}:</strong> {reviewModal.correction.date?.split('T')[0]}
                </Typography>
                <Typography variant="body2">
                  <strong>{tAttend('original')}:</strong> {reviewModal.correction.originalStatus} → <strong>{reviewModal.correction.requestedStatus}</strong>
                </Typography>
                <Typography variant="body2">
                  <strong>{tAttend('reason')}:</strong> {reviewModal.correction.reason}
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>{tAttend('decision')}</InputLabel>
                  <Select value={reviewModal.status} label={tAttend('decision')}
                    onChange={(e) => setReviewModal((p) => ({ ...p, status: e.target.value }))}>
                    <MenuItem value="Approved">{tAttend('approve')}</MenuItem>
                    <MenuItem value="Rejected">{tAttend('reject')}</MenuItem>
                  </Select>
                </FormControl>
                <TextField label={tAttend('reviewNotes')} multiline rows={3} size="small" value={reviewModal.notes}
                  onChange={(e) => setReviewModal((p) => ({ ...p, notes: e.target.value }))} />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewModal((p) => ({ ...p, open: false }))}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleReview}
            color={reviewModal.status === 'Approved' ? 'primary' : 'error'}>
            {reviewModal.status === 'Approved' ? tAttend('approve') : tAttend('reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
