import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Tooltip, TablePagination, InputAdornment,
} from '@mui/material';
import { Add, Edit, Visibility, Delete, Search, Refresh } from '@mui/icons-material';
import { behavioralAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const DisciplinePage = () => {
  const { t: tDisc } = useTranslation('discipline');
  const { showSuccess, showError } = useNotification();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; report: any }>({ open: false, report: null });
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: '', incidentDate: '', incidentType: 'Discipline', severity: 'Minor', description: '', actionTaken: '', followUp: '', parentNotified: false });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const fetch = async () => {
    setLoading(true);
    try { const res = await behavioralAPI.list({ limit: 500 }); setReports(res.data.data?.reports || []); }
    catch { showError(tDisc('failedToLoad')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const loadStudents = async () => { try { const r = await studentsAPI.list({ limit: 500 }); setStudents(r.data.data?.students || []); } catch {} }; loadStudents(); }, []);

  const openCreate = () => { setEditing(null); setForm({ studentId: '', incidentDate: new Date().toISOString().split('T')[0], incidentType: 'Discipline', severity: 'Minor', description: '', actionTaken: '', followUp: '', parentNotified: false }); setDialog(true); };

  const handleSave = async () => {
    if (!form.studentId || !form.incidentDate || !form.description) { showError(tDisc('studentDateDescriptionRequired')); return; }
    setSaving(true);
    try {
      if (editing) { await behavioralAPI.update(editing._id, form); showSuccess(tDisc('reportUpdated')); }
      else { await behavioralAPI.create(form); showSuccess(tDisc('reportCreated')); }
      setDialog(false); fetch();
    } catch (err: any) { showError(err.response?.data?.message || tDisc('failedToSave')); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.report) return;
    try {
      await behavioralAPI.delete(deleteDialog.report._id);
      showSuccess(tDisc('reportDeleted'));
      setDeleteDialog({ open: false, report: null });
      fetch();
    } catch (err: any) { showError(err.response?.data?.message || tDisc('failedToDelete')); }
  };

  const typeColors: Record<string, any> = { Discipline: 'error', Achievement: 'success', Participation: 'info', Other: 'default' };
  const severityColors: Record<string, any> = { Minor: 'success', Moderate: 'warning', Serious: 'error', Critical: 'error' };

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase().includes(s) ||
      (r.incidentType || '').toLowerCase().includes(s) ||
      (r.severity || '').toLowerCase().includes(s) ||
      (r.description || '').toLowerCase().includes(s)
    );
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tDisc('behavioralDisciplineReports')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tDisc('trackIncidents')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2, px: 3 }}>{tDisc('newReport')}</Button>
          <Tooltip title={tDisc('status')}><IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, mb: 2 }}>
        <TextField fullWidth size="small" placeholder={tDisc('searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('student')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('incidentDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('incidentType')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('severity')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('description')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tDisc('parentNotified')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">{tDisc('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((r: any) => (
                  <TableRow key={r._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.student?.firstName} {r.student?.lastName}</TableCell>
                    <TableCell>{new Date(r.incidentDate).toLocaleDateString()}</TableCell>
                    <TableCell><Chip label={r.incidentType} size="small" color={typeColors[r.incidentType] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                    <TableCell><Chip label={r.severity} size="small" color={severityColors[r.severity] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.8rem" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {r.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.parentNotified ? <Chip label={tDisc('status')} size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /> : <Chip label={tDisc('status')} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={tDisc('status')}><IconButton size="small" onClick={() => { setSelected(r); setDetailDialog(true); }} sx={{ borderRadius: 1.5 }}><Visibility fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={tDisc('status')}><IconButton size="small" onClick={() => { setEditing(r); setForm({ studentId: r.student?._id || '', incidentDate: r.incidentDate.split('T')[0], incidentType: r.incidentType, severity: r.severity, description: r.description, actionTaken: r.actionTaken || '', followUp: r.followUp || '', parentNotified: r.parentNotified }); setDialog(true); }} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={tDisc('status')}><IconButton size="small" onClick={() => setDeleteDialog({ open: true, report: r })} sx={{ borderRadius: 1.5, color: '#B5251A' }}><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">{reports.length === 0 ? tDisc('noReportsFound') : tDisc('noReportsMatchSearch')}</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPageOptions={[25, 50, 100]}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{editing ? tDisc('editReport') : tDisc('newBehavioralReport')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField select fullWidth label={`${tDisc('student')} *`} size="small" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                {students.map((st: any) => <MenuItem key={st._id} value={st._id}>{st.firstName} {st.lastName}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tDisc('incidentDate')} *`} type="date" size="small" InputLabelProps={{ shrink: true }} value={form.incidentDate} onChange={e => setForm({ ...form, incidentDate: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tDisc('incidentType')} size="small" value={form.incidentType} onChange={e => setForm({ ...form, incidentType: e.target.value })}>
                {[{ v: 'Discipline', k: tDisc('typeDiscipline') }, { v: 'Achievement', k: tDisc('typeAchievement') }, { v: 'Participation', k: tDisc('typeParticipation') }, { v: 'Other', k: tDisc('status') }].map(item => <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tDisc('severity')} size="small" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {[{ v: 'Minor', k: tDisc('severityMinor') }, { v: 'Moderate', k: tDisc('severityModerate') }, { v: 'Serious', k: tDisc('severitySerious') }, { v: 'Critical', k: tDisc('severityCritical') }].map(item => <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tDisc('parentNotified')} size="small" value={form.parentNotified ? 'true' : 'false'} onChange={e => setForm({ ...form, parentNotified: e.target.value === 'true' })}>
                <MenuItem value="false">{tDisc('status')}</MenuItem><MenuItem value="true">{tDisc('status')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label={`${tDisc('description')} *`} multiline rows={3} size="small" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tDisc('actionTaken')} multiline rows={2} size="small" value={form.actionTaken} onChange={e => setForm({ ...form, actionTaken: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tDisc('followUp')} multiline rows={2} size="small" value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tDisc('status')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving...' : tDisc('status')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{tDisc('reportDetails')}</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tDisc('student')}</Typography><Typography variant="body2" fontWeight={600}>{selected.student?.firstName} {selected.student?.lastName}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">{tDisc('incidentDate')}</Typography><Typography variant="body2" fontWeight={600}>{new Date(selected.incidentDate).toLocaleDateString()}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">{tDisc('incidentType')}</Typography><Typography variant="body2" fontWeight={600}>{selected.incidentType}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">{tDisc('severity')}</Typography><Typography variant="body2" fontWeight={600}>{selected.severity}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">{tDisc('parentNotified')}</Typography><Typography variant="body2" fontWeight={600}>{selected.parentNotified ? tDisc('status') : tDisc('status')}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">{tDisc('description')}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 1.5, borderRadius: 1, mt: 0.5 }}>{selected.description}</Typography></Grid>
              {selected.actionTaken && <Grid item xs={12}><Typography variant="caption" color="text.secondary">{tDisc('actionTaken')}</Typography><Typography variant="body2">{selected.actionTaken}</Typography></Grid>}
              {selected.followUp && <Grid item xs={12}><Typography variant="caption" color="text.secondary">{tDisc('followUp')}</Typography><Typography variant="body2">{selected.followUp}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}><Button onClick={() => setDetailDialog(false)} sx={{ borderRadius: 2 }}>{tDisc('status')}</Button></DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, report: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#B5251A' }}>{tDisc('deleteReport')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {tDisc('deleteReportConfirm', { name: `${deleteDialog.report?.student?.firstName} ${deleteDialog.report?.student?.lastName}` })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialog({ open: false, report: null })} sx={{ borderRadius: 2 }}>{tDisc('status')}</Button>
          <Button onClick={handleDelete} variant="contained" sx={{ borderRadius: 2, bgcolor: '#B5251A', '&:hover': { bgcolor: '#9A1E15' } }}>{tDisc('status')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
