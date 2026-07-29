import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, LocalShipping } from '@mui/icons-material';
import { transportAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const statusStyles: Record<string, any> = {
  Active: { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A' },
  Maintenance: { bg: 'rgba(201,146,10,0.12)', color: '#C9920A' },
  Inactive: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

const initialForm = {
  plateNumber: '', busNumber: '', capacity: 30, driverName: '', driverPhone: '',
  driverLicense: '', routeName: '', routeStops: '', fee: 0, status: 'Active', notes: '',
};

export const TransportPage = () => {
  const { t: tTransport } = useTranslation('transport');
  const { showSuccess, showError } = useNotification();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await transportAPI.list({ limit: 200 });
      setBuses(res.data.data?.buses || []);
    } catch { showError(tTransport('failedToLoadBuses')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(initialForm); setDialog(true); };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      plateNumber: b.plateNumber || '',
      busNumber: b.busNumber || '',
      capacity: b.capacity || 30,
      driverName: b.driverName || '',
      driverPhone: b.driverPhone || '',
      driverLicense: b.driverLicense || '',
      routeName: b.routeName || '',
      routeStops: (b.routeStops || []).join(', '),
      fee: b.fee || 0,
      status: b.status || 'Active',
      notes: b.notes || '',
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.plateNumber.trim() || !form.busNumber.trim() || !form.driverName.trim() || !form.routeName.trim()) {
      showError(tTransport('requiredFieldsMissing')); return;
    }
    setSaving(true);
    try {
      const data = { ...form, routeStops: form.routeStops.split(',').map((s: string) => s.trim()).filter(Boolean) };
      if (editing) { await transportAPI.update(editing._id, data); showSuccess(tTransport('busUpdated')); }
      else { await transportAPI.create(data); showSuccess(tTransport('busCreated')); }
      setDialog(false); fetch();
    } catch (err: any) { showError(err.response?.data?.message || tTransport('failedToSave')); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await transportAPI.delete(delId); showSuccess(tTransport('status')); fetch(); } catch { showError(tTransport('failedToDelete')); } finally { setDelId(null); }
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tTransport('transportManagement')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tTransport('manageBuses')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2, px: 3 }}>{tTransport('addBus')}</Button>
          <Tooltip title={tTransport('status')}><IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tTransport('busNumber')}</TableCell>
                  <TableCell>{tTransport('plateNumber')}</TableCell>
                  <TableCell>{tTransport('capacity')}</TableCell>
                  <TableCell>{tTransport('driverName')}</TableCell>
                  <TableCell>{tTransport('routeName')}</TableCell>
                  <TableCell>{tTransport('fee')}</TableCell>
                  <TableCell>{tTransport('status')}</TableCell>
                  <TableCell align="right">{tTransport('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buses.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <LocalShipping sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.muted">{tTransport('noBusesFound')}</Typography>
                  </TableCell></TableRow>
                ) : (
                  buses.map((b: any) => (
                    <TableRow key={b._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell><Typography variant="body2" fontWeight={700}>{b.busNumber}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{b.plateNumber}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{b.capacity}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{b.driverName}</Typography>
                        {b.driverPhone && <Typography variant="caption" color="text.secondary" display="block">{b.driverPhone}</Typography>}
                      </TableCell>
                      <TableCell><Typography variant="body2">{b.routeName}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{(b.fee || 0).toLocaleString()} ETB</Typography></TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', ...(statusStyles[b.status] || statusStyles.Inactive) }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={tTransport('status')}><IconButton size="small" onClick={() => openEdit(b)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={tTransport('status')}><IconButton size="small" color="error" onClick={() => setDelId(b._id)} sx={{ borderRadius: 1.5 }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tTransport('deleteBus')}</DialogTitle>
        <DialogContent><Typography>{tTransport('deleteBusConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelId(null)} sx={{ borderRadius: 2 }}>{tTransport('status')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tTransport('status')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{editing ? tTransport('editBus') : tTransport('addBus')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}><TextField fullWidth label={`${tTransport('busNumber')} *`} size="small" value={form.busNumber} onChange={e => setForm({ ...form, busNumber: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tTransport('plateNumber')} *`} size="small" value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={`${tTransport('capacity')} *`} type="number" size="small" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></Grid>
            <Grid item xs={4}>
              <TextField select fullWidth label={tTransport('status')} size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Active', 'Maintenance', 'Inactive'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}><TextField fullWidth label={tTransport('feeETB')} type="number" size="small" value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tTransport('driverName')} *`} size="small" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tTransport('driverPhone')} size="small" value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tTransport('driverLicense')} size="small" value={form.driverLicense} onChange={e => setForm({ ...form, driverLicense: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tTransport('routeName')} *`} size="small" value={form.routeName} onChange={e => setForm({ ...form, routeName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tTransport('routeStops')} size="small" value={form.routeStops} onChange={e => setForm({ ...form, routeStops: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={tTransport('notes')} size="small" multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tTransport('status')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : tTransport('status')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
