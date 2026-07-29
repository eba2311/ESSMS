import { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, TextField, MenuItem,
  CircularProgress, Alert, Card, CardContent, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Chip, Divider, TablePagination,
} from '@mui/material';
import {
  PictureAsPdf, TableChart, Download, Group, School,
  TrendingUp, CalendarMonth, Assignment,
} from '@mui/icons-material';
import { sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SectionReportsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { t: tSections } = useTranslation('sections');
  const { t: tCommon } = useTranslation('common');

  const REPORT_TYPES = [
    { value: 'roster', label: tSections('reports.roster'), icon: <Group />, desc: tSections('reports.rosterDesc') },
    { value: 'performance', label: tSections('reports.performance'), icon: <TrendingUp />, desc: tSections('reports.performanceDesc') },
    { value: 'attendance', label: tSections('reports.attendance'), icon: <CalendarMonth />, desc: tSections('reports.attendanceDesc') },
    { value: 'teacher-assignment', label: tSections('reports.teacherAssignment'), icon: <Assignment />, desc: tSections('reports.teacherAssignmentDesc') },
  ];

  const curYear = new Date().getFullYear();
  const curAY = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
  const [selectedType, setSelectedType] = useState('');
  const [academicYear, setAcademicYear] = useState(curAY);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const academicYears = [
    `${curYear - 1}/${curYear}`,
    `${curYear}/${curYear + 1}`,
    `${curYear + 1}/${curYear + 2}`,
  ];

  const generateReport = async () => {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const res = await sectionsAPI.report(id!, { type: selectedType, academicYear });
      setReportData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || tSections('reports.failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;
    let csv = '';
    if (selectedType === 'roster' && reportData.students) {
      csv = 'Student ID,First Name,Last Name,Gender,Guardian,Guardian Phone\n';
      reportData.students.forEach((s: any) => {
        csv += `${s.studentId},${s.firstName},${s.lastName},${s.gender || ''},${s.guardianName || ''},${s.guardianPhone || ''}\n`;
      });
    } else if (selectedType === 'performance' && reportData.studentResults) {
      csv = 'Student ID,First Name,Last Name,Average,Assessments\n';
      reportData.studentResults.forEach((s: any) => {
        csv += `${s.student?.studentId || ''},${s.student?.firstName || ''},${s.student?.lastName || ''},${s.average},${s.assessmentsCount}\n`;
      });
    } else if (selectedType === 'attendance' && reportData.studentAttendance) {
      csv = 'Student ID,First Name,Last Name,Total,Present,Absent,Late,Rate%\n';
      reportData.studentAttendance.forEach((s: any) => {
        csv += `${s.student?.studentId || ''},${s.student?.firstName || ''},${s.student?.lastName || ''},${s.total},${s.present},${s.absent},${s.late},${s.rate}\n`;
      });
    } else if (selectedType === 'teacher-assignment' && reportData.assignments) {
      csv = 'Teacher,Subject,Code\n';
      reportData.assignments.forEach((a: any) => {
        csv += `${a.teacher?.firstName || ''} ${a.teacher?.lastName || ''},${a.subject?.name || ''},${a.subject?.code || ''}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section-report-${selectedType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionInfo = reportData?.section;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#111827">{tSections('reports.title')}</Typography>
          {sectionInfo && (
            <Typography variant="body2" color="text.secondary">
              {sectionInfo.name} — {tCommon('grade')} {sectionInfo.grade} — {sectionInfo.academicYear}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>{tCommon('actions.back')}</Button>
      </Box>

      {/* Report selection */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>{tSections('reports.generateReport')}</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField select fullWidth label={tSections('reports.reportType')} value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setReportData(null); }} size="small">
              <MenuItem value="">{tSections('reports.selectType')}</MenuItem>
              {REPORT_TYPES.map((rt) => (
                <MenuItem key={rt.value} value={rt.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {rt.icon}
                    <Box>
                      <Typography variant="body2">{rt.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{rt.desc}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField select fullWidth label={tSections('dialog.academicYear')} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} size="small">
              {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="contained" onClick={generateReport} disabled={!selectedType || loading} startIcon={loading ? <CircularProgress size={16} /> : <TableChart />} sx={{ borderRadius: 2 }}>
              {loading ? tSections('reports.generating') : tSections('reports.generate')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Report output */}
      {reportData && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid rgba(229,231,235,0.6)">
            <Typography variant="h6" fontWeight={700}>
              {reportData.reportType}
            </Typography>
            <Button size="small" startIcon={<Download />} onClick={downloadCSV} sx={{ borderRadius: 2 }}>
              {tSections('reports.downloadCSV')}
            </Button>
          </Box>

          {selectedType === 'roster' && (
            <Box>
              <Box px={2} py={1} display="flex" gap={2}>
                <Chip icon={<Group />} label={`${reportData.totalStudents} ${tCommon('students')}`} size="small" variant="outlined" />
                <Chip icon={<School />} label={`${tCommon('capacity')}: ${reportData.capacity}`} size="small" variant="outlined" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.studentId')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.name')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.gender')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('reports.guardian')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('reports.phone')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.students?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s: any) => (
                      <TableRow key={s._id} hover>
                        <TableCell><Typography fontWeight={600} fontSize="0.85rem">{s.studentId}</Typography></TableCell>
                        <TableCell>{s.firstName} {s.lastName}</TableCell>
                        <TableCell><Chip label={s.gender || '—'} size="small" variant="outlined" /></TableCell>
                        <TableCell>{s.guardianName || '—'}</TableCell>
                        <TableCell>{s.guardianPhone || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.students || reportData.students.length === 0) && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{tSections('reports.noStudentsFound')}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {reportData.students?.length > rowsPerPage && (
                <TablePagination component="div" count={reportData.students.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
              )}
            </Box>
          )}

          {selectedType === 'performance' && (
            <Box>
              <Box px={2} py={1} display="flex" flexWrap="wrap" gap={1}>
                <Chip label={`${tSections('profile.sectionAverage')}: ${reportData.sectionAverage}%`} size="small" color="primary" variant="outlined" />
                <Chip label={`${tSections('reports.highest')}: ${reportData.highestAverage}%`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981' }} />
                <Chip label={`${tSections('reports.lowest')}: ${reportData.lowestAverage}%`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }} />
                <Chip label={`${reportData.assessmentsCount} ${tSections('reports.assessments')}`} size="small" variant="outlined" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.student')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{tSections('reports.averagePercent')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{tSections('reports.totalObtained')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{tSections('reports.assessments')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.studentResults?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r: any, i: number) => (
                      <TableRow key={r.student?.studentId || i} hover>
                        <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                        <TableCell>{r.student?.firstName || ''} {r.student?.lastName || ''}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${r.average}%`} size="small" color={r.average >= 75 ? 'success' : r.average >= 50 ? 'warning' : 'error'} variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{r.totalMarksObtained}/{r.totalMarksPossible}</TableCell>
                        <TableCell align="right">{r.assessmentsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {selectedType === 'attendance' && (
            <Box>
              <Box px={2} py={1} display="flex" flexWrap="wrap" gap={1}>
                <Chip label={`${tSections('reports.rate')}: ${reportData.attendanceRate}%`} size="small" color="primary" variant="outlined" />
                <Chip label={`${tSections('profile.present')}: ${reportData.presentRecords}`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981' }} />
                <Chip label={`${tSections('profile.absent')}: ${reportData.absentRecords}`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }} />
                <Chip label={`${tSections('reports.late')}: ${reportData.lateRecords}`} size="small" variant="outlined" />
                <Chip label={`${tSections('reports.total')}: ${reportData.totalRecords}`} size="small" variant="outlined" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('profile.student')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('reports.total')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('profile.present')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('profile.absent')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('reports.late')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('reports.ratePercent')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.studentAttendance?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell>{s.student?.firstName || ''} {s.student?.lastName || ''}</TableCell>
                        <TableCell align="center">{s.total}</TableCell>
                        <TableCell align="center" sx={{ color: '#10B981' }}>{s.present}</TableCell>
                        <TableCell align="center" sx={{ color: s.absent > 5 ? '#EF4444' : 'inherit' }}>{s.absent}</TableCell>
                        <TableCell align="center">{s.late}</TableCell>
                        <TableCell align="center">
                          <Chip label={`${s.rate}%`} size="small" color={s.rate >= 90 ? 'success' : s.rate >= 75 ? 'warning' : 'error'} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {selectedType === 'teacher-assignment' && (
            <Box>
              <Box px={2} py={1}>
                <Chip label={`${reportData.totalAssignments} ${tSections('reports.assignments')}`} size="small" variant="outlined" />

              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('reports.teacher')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('reports.subject')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tSections('reports.code')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.assignments?.map((a: any) => (
                      <TableRow key={a._id} hover>
                        <TableCell>{a.teacher?.firstName} {a.teacher?.lastName}</TableCell>
                        <TableCell>{a.subject?.name || '—'}</TableCell>
                        <TableCell><Chip label={a.subject?.code || '—'} size="small" variant="outlined" /></TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.assignments || reportData.assignments.length === 0) && (
                      <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>{tSections('reports.noTeacherAssignments')}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
