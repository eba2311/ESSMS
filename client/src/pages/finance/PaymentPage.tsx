import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Receipt } from '@mui/icons-material';
import { financeAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canRecordPayment } from '../../utils/permissions';

const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
};

export const PaymentPage = () => {
  const { t: tFin } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = canRecordPayment(user?.role);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    academicYear: getCurrentAcademicYear(),
    amount: '',
    paymentMethod: 'Cash',
    transactionReference: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        financeAPI.collectionReports({ academicYear: getCurrentAcademicYear() }),
        studentsAPI.list({ limit: 500 }),
      ]);
      setPayments(paymentsRes.data.data?.recentPayments || []);
      setStudents(studentsRes.data.data?.students || []);
    } catch {
      showError(tFin('failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      const res = await financeAPI.recordPayment(formData);
      showSuccess(tFin('paymentRecorded'));
      setDialog(false);
      setFormData({ studentId: '', academicYear: getCurrentAcademicYear(), amount: '', paymentMethod: 'Cash', transactionReference: '', remarks: '' });
      fetchData();
      // Show receipt
      const receiptRes = await financeAPI.getReceipt(res.data.data._id);
      setReceipt(receiptRes.data.data);
      setReceiptDialog(true);
    } catch (err: any) {
      showError(err.response?.data?.message || tFin('failedToRecordPayment'));
    }
  };

  const viewReceipt = async (paymentId: string) => {
    try {
      const res = await financeAPI.getReceipt(paymentId);
      setReceipt(res.data.data);
      setReceiptDialog(true);
    } catch {
      showError(tFin('failedToLoadReceipt'));
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{tFin('payments')}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>
            {tFin('recordPayment')}
          </Button>
        )}
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {[tFin('receiptHash'), tCommon('student'), tFin('amountETB'), tFin('method'), tCommon('date'), tCommon('actions')].map((h, i) => (
                    <TableCell key={i} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p._id} hover>
                    <TableCell>{p.receiptNumber}</TableCell>
                    <TableCell>
                      {p.student?.studentId} - {p.student?.firstName} {p.student?.lastName}
                    </TableCell>
                    <TableCell><strong>{p.amount?.toLocaleString()}</strong></TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<Receipt />} onClick={() => viewReceipt(p._id)}>
                        {tFin('receipt')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {tFin('noPayments')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Record Payment Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tFin('recordPayment')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={tCommon('student')} select value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}>
            {students.map((s: any) => (
              <MenuItem key={s._id} value={s._id}>
                {s.studentId} - {s.firstName} {s.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth margin="dense" label={tFin('academicYear')} value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} />
          <TextField fullWidth margin="dense" label={tFin('amountETB')} type="number" value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          <TextField fullWidth margin="dense" label={tFin('paymentMethod')} select value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
            {['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money'].map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth margin="dense" label={tFin('transactionReference')} value={formData.transactionReference}
            onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })} />
          <TextField fullWidth margin="dense" label={tFin('remarks')} multiline rows={2} value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">{tFin('record')}</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{tFin('paymentReceipt')}</DialogTitle>
        <DialogContent>
          {receipt && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">{tFin('receiptNumber')}</Typography>
              <Typography fontWeight={700} mb={1}>{receipt.receiptNumber}</Typography>
              <Typography variant="subtitle2" color="text.secondary">{tCommon('student')}</Typography>
              <Typography mb={1}>{receipt.student?.fullName} ({receipt.student?.studentId})</Typography>
              <Typography variant="subtitle2" color="text.secondary">{tFin('amount')}</Typography>
              <Typography fontWeight={700} mb={1}>{receipt.payment?.amount?.toLocaleString()} ETB</Typography>
              <Typography variant="subtitle2" color="text.secondary">{tFin('paymentMethod')}</Typography>
              <Typography mb={1}>{receipt.payment?.method}</Typography>
              <Typography variant="subtitle2" color="text.secondary">{tCommon('date')}</Typography>
              <Typography mb={1}>{receipt.payment?.date ? new Date(receipt.payment.date).toLocaleDateString() : '-'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">{tFin('receivedBy')}</Typography>
              <Typography>{receipt.receivedBy?.name}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog(false)} variant="contained">{tCommon('close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
