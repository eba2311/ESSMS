import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, IconButton, Tooltip, TextField, Grid, InputAdornment,
  LinearProgress,
} from '@mui/material';
import { Download, Print, Search, FilterList, ArrowBack, Refresh } from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { canCalculateRoster } from '../../utils/permissions';

export const SemesterRosterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const canCalculate = canCalculateRoster(user?.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roster, setRoster] = useState<any[]>([]);
  const [semester, setSemester] = useState<'1' | '2'>('1');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
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
  useEffect(() => { fetchRoster(); }, [semester, academicYear, sectionFilter, gradeFilter]);

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
      const params: any = { semester, academicYear };
      if (sectionFilter) params.sectionId = sectionFilter;
      if (gradeFilter) params.grade = gradeFilter;
      const res = await rosterAPI.getSemesterRoster(params);
      setRoster(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch semester roster');
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
    if (resultFilter) {
      data = data.filter((r: any) => r.result === resultFilter);
    }
    return data;
  }, [roster, search, resultFilter]);

  const allSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    roster.forEach((r: any) => {
      if (r.marks) {
        r.marks.forEach((m: any) => {
          if (m.subjectName && !subjectMap.has(m.subjectId || m.subjectName)) {
            subjectMap.set(m.subjectId || m.subjectName, m.subjectName);
          }
        });
      }
    });
    return Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [roster]);

  const getSubjectMark = (row: any, subjectId: string) => {
    if (!row.marks) return null;
    return row.marks.find((m: any) => (m.subjectId || m.subjectName) === subjectId);
  };

  const resultCounts = useMemo(() => {
    const counts: Record<string, number> = { Excellent: 0, 'Very Good': 0, Good: 0, Pass: 0, Fail: 0 };
    roster.forEach((r: any) => { if (r.result && counts[r.result] !== undefined) counts[r.result]++; });
    return counts;
  }, [roster]);

  const calculateRoster = async () => {
    try {
      setLoading(true);
      await rosterAPI.calculateSemesterRoster({ academicYear, semester });
      await fetchRoster();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate semester roster');
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredRoster.length === 0) return;
    const subjectHeaders = allSubjects.map(s => s.name);
    const headers = ['Student ID', 'Name', 'Gender', 'Section', 'Grade', ...subjectHeaders, 'Total', 'Average', 'Attendance', 'Section Rank', 'Grade Rank', 'Result'];
    const rows = filteredRoster.map(r => {
      const subjectMarks = allSubjects.map(s => {
        const mark = getSubjectMark(r, s.id);
        return mark ? `${mark.mark}` : '';
      });
      return [
        r.studentId, r.fullName, r.gender || '', r.section, r.grade,
        ...subjectMarks,
        r.totalMarks || '', r.average || '',
        r.attendance !== undefined ? `${r.attendance}%` : '', r.sectionRank || '', r.gradeRank || '', r.result || ''
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `semester_${semester}_${academicYear.replace('/', '-')}_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBarColor = (val: number) => {
    if (val >= 80) return '#10B981';
    if (val >= 60) return '#3B82F6';
    if (val >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('semester.title', { semester })}
        </Typography>
      </Box>

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
              <InputLabel>{tCommon('semester')}</InputLabel>
              <Select value={semester} label={tCommon('semester')} onChange={(e) => setSemester(e.target.value as '1' | '2')}>
                <MenuItem value="1">{tRoster('semester.semester1')}</MenuItem>
                <MenuItem value="2">{tRoster('semester.semester2')}</MenuItem>
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth size="small" placeholder={tRoster('semester.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </Grid>
        </Grid>
        <Box display="flex" gap={1} mt={2} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" color="text.secondary" mr={1}>{tCommon('result')}:</Typography>
          {['', 'Excellent', 'Very Good', 'Good', 'Pass', 'Fail'].map(r => (
            <Chip key={r} label={r || tCommon('all')} size="small" variant={resultFilter === r ? 'filled' : 'outlined'}
              color={r === 'Fail' ? 'error' : r === 'Excellent' ? 'success' : r === 'Pass' ? 'warning' : 'default'}
              onClick={() => setResultFilter(r)} clickable sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>
      </Paper>

      <Grid container spacing={2} mb={2} className="no-print">
        {Object.entries(resultCounts).map(([label, count]) => (
          <Grid item xs={6} sm={4} md={2.4} key={label}>
            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 1, border: '1px solid rgba(229,231,235,0.6)' }}>
              <Typography variant="h6" fontWeight={800} color={label === 'Fail' ? 'error' : label === 'Excellent' ? 'success' : 'primary'}>
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} className="no-print">
        <Typography variant="body2" color="text.secondary">
          {filteredRoster.length} {tCommon('of')} {roster.length} {tCommon('students')} · {allSubjects.length} {tRoster('semester.subjects')}
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
              {tRoster('semester.calculateRoster')}
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">{tRoster('semester.printTitle', { semester })}</Typography>
        <Typography variant="body1">{tCommon('academicYear')}: {academicYear}</Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '75vh' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', zIndex: 2, minWidth: 30, position: 'sticky', left: 0 }}><b>#</b></TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', zIndex: 2, minWidth: 80, position: 'sticky', left: 30 }}><b>ID</b></TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', zIndex: 2, minWidth: 140, position: 'sticky', left: 110 }}><b>{tCommon('name')}</b></TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', zIndex: 2, minWidth: 50, position: 'sticky', left: 250 }}><b>{tCommon('section')}</b></TableCell>
                    {allSubjects.map((sub) => (
                      <TableCell key={sub.id} align="center" sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.65rem', minWidth: 130, borderBottom: '2px solid rgba(59,130,246,0.3)' }}>
                        {sub.name}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ bgcolor: 'rgba(16,185,129,0.08)', fontWeight: 800, fontSize: '0.7rem', minWidth: 55 }}><b>{tCommon('average')}</b></TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'rgba(245,158,11,0.08)', fontWeight: 800, fontSize: '0.7rem', minWidth: 55 }}><b>{tRoster('attendance')}</b></TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', minWidth: 45 }}><b>{tCommon('rank')}</b></TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 800, fontSize: '0.7rem', minWidth: 60 }}><b>{tRoster('result')}</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoster.length === 0 ? (
                    <TableRow><TableCell colSpan={allSubjects.length + 8} align="center">
                      <Typography color="text.secondary" py={3}>{roster.length === 0 ? tRoster('semester.noDataHint') : tCommon('noMatchFilters')}</Typography>
                    </TableCell></TableRow>
                  ) : (
                    filteredRoster.map((row, idx) => (
                      <TableRow key={row.studentId || idx} hover sx={{ '& td': { py: 0.5, px: 1 } }}>
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 1, fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: 30, bgcolor: 'inherit', zIndex: 1, fontSize: '0.65rem', color: 'text.secondary' }}>{row.studentId}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: 110, bgcolor: 'inherit', zIndex: 1, whiteSpace: 'nowrap' }}>
                          <Typography fontWeight={600} sx={{ fontSize: '0.8rem' }}>{row.fullName}</Typography>
                        </TableCell>
                        <TableCell sx={{ position: 'sticky', left: 250, bgcolor: 'inherit', zIndex: 1 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{row.section || '—'}</Typography>
                        </TableCell>
                        {allSubjects.map((sub) => {
                          const mark = getSubjectMark(row, sub.id);
                          if (!mark) {
                            return (
                              <TableCell key={sub.id} align="center" sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>—</Typography>
                              </TableCell>
                            );
                          }
                          const val = Number(mark.mark) || 0;
                          const color = getBarColor(val);
                          const passed = val >= 50;
                          return (
                            <TableCell key={sub.id} align="center" sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                              <Box sx={{ width: '100%' }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, mb: 0.3 }}>{val}%</Typography>
                                <Box sx={{ position: 'relative', width: '100%' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={val}
                                    sx={{
                                      height: 10,
                                      borderRadius: 5,
                                      bgcolor: 'rgba(0,0,0,0.06)',
                                      '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: color },
                                    }}
                                  />
                                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: val >= 50 ? 'rgba(0,0,0,0.6)' : '#fff', textShadow: val < 50 ? '0 0 3px rgba(0,0,0,0.5)' : 'none' }}>
                                      {val}/100
                                    </Typography>
                                  </Box>
                                </Box>
                                <Chip label={mark.grade} size="small" sx={{
                                  mt: 0.3, fontSize: '0.55rem', fontWeight: 700, minWidth: 28, height: 16,
                                  bgcolor: passed ? (val >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)') : 'rgba(239,68,68,0.1)',
                                  color: passed ? (val >= 80 ? '#059669' : '#2563EB') : '#DC2626',
                                  border: `1px solid ${passed ? (val >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)') : 'rgba(239,68,68,0.3)'}`,
                                }} />
                              </Box>
                            </TableCell>
                          );
                        })}
                        <TableCell align="center" sx={{ bgcolor: 'rgba(16,185,129,0.05)' }}>
                          <Typography fontWeight={700} sx={{ fontSize: '0.8rem' }}>{row.average ? `${row.average}%` : '—'}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: 'rgba(245,158,11,0.05)' }}>
                          {row.attendance !== undefined ? (
                            <Chip label={`${row.attendance}%`} size="small"
                              color={row.attendance >= 90 ? 'success' : row.attendance >= 75 ? 'warning' : 'error'}
                              sx={{ fontSize: '0.6rem', fontWeight: 600, height: 18 }} />
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.sectionRank || '—'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          {row.result ? (
                            <Chip label={row.result} size="small"
                              color={row.result === 'Fail' ? 'error' : row.result === 'Pass' ? 'warning' : 'success'}
                              sx={{ fontSize: '0.6rem', fontWeight: 600, height: 18 }} />
                          ) : '—'}
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
          Generated on {new Date().toLocaleString()} · {tCommon('semester')} {semester} · {academicYear} · ESSMS
        </Typography>
      </Box>
    </Box>
  );
};
