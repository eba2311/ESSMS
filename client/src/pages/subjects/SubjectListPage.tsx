import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, IconButton, TextField,
  MenuItem, Tooltip, Alert, Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Search, Visibility, Book, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { subjectsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export const SubjectListPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === 'system_admin' || role === 'academic_head' || role === 'school_director';
  const canDelete = role === 'system_admin';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [delSubject, setDelSubject] = useState<{ _id: string; name: string } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await subjectsAPI.list(params);
      setSubjects(res.data.data?.subjects || []);
      setTotalPages(res.data.data?.pagination?.pages || 1);
    } catch { setError(t('failedToLoadSubjects')); }
    finally { setLoading(false); }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!delSubject) return;
    try { await subjectsAPI.delete(delSubject._id); showSuccess(t('subjectDeleted')); fetch(); }
    catch { showError(t('failedToDelete')); } finally { setDelSubject(null); }
  };

  const handleToggle = async (id: string, status: string) => {
    try {
      const newStatus = status === 'Active' ? 'Inactive' : 'Active';
      await subjectsAPI.toggleStatus(id, newStatus);
      showSuccess(newStatus === 'Active' ? t('subjectActivated') : t('subjectDeactivated'));
      fetch();
    } catch { showError(t('failedToUpdate')); }
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{t('subjects')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{t('subjectsSubtitle')}</Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/subjects/new')} sx={{ borderRadius: 2, px: 3 }}>{t('addSubject')}</Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField label={t('searchNameOrCode')} value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ minWidth: 220 }} InputProps={{ endAdornment: <Search color="action" /> }} />
          <TextField select label={t('type')} value={filterType} onChange={(e) => setFilterType(e.target.value)} size="small" sx={{ minWidth: 130 }}>
            <MenuItem value="">{t('all')}</MenuItem>
            <MenuItem value="Compulsory">{t('compulsory')}</MenuItem>
            <MenuItem value="Elective">{t('elective')}</MenuItem>
            <MenuItem value="Practical">{t('practical')}</MenuItem>
          </TextField>
          <TextField select label={t('status')} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 130 }}>
            <MenuItem value="">{t('all')}</MenuItem>
            <MenuItem value="Active">{t('active')}</MenuItem>
            <MenuItem value="Inactive">{t('inactive')}</MenuItem>
            <MenuItem value="Archived">{t('archived')}</MenuItem>
          </TextField>
          <Button variant="outlined" startIcon={<FilterList />} onClick={() => fetch()} sx={{ borderRadius: 2 }}>{t('filter')}</Button>
          <Tooltip title={t('refresh')}><IconButton onClick={() => fetch()} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box> : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                    <TableRow>
                      <TableCell>{t('code')}</TableCell>
                      <TableCell>{t('name')}</TableCell>
                      <TableCell>{t('shortName')}</TableCell>
                      <TableCell>{t('type')}</TableCell>
                      <TableCell>{t('grades')}</TableCell>
                      <TableCell>{t('periods')}</TableCell>
                      <TableCell>{t('year')}</TableCell>
                      <TableCell>{t('status')}</TableCell>
                      <TableCell align="right">{t('actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Book sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">{t('noSubjectsFound')}</Typography>
                    </TableCell></TableRow>
                  ) : (
                    subjects.map((s) => (
                      <TableRow key={s._id} hover sx={{ '&:last-child td': { borderBottom: 0 }, opacity: s.status === 'Active' ? 1 : 0.55 }}>
                        <TableCell>
                          <Chip label={s.code} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{s.shortName || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={s.subjectType || (s.isCore ? t('compulsory') : t('elective'))} size="small" variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.3} flexWrap="wrap">
                            {(s.grades || []).map((g: number) => (
                              <Chip key={g} label={g} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={`${s.weeklyPeriods ?? 4}/wk`} size="small"
                            sx={{ fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{s.academicYear || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.status || t('active')}
                            size="small"
                            onClick={() => canManage && handleToggle(s._id, s.status)}
                            sx={{
                              fontWeight: 600, fontSize: '0.65rem', cursor: canManage ? 'pointer' : 'default',
                              bgcolor: s.status === 'Active' ? 'rgba(45,125,58,0.12)' : s.status === 'Inactive' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.1)',
                              color: s.status === 'Active' ? '#2D7D3A' : s.status === 'Inactive' ? '#B45309' : '#6B7280',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={t('viewDetails')}>
                            <IconButton size="small" onClick={() => navigate(`/subjects/${s._id}`)} sx={{ borderRadius: 1.5 }}><Visibility fontSize="small" /></IconButton>
                          </Tooltip>
                          {canManage && (
                            <Tooltip title={t('edit')}>
                              <IconButton size="small" onClick={() => navigate(`/subjects/${s._id}/edit`)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title={t('delete')}>
                              <IconButton size="small" color="error" onClick={() => setDelSubject({ _id: s._id, name: s.name })} sx={{ borderRadius: 1.5 }}><Delete fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" py={2}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Paper>

      <Dialog open={!!delSubject} onClose={() => setDelSubject(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('deleteSubject')}</DialogTitle>
        <DialogContent><Typography>{t('deleteSubjectConfirm', { name: delSubject?.name })}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelSubject(null)} sx={{ borderRadius: 2 }}>{t('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
