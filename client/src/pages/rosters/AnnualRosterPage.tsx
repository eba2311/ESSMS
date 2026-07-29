import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, IconButton, Tooltip, TextField, Grid, InputAdornment,
} from '@mui/material';
import { Download, Print, Search, FilterList, ArrowBack, Refresh } from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { canCalculateRoster, canPromoteRoster } from '../../utils/permissions';

export const AnnualRosterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const canCalculate = canCalculateRoster(user?.role);
  const canPromote = canPromoteRoster(user?.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roster, setRoster] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [promotionFilter, setPromotionFilter] = useState('');
  const [sections, setSections] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
  const [academicYear, setAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );

  useEffect(() => { fetchSections(); }, [academicYear]);
  useEffect(() => { fetchRoster(); }, [academicYear, sectionFilter, gradeFilter]);

  const fetchSections = async () => {
    try {
      const res = await sectionsAPI.list({ academicYear });
      const data = res.data.data;
      setSections(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const fetchRoster = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { academicYear };
      if (sectionFilter) params.sectionId = sectionFilter;
      if (gradeFilter) params.grade = gradeFilter;
      const res = await rosterAPI.getAnnualRoster(params);
      setRoster(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch annual roster');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoster = useMemo(() => {
    let data = roster;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r: any) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q) ||
        r.section?.toLowerCase().includes(q)
      );
    }
    if (promotionFilter) {
      data = data.filter((r: any) => r.promotionStatus === promotionFilter);
    }
    return data;
  }, [roster, search, promotionFilter]);

  const promotionCounts = useMemo(() => {
    const c: Record<string, number> = { Promoted: 0, Repeat: 0, Incomplete: 0 };
    roster.forEach((r: any) => { if (r.promotionStatus && c[r.promotionStatus] !== undefined) c[r.promotionStatus]++; });
    return c;
  }, [roster]);

  const calculateRoster = async () => {
    try {
      setLoading(true);
      await rosterAPI.calculateAnnualRoster({ academicYear });
      await fetchRoster();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate annual roster');
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredRoster.length === 0) return;
    const headers = ['Student ID', 'Name', 'Gender', 'Section', 'Grade', 'Sem 1 Avg', 'Sem 2 Avg', 'Annual Avg', 'Attendance', 'Section Rank', 'Grade Rank', 'School Rank', 'Promotion Status'];
    const rows = filteredRoster.map(r => [
      r.studentId, r.fullName, r.gender || '', r.section, r.grade,
      r.semester1Average || '', r.semester2Average || '', r.annualAverage || '',
      r.attendance !== undefined ? `${r.attendance}%` : '',
      r.sectionRank || '', r.gradeRank || '', r.schoolRank || '', r.promotionStatus || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `annual_roster_${academicYear.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('annual.title')}
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }} className="no-print">
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterList color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700} color="primary">{tCommon('filters')}</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('academicYear')}</InputLabel>
              <Select value={academicYear} label={tCommon('academicYear')} onChange={(e) => setAcademicYear(e.target.value)}>
                {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('grade')}</InputLabel>
              <Select value={gradeFilter} label={tCommon('grade')} onChange={(e) => setGradeFilter(e.target.value)}>
                <MenuItem value="">{tCommon('allGrades')}</MenuItem>
                {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('section')}</InputLabel>
              <Select value={sectionFilter} label={tCommon('section')} onChange={(e) => setSectionFilter(e.target.value)}>
                <MenuItem value="">{tCommon('allSections')}</MenuItem>
                {sections.filter(s => !gradeFilter || s.grade === Number(gradeFilter)).map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} ({tCommon('grade')} {s.grade})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth size="small" placeholder={tRoster('annual.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </Grid>
        </Grid>

        <Box display="flex" gap={1} mt={2} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" color="text.secondary" mr={1}>{tRoster('annual.promotion')}:</Typography>
          {['', 'Promoted', 'Repeat', 'Incomplete'].map(p => (
            <Chip key={p} label={p || tCommon('all')} size="small" variant={promotionFilter === p ? 'filled' : 'outlined'}
              color={p === 'Repeat' ? 'error' : p === 'Promoted' ? 'success' : p === 'Incomplete' ? 'warning' : 'default'}
              onClick={() => setPromotionFilter(p)} clickable sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>
      </Paper>

      {/* Summary Stats */}
      <Grid container spacing={2} mb={2} className="no-print">
        <Grid item xs={6} sm={4} md={3}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="primary">{roster.length}</Typography>
            <Typography variant="caption" color="text.secondary">{tCommon('totalStudents')}</Typography>
          </Card>
        </Grid>
        {Object.entries(promotionCounts).map(([label, count]) => (
          <Grid item xs={6} sm={4} md={3} key={label}>
            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
              <Typography variant="h6" fontWeight={800} color={label === 'Repeat' ? 'error' : label === 'Promoted' ? 'success' : 'warning'}>
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} className="no-print">
        <Typography variant="body2" color="text.secondary">
          {filteredRoster.length} {tCommon('of')} {roster.length} {tCommon('students')}
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={tCommon('refresh')}>
            <IconButton color="primary" onClick={fetchRoster}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={tCommon('print')}>
            <IconButton color="primary" onClick={() => window.print()}><Print fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={tCommon('exportCSV')}>
            <IconButton color="success" onClick={handleExportCSV}><Download fontSize="small" /></IconButton>
          </Tooltip>
          {canCalculate && (
            <Button variant="contained" color="secondary" onClick={calculateRoster} size="small" sx={{ borderRadius: 2 }}>
              {tRoster('annual.calculateAnnualRoster')}
            </Button>
          )}
          {canPromote && (
            <Button variant="outlined" onClick={() => navigate('/rosters/promote')} size="small" sx={{ borderRadius: 2 }}>
              {tRoster('annual.promoteStudents')}
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Print Header */}
      <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">{tRoster('annual.printTitle')}</Typography>
        <Typography variant="body1">{tCommon('academicYear')}: {academicYear}</Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell><b>#</b></TableCell>
                    <TableCell><b>{tRoster('studentId')}</b></TableCell>
                    <TableCell><b>{tCommon('name')}</b></TableCell>
                    <TableCell><b>{tCommon('gender')}</b></TableCell>
                    <TableCell><b>{tCommon('section')}</b></TableCell>
                    <TableCell><b>{tRoster('sem1Avg')}</b></TableCell>
                    <TableCell><b>{tRoster('sem2Avg')}</b></TableCell>
                    <TableCell><b>{tRoster('annualAvg')}</b></TableCell>
                    <TableCell><b>{tRoster('attendance')}</b></TableCell>
                    <TableCell><b>{tRoster('schoolRank')}</b></TableCell>
                    <TableCell><b>{tRoster('promotion')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoster.length === 0 ? (
                    <TableRow><TableCell colSpan={11} align="center">
                      <Typography color="text.secondary">{roster.length === 0 ? tCommon('noDataFound') : tCommon('noMatchFilters')}</Typography>
                    </TableCell></TableRow>
                  ) : (
                    filteredRoster.map((row, idx) => (
                      <TableRow key={row.studentId || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{row.studentId}</Typography></TableCell>
                        <TableCell><Typography fontWeight={600}>{row.fullName}</Typography></TableCell>
                        <TableCell>
                          <Chip label={row.gender || '—'} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
                        </TableCell>
                        <TableCell>{row.section} (Gr. {row.grade})</TableCell>
                        <TableCell>{row.semester1Average ? `${row.semester1Average}%` : '-'}</TableCell>
                        <TableCell>{row.semester2Average ? `${row.semester2Average}%` : '-'}</TableCell>
                        <TableCell><Typography fontWeight={700}>{row.annualAverage ? `${row.annualAverage}%` : '-'}</Typography></TableCell>
                        <TableCell>
                          {row.attendance !== undefined ? (
                            <Chip label={`${row.attendance}%`} size="small"
                              color={row.attendance >= 90 ? 'success' : row.attendance >= 75 ? 'warning' : 'error'}
                              sx={{ fontSize: '0.6rem', fontWeight: 600 }} />
                          ) : '-'}
                        </TableCell>
                        <TableCell>{row.schoolRank || '-'}</TableCell>
                        <TableCell>
                          {row.promotionStatus ? (
                            <Chip label={row.promotionStatus} size="small"
                              color={row.promotionStatus === 'Repeat' ? 'error' : row.promotionStatus === 'Promoted' ? 'success' : 'warning'}
                              sx={{ fontSize: '0.65rem' }} />
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Generated on {new Date().toLocaleString()} · {tRoster('annual.annual')} · {academicYear} · ESSMS
        </Typography>
      </Box>
    </Box>
  );
};
