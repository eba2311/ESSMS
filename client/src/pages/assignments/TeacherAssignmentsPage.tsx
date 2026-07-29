import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Tooltip, Avatar, Collapse,
} from '@mui/material';
import {
  ArrowBack, Refresh, Person, Book, School, ExpandMore, ExpandLess,
  KeyboardArrowDown, KeyboardArrowUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI } from '../../services/api';

const TeacherRow = ({ teacher }: { teacher: any }) => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ '&:hover': { bgcolor: 'rgba(27,79,138,0.04)' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', fontSize: '0.75rem', fontWeight: 700 }}>
              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {teacher.firstName} {teacher.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {teacher.employeeId || teacher.teacherId}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>{teacher.sections?.length || 0}</TableCell>
        <TableCell align="right">{teacher.totalPeriods}</TableCell>
        <TableCell align="center">
          <Chip
            size="small"
            label={teacher.totalPeriods > 30 ? tAssign('overloaded') : teacher.totalPeriods > 20 ? tAssign('busy') : tAssign('available')}
            color={teacher.totalPeriods > 30 ? 'error' : teacher.totalPeriods > 20 ? 'warning' : 'success'}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ pb: 0, pt: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary">
                {tAssign('assignedSubjectsPerSection')}
              </Typography>
              {teacher.sections?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">{tAssign('noAssignments')}</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{tCommon('section')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tCommon('grade')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tCommon('subject')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">{tCommon('periodsPerWeek')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacher.sections.map((s: any) => (
                      <TableRow key={s.assignmentId}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <School sx={{ fontSize: 14, color: '#9CA3AF' }} />
                            <Typography variant="body2">{s.section?.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{tCommon('grade')} {s.section?.grade}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Book sx={{ fontSize: 14, color: '#9CA3AF' }} />
                            <Typography variant="body2">{s.subject?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">({s.subject?.code})</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{s.periodsPerWeek}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const TeacherAssignmentsPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await assignmentsAPI.teacherAssignments();
      setData(r.data.data);
    } catch (err: any) {
      setError(tAssign('failedToLoadTeacherAssignments') + ': ' + (err.response?.data?.message || err.message));
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('teacherAssignments')}
        </Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : data ? (
        <>
          <Box display="flex" gap={2} mb={3}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', px: 3, py: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" fontWeight={800} color="#1B4F8A">{data.stats.totalTeachers}</Typography>
              <Typography variant="caption" color="text.secondary">{tAssign('totalTeachers')}</Typography>
            </Paper>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', px: 3, py: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" fontWeight={800} color="#2D7D3A">{data.stats.assigned}</Typography>
              <Typography variant="caption" color="text.secondary">{tCommon('assigned')}</Typography>
            </Paper>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', px: 3, py: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" fontWeight={800} color={data.stats.unassigned > 0 ? '#DC2626' : '#2D7D3A'}>{data.stats.unassigned}</Typography>
              <Typography variant="caption" color="text.secondary">{tCommon('unassigned')}</Typography>
            </Paper>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', px: 3, py: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" fontWeight={800} color="#C9920A">{data.stats.assignmentRate}%</Typography>
              <Typography variant="caption" color="text.secondary">{tAssign('assignmentRate')}</Typography>
            </Paper>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {tAssign('teacherSubjectSectionAssignments')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {tAssign('clickToExpandTeacher')}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell>{tCommon('teacher')}</TableCell>
                    <TableCell>{tAssign('sections')}</TableCell>
                    <TableCell align="right">{tCommon('totalPeriods')}</TableCell>
                    <TableCell align="center">{tAssign('workload')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.teachers?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>{tAssign('noTeacherAssignmentsFound')}</TableCell></TableRow>
                  ) : (
                    data.teachers?.map((t: any) => <TeacherRow key={t._id} teacher={t} />)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : null}
    </Box>
  );
};
