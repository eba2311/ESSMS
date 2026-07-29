import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  TextField, Select, InputLabel, FormControl, MenuItem, IconButton, Tooltip,
  Checkbox, Avatar, Pagination, Divider, LinearProgress,
} from '@mui/material';
import { ArrowBack, School, Search, Add, Refresh, GroupAdd, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI, sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const BulkStudentAssignPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<any[]>([]);
  const [targetSection, setTargetSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 30 };
      if (grade) params.grade = grade;
      if (search) params.search = search;
      const r = await assignmentsAPI.unassignedStudents(params);
      setStudents(r.data.data || []);
      setTotalPages(r.data.pagination?.pages || 1);
      setTotalCount(r.data.pagination?.total || 0);
    } catch {
      setError(tCommon('failedToLoad'));
    }
    finally { setLoading(false); }
  }, [page, search, grade]);

  const fetchSections = useCallback(async (filterGrade?: number) => {
    try {
      const params: any = { limit: 200, isActive: true };
      if (filterGrade) params.grade = filterGrade;
      const r = await sectionsAPI.list(params);
      setSections(r.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchSections(grade || undefined); }, [grade, fetchSections]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s._id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!targetSection || selected.size === 0) return;
    setSubmitting(true);
    try {
      const r = await assignmentsAPI.batchAssignStudents({
        sectionId: targetSection,
        studentIds: Array.from(selected),
      });
      const data = r.data.data || {};
      setResult({
        message: r.data.message,
        enrolled: data.enrolled,
        capacity: data.capacity,
        sectionName: data.section?.name,
        grade: data.section?.grade,
      });
      showSuccess(r.data.message || tAssign('studentsAssignedSuccessfully'));
      setSelected(new Set());
      fetchStudents();
    } catch (err: any) {
      showError(err?.response?.data?.message || tAssign('failedToAssignStudents'));
    }
    finally { setSubmitting(false); }
  };

  const targetSectionObj = sections.find((s) => s._id === targetSection);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('bulkAssignStudents')}
        </Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => { setPage(1); fetchStudents(); }}><Refresh /></IconButton></Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField
            label={tCommon('searchByNameOrId')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
            InputProps={{ endAdornment: <Search color="action" /> }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{tCommon('grade')}</InputLabel>
            <Select value={grade} label={tCommon('grade')} onChange={(e) => { setGrade(e.target.value as number | ''); setPage(1); }}>
              <MenuItem value="">{tCommon('allGrades')}</MenuItem>
              {[9, 10, 11, 12].map((g) => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => { setPage(1); fetchStudents(); }} sx={{ borderRadius: 2 }}>{tCommon('filter')}</Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {tAssign('selectedOfTotal', { selected: selected.size, count: students.length, total: totalCount })}
          </Typography>
        </Box>
      </Paper>

      {/* Bulk Assign Bar */}
      {selected.size > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(27,79,138,0.2)', bgcolor: 'rgba(27,79,138,0.04)', mb: 2.5, p: 2 }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <GroupAdd sx={{ color: '#1B4F8A' }} />
            <Typography variant="body2" fontWeight={700} color="#1B4F8A">
              {tAssign('studentsSelected', { count: selected.size })}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>{tAssign('assignToSection')}</InputLabel>
              <Select value={targetSection} label={tAssign('assignToSection')} onChange={(e) => setTargetSection(e.target.value)}>
                {sections.map((sec) => (
                  <MenuItem key={sec._id} value={sec._id}>
                    {sec.name} — {tCommon('grade')} {sec.grade} ({sec.enrolled}/{sec.capacity || 50})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {targetSectionObj && (
              <Chip
                size="small"
                label={`${targetSectionObj.availableSeats} ${tAssign('seatsAvailable')}`}
                color={targetSectionObj.availableSeats >= selected.size ? 'success' : 'warning'}
                variant="outlined"
              />
            )}
            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={16} /> : <GroupAdd />}
              onClick={handleBulkAssign}
              disabled={!targetSection || submitting || selected.size === 0}
              sx={{ borderRadius: 2 }}
            >
              {submitting ? tAssign('assigning') : tAssign('assignStudentCount', { count: selected.size })}
            </Button>
          </Box>
          {targetSectionObj && selected.size > targetSectionObj.availableSeats && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {tAssign('seatsExceeded', { available: targetSectionObj.availableSeats, rejected: selected.size - targetSectionObj.availableSeats })}
            </Alert>
          )}
        </Paper>
      )}

      {/* Results */}
      {result && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(45,125,58,0.2)', bgcolor: 'rgba(45,125,58,0.04)', mb: 2.5, p: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CheckCircle sx={{ color: '#2D7D3A' }} />
            <Typography variant="body2" fontWeight={700}>{result.message}</Typography>
          </Box>
          {result.sectionName && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
              {result.sectionName} — {tCommon('grade')} {result.grade} | {tAssign('enrolled')}: {result.enrolled}/{result.capacity}
            </Typography>
          )}
        </Paper>
      )}

      {/* Student Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={students.length > 0 && selected.size === students.length}
                      indeterminate={selected.size > 0 && selected.size < students.length}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell>{tCommon('hash')}</TableCell>
                  <TableCell>{tCommon('studentId')}</TableCell>
                  <TableCell>{tCommon('name')}</TableCell>
                  <TableCell>{tCommon('grade')}</TableCell>
                  <TableCell>{tCommon('gender')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <School sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                      <Typography color="text.secondary">{tAssign('noUnassignedStudents')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s, i) => (
                    <TableRow
                      key={s._id}
                      hover
                      onClick={() => toggleSelect(s._id)}
                      sx={{ cursor: 'pointer', bgcolor: selected.has(s._id) ? 'rgba(27,79,138,0.04)' : undefined }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.has(s._id)} />
                      </TableCell>
                      <TableCell>{(page - 1) * 30 + i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={700} fontSize="0.8rem">{s.studentId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.7rem', fontWeight: 700 }}>
                            {s.firstName?.[0]}{s.lastName?.[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={`${tCommon('grade')} ${s.grade}`} size="small" variant="outlined" /></TableCell>
                      <TableCell>{s.gender || '\u2014'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" p={2}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
