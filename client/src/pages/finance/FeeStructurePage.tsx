import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, MenuItem, CircularProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { financeAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageFinance } from '../../utils/permissions';

const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
};

export const FeeStructurePage = () => {
  const { t: tFin } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = canManageFinance(user?.role);
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent';
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [formData, setFormData] = useState({
    academicYear: getCurrentAcademicYear(),
    grade: 9,
    components: [{ name: 'Tuition', amount: 0 }],
    dueDate: '',
  });

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await financeAPI.feeStructures();
      let data = res.data.data || [];
      if (isStudentOrParent) {
        try {
          const me = await studentsAPI.me.get();
          const myGrade = me.data.data?.section?.grade;
          if (myGrade) data = data.filter((f: any) => f.grade === myGrade);
        } catch { /* show all if can't determine grade */ }
      }
      setFeeStructures(data);
    } catch {
      showError(tFin('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeeStructures(); }, []);

  const addComponent = () =>
    setFormData({ ...formData, components: [...formData.components, { name: '', amount: 0 }] });

  const removeComponent = (i: number) =>
    setFormData({ ...formData, components: formData.components.filter((_, idx) => idx !== i) });

  const updateComponent = (i: number, field: string, value: any) => {
    const updated = [...formData.components];
    updated[i] = { ...updated[i], [field]: value };
    setFormData({ ...formData, components: updated });
  };

  const handleEdit = (f: any) => {
    setEditingId(f._id);
    setFormData({
      academicYear: f.academicYear,
      grade: f.grade,
      components: f.components?.map((c: any) => ({ name: c.name, amount: c.amount })) || [{ name: 'Tuition', amount: 0 }],
      dueDate: f.dueDate ? f.dueDate.split('T')[0] : '',
    });
    setDialog(true);
  };

  const handleDelete = async () => {
    try {
      await financeAPI.deleteFeeStructure(deleteDialog.id);
      showSuccess(tFin('deleted'));
      setDeleteDialog({ open: false, id: '' });
      fetchFeeStructures();
    } catch (err: any) {
      showError(err.response?.data?.message || tFin('failedToDelete'));
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await financeAPI.updateFeeStructure(editingId, formData);
        showSuccess(tFin('updated'));
      } else {
        await financeAPI.createFeeStructure(formData);
        showSuccess(tFin('created'));
      }
      setDialog(false);
      setEditingId(null);
      setFormData({ academicYear: getCurrentAcademicYear(), grade: 9, components: [{ name: 'Tuition', amount: 0 }], dueDate: '' });
      fetchFeeStructures();
    } catch (err: any) {
      showError(err.response?.data?.message || tFin('failedToSave'));
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{tFin('title')}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>
            {tFin('addFeeStructure')}
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
                  {[tFin('academicYear'), tCommon('grade'), tFin('components'), tFin('totalETB'), tFin('dueDate'), tCommon('status'), ...(canManage ? [tCommon('actions')] : [])].map((h, i) => (
                    <TableCell key={i} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {feeStructures.map((f: any) => (
                  <TableRow key={f._id} hover>
                    <TableCell>{f.academicYear}</TableCell>
                    <TableCell>{tCommon('gradeValue', { grade: f.grade })}</TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.components?.map((c: any) => `${c.name}: ${c.amount} ETB`).join(' | ') || '-'}
                    </TableCell>
                    <TableCell><strong>{f.totalAmount?.toLocaleString()}</strong></TableCell>
                    <TableCell>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip label={f.isActive ? tCommon('active') : tCommon('inactive')} size="small"
                        color={f.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {canManage && (
                          <>
                            <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(f)}>{tCommon('edit')}</Button>
                            <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog({ open: true, id: f._id })}>{tCommon('delete')}</Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {feeStructures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {tFin('noFeeStructures')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => { setDialog(false); setEditingId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? tFin('editFeeStructure') : tFin('createFeeStructure')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={tFin('academicYear')} value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} />
          <TextField fullWidth margin="dense" label={tCommon('grade')} select value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}>
            {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('gradeValue', { grade: g })}</MenuItem>)}
          </TextField>
          <TextField fullWidth margin="dense" label={tFin('dueDate')} type="date" value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            InputLabelProps={{ shrink: true }} />
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">{tFin('feeComponents')}</Typography>
              <Button size="small" startIcon={<Add />} onClick={addComponent}>{tFin('addComponent')}</Button>
            </Box>
            {formData.components.map((comp, i) => (
              <Box key={i} display="flex" gap={1} mb={1} alignItems="center">
                <TextField size="small" label={tCommon('name')} value={comp.name} sx={{ flex: 1 }}
                  onChange={(e) => updateComponent(i, 'name', e.target.value)} />
                <TextField size="small" label={tFin('amountETB')} type="number" value={comp.amount} sx={{ width: 140 }}
                  onChange={(e) => updateComponent(i, 'amount', Number(e.target.value))} />
                {formData.components.length > 1 && (
                  <IconButton size="small" onClick={() => removeComponent(i)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialog(false); setEditingId(null); }}>{tCommon('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">{editingId ? tCommon('update') : tCommon('create')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: '' })} maxWidth="xs">
        <DialogTitle>{tFin('deleteFeeStructure')}</DialogTitle>
        <DialogContent>
          <Typography>{tFin('confirmDelete')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: '' })}>{tCommon('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">{tCommon('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
