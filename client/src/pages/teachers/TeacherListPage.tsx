import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Chip, IconButton, CircularProgress,
  Alert, Pagination, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Edit, Visibility, Search, Refresh, School, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export const TeacherListPage = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const role = user?.role;

  const canManage = role === 'system_admin';
  const canAssign = role === 'system_admin' || role === 'academic_head';

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; teacherId: string; teacherName: string }>({ open: false, teacherId: '', teacherName: '' });

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.list({ page, limit: 20, search: searchSubmitted || undefined });
      setTeachers(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [page, searchSubmitted]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const handleSearch = () => {
    setSearchSubmitted(search);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await teachersAPI.delete(id);
      showSuccess('Teacher terminated');
      fetchTeachers();
    } catch {
      showError('Failed to terminate teacher');
    }
    setTerminateDialog({ open: false, teacherId: '', teacherName: '' });
  };

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tTeacher('title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tTeacher('subtitle')}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {canManage && (
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/teachers/new')} sx={{ borderRadius: 2, px: 3 }}>{tTeacher('create')}</Button>
          )}
          <Tooltip title={tCommon('refresh')}><IconButton onClick={() => { setSearchSubmitted(''); setSearch(''); setPage(1); }} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <Box display="flex" gap={1.5}>
          <TextField
            label={tCommon('searchByNameOrId')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            size="small"
            sx={{ minWidth: 280 }}
            InputProps={{ endAdornment: <Search color="action" /> }}
          />
           <Button variant="outlined" onClick={handleSearch} sx={{ borderRadius: 2 }}>{tCommon('searchButton')}</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : (
        <>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('id')}</TableCell>
                    <TableCell>{tCommon('name')}</TableCell>
                    <TableCell>{tCommon('gender')}</TableCell>
                    <TableCell>{tCommon('phoneEmail')}</TableCell>
                    <TableCell>{tCommon('position')}</TableCell>
                    <TableCell>{tCommon('employment')}</TableCell>
                    <TableCell>{tCommon('status')}</TableCell>
                    <TableCell align="right">{tCommon('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <School sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                        <Typography color="text.secondary">{tTeacher('noTeachers')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((t) => {
                      const degree = t.qualifications?.[0];
                      return (
                        <TableRow key={t._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={700} fontSize="0.8rem">{t.teacherId}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Box sx={{
                                width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(27,79,138,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#1B4F8A', fontWeight: 700, fontSize: '0.7rem',
                              }}>
                                {t.firstName?.[0]}{t.lastName?.[0]}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {[t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ')}
                                </Typography>
                                {degree && <Typography variant="caption" color="text.secondary">{degree.degree} in {degree.field}</Typography>}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontSize="0.8rem">{t.gender || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontSize="0.8rem">{t.phoneNumber || t.email || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={t.position || 'Subject Teacher'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={t.employmentType || 'Full-time'} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.status || 'Active'}
                              size="small"
                              sx={{
                                fontWeight: 600, fontSize: '0.7rem',
                                bgcolor: t.status === 'Active' ? 'rgba(45,125,58,0.12)' : t.status === 'On Leave' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.1)',
                                color: t.status === 'Active' ? '#2D7D3A' : t.status === 'On Leave' ? '#B45309' : '#6B7280',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={tCommon('viewProfile')}>
                              <IconButton size="small" onClick={() => navigate(`/teachers/${t._id}`)} sx={{ borderRadius: 1.5 }}><Visibility fontSize="small" /></IconButton>
                            </Tooltip>
                           {canManage && (
                              <>
                                <Tooltip title={tCommon('edit')}>
                                  <IconButton size="small" onClick={() => navigate(`/teachers/${t._id}/edit`)} sx={{ borderRadius: 1.5 }}><Edit fontSize="small" /></IconButton>
                                </Tooltip>
                                <Tooltip title={tTeacher('terminate')}>
                                  <IconButton size="small" onClick={() => setTerminateDialog({ open: true, teacherId: t._id, teacherName: `${t.firstName} ${t.lastName}` })} sx={{ borderRadius: 1.5, color: '#DC2626' }}><Delete fontSize="small" /></IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2.5}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}

      <Dialog open={terminateDialog.open} onClose={() => setTerminateDialog({ open: false, teacherId: '', teacherName: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tTeacher('terminateTeacher')}</DialogTitle>
        <DialogContent>
          <Typography>{tTeacher('terminateConfirm', { name: terminateDialog.teacherName })}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setTerminateDialog({ open: false, teacherId: '', teacherName: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={() => handleDelete(terminateDialog.teacherId)} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tTeacher('terminate')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};