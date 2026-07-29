import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton, Button, IconButton, Tooltip,
  Select, InputLabel, FormControl, MenuItem, Avatar, Divider, LinearProgress,
} from '@mui/material';
import {
  ArrowBack, Refresh, Download, Assessment, Warning, School, Group, Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { assignmentsAPI } from '../../services/api';

export const AssignmentReportsPage = () => {
  const { t: tAssign } = useTranslation('assignments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [type, setType] = useState('enrollment');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const REPORT_TYPES = [
    { value: 'enrollment', label: tAssign('enrollment'), icon: <School /> },
    { value: 'teacher-workload', label: tAssign('teacherWorkload'), icon: <Person /> },
    { value: 'section-subject-teacher', label: tAssign('sectionSubjectTeacher'), icon: <Group /> },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await assignmentsAPI.reports({ type });
      setData(r.data.data);
    } catch { setError(tCommon('failedToLoad')); }
    finally { setLoading(false); }
  }, [type]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-report-${type}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = '';
    let filename = '';

    if (type === 'enrollment' && data.byGrade) {
      csvContent = 'Grade,Students,Capacity,Utilization\n';
      for (const g of data.byGrade) {
        const util = g.capacity ? Math.round((g.students / g.capacity) * 100) : 0;
        csvContent += `Grade ${g._id},${g.students},${g.capacity},${util}%\n`;
      }
      csvContent += `\nTotal,${data.totalStudents},${data.totalCapacity},${Math.round(data.utilization || 0)}%\n`;
      filename = 'enrollment-report';
    } else if (type === 'teacher-workload' && data.workloads) {
      csvContent = 'Teacher,Employee ID,Total Periods,Max Periods,Remaining,Status\n';
      for (const w of data.workloads) {
        csvContent += `"${w.teacherName}",${w.employeeId},${w.totalPeriods},${w.maxPeriods},${w.remaining},${w.overloaded ? 'Overloaded' : 'OK'}\n`;
      }
      filename = 'teacher-workload-report';
    } else if (type === 'section-subject-teacher' && data.mappings) {
      csvContent = 'Section,Grade,Subject,Teacher,Periods/Week\n';
      for (const m of data.mappings) {
        csvContent += `"${m.sectionName}",Grade ${m.grade},"${m.subjectName}","${m.teacherName || 'Unassigned'}",${m.periodsPerWeek || ''}\n`;
      }
      filename = 'section-subject-teacher-report';
    } else {
      csvContent = JSON.stringify(data, null, 2);
      filename = `assignment-report-${type}`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/assignments/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {tAssign('assignmentReports')}
        </Typography>
        <Tooltip title={tCommon('refresh')}><IconButton onClick={fetchReport}><Refresh /></IconButton></Tooltip>
        {data && (
          <Box display="flex" gap={0.5}>
            <Tooltip title={tAssign('exportCsv')}>
              <IconButton onClick={handleExportCSV}><Download /></IconButton>
            </Tooltip>
            <Tooltip title={tAssign('exportJson')}>
              <IconButton onClick={handleExportJSON}>
                <Typography variant="caption" fontWeight={700} fontSize="0.6rem">JSON</Typography>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5, p: 2 }}>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v && setType(v)}
          size="small"
          sx={{ gap: 1 }}
        >
          {REPORT_TYPES.map((r) => (
            <ToggleButton
              key={r.value}
              value={r.value}
              sx={{ borderRadius: '8px !important', px: 2, gap: 0.75, textTransform: 'none', border: '1px solid rgba(229,231,235,0.6)' }}
            >
              {r.icon}
              <Typography variant="body2" fontWeight={type === r.value ? 700 : 500}>{r.label}</Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={28} /></Box>
      ) : data ? (
        <>
          {type === 'enrollment' && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('enrollmentReport')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('grade')}</TableCell>
                      <TableCell>{tAssign('students')}</TableCell>
                      <TableCell>{tCommon('capacity')}</TableCell>
                      <TableCell>{tAssign('utilization')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.byGrade || []).map((g: any) => (
                      <TableRow key={g._id}>
                        <TableCell><Typography fontWeight={600}>{tCommon('grade')} {g._id}</Typography></TableCell>
                        <TableCell>{g.students}</TableCell>
                        <TableCell>{g.capacity}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <LinearProgress
                              variant="determinate"
                              value={g.capacity ? (g.students / g.capacity) * 100 : 0}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" fontWeight={600}>{Math.round((g.students / (g.capacity || 1)) * 100)}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{tAssign('totalStudents')}</Typography>
                  <Typography fontWeight={700}>{data.totalStudents}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{tAssign('totalCapacity')}</Typography>
                  <Typography fontWeight={700}>{data.totalCapacity}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{tAssign('overallUtilization')}</Typography>
                  <Typography fontWeight={700} color={data.utilization > 90 ? '#DC2626' : '#2D7D3A'}>
                    {Math.round(data.utilization || 0)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {type === 'teacher-workload' && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('teacherWorkloadReport')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('teacher')}</TableCell>
                      <TableCell>{tCommon('employeeId')}</TableCell>
                      <TableCell align="right">{tCommon('totalPeriods')}</TableCell>
                      <TableCell align="right">{tCommon('max')}</TableCell>
                      <TableCell align="right">{tCommon('remaining')}</TableCell>
                      <TableCell align="center">{tCommon('status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.workloads || []).length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>{tAssign('noWorkloadData')}</TableCell></TableRow>
                    ) : (
                      (data.workloads || []).map((w: any) => (
                        <TableRow key={w._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.65rem', fontWeight: 700 }}>
                                {w.teacherName?.[0] || '?'}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>{w.teacherName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{w.employeeId}</Typography></TableCell>
                          <TableCell align="right">{w.totalPeriods}</TableCell>
                          <TableCell align="right">{w.maxPeriods}</TableCell>
                          <TableCell align="right">{w.remaining}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={w.overloaded ? tCommon('overloaded') : tCommon('ok')}
                              color={w.overloaded ? 'error' : 'success'}
                              variant="outlined"
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {type === 'section-subject-teacher' && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAssign('sectionSubjectTeacherReport')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('section')}</TableCell>
                      <TableCell>{tCommon('grade')}</TableCell>
                      <TableCell>{tCommon('subject')}</TableCell>
                      <TableCell>{tCommon('teacher')}</TableCell>
                      <TableCell align="right">{tCommon('periodsPerWeek')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.mappings || []).length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>{tAssign('noAssignmentsYet')}</TableCell></TableRow>
                    ) : (
                      (data.mappings || []).map((m: any, i: number) => (
                        <TableRow key={i} hover>
                          <TableCell><Typography fontWeight={600}>{m.sectionName}</Typography></TableCell>
                          <TableCell>{tCommon('grade')} {m.grade}</TableCell>
                          <TableCell>{m.subjectName}</TableCell>
                          <TableCell>{m.teacherName || <Typography variant="body2" color="text.secondary" fontStyle="italic">{tCommon('unassigned')}</Typography>}</TableCell>
                          <TableCell align="right">{m.periodsPerWeek || '\u2014'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tAssign('selectReportTypeToView')}</Typography>
        </Paper>
      )}
    </Box>
  );
};
