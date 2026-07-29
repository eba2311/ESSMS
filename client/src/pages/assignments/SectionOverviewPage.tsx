import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, InputLabel, FormControl, MenuItem, Button, IconButton, Tooltip,
  Avatar, Divider, LinearProgress,
} from '@mui/material';
import { ArrowBack, Group, Person, Book, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI, sectionsAPI } from '../../services/api';

export const SectionOverviewPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');

  const fetchSections = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await sectionsAPI.list({ limit: 200 });
      setSections(r.data.data || []);
    } catch { /* ignore */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const fetchOverview = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const r = await assignmentsAPI.sectionOverview(id);
      setOverview(r.data.data);
    } catch { setError(tCommon('failedToLoad')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedId) fetchOverview(selectedId);
    else setOverview(null);
  }, [selectedId, fetchOverview]);

  const handleAssignTeacher = async (subjectId: string) => {
    const subject = overview?.subjects?.find((s: any) => s._id === subjectId);
    if (!subject || !selectedId) return;
    navigate(`/assignments/teachers/batch?section=${selectedId}&subject=${subjectId}`);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('sectionOverview')}
        </Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => selectedId && fetchOverview(selectedId)}><Refresh /></IconButton></Tooltip>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>{tCommon('selectSection')}</InputLabel>
          <Select
            value={selectedId}
            label={tCommon('selectSection')}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {sections.map((sec) => (
              <MenuItem key={sec._id} value={sec._id}>{sec.name} — {tCommon('grade')} {sec.grade}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : overview ? (
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Section Info */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {overview.section?.name} — {tCommon('grade')} {overview.section?.grade}
            </Typography>
            <Box display="flex" gap={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">{tAssign('students')}</Typography>
                <Typography fontWeight={700}>{overview.totalStudents ?? (Array.isArray(overview.students) ? overview.students.length : 0)} / {overview.capacity || 50}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={overview.capacity ? ((overview.totalStudents ?? (Array.isArray(overview.students) ? overview.students.length : 0)) / overview.capacity) * 100 : 0}
                  sx={{ mt: 0.5, height: 4, borderRadius: 2, width: 160 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{tAssign('subjects')}</Typography>
                <Typography fontWeight={700}>{overview.subjects?.length || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{tAssign('unassignedSubjects')}</Typography>
                <Typography fontWeight={700} color={overview.unassignedSubjects?.length > 0 ? '#DC2626' : '#2D7D3A'}>
                  {overview.unassignedSubjects?.length || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Subject-Teacher Mapping */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('subjectTeacherMapping')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tCommon('subject')}</TableCell>
                    <TableCell>{tCommon('code')}</TableCell>
                    <TableCell>{tCommon('teacher')}</TableCell>
                    <TableCell align="right">{tCommon('periodsPerWeek')}</TableCell>
                    <TableCell align="center">{tCommon('status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overview.subjects?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>{tAssign('noSubjectsAssigned')}</TableCell></TableRow>
                  ) : (
                    overview.subjects?.map((sub: any) => {
                      const assigned = overview.assignedSubjects?.find((a: any) => a.subjectId === sub._id);
                      const isUnassigned = overview.unassignedSubjects?.some((u: any) => u._id === sub._id);
                      return (
                        <TableRow key={sub._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Book sx={{ fontSize: 16, color: '#9CA3AF' }} />
                              <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" fontFamily="monospace" color="text.secondary">{sub.code}</Typography></TableCell>
                          <TableCell>
                            {assigned ? (
                              <Box display="flex" alignItems="center" gap={0.75}>
                                <Avatar sx={{ width: 22, height: 22, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.6rem', fontWeight: 700 }}>
                                  {assigned.teacherName?.[0] || '?'}
                                </Avatar>
                                <Typography variant="body2">{assigned.teacherName || '\u2014'}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">{tCommon('unassigned')}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{assigned?.periodsPerWeek || '\u2014'}</TableCell>
                          <TableCell align="center">
                            {isUnassigned ? (
                              <Chip
                                size="small"
                                label={tAssign('needsTeacher')}
                                color="warning"
                                variant="outlined"
                                onClick={() => handleAssignTeacher(sub._id)}
                                sx={{ cursor: 'pointer', borderRadius: 1 }}
                              />
                            ) : assigned ? (
                              <Chip size="small" label={tCommon('assigned')} color="success" variant="outlined" sx={{ borderRadius: 1 }} />
                            ) : (
                              <Chip size="small" label={'\u2014'} variant="outlined" sx={{ borderRadius: 1 }} />
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
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Group sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tAssign('selectSectionToViewOverview')}</Typography>
        </Paper>
      )}
    </Box>
  );
};
