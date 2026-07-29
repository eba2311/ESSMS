import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Avatar,
  Tooltip,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Collapse,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Search,
  School,
  FilterList,
  EmojiEvents,
  TrendingUp,
  MoreVert,
  PersonAdd,
  Block,
  Archive,
  Unarchive,
  School as GraduateIcon,
  ExpandMore,
  ExpandLess,
  Phone,
  Badge,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  canCreateStudents,
  canEditStudents,
  canSuspendStudents,
  canArchiveStudents,
  canGraduateStudents,
  canPromoteStudents,
  canTransferStudents,
} from '../../utils/permissions';

const statusStyles: Record<string, any> = {
  'Active': { bg: 'rgba(45,125,58,0.12)', color: '#2D7D3A' },
  'Pending Approval': { bg: 'rgba(201,146,10,0.12)', color: '#C9920A' },
  'Suspended': { bg: 'rgba(181,37,26,0.12)', color: '#B5251A' },
  'Transferred': { bg: 'rgba(27,79,138,0.12)', color: '#1B4F8A' },
  'Withdrawn': { bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
  'Graduated': { bg: 'rgba(27,79,138,0.12)', color: '#1B4F8A' },
  'Archived': { bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
};

const allStatuses = ['Active', 'Pending Approval', 'Suspended', 'Transferred', 'Withdrawn', 'Graduated', 'Archived'];

export const StudentListPage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (searchSubmitted) params.search = searchSubmitted;
      if (gradeFilter) params.grade = gradeFilter;
      if (statusFilter) params.status = statusFilter;
      if (academicYearFilter) params.academicYear = academicYearFilter;
      const response = await studentsAPI.list(params);
      setStudents(response.data.data?.students || []);
      setTotalPages(response.data.data?.pagination?.pages || 1);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load students';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, gradeFilter, statusFilter, academicYearFilter, searchSubmitted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSubmitted(search);
    setPage(1);
  };

  const handleActionMenu = (event: React.MouseEvent<HTMLElement>, student: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleSuspend = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.suspend(selectedStudent._id, { reason: 'Suspended by administrator' });
      showSuccess('Student suspended');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed'); }
    handleActionClose();
  };

  const handleApprove = async () => {
    if (!selectedStudent) return;
    try {
      const res = await studentsAPI.approve(selectedStudent._id);
      const creds = res.data.data?.credentials;
      let msg = 'Admission approved. Student account created.';
      if (creds) msg += ` Username: ${creds.username}, Password: ${creds.tempPassword}`;
      showSuccess(msg);
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed to approve'); }
    handleActionClose();
  };

  const handleArchive = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.archive(selectedStudent._id, { reason: 'Archived by administrator' });
      showSuccess('Student archived');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed'); }
    handleActionClose();
  };

  const [promoteDialog, setPromoteDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [promoteData, setPromoteData] = useState({ newGrade: '', newSectionId: '', stream: '', reason: '' });
  const [transferData, setTransferData] = useState({ transferSchool: '', transferReason: '', transferDate: '' });

  const handleRestore = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.restore(selectedStudent._id, { reason: 'Restored by administrator' });
      showSuccess('Student restored');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed'); }
    handleActionClose();
  };

  const handleGraduate = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.graduate(selectedStudent._id, {});
      showSuccess('Student graduated');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed'); }
    handleActionClose();
  };

  const handlePromoteSubmit = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.promote(selectedStudent._id, { ...promoteData, newGrade: Number(promoteData.newGrade) });
      showSuccess('Student promoted');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed to promote'); }
    setPromoteDialog(false);
    handleActionClose();
  };

  const handleTransferSubmit = async () => {
    if (!selectedStudent) return;
    try {
      await studentsAPI.transfer(selectedStudent._id, transferData);
      showSuccess('Student transferred');
      fetchStudents();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed to transfer'); }
    setTransferDialog(false);
    handleActionClose();
  };

  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={1.5}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tStudent('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {tStudent('subtitle')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {canCreateStudents(user?.role) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/students/new')}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {tStudent('create')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}
      >
        <Box component="form" onSubmit={handleSearch} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder={tCommon('searchStudents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="outlined" size="small" sx={{ borderRadius: 2 }}>
            {tCommon('searchButton')}
          </Button>
          <Button
            size="small"
            startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ borderRadius: 2 }}
          >
            {tCommon('filters')}
          </Button>
        </Box>

        <Collapse in={showFilters}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mt={2} pt={2} sx={{ borderTop: '1px solid rgba(229,231,235,0.6)' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>{tCommon('grade')}</InputLabel>
              <Select value={gradeFilter} label={tCommon('grade')} onChange={(e) => { setGradeFilter(e.target.value as string); setPage(1); }}>
                <MenuItem value="">{tCommon('allGrades')}</MenuItem>
                {[9, 10, 11, 12].map((g) => (
                  <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tCommon('status')}</InputLabel>
              <Select value={statusFilter} label={tCommon('status')} onChange={(e) => { setStatusFilter(e.target.value as string); setPage(1); }}>
                <MenuItem value="">{tCommon('allStatuses')}</MenuItem>
                {allStatuses.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label={tCommon('academicYear')}
              placeholder={tCommon('academicYearPlaceholder')}
              value={academicYearFilter}
              onChange={(e) => { setAcademicYearFilter(e.target.value); setPage(1); }}
              sx={{ minWidth: 150 }}
            />
          </Box>
        </Collapse>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('student')}</TableCell>
                  <TableCell>{tCommon('idAdmission')}</TableCell>
                  <TableCell>{tCommon('grade')}</TableCell>
                  <TableCell>{tCommon('section')}</TableCell>
                  <TableCell>{tCommon('average')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                  <TableCell align="right">{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <School sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4 }} />
                        <Typography color="text.muted">{tStudent('noStudents')}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const avg = student.average ?? student.gpa ?? 0;
                    return (
                      <TableRow
                        key={student._id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => navigate(`/students/${student._id}`)}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: 'rgba(27,79,138,0.1)',
                                color: '#1B4F8A',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {student.firstName} {student.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.muted">
                                {student.gender || '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" color="text.secondary">
                            {student.studentId}
                          </Typography>
                          {student.admissionNumber && (
                            <Typography variant="caption" display="block" color="text.muted">
                              Adm: {student.admissionNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            Grade {student.grade || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student.section?.name || '—'}
                          </Typography>
                          {student.stream && (
                            <Typography variant="caption" color="text.muted">
                              {student.stream}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 36,
                                height: 28,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: `${getAvgColor(avg)}15`,
                                color: getAvgColor(avg),
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {avg > 0 ? `${avg}%` : '—'}
                            </Box>
                            <TrendingUp sx={{ fontSize: 14, color: avg >= 50 ? '#2D7D3A' : '#B5251A', opacity: avg > 0 ? 1 : 0.2 }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={student.status || 'Active'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              bgcolor: statusStyles[student.status]?.bg || 'rgba(156,163,175,0.15)',
                              color: statusStyles[student.status]?.color || '#6B7280',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title={tCommon('viewProfile')}>
                              <IconButton size="small" onClick={() => navigate(`/students/${student._id}`)}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canEditStudents(user?.role) && (
                              <Tooltip title={tStudent('editStudent')}>
                                <IconButton size="small" onClick={() => navigate(`/students/${student._id}/edit`)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(canSuspendStudents(user?.role) || canArchiveStudents(user?.role) || canGraduateStudents(user?.role)) && (
                              <Tooltip title={tCommon('moreActions')}>
                                <IconButton size="small" onClick={(e) => handleActionMenu(e, student)}>
                                  <MoreVert fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                sx={{
                  '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 600 },
                  '& .Mui-selected': { bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A' },
                }}
              />
            </Box>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedStudent && (
          <MenuItem onClick={() => { handleActionClose(); navigate(`/assessments/report-card/${selectedStudent._id}`); }}>
            <ListItemIcon><School fontSize="small" /></ListItemIcon>
            <ListItemText>{tStudent('reportCard')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status === 'Pending Approval' && canEditStudents(user?.role) && (
          <MenuItem onClick={handleApprove}>
            <ListItemIcon><PersonAdd fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>{tStudent('approveAdmission')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status === 'Active' && canPromoteStudents(user?.role) && (
          <MenuItem onClick={() => { handleActionClose(); setPromoteData({ newGrade: String(selectedStudent.grade + 1), newSectionId: '', stream: '', reason: '' }); setPromoteDialog(true); }}>
            <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
            <ListItemText>{tStudent('promote')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status === 'Active' && canTransferStudents(user?.role) && (
          <MenuItem onClick={() => { handleActionClose(); setTransferData({ transferSchool: '', transferReason: '', transferDate: new Date().toISOString().split('T')[0] }); setTransferDialog(true); }}>
            <ListItemIcon><School fontSize="small" /></ListItemIcon>
            <ListItemText>{tStudent('transfer')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status === 'Active' && canSuspendStudents(user?.role) && (
          <MenuItem onClick={handleSuspend}>
            <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>{tStudent('suspend')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status === 'Active' && selectedStudent?.grade === 12 && canGraduateStudents(user?.role) && (
          <MenuItem onClick={handleGraduate}>
            <ListItemIcon><GraduateIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>{tStudent('graduate')}</ListItemText>
          </MenuItem>
        )}
        {(selectedStudent?.status === 'Suspended' || selectedStudent?.status === 'Archived' || selectedStudent?.status === 'Withdrawn') && (
          <MenuItem onClick={handleRestore}>
            <ListItemIcon><Unarchive fontSize="small" /></ListItemIcon>
            <ListItemText>{tStudent('restore')}</ListItemText>
          </MenuItem>
        )}
        {selectedStudent?.status !== 'Archived' && canArchiveStudents(user?.role) && (
          <MenuItem onClick={handleArchive}>
            <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
            <ListItemText>{tStudent('archive')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Promote Dialog */}
      <Dialog open={promoteDialog} onClose={() => setPromoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tStudent('promoteStudent')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label={tStudent('newGrade')} type="number" value={promoteData.newGrade} onChange={(e) => setPromoteData({ ...promoteData, newGrade: e.target.value })} inputProps={{ min: 9, max: 12 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tCommon('stream')} value={promoteData.stream} onChange={(e) => setPromoteData({ ...promoteData, stream: e.target.value })} placeholder={tStudent('streamPlaceholder')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tCommon('reason')} value={promoteData.reason} onChange={(e) => setPromoteData({ ...promoteData, reason: e.target.value })} multiline rows={2} placeholder={tStudent('reasonForPromotion')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPromoteDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handlePromoteSubmit} sx={{ borderRadius: 2, textTransform: 'none' }}>{tStudent('promote')}</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tStudent('transferStudent')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('transferToSchool')} value={transferData.transferSchool} onChange={(e) => setTransferData({ ...transferData, transferSchool: e.target.value })} required placeholder={tStudent('schoolNamePlaceholder')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('transferDate')} type="date" value={transferData.transferDate} onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('reasonForTransfer')} value={transferData.transferReason} onChange={(e) => setTransferData({ ...transferData, transferReason: e.target.value })} multiline rows={2} required placeholder={tStudent('reasonForTransfer')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleTransferSubmit} sx={{ borderRadius: 2, textTransform: 'none' }}>{tStudent('transfer')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};