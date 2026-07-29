import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, IconButton, Tooltip, TextField, Grid, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack, Search, FilterList, CheckCircle, Cancel, Warning, School,
  TrendingUp, People,
} from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

export const PromotionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [roster, setRoster] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [promotionResult, setPromotionResult] = useState<any>(null);

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
      setSelectedIds([]);
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
    if (statusFilter) {
      data = data.filter((r: any) => r.promotionStatus === statusFilter);
    }
    return data;
  }, [roster, search, statusFilter]);

  const stats = useMemo(() => ({
    total: roster.length,
    promoted: roster.filter(r => r.promotionStatus === 'Promoted').length,
    repeat: roster.filter(r => r.promotionStatus === 'Repeat').length,
    incomplete: roster.filter(r => r.promotionStatus === 'Incomplete').length,
    avg: roster.length > 0 ? (roster.reduce((sum, r) => sum + (r.annualAverage || 0), 0) / roster.length).toFixed(1) : '0',
  }), [roster]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRoster.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRoster.map(r => r.studentId));
    }
  };

  const handlePromote = async (action: 'promote' | 'repeat') => {
    if (selectedIds.length === 0) { showError('Select students first'); return; }
    setConfirmDialog({ open: true, action });
  };

  const executePromotion = async () => {
    try {
      setPromoting(true);
      const action = confirmDialog.action as 'promote' | 'repeat';
      const res = await rosterAPI.promoteStudents({
        academicYear,
        studentIds: selectedIds,
        action,
      });
      const result = res.data.data;
      setPromotionResult(result);
      showSuccess(res.data.message || 'Promotion executed');
      setConfirmDialog({ open: false, action: '' });
      setSelectedIds([]);
      await fetchRoster();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2} className="no-print">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('promotion.title')}
        </Typography>
      </Box>

      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} className="no-print">
        <Typography variant="body2">
          <strong>{tRoster('promotion.promote')}</strong> {tRoster('promotion.promoteDesc')}
          <strong> {tRoster('promotion.repeat')}</strong> {tRoster('promotion.repeatDesc')}
          {tRoster('promotion.calculateHint')}
        </Typography>
      </Alert>

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
              fullWidth size="small" placeholder={tRoster('promotion.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </Grid>
        </Grid>

        <Box display="flex" gap={1} mt={2} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" color="text.secondary" mr={1}>{tCommon('status')}:</Typography>
          {['', 'Promoted', 'Repeat', 'Incomplete'].map(s => (
            <Chip key={s} label={s || tCommon('all')} size="small" variant={statusFilter === s ? 'filled' : 'outlined'}
              color={s === 'Repeat' ? 'error' : s === 'Promoted' ? 'success' : s === 'Incomplete' ? 'warning' : 'default'}
              onClick={() => setStatusFilter(s)} clickable sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} mb={2} className="no-print">
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="primary">{stats.total}</Typography>
            <Typography variant="caption" color="text.secondary">{tCommon('total')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="success.main">{stats.promoted}</Typography>
            <Typography variant="caption" color="text.secondary">{tRoster('promotion.eligible')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="error">{stats.repeat}</Typography>
            <Typography variant="caption" color="text.secondary">{tRoster('promotion.repeat')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="warning.main">{stats.incomplete}</Typography>
            <Typography variant="caption" color="text.secondary">{tRoster('dashboard.incomplete')}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="h6" fontWeight={800} color="info.main">{stats.avg}%</Typography>
            <Typography variant="caption" color="text.secondary">{tCommon('average')}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Action Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} className="no-print">
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length} {tCommon('of')} {filteredRoster.length} {tRoster('promotion.selected')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" color="success" onClick={() => handlePromote('promote')}
            disabled={selectedIds.length === 0} size="small" startIcon={<CheckCircle />}
            sx={{ borderRadius: 2 }}>
            {tRoster('promotion.promote')} ({selectedIds.length})
          </Button>
          <Button variant="contained" color="error" onClick={() => handlePromote('repeat')}
            disabled={selectedIds.length === 0} size="small" startIcon={<Cancel />}
            sx={{ borderRadius: 2 }}>
            {tRoster('promotion.markRepeat')} ({selectedIds.length})
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Promotion Result */}
      {promotionResult && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPromotionResult(null)}>
          <Typography variant="body2">
            <strong>{tRoster('promotion.promoted')}:</strong> {promotionResult.promoted?.length || 0} ·
            <strong> {tRoster('promotion.repeated')}:</strong> {promotionResult.repeated?.length || 0} ·
            <strong> {tRoster('promotion.skipped')}:</strong> {promotionResult.skipped?.length || 0}
          </Typography>
        </Alert>
      )}

      {/* Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input type="checkbox" checked={filteredRoster.length > 0 && selectedIds.length === filteredRoster.length}
                        onChange={toggleSelectAll} />
                    </TableCell>
                    <TableCell><b>#</b></TableCell>
                    <TableCell><b>{tCommon('studentId')}</b></TableCell>
                    <TableCell><b>{tCommon('name')}</b></TableCell>
                    <TableCell><b>{tCommon('section')}</b></TableCell>
                    <TableCell><b>{tRoster('semester.sem1')}</b></TableCell>
                    <TableCell><b>{tRoster('semester.sem2')}</b></TableCell>
                    <TableCell><b>{tRoster('annual.annualAvg')}</b></TableCell>
                    <TableCell><b>{tRoster('promotion.schoolRank')}</b></TableCell>
                    <TableCell><b>{tCommon('status')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoster.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center">
                      <Typography color="text.secondary">{roster.length === 0 ? tRoster('promotion.noDataHint') : tCommon('noMatchFilters')}</Typography>
                    </TableCell></TableRow>
                  ) : (
                    filteredRoster.map((row, idx) => (
                      <TableRow key={row.studentId || idx} hover
                        sx={{ bgcolor: selectedIds.includes(row.studentId) ? 'rgba(25,118,210,0.04)' : 'transparent' }}>
                        <TableCell padding="checkbox">
                          <input type="checkbox" checked={selectedIds.includes(row.studentId)}
                            onChange={() => toggleSelect(row.studentId)} />
                        </TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{row.studentId}</Typography></TableCell>
                        <TableCell><Typography fontWeight={600}>{row.fullName}</Typography></TableCell>
                        <TableCell>{row.section} (Gr. {row.grade})</TableCell>
                        <TableCell>{row.semester1Average ? `${row.semester1Average}%` : '-'}</TableCell>
                        <TableCell>{row.semester2Average ? `${row.semester2Average}%` : '-'}</TableCell>
                        <TableCell><Typography fontWeight={700}>{row.annualAverage ? `${row.annualAverage}%` : '-'}</Typography></TableCell>
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: '' })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmDialog.action === 'promote' ? tRoster('promotion.confirmPromotion') : tRoster('promotion.confirmRepeat')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'promote'
              ? tRoster('promotion.promoteConfirmMessage', { count: selectedIds.length })
              : tRoster('promotion.repeatConfirmMessage', { count: selectedIds.length })}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            {tRoster('promotion.cannotUndo')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmDialog({ open: false, action: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={executePromotion} variant="contained" disabled={promoting}
            color={confirmDialog.action === 'promote' ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
            {promoting ? tRoster('promotion.processing') : confirmDialog.action === 'promote' ? tRoster('promotion.promote') : tRoster('promotion.markRepeat')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
