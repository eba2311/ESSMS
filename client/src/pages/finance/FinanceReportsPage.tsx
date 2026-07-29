import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, TextField, Button, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Chip, Grid,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { financeAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageFinance } from '../../utils/permissions';

export const FinanceReportsPage = () => {
  const { t: tFin } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { showError } = useNotification();
  const { user } = useAuth();
  const canManage = canManageFinance(user?.role);
  const [activeTab, setActiveTab] = useState<'collection' | 'outstanding'>('collection');
  const getCurrentAcademicYear = () => {
    const now = new Date();
    return now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  };
  const [filters, setFilters] = useState({ academicYear: getCurrentAcademicYear(), grade: '', startDate: '', endDate: '' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      if (activeTab === 'collection') {
        const res = await financeAPI.collectionReports(params);
        setData(res.data.data);
      } else {
        const res = await financeAPI.outstandingReports(params);
        setData(res.data.data);
      }
    } catch {
      showError(tFin('failedToGenerateReport'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>{tFin('title')}</Typography>

      {/* Tab Selection */}
      <Box display="flex" gap={1} mb={3}>
        {(['collection', 'outstanding'] as const).map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'contained' : 'outlined'}
            onClick={() => { setActiveTab(tab); setData(null); }}>
            {tab === 'collection' ? tFin('collectionReport') : tFin('outstandingFees')}
          </Button>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label={tFin('academicYear')} value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" label={tCommon('grade')} select value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}>
              <MenuItem value="">{tFin('allGrades')}</MenuItem>
              {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('gradeValue', { grade: g })}</MenuItem>)}
            </TextField>
          </Grid>
          {activeTab === 'collection' && (
            <>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth size="small" label={tFin('startDate')} type="date" value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth size="small" label={tFin('endDate')} type="date" value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="contained" startIcon={<Search />} onClick={fetchReport}>
              {tFin('generate')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}

      {data && activeTab === 'collection' && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={3}>
            {[
              { label: tFin('totalPayments'), value: data.summary?.totalPayments },
              { label: tFin('totalAmountETB'), value: data.summary?.totalAmount?.toLocaleString() },
              { label: tFin('avgPaymentETB'), value: data.summary?.averagePayment?.toLocaleString() },
            ].map(({ label, value }) => (
              <Grid item xs={12} sm={4} key={label}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Recent Payments */}
          <Paper>
            <Box p={2}><Typography fontWeight={600}>{tFin('recentPayments')}</Typography></Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    {[tFin('receiptHash'), tCommon('student'), tFin('amountETB'), tFin('method'), tCommon('date')].map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 600 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentPayments?.map((p: any) => (
                    <TableRow key={p._id} hover>
                      <TableCell>{p.receiptNumber}</TableCell>
                      <TableCell>{p.student?.firstName} {p.student?.lastName}</TableCell>
                      <TableCell>{p.amount?.toLocaleString()}</TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                      <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {data && activeTab === 'outstanding' && (
        <>
          {/* Summary */}
          <Grid container spacing={2} mb={3}>
            {[
              { label: tFin('studentsWithOutstanding'), value: data.summary?.totalStudentsWithOutstanding, color: 'warning.main' },
              { label: tFin('totalOutstandingETB'), value: data.summary?.totalOutstandingAmount?.toLocaleString(), color: 'error.main' },
              { label: tFin('overdueCount'), value: data.summary?.overdueCount, color: 'error.main' },
            ].map(({ label, value, color }) => (
              <Grid item xs={12} sm={4} key={label}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Outstanding Fees Table */}
          <Paper>
            <Box p={2}><Typography fontWeight={600}>{tFin('outstandingFeesDetail')}</Typography></Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    {[tCommon('student'), tCommon('grade'), tFin('section'), tFin('outstandingETB'), tFin('dueDate'), tCommon('status')].map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 600 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.outstandingFees?.map((item: any) => (
                    <TableRow key={item.student?.id} hover>
                      <TableCell>{item.student?.studentId} - {item.student?.fullName}</TableCell>
                      <TableCell>{tCommon('gradeValue', { grade: item.student?.grade })}</TableCell>
                      <TableCell>{item.student?.section}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>
                        {item.fees?.outstanding?.toLocaleString()}
                      </TableCell>
                      <TableCell>{item.fees?.dueDate ? new Date(item.fees.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Chip label={item.fees?.isOverdue ? tFin('overdue') : tFin('pending')} size="small"
                          color={item.fees?.isOverdue ? 'error' : 'warning'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};
