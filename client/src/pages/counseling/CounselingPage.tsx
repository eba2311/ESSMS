import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Tooltip, Switch,
  FormControlLabel, TablePagination,
} from '@mui/material';
import { Add, Edit, Visibility, Delete } from '@mui/icons-material';
import { counselingAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageCounseling } from '../../utils/permissions';

export const CounselingPage = () => {
  const { t: tCouncil } = useTranslation('counseling');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = canManageCounseling(user?.role);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ studentId: '', sessionDate: '', sessionType: 'Academic', confidentialNotes: '', followUpDate: '', followUpRequired: false, status: 'Scheduled' });
  const [saving, setSaving] = useState(false);

  const fetch = async (p = page, rpp = rowsPerPage) => {
    setLoading(true);
    try {
      const res = await counselingAPI.list({ limit: rpp, page: p + 1 });
      const d = res.data.data;
      setSessions(d.sessions || []);
      setTotal(d.pagination?.total || 0);
    } catch { showError(tCouncil('failedToLoad')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch();
    studentsAPI.list({ limit: 500 })
      .then(r => setStudents(r.data.data?.students || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetch(page, rowsPerPage); }, [page, rowsPerPage]);

  const openCreate = () => {
    setEditing(null);
    setForm({ studentId: '', sessionDate: '', sessionType: 'Academic', confidentialNotes: '', followUpDate: '', followUpRequired: false, status: 'Scheduled' });
    setDialog(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      studentId: s.student?._id || '',
      sessionDate: s.sessionDate ? s.sessionDate.slice(0, 10) : '',
      sessionType: s.sessionType || 'Academic',
      confidentialNotes: s.confidentialNotes || '',
      followUpDate: s.followUpDate ? s.followUpDate.slice(0, 10) : '',
      followUpRequired: s.followUpRequired || false,
      status: s.status || 'Scheduled',
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.studentId || !form.sessionDate || !form.confidentialNotes) {
      showError(tCouncil('studentRequired')); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await counselingAPI.update(editing._id, form);
        showSuccess(tCouncil('sessionUpdated'));
      } else {
        await counselingAPI.create(form);
        showSuccess(tCouncil('sessionCreated'));
      }
      setDialog(false);
      fetch(page, rowsPerPage);
    } catch (err: any) {
      showError(err.response?.data?.message || tCouncil('failedToSave'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await counselingAPI.delete(deleteTarget._id);
      showSuccess(tCouncil('sessionDeleted'));
      setDeleteDialog(false);
      setDeleteTarget(null);
      fetch(page, rowsPerPage);
    } catch (err: any) {
      showError(err.response?.data?.message || tCouncil('failedToDelete'));
    }
  };

  const handleChangePage = (_: any, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const typeColors: Record<string, any> = { Academic: 'primary', Behavioral: 'warning', Personal: 'info', Career: 'success', Other: 'default' };
  const statusColors: Record<string, any> = { Scheduled: 'info', Completed: 'success', Cancelled: 'error' };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>{tCouncil('counselingSessions')}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="small">{tCouncil('newSession')}</Button>
        )}
      </Box>
      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('student')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('date')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('type')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('followUpRequired')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('counselor')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCouncil('status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map(s => (
                    <TableRow key={s._id} hover>
                      <TableCell>{s.student?.firstName} {s.student?.lastName}</TableCell>
                      <TableCell>{new Date(s.sessionDate).toLocaleDateString()}</TableCell>
                      <TableCell><Chip label={s.sessionType} size="small" color={typeColors[s.sessionType] || 'default'} /></TableCell>
                      <TableCell><Chip label={s.status} size="small" color={statusColors[s.status] || 'default'} /></TableCell>
                      <TableCell>{s.followUpDate ? new Date(s.followUpDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{s.counselor?.firstName} {s.counselor?.lastName}</TableCell>
                      <TableCell>
                        <Tooltip title={tCouncil('status')}><IconButton size="small" onClick={() => { setSelected(s); setDetailDialog(true); }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        {canManage && (
                          <>
                            <Tooltip title={tCouncil('status')}><IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title={tCouncil('status')}><IconButton size="small" color="error" onClick={() => { setDeleteTarget(s); setDeleteDialog(true); }}><Delete fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>{tCouncil('noSessionsFound')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? tCouncil('editSession') : tCouncil('newCounselingSession')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField select fullWidth label={`${tCouncil('student')} *`} size="small" value={form.studentId}
                onChange={e => setForm({ ...form, studentId: e.target.value })}>
                {students.map(st => (
                  <MenuItem key={st._id} value={st._id}>{st.firstName} {st.lastName} ({st.studentId})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={`${tCouncil('sessionDate')} *`} type="date" size="small"
                InputLabelProps={{ shrink: true }} value={form.sessionDate}
                onChange={e => setForm({ ...form, sessionDate: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tCouncil('type')} size="small" value={form.sessionType}
                onChange={e => setForm({ ...form, sessionType: e.target.value })}>
                {[{ v: 'Academic', k: tCouncil('academic') }, { v: 'Behavioral', k: tCouncil('behavioral') }, { v: 'Personal', k: tCouncil('personal') }, { v: 'Career', k: tCouncil('career') }, { v: 'Other', k: tCouncil('status') }].map(item => (
                  <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={`${tCouncil('confidentialNotes')} *`} multiline rows={4} size="small"
                value={form.confidentialNotes}
                onChange={e => setForm({ ...form, confidentialNotes: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tCouncil('followUpDate')} type="date" size="small"
                InputLabelProps={{ shrink: true }} value={form.followUpDate}
                onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={tCouncil('status')} size="small" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {[{ v: 'Scheduled', k: tCouncil('scheduled') }, { v: 'Completed', k: tCouncil('completed') }, { v: 'Cancelled', k: tCouncil('cancelled') }].map(item => (
                  <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.followUpRequired}
                  onChange={e => setForm({ ...form, followUpRequired: e.target.checked })} />}
                label={tCouncil('followUpRequired')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tCouncil('status')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : tCouncil('status')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tCouncil('sessionDetails')}</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2} mt={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('student')}</Typography>
                <Typography variant="body2" fontWeight={600}>{selected.student?.firstName} {selected.student?.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('date')}</Typography>
                <Typography variant="body2" fontWeight={600}>{new Date(selected.sessionDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('type')}</Typography>
                <Typography variant="body2" fontWeight={600}>{selected.sessionType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('status')}</Typography>
                <Chip label={selected.status} size="small" color={statusColors[selected.status] || 'default'} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('counselor')}</Typography>
                <Typography variant="body2" fontWeight={600}>{selected.counselor?.firstName} {selected.counselor?.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tCouncil('followUpRequired')}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selected.followUpRequired ? `Yes (${selected.followUpDate ? new Date(selected.followUpDate).toLocaleDateString() : tCouncil('noDateSet')})` : tCouncil('none')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">{tCouncil('confidentialNotes')}</Typography>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mt: 0.5,
                  fontFamily: 'monospace', fontSize: '0.85rem',
                }}>
                  {selected.confidentialNotes || tCouncil('noNotesRecorded')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDetailDialog(false)} sx={{ borderRadius: 2 }}>{tCouncil('status')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => { setDeleteDialog(false); setDeleteTarget(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tCouncil('deleteSession')}</DialogTitle>
        <DialogContent>
          <Typography>{tCouncil('deleteSessionConfirm', { name: `${deleteTarget?.student?.firstName} ${deleteTarget?.student?.lastName}` })}</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>{tCouncil('actionCannotUndone')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setDeleteDialog(false); setDeleteTarget(null); }} sx={{ borderRadius: 2 }}>{tCouncil('status')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCouncil('status')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
