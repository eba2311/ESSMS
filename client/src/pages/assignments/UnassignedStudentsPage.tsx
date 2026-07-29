import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button,
  TextField, Select, InputLabel, FormControl, MenuItem, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  Pagination,
} from '@mui/material';
import { ArrowBack, School, Search, Add, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI, sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const UnassignedStudentsPage = () => {
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

  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [targetSection, setTargetSection] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 30 };
      if (grade) params.grade = grade;
      if (search) params.search = search;
      const r = await assignmentsAPI.unassignedStudents(params);
      setStudents(r.data.data || []);
      setTotalPages(r.data.pagination?.pages || 1);
    } catch { setError(tCommon('failedToLoad')); }
    finally { setLoading(false); }
  }, [page, search, grade]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAssign = async () => {
    if (!selectedStudent || !targetSection) return;
    try {
      await sectionsAPI.assignStudents(targetSection, { studentIds: [selectedStudent._id] });
      showSuccess(tAssign('studentAssignedToSection', { name: `${selectedStudent.firstName} ${selectedStudent.lastName}` }));
      setAssignDialog(false);
      setSelectedStudent(null);
      setTargetSection('');
      fetchStudents();
    } catch { showError(tAssign('failedToAssignStudent')); }
  };

  const openAssignDialog = async (student: any) => {
    setSelectedStudent(student);
    setTargetSection('');
    try {
      const r = await sectionsAPI.list({ grade: student.grade, isActive: true, limit: 100 });
      setSections(r.data.data || []);
      setAssignDialog(true);
    } catch { showError(tCommon('failedToLoad')); }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tAssign('unassignedStudents')}</Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => { setPage(1); fetchStudents(); }}><Refresh /></IconButton></Tooltip>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap">
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
            <Select value={grade} label={tCommon('grade')} onChange={(e) => setGrade(e.target.value as number | '')}>
              <MenuItem value="">{tCommon('allGrades')}</MenuItem>
              {[9, 10, 11, 12].map((g) => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => { setPage(1); fetchStudents(); }} sx={{ borderRadius: 2 }}>{tCommon('filter')}</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('hash')}</TableCell>
                  <TableCell>{tCommon('studentId')}</TableCell>
                  <TableCell>{tCommon('name')}</TableCell>
                  <TableCell>{tCommon('grade')}</TableCell>
                  <TableCell>{tCommon('gender')}</TableCell>
                  <TableCell align="right">{tCommon('actions')}</TableCell>
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
                    <TableRow key={s._id} hover>
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
                      <TableCell align="right">
                        <Button size="small" variant="contained" startIcon={<Add />} onClick={() => openAssignDialog(s)} sx={{ borderRadius: 2, fontSize: '0.7rem' }}>
                          {tCommon('assign')}
                        </Button>
                      </TableCell>
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

      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tAssign('assignStudentToSection')}</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box mb={2} mt={1}>
              <Typography variant="body2" fontWeight={600}>{selectedStudent.firstName} {selectedStudent.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedStudent.studentId} — {tCommon('grade')} {selectedStudent.grade}</Typography>
            </Box>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>{tCommon('selectSection')}</InputLabel>
            <Select value={targetSection} label={tCommon('selectSection')} onChange={(e) => setTargetSection(e.target.value)}>
              {sections.map((sec) => (
                <MenuItem key={sec._id} value={sec._id}>
                  {sec.name} ({tAssign('capacity')}: {sec.capacity || 50})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!targetSection}>{tCommon('assign')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
