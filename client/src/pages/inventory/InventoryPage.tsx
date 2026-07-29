import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Inventory2 } from '@mui/icons-material';
import { inventoryAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const conditionStyles: Record<string, any> = {
  New: { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A' },
  Good: { bg: 'rgba(36,114,196,0.1)', color: '#2472C4' },
  Fair: { bg: 'rgba(201,146,10,0.12)', color: '#C9920A' },
  Damaged: { bg: 'rgba(181,37,26,0.1)', color: '#B5251A' },
  Disposed: { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

const categories = ['Furniture', 'Electronics', 'Sports', 'Laboratory', 'Library', 'Office', 'Other'];

const initialForm = {
  name: '', category: 'Other', description: '', quantity: 1, unit: '',
  condition: 'New', location: '', purchaseDate: '', purchasePrice: 0, supplier: '', notes: '',
};

export const InventoryPage = () => {
  const { t: tInv } = useTranslation('inventory');
  const { showSuccess, showError } = useNotification();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.list({ limit: 200 });
      setItems(res.data.data?.items || []);
    } catch { showError(tInv('failedToLoad')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(initialForm); setDialog(true); };

  const openEdit = (it: any) => {
    setEditing(it);
    setForm({
      name: it.name || '',
      category: it.category || 'Other',
      description: it.description || '',
      quantity: it.quantity || 1,
      unit: it.unit || '',
      condition: it.condition || 'New',
      location: it.location || '',
      purchaseDate: it.purchaseDate ? it.purchaseDate.split('T')[0] : '',
      purchasePrice: it.purchasePrice || 0,
      supplier: it.supplier || '',
      notes: it.notes || '',
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError(tInv('itemNameRequired')); return; }
    setSaving(true);
    try {
      if (editing) { await inventoryAPI.update(editing._id, form); showSuccess(tInv('itemUpdated')); }
      else { await inventoryAPI.create(form); showSuccess(tInv('itemCreated')); }
      setDialog(false); fetch();
    } catch (err: any) { showError(err.response?.data?.message || tInv('failedToSave')); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await inventoryAPI.delete(delId); showSuccess(tInv('deleted')); fetch(); } catch { showError(tInv('failedToDelete')); } finally { setDelId(null); }
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tInv('pageTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tInv('pageSubtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2, px: 3 }}>{tInv('addItem')}</Button>
          <Tooltip title={tInv('refresh')}><IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tInv('itemCode')}</TableCell>
                  <TableCell>{tInv('name')}</TableCell>
                  <TableCell>{tInv('category')}</TableCell>
                  <TableCell>{tInv('qty')}</TableCell>
                  <TableCell>{tInv('available')}</TableCell>
                  <TableCell>{tInv('condition')}</TableCell>
                  <TableCell>{tInv('location')}</TableCell>
                  <TableCell align="right">{tInv('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Inventory2 sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.muted">{tInv('noItems')}</Typography>
                  </TableCell></TableRow>
                ) : (
                  items.map((it: any) => (
                    <TableRow key={it._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{it.itemCode}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{it.name}</Typography></TableCell>
                      <TableCell><Chip label={it.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                      <TableCell><Typography variant="body2">{it.quantity}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color={it.availableQuantity === 0 ? 'error' : 'text.primary'}>
                          {it.availableQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={it.condition} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', ...(conditionStyles[it.condition] || conditionStyles.Good) }} />
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{it.location || '\u2014'}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title={tInv('edit')}><IconButton size="small" onClick={() => openEdit(it)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={tInv('delete')}><IconButton size="small" color="error" onClick={() => setDelId(it._id)} sx={{ borderRadius: 1.5 }}><Delete fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{tInv('deleteItem')}</DialogTitle>
        <DialogContent><Typography>{tInv('deleteConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelId(null)} sx={{ borderRadius: 2 }}>{tInv('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tInv('delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{editing ? tInv('editItem') : tInv('addInventoryItem')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}><TextField fullWidth label={tInv('itemNameRequired')} size="small" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={3}>
              <TextField select fullWidth label={tInv('category')} size="small" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField select fullWidth label={tInv('condition')} size="small" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                {['New', 'Good', 'Fair', 'Damaged', 'Disposed'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={3}><TextField fullWidth label={tInv('quantity')} type="number" size="small" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tInv('unit')} size="small" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder={tInv('unitPlaceholder')} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tInv('location')} size="small" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder={tInv('locationPlaceholder')} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tInv('supplier')} size="small" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label={tInv('purchasePrice')} type="number" size="small" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth type="date" label={tInv('purchaseDate')} size="small" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={tInv('description')} size="small" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={tInv('notes')} size="small" multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tInv('cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>{saving ? tInv('saving') : tInv('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
