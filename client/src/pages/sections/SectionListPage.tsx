import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Grid, Tooltip, IconButton, Card, CardContent, LinearProgress,
  Menu, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Add, Refresh, People, Edit, Archive, Unarchive,
  School, TrendingUp, Warning, CheckCircle, Block,
  MoreVert, Assessment, Visibility, ContentCopy, AutoAwesome,
} from '@mui/icons-material';
import { sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SectionListPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t: tSections } = useTranslation('sections');
  const { t: tCommon } = useTranslation('common');
  const role = user?.role;
  const isAdmin = role === 'system_admin';
  const isAcademicHead = role === 'academic_head';
  const isRegistrar = role === 'registrar';
  const isDirector = role === 'school_director';
  const canManage = isAdmin || isAcademicHead;
  const canTransfer = isAdmin || isAcademicHead || isRegistrar;

  const [sections, setSections] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [error, setError] = useState('');
  const curYear = new Date().getFullYear();
  const curAY = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
  const nextAY = new Date().getMonth() + 1 >= 9 ? `${curYear + 1}/${curYear + 2}` : `${curYear}/${curYear + 1}`;
  const [rolloverDialog, setRolloverDialog] = useState(false);
  const [rolloverData, setRolloverData] = useState({ fromAY: curAY, toAY: nextAY, gradeFilter: '' });
  const [bulkArchiveDialog, setBulkArchiveDialog] = useState(false);
  const [bulkArchiveData, setBulkArchiveData] = useState({ sectionIds: [] as string[], reason: '' });
  const [bulkCreateDialog, setBulkCreateDialog] = useState(false);
  const [bulkCreateData, setBulkCreateData] = useState({ grade: 9, stream: '', academicYear: curAY, count: 3 });
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [balanceGrade, setBalanceGrade] = useState('');
  const [mergeDialog, setMergeDialog] = useState(false);
  const [mergeData, setMergeData] = useState({ sourceSectionId: '', targetSectionId: '', reason: '' });
  const [gradeF, setGradeF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [selectedAY, setSelectedAY] = useState(curAY);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', grade: 9, stream: '', academicYear: curAY, capacity: 50, minCapacity: 10,
    building: '', floor: '', roomNumber: '',
  });

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { academicYear: selectedAY };
      if (gradeF) params.grade = gradeF;
      if (statusF) params.isActive = statusF === 'active' ? 'true' : 'false';
      const res = await sectionsAPI.list(params);
      const data = res.data.data || [];
      setSections(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || tSections('messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [selectedAY, gradeF, statusF, tSections]);

  const fetchDashboard = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await sectionsAPI.dashboard({ academicYear: selectedAY });
      setDashboard(res.data.data);
    } catch {
      // Dashboard is optional
    } finally {
      setDbLoading(false);
    }
  }, [selectedAY]);

  useEffect(() => { fetchSections(); fetchDashboard(); }, [fetchSections, fetchDashboard]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', grade: 9, stream: '', academicYear: selectedAY, capacity: 50, minCapacity: 10, building: '', floor: '', roomNumber: '' });
    setDialog(true);
  };

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ].filter((y, i, a) => a.indexOf(y) === i);

  const openEdit = (s: any) => {
    setEditingId(s._id);
    setFormData({
      name: s.name || '', grade: s.grade || 9,
      stream: s.stream === 'Common' ? '' : (s.stream || ''),
      academicYear: s.academicYear || selectedAY,
      capacity: s.capacity || 50, minCapacity: s.minCapacity || 10,
      building: s.building || '', floor: s.floor?.toString() || '', roomNumber: s.roomNumber || '',
    });
    setDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData, grade: Number(formData.grade), capacity: Number(formData.capacity),
        minCapacity: Number(formData.minCapacity),
        floor: formData.floor ? Number(formData.floor) : undefined,
        stream: formData.stream || undefined,
      };
      if (editingId) {
        await sectionsAPI.update(editingId, payload);
        showSuccess(tSections('messages.sectionUpdated'));
      } else {
        await sectionsAPI.create(payload);
        showSuccess(tSections('messages.sectionCreated'));
      }
      setDialog(false);
      setEditingId(null);
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.failedToSave'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await sectionsAPI.delete(deleteId);
      showSuccess(tSections('messages.sectionDeactivated'));
      setDeleteId(null);
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.failedToDelete'));
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;
    try {
      await sectionsAPI.archive(archiveId, { reason: archiveReason || undefined });
      showSuccess(tSections('messages.sectionArchived'));
      setArchiveId(null);
      setArchiveReason('');
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.failedToArchive'));
    }
  };

  const handleRollover = async () => {
    try {
      await sectionsAPI.rollover({ fromAcademicYear: rolloverData.fromAY, toAcademicYear: rolloverData.toAY, gradeFilter: rolloverData.gradeFilter || undefined });
      showSuccess(tSections('messages.sectionsRolledOver'));
      setRolloverDialog(false);
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.rolloverFailed'));
    }
  };

  const handleBulkArchive = async () => {
    if (bulkArchiveData.sectionIds.length === 0) { showError(tSections('messages.selectSectionsToArchive')); return; }
    try {
      await sectionsAPI.archiveMultiple({ sectionIds: bulkArchiveData.sectionIds, reason: bulkArchiveData.reason || undefined });
      showSuccess(tSections('messages.sectionsArchivedCount', { count: bulkArchiveData.sectionIds.length }));
      setBulkArchiveDialog(false);
      setBulkArchiveData({ sectionIds: [], reason: '' });
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.bulkArchiveFailed'));
    }
  };

  const handleBulkCreate = async () => {
    try {
      await sectionsAPI.bulkCreate({ grade: bulkCreateData.grade, stream: bulkCreateData.stream || undefined, academicYear: bulkCreateData.academicYear, count: bulkCreateData.count });
      showSuccess(tSections('messages.sectionsCreatedCount', { count: bulkCreateData.count }));
      setBulkCreateDialog(false);
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.bulkCreateFailed'));
    }
  };

  const handleMerge = async () => {
    if (!mergeData.sourceSectionId || !mergeData.targetSectionId) {
      showError(tSections('messages.selectSourceAndTarget'));
      return;
    }
    if (mergeData.sourceSectionId === mergeData.targetSectionId) {
      showError(tSections('messages.sourceAndTargetDifferent'));
      return;
    }
    try {
      const res = await sectionsAPI.mergeSections(mergeData);
      showSuccess(res.data.message || tSections('messages.sectionsMerged'));
      setMergeDialog(false);
      setMergeData({ sourceSectionId: '', targetSectionId: '', reason: '' });
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.mergeFailed'));
    }
  };

  const handleToggleBulkSelect = (sectionId: string) => {
    setBulkArchiveData(prev => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter(id => id !== sectionId)
        : [...prev.sectionIds, sectionId],
    }));
  };

  const handleRestore = async (id: string) => {
    try {
      await sectionsAPI.restore(id);
      showSuccess(tSections('messages.sectionRestored'));
      fetchSections();
    } catch (err: any) {
      showError(err.response?.data?.message || tSections('messages.failedToRestore'));
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, s: any) => {
    setAnchorEl(e.currentTarget);
    setSelectedSection(s);
  };

  const metrics = dashboard?.metrics;
  const sectionDetails = dashboard?.sections || [];

  return (
    <Box>
      {/* Dashboard metrics */}
      {!dbLoading && metrics && (
        <Box display="flex" flexWrap="wrap" gap={1.5} mb={3}>
          {[
            { label: tSections('dashboard.totalSections'), value: metrics.totalSections, icon: <School fontSize="small" />, color: '#1B4F8A' },
            { label: tCommon('status.active'), value: metrics.activeSections, icon: <CheckCircle fontSize="small" />, color: '#2D7D3A' },
            { label: tCommon('status.archived'), value: metrics.archivedSections, icon: <Archive fontSize="small" />, color: '#6B7280' },
            { label: tSections('dashboard.totalStudents'), value: metrics.totalStudents, icon: <People fontSize="small" />, color: '#7C3AED' },
            { label: tSections('dashboard.availableSeats'), value: metrics.availableSeats, icon: <TrendingUp fontSize="small" />, color: '#C9920A' },
            { label: tSections('dashboard.fullSections'), value: metrics.fullSections, icon: <Warning fontSize="small" />, color: metrics.fullSections > 0 ? '#DC2626' : '#2D7D3A' },
            { label: tSections('dashboard.utilization'), value: `${metrics.capacityUtilization}%`, icon: <Assessment fontSize="small" />, color: '#0891B2' },
          ].map((m) => (
            <Paper key={m.label} elevation={0} sx={{ px: 1.5, py: 1, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', display: 'flex', alignItems: 'center', gap: 1, minWidth: 130 }}>
              <Box sx={{ color: m.color, display: 'flex', opacity: 0.7 }}>{m.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{m.label}</Typography>
                <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>{m.value}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Capacity alerts */}
      {sectionDetails.filter((s: any) => s.isFull && s.isActive).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} icon={<Warning />}>
          {tSections('alert.fullCapacity', { count: sectionDetails.filter((s: any) => s.isFull && s.isActive).length })}
        </Alert>
      )}

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tSections('list.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tSections('list.subtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <TextField select size="small" value={selectedAY} onChange={(e) => setSelectedAY(e.target.value)} sx={{ minWidth: 110 }}>
            {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={gradeF} onChange={(e) => setGradeF(e.target.value)} sx={{ minWidth: 90 }}>
            <MenuItem value="">{tSections('list.allGrades')}</MenuItem>
            {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tSections('list.grade')} {g}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={statusF} onChange={(e) => setStatusF(e.target.value)} sx={{ minWidth: 100 }}>
            <MenuItem value="">{tSections('list.allStatus')}</MenuItem>
            <MenuItem value="active">{tCommon('status.active')}</MenuItem>
            <MenuItem value="inactive">{tCommon('status.inactive')}</MenuItem>
          </TextField>
          {canManage && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="small" sx={{ borderRadius: 2 }}>
              {tSections('list.addSection')}
            </Button>
          )}
          {canManage && (
            <Button variant="outlined" size="small" startIcon={<AutoAwesome />} onClick={() => setRolloverDialog(true)} sx={{ borderRadius: 2 }}>
              {tSections('list.rollover')}
            </Button>
          )}
          {canManage && (
            <Button variant="outlined" size="small" startIcon={<ContentCopy />} onClick={() => setBulkCreateDialog(true)} sx={{ borderRadius: 2 }}>
              {tSections('list.bulkCreate')}
            </Button>
          )}
          {canManage && (
            <Button variant="outlined" size="small" onClick={() => setBalanceDialog(true)} sx={{ borderRadius: 2 }}>
              {tSections('list.balance')}
            </Button>
          )}
          {canManage && sections.filter((s: any) => s.isActive && !s.isArchived).length >= 2 && (
            <Button variant="outlined" size="small" color="secondary" onClick={() => setMergeDialog(true)} sx={{ borderRadius: 2 }}>
              {tSections('list.merge')}
            </Button>
          )}
          {canManage && sections.filter((s: any) => s.isActive && !s.isArchived).length > 0 && (
            <Button variant="outlined" size="small" color="warning" startIcon={<Archive />} onClick={() => setBulkArchiveDialog(true)} sx={{ borderRadius: 2 }}>
              {tSections('list.archive')}
            </Button>
          )}
          <Tooltip title={tSections('list.refresh')}><IconButton onClick={() => { fetchSections(); fetchDashboard(); }} size="small"><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tSections('list.table.section')}</TableCell>
                  <TableCell>{tCommon('grade')}</TableCell>
                  <TableCell>{tSections('list.table.stream')}</TableCell>
                  <TableCell>{tSections('list.table.ay')}</TableCell>
                  <TableCell>{tCommon('capacity')}</TableCell>
                  <TableCell>{tCommon('students')}</TableCell>
                  <TableCell>{tSections('list.table.seats')}</TableCell>
                  <TableCell>{tCommon('status.title')}</TableCell>
                  <TableCell align="right">{tSections('list.table.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <People sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                    <Typography color="text.muted">{tSections('list.noSectionsFound')}</Typography>
                  </TableCell></TableRow>
                ) : (
                  sections.map((s: any) => {
                    const studentCount = s.studentCount || 0;
                    const pct = s.capacity > 0 ? Math.round((studentCount / s.capacity) * 100) : 0;
                    return (
                      <TableRow key={s._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'pointer' }} onClick={() => navigate(`/sections/${s._id}`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{s.name}</Typography>
                          {s.sectionCode && <Typography variant="caption" color="text.secondary">{s.sectionCode}</Typography>}
                        </TableCell>
                        <TableCell><Chip label={`${tCommon('grade')} ${s.grade}`} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A' }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{s.stream || tCommon('stream.common')}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontSize="0.8rem">{s.academicYear}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{s.capacity}</Typography></TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" fontWeight={600}>{studentCount}</Typography>
                            <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#DC2626' : pct >= 80 ? '#C9920A' : '#2D7D3A' } }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={s.capacity - studentCount <= 0 ? 'error' : 'text.secondary'} fontWeight={600}>
                            {s.capacity - studentCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {s.isArchived ? (
                            <Chip label={tCommon('status.archived')} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(107,114,128,0.1)', color: '#6B7280' }} />
                          ) : s.isActive ? (
                            <Chip label={tCommon('status.active')} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(45,125,58,0.12)', color: '#2D7D3A' }} />
                          ) : (
                            <Chip label={tCommon('status.inactive')} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626' }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, s); }}>
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Action menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); navigate(`/sections/${selectedSection?._id}`); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>{tSections('list.menu.viewDetails')}</ListItemText>
        </MenuItem>
        {canManage && (
          <MenuItem onClick={() => { setAnchorEl(null); openEdit(selectedSection); }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>{tCommon('actions.edit')}</ListItemText>
          </MenuItem>
        )}
        {canManage && selectedSection && !selectedSection.isArchived && (
          <MenuItem onClick={() => { setAnchorEl(null); setArchiveId(selectedSection._id); setArchiveReason(''); }}>
            <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
            <ListItemText>{tCommon('actions.archive')}</ListItemText>
          </MenuItem>
        )}
        {isAdmin && selectedSection?.isArchived && (
          <MenuItem onClick={() => { setAnchorEl(null); handleRestore(selectedSection._id); }}>
            <ListItemIcon><Unarchive fontSize="small" /></ListItemIcon>
            <ListItemText>{tCommon('actions.restore')}</ListItemText>
          </MenuItem>
        )}
        {canManage && selectedSection && !selectedSection.isActive && !selectedSection.isArchived && (
          <MenuItem onClick={() => { setAnchorEl(null); setDeleteId(selectedSection._id); }}>
            <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>{tCommon('actions.deactivate')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? tSections('dialog.editSection') : tSections('dialog.createNewSection')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('dialog.sectionName')} value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={tSections('dialog.sectionNamePlaceholder')} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tCommon('grade')} select value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}>
                {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tCommon('stream.title')} select value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}>
                <MenuItem value="">{tCommon('stream.common')}</MenuItem>
                <MenuItem value="Natural Science">{tCommon('stream.naturalScience')}</MenuItem>
                <MenuItem value="Social Science">{tCommon('stream.socialScience')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('dialog.academicYear')} select value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}>
                {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tSections('dialog.maxCapacity')} type="number" value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tSections('dialog.minCapacity')} type="number" value={formData.minCapacity}
                onChange={(e) => setFormData({ ...formData, minCapacity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tSections('dialog.floor')} type="number" value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('dialog.building')} value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('dialog.roomNumber')} value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setDialog(false); setEditingId(null); }} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 2 }}>{editingId ? tCommon('actions.update') : tCommon('actions.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('deactivate.title')}</DialogTitle>
        <DialogContent>
          <Typography>{tSections('deactivate.message')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tSections('deactivate.confirm')}</Button>
        </DialogActions>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={!!archiveId} onClose={() => setArchiveId(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('archive.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('archive.message')}
          </Typography>
          <TextField fullWidth multiline rows={2} label={tSections('archive.reasonOptional')} value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setArchiveId(null)} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleArchive} variant="contained" color="warning" sx={{ borderRadius: 2 }}>{tCommon('actions.archive')}</Button>
        </DialogActions>
      </Dialog>

      {/* Rollover Dialog */}
      <Dialog open={rolloverDialog} onClose={() => setRolloverDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
          {tSections('rollover.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {tSections('rollover.message')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('rollover.fromAY')} value={rolloverData.fromAY}
                onChange={(e) => setRolloverData({ ...rolloverData, fromAY: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tSections('rollover.toAY')} value={rolloverData.toAY}
                onChange={(e) => setRolloverData({ ...rolloverData, toAY: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tSections('rollover.gradeFilter')} select value={rolloverData.gradeFilter}
                onChange={(e) => setRolloverData({ ...rolloverData, gradeFilter: e.target.value })} size="small">
                <MenuItem value="">{tSections('list.allGrades')}</MenuItem>
                {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRolloverDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleRollover} variant="contained" sx={{ borderRadius: 2 }}>{tCommon('actions.rollover')}</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkCreateDialog} onClose={() => setBulkCreateDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <ContentCopy sx={{ mr: 1, verticalAlign: 'middle' }} />
          {tSections('bulkCreate.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('bulkCreate.message')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField fullWidth label={tCommon('grade')} select value={bulkCreateData.grade}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, grade: Number(e.target.value) })} size="small">
                {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tCommon('stream.title')} select value={bulkCreateData.stream}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, stream: e.target.value })} size="small">
                <MenuItem value="">{tCommon('stream.common')}</MenuItem>
                <MenuItem value="Natural Science">{tCommon('stream.naturalScience')}</MenuItem>
                <MenuItem value="Social Science">{tCommon('stream.socialScience')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tSections('bulkCreate.count')} type="number" value={bulkCreateData.count}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, count: Number(e.target.value) })}
                size="small" inputProps={{ min: 1, max: 10 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tSections('dialog.academicYear')} value={bulkCreateData.academicYear}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, academicYear: e.target.value })} size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkCreateDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleBulkCreate} variant="contained" sx={{ borderRadius: 2 }}>{tSections('bulkCreate.confirm', { count: bulkCreateData.count })}</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Archive Dialog */}
      <Dialog open={bulkArchiveDialog} onClose={() => setBulkArchiveDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('bulkArchive.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('bulkArchive.message')}
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
            {sections.filter((s: any) => s.isActive && !s.isArchived).map((s: any) => (
              <Box key={s._id} display="flex" alignItems="center" gap={1} py={0.5}
                onClick={() => handleToggleBulkSelect(s._id)}
                sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' } }}>
                <input type="checkbox" checked={bulkArchiveData.sectionIds.includes(s._id)} readOnly />
                <Typography variant="body2">{tSections('bulkArchive.sectionItem', { name: s.name, grade: s.grade, count: s.studentCount || 0 })}</Typography>
              </Box>
            ))}
            {sections.filter((s: any) => s.isActive && !s.isArchived).length === 0 && (
              <Typography variant="body2" color="text.secondary">{tSections('bulkArchive.noActiveSections')}</Typography>
            )}
          </Box>
          <TextField fullWidth multiline rows={2} label={tSections('archive.reasonOptional')} value={bulkArchiveData.reason}
            onChange={(e) => setBulkArchiveData({ ...bulkArchiveData, reason: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setBulkArchiveDialog(false); setBulkArchiveData({ sectionIds: [], reason: '' }); }} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleBulkArchive} variant="contained" color="warning" disabled={bulkArchiveData.sectionIds.length === 0} sx={{ borderRadius: 2 }}>
            {tSections('bulkArchive.confirm', { count: bulkArchiveData.sectionIds.length })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={balanceDialog} onClose={() => { setBalanceDialog(false); setBalanceGrade(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('balance.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('balance.message')}
          </Typography>
          <TextField fullWidth type="number" label={tSections('balance.gradeLabel')} size="small" value={balanceGrade}
            onChange={(e) => setBalanceGrade(e.target.value)} inputProps={{ min: 9, max: 12 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setBalanceDialog(false); setBalanceGrade(''); }} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={async () => {
            const grade = Number(balanceGrade);
            if (![9, 10, 11, 12].includes(grade)) return;
            try {
              await sectionsAPI.balance({ grade, academicYear: selectedAY });
              showSuccess(tSections('messages.sectionsBalanced'));
              fetchSections();
            } catch (e: any) {
              showError(e.response?.data?.message || tCommon('status.failed'));
            }
            setBalanceDialog(false);
            setBalanceGrade('');
          }} variant="contained" disabled={![9, 10, 11, 12].includes(Number(balanceGrade))} sx={{ borderRadius: 2 }}>
            {tCommon('actions.balance')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Sections Dialog */}
      <Dialog open={mergeDialog} onClose={() => { setMergeDialog(false); setMergeData({ sourceSectionId: '', targetSectionId: '', reason: '' }); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tSections('merge.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tSections('merge.message')}
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {tSections('merge.warning')}
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth select label={tSections('merge.sourceLabel')} size="small" value={mergeData.sourceSectionId}
                onChange={(e) => setMergeData({ ...mergeData, sourceSectionId: e.target.value })}>
                {sections.filter((s: any) => s.isActive && !s.isArchived).map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} — {tCommon('grade')} {s.grade} ({s.enrolled || 0} {tCommon('students').toLowerCase()})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label={tSections('merge.targetLabel')} size="small" value={mergeData.targetSectionId}
                onChange={(e) => setMergeData({ ...mergeData, targetSectionId: e.target.value })}>
                {sections.filter((s: any) => s.isActive && !s.isArchived && s._id !== mergeData.sourceSectionId).map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} — {tCommon('grade')} {s.grade} ({s.enrolled || 0}/{s.capacity || 50} {tSections('list.table.seats').toLowerCase()})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label={tSections('merge.reasonOptional')} size="small" value={mergeData.reason}
                onChange={(e) => setMergeData({ ...mergeData, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setMergeDialog(false); setMergeData({ sourceSectionId: '', targetSectionId: '', reason: '' }); }} sx={{ borderRadius: 2 }}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleMerge} variant="contained" color="secondary" disabled={!mergeData.sourceSectionId || !mergeData.targetSectionId} sx={{ borderRadius: 2 }}>
            {tSections('merge.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
