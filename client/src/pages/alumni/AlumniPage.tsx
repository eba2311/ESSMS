import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Grid, Card, CardContent, TextField, MenuItem, TablePagination,
  InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import { alumniAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const AlumniPage = () => {
  const { t: tAlumni } = useTranslation('alumni');
  const { showError } = useNotification();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const fetch = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([alumniAPI.list({ limit: 1000 }), alumniAPI.stats()]);
      setAlumni(res.data.data?.alumni || []);
      setStats(statsRes.data.data);
    } catch { showError(tAlumni('failedToLoad')); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const statusColors: Record<string, any> = { Employed: 'success', 'Self-Employed': 'info', Unemployed: 'default', 'Further Education': 'primary', Unknown: 'default' };

  const graduationYears = [...new Set(alumni.map((a: any) => a.graduationYear).filter(Boolean))].sort((a: any, b: any) => b - a);

  const filtered = alumni.filter((a: any) => {
    const matchSearch = !search ||
      `${a.student?.firstName} ${a.student?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (a.currentEmployment?.employer || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.higherEducation?.institution || '').toLowerCase().includes(search.toLowerCase());
    const matchYear = !yearFilter || String(a.graduationYear) === yearFilter;
    const matchStatus = !statusFilter || a.currentEmployment?.status === statusFilter;
    return matchSearch && matchYear && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{tAlumni('pageTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{tAlumni('pageSubtitle')}</Typography>
        </Box>
        <Tooltip title={tAlumni('refresh')}>
          <IconButton onClick={fetch} size="small" sx={{ borderRadius: 2 }}><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {stats && (
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}><CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary">{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">{tAlumni('totalAlumni')}</Typography>
            </CardContent></Card>
          </Grid>
          {(stats.byYear || []).slice(0, 3).map((y: any) => (
            <Grid key={y._id} item xs={12} md={3}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}><CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="secondary">{y.count}</Typography>
                <Typography variant="caption" color="text.secondary">{tAlumni('classOf', { year: y._id })}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField fullWidth size="small" placeholder={tAlumni('searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth size="small" label={tAlumni('graduationYear')} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="">{tAlumni('allYears')}</MenuItem>
              {graduationYears.map((y: any) => <MenuItem key={y} value={String(y)}>{tAlumni('classOf', { year: y })}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth size="small" label={tAlumni('employmentStatus')} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="">{tAlumni('allStatus')}</MenuItem>
              {Object.keys(statusColors).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress size={32} /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{tAlumni('colStudent')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tAlumni('colGraduationYear')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tAlumni('colEmploymentStatus')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tAlumni('colEmployer')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{tAlumni('colHigherEducation')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((a: any) => (
                  <TableRow key={a._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{a.student?.firstName} {a.student?.lastName}</TableCell>
                    <TableCell>{a.graduationYear || '—'}</TableCell>
                    <TableCell><Chip label={a.currentEmployment?.status || 'Unknown'} size="small" color={statusColors[a.currentEmployment?.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                    <TableCell>{a.currentEmployment?.employer || '—'}</TableCell>
                    <TableCell>{a.higherEducation?.enrolled ? `${a.higherEducation.institution || ''} ${a.higherEducation.program || ''}` : '—'}</TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">{alumni.length === 0 ? tAlumni('noRecords') : tAlumni('noMatches')}</Typography></TableCell></TableRow>}
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
    </Box>
  );
};
