import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, DateRange, CheckCircle } from '@mui/icons-material';
import { academicTermsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const initialForm = {
  academicYear: '', term: '1', name: '', startDate: '', endDate: '', isActive: true,
};

export const AcademicTermsPage = () => {
  const { t } = useTranslation('settings');
  const { showSuccess, showError } = useNotification();
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await academicTermsAPI.list();
      setTerms(res.data.data || []);
    } catch { showError(t('failedToLoadTerms')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(initialForm); setDialog(true); };

  const openEdit = (tItem: any) => {
    setEditing(tItem);
    setForm({
      academicYear: tItem.academicYear || '',
      term: tItem.term || '1',
      name: tItem.name || '',
      startDate: tItem.startDate ? tItem.startDate.split('T')[0] : '',
      endDate: tItem.endDate ? tItem.endDate.split('T')[0] : '',
      isActive: tItem.isActive !== false,
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.academicYear.trim() || !form.name.trim() || !form.startDate || !form.endDate) {
      showError(t('requiredFieldsMissing')); return;
    }
    setSaving(true);
    try {
      if (editing) { await academicTermsAPI.update(editing._id, form); showSuccess(t('termUpdated')); }
      else { await academicTermsAPI.create(form); showSuccess(t('termCreated')); }
      setDialog(false); fetch();
    } catch (err: any) { showError(err.response?.data?.message || t('failedToSave')); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await academicTermsAPI.delete(delId); showSuccess(t('deleted')); fetch(); } catch { showError(t('failedToDelete')); } finally { setDelId(null); }
  };

  const handleSetCurrent = async (id: string) => {
    try { await academicTermsAPI.setCurrent(id); showSuccess(t('currentTermUpdated')); fetch(); } catch { showError(t('failedToSetCurrent')); }
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{t('pageTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{t('pageSubtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2, px: 3 }}>{t('addTerm')}</Button>
          <Tooltip title={t('refresh')}><IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('name')}</TableCell>
                  <TableCell>{t('academicYear')}</TableCell>
                  <TableCell>{t('term')}</TableCell>
                  <TableCell>{t('startDate')}</TableCell>
                  <TableCell>{t('endDate')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell>{t('current')}</TableCell>
                  <TableCell align="right">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <DateRange sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.muted">{t('noTerms')}</Typography>
                  </TableCell></TableRow>
                ) : (
                  terms.map((tItem: any) => (
                    <TableRow key={tItem._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell><Typography variant="body2" fontWeight={700}>{tItem.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{tItem.academicYear}</Typography></TableCell>
                      <TableCell><Chip label={`${t('semester')} ${tItem.term}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                      <TableCell><Typography variant="body2">{tItem.startDate?.split('T')[0]}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{tItem.endDate?.split('T')[0]}</Typography></TableCell>
                      <TableCell>
                        <Chip label={tItem.isActive ? t('active') : t('inactive')} size="small" color={tItem.isActive ? 'success' : 'default'} sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        {tItem.isCurrent ? (
                          <Chip icon={<CheckCircle />} label={t('current')} size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => handleSetCurrent(tItem._id)} sx={{ fontSize: '0.65rem', p: '2px 8px', borderRadius: 1.5 }}>
                            {t('setCurrent')}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('edit')}><IconButton size="small" onClick={() => openEdit(tItem)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={t('delete')}><IconButton size="small" color="error" onClick={() => setDelId(tItem._id)} sx={{ borderRadius: 1.5 }}><Delete fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{t('deleteTerm')}</DialogTitle>
        <DialogContent><Typography>{t('deleteTermConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelId(null)} sx={{ borderRadius: 2 }}>{t('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{editing ? t('editTerm') : t('addTerm')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}><TextField fullWidth label={`${t('termName')} *`} size="small" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('termNamePlaceholder')} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${t('academicYear')} *`} size="small" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder={t('academicYearPlaceholder')} /></Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={`${t('semester')} *`} size="small" value={form.term} onChange={e => setForm({ ...form, term: e.target.value })}>
                <MenuItem value="1">{t('semester')} 1</MenuItem>
                <MenuItem value="2">{t('semester')} 2</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label={`${t('startDate')} *`} size="small" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label={`${t('endDate')} *`} size="small" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label={t('status')} size="small" value={form.isActive ? t('active') : t('inactive')} onChange={e => setForm({ ...form, isActive: e.target.value === t('active') })}>
                <MenuItem value={t('active')}>{t('active')}</MenuItem>
                <MenuItem value={t('inactive')}>{t('inactive')}</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{t('cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>{saving ? t('saving') : t('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
