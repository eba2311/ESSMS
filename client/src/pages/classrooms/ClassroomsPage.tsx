import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, MeetingRoom } from '@mui/icons-material';
import { classroomsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const statusStyles: Record<string, any> = {
  Available: { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A' },
  Occupied: { bg: 'rgba(181,37,26,0.1)', color: '#B5251A' },
  Maintenance: { bg: 'rgba(201,146,10,0.12)', color: '#C9920A' },
  Unavailable: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

export const ClassroomsPage = () => {
  const { t: tClass } = useTranslation('classrooms');
  const { showSuccess, showError } = useNotification();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ roomNumber: '', building: '', floor: 1, capacity: 30, type: 'Regular', facilities: '', status: 'Available' });
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try { const res = await classroomsAPI.list({ limit: 200 }); setClassrooms(res.data.data?.classrooms || []); }
    catch { showError(tClass('failedToLoadClassrooms')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openEdit = (c: any) => { setEditing(c); setForm({ roomNumber: c.roomNumber, building: c.building || '', floor: c.floor || 1, capacity: c.capacity, type: c.type, facilities: (c.facilities || []).join(', '), status: c.status }); setDialog(true); };
  const openCreate = () => { setEditing(null); setForm({ roomNumber: '', building: '', floor: 1, capacity: 30, type: 'Regular', facilities: '', status: 'Available' }); setDialog(true); };

  const handleSave = async () => {
    if (!form.roomNumber.trim() || !form.capacity) { showError(tClass('roomNumberRequired')); return; }
    setSaving(true);
    try {
      const data = { ...form, facilities: form.facilities.split(',').map(s => s.trim()).filter(Boolean) };
      if (editing) { await classroomsAPI.update(editing._id, data); showSuccess(tClass('roomUpdated')); }
      else { await classroomsAPI.create(data); showSuccess(tClass('roomCreated')); }
      setDialog(false); fetch();
    } catch (err: any) { showError(err.response?.data?.message || tClass('failedToSave')); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await classroomsAPI.delete(delId); showSuccess(tClass('roomDeleted')); fetch(); } catch { showError(tClass('failedToDelete')); } finally { setDelId(null); }
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tClass('classrooms')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tClass('classroomsSubtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2, px: 3 }}>{tClass('addClassroom')}</Button>
          <Tooltip title={tClass('status')}><IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tClass('roomNumber')}</TableCell>
                  <TableCell>{tClass('building')}</TableCell>
                  <TableCell>{tClass('floor')}</TableCell>
                  <TableCell>{tClass('capacity')}</TableCell>
                  <TableCell>{tClass('roomType')}</TableCell>
                  <TableCell>{tClass('status')}</TableCell>
                  <TableCell>{tClass('facilities')}</TableCell>
                  <TableCell align="right">{tClass('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classrooms.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <MeetingRoom sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.muted">{tClass('noClassroomsFound')}</Typography>
                  </TableCell></TableRow>
                ) : (
                  classrooms.map(c => (
                    <TableRow key={c._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{c.roomNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{c.building || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.floor ? `${tClass('floor')} ${c.floor}` : '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{c.capacity}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={c.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', ...(statusStyles[c.status] || statusStyles.Unavailable) }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{c.facilities?.join(', ') || '—'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={tClass('edit')}><IconButton size="small" onClick={() => openEdit(c)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={tClass('status')}><IconButton size="small" color="error" onClick={() => setDelId(c._id)} sx={{ borderRadius: 1.5 }}><Delete fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{tClass('deleteClassroom')}</DialogTitle>
        <DialogContent><Typography>{tClass('deleteClassroomConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelId(null)} sx={{ borderRadius: 2 }}>{tClass('status')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tClass('status')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{editing ? tClass('editClassroom') : tClass('addClassroom')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}><TextField fullWidth label={`${tClass('roomNumber')} *`} size="small" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tClass('building')} size="small" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={tClass('floor')} type="number" size="small" value={form.floor} onChange={e => setForm({ ...form, floor: Number(e.target.value) })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={`${tClass('capacity')} *`} type="number" size="small" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></Grid>
            <Grid item xs={4}>
              <TextField select fullWidth label={tClass('roomType')} size="small" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['Regular', 'Laboratory', 'Computer Lab', 'Library'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tClass('status')} size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Available', 'Occupied', 'Maintenance', 'Unavailable'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label={tClass('facilitiesComma')} size="small" value={form.facilities} onChange={e => setForm({ ...form, facilities: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tClass('status')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : tClass('status')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
