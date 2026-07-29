import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Select, InputLabel, FormControl, MenuItem,
  IconButton, Tooltip, Avatar, Pagination, Collapse, Grid,
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions,
  Radio, RadioGroup, FormControlLabel, Switch,
} from '@mui/material';
import {
  Search, FilterList, Refresh, Person, School, CheckCircle,
  Block, Archive, Unarchive, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const AdvancedStudentSearchPage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [searched, setSearched] = useState(false);

  const [filters, setFilters] = useState({
    name: '', studentId: '', admissionNumber: '', grade: '', sectionId: '',
    status: '', stream: '', academicYear: '', guardianName: '', guardianPhone: '', phone: '',
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('Active');
  const [bulkReason, setBulkReason] = useState('');

  const handleSearch = useCallback(async (p?: number) => {
    setLoading(true);
    setError('');
    setSearched(true);
    const params: any = { ...filters, page: p || page, limit: 30 };
    Object.keys(params).forEach((k) => { if (!params[k] && params[k] !== 0) delete params[k]; });
    try {
      const r = await studentsAPI.advancedSearch(params);
      setResults(r.data.data || []);
      setTotal(r.data.pagination?.total || 0);
      setTotalPages(r.data.pagination?.pages || 1);
    } catch { setError(tStudent('searchFailed')); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { if (searched) handleSearch(); }, [page]);

  const handleBulkUpdate = async () => {
    if (selected.length === 0) return;
    try {
      await studentsAPI.bulkStatus({ studentIds: selected, status: bulkStatus, reason: bulkReason });
      showSuccess(`${selected.length} students updated to ${bulkStatus}`);
      setBulkDialog(false);
      setSelected([]);
      handleSearch();
    } catch { showError(tStudent('bulkUpdateFailed')); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === results.length) setSelected([]);
    else setSelected(results.map((r) => r._id));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tStudent('advancedStudentSearch')}
        </Typography>
        <Button startIcon={<FilterList />} onClick={() => setShowFilters(!showFilters)} sx={{ borderRadius: 2 }}>
          {showFilters ? tStudent('hideFilters') : tStudent('showFilters')}
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" onClick={() => setBulkDialog(true)} sx={{ borderRadius: 2 }}>
            {tStudent('bulkAction', { count: selected.length })}
          </Button>
        )}
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => handleSearch()}><Refresh /></IconButton></Tooltip>
      </Box>

      <Collapse in={showFilters}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('nameFirstOrLast')} value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('studentId')} value={filters.studentId}
                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('admissionNumber')} value={filters.admissionNumber}
                onChange={(e) => setFilters({ ...filters, admissionNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{tStudent('gradeLabel')}</InputLabel>
                <Select value={filters.grade} label={tStudent('gradeLabel')} onChange={(e) => setFilters({ ...filters, grade: e.target.value })}>
                  <MenuItem value="">{tStudent('allStreams')}</MenuItem>
                  {[9, 10, 11, 12].map((g) => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{tStudent('status')}</InputLabel>
                <Select value={filters.status} label={tStudent('status')} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <MenuItem value="">{tStudent('allStatuses')}</MenuItem>
                  <MenuItem value="Active">{tStudent('active')}</MenuItem>
                  <MenuItem value="Suspended">{tStudent('suspended')}</MenuItem>
                  <MenuItem value="Archived">{tStudent('archived')}</MenuItem>
                  <MenuItem value="Withdrawn">{tStudent('withdrawn')}</MenuItem>
                  <MenuItem value="Graduated">{tStudent('graduated')}</MenuItem>
                  <MenuItem value="Transferred">{tStudent('transferred')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{tStudent('stream')}</InputLabel>
                <Select value={filters.stream} label={tStudent('stream')} onChange={(e) => setFilters({ ...filters, stream: e.target.value })}>
                  <MenuItem value="">{tStudent('allStreams')}</MenuItem>
                  <MenuItem value="Natural Science">{tStudent('naturalScience')}</MenuItem>
                  <MenuItem value="Social Science">{tStudent('socialScience')}</MenuItem>
                  <MenuItem value="Common">{tStudent('common')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('academicYear')} value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('phone')} value={filters.phone}
                onChange={(e) => setFilters({ ...filters, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('guardian')} value={filters.guardianName}
                onChange={(e) => setFilters({ ...filters, guardianName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label={tStudent('guardianPhone')} value={filters.guardianPhone}
                onChange={(e) => setFilters({ ...filters, guardianPhone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1.5}>
                <Button variant="contained" startIcon={<Search />} onClick={() => { setPage(1); handleSearch(); }} sx={{ borderRadius: 2 }}>
                  {tCommon('search')}
                </Button>
                <Button variant="outlined" onClick={() => {
                  setFilters({ name: '', studentId: '', admissionNumber: '', grade: '', sectionId: '', status: '', stream: '', academicYear: '', guardianName: '', guardianPhone: '', phone: '' });
                  setResults([]);
                  setSearched(false);
                  setSelected([]);
                }} sx={{ borderRadius: 2 }}>
                  {tCommon('clear')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {searched && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={1.5}>
            <Typography variant="body2" color="text.secondary">
              {loading ? tStudent('searching') : tStudent('resultsCount', { count: total })}
              {selected.length > 0 && ` — ${tStudent('selectedCount', { count: selected.length })}`}
            </Typography>
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={6}><CircularProgress size={28} /></Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox checked={results.length > 0 && selected.length === results.length} indeterminate={selected.length > 0 && selected.length < results.length} onChange={selectAll} />
                      </TableCell>
                      <TableCell>{tStudent('studentId')}</TableCell>
                      <TableCell>{tStudent('fullName')}</TableCell>
                      <TableCell>{tStudent('gradeLabel')}</TableCell>
                      <TableCell>{tStudent('section')}</TableCell>
                      <TableCell>{tStudent('status')}</TableCell>
                      <TableCell>{tStudent('stream')}</TableCell>
                      <TableCell align="right">{tCommon('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <School sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                          <Typography color="text.secondary">{tStudent('noStudentsMatch')}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : results.map((s) => (
                      <TableRow key={s._id} hover selected={selected.includes(s._id)}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected.includes(s._id)} onChange={() => toggleSelect(s._id)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={700} fontSize="0.75rem">
                            {s.studentId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 26, height: 26, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.65rem', fontWeight: 700 }}>
                              {s.firstName?.[0]}{s.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}
                                sx={{ cursor: 'pointer', '&:hover': { color: '#1B4F8A' } }}
                                onClick={() => navigate(`/students/${s._id}`)}>
                                {s.firstName} {s.lastName}
                              </Typography>
                              {s.admissionNumber && (
                                <Typography variant="caption" color="text.secondary">{s.admissionNumber}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{tCommon('grade')} {s.grade}</TableCell>
                        <TableCell>{s.section?.name || <Typography variant="caption" color="text.secondary">—</Typography>}</TableCell>
                        <TableCell>
                          <Chip label={s.status} size="small" color={
                            s.status === 'Active' ? 'success' : s.status === 'Suspended' ? 'warning' : s.status === 'Archived' ? 'error' : 'default'
                          } variant="outlined" sx={{ borderRadius: 1 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.stream || '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/students/${s._id}`)} sx={{ borderRadius: 1, fontSize: '0.7rem' }}>
                            {tCommon('view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" p={2}>
                  <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

      {!searched && !loading && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 8, textAlign: 'center' }}>
          <Search sx={{ fontSize: 56, color: '#9CA3AF', opacity: 0.25, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" mb={0.5}>{tStudent('advancedStudentSearch')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tStudent('advancedSearchDescription')}
          </Typography>
        </Paper>
      )}

      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tStudent('bulkStatusUpdate')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>{tStudent('studentsSelected', { count: selected.length })}</Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              {['Active', 'Suspended', 'Archived'].map((s) => (
                <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
              ))}
            </RadioGroup>
          </FormControl>
          <TextField fullWidth size="small" label={tStudent('reasonOptional')} value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" color={bulkStatus === 'Archived' ? 'error' : bulkStatus === 'Suspended' ? 'warning' : 'primary'}
            onClick={handleBulkUpdate}>{tCommon('update')} {selected.length} Students</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
