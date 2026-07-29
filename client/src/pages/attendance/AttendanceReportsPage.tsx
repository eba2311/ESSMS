import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Card, CardContent, TextField,
  FormControl, InputLabel, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, CircularProgress, Alert, Chip, Grid, Tabs, Tab,
} from '@mui/material';
import { Search, School, Group } from '@mui/icons-material';
import { attendanceAPI, sectionsAPI } from '../../services/api';

export const AttendanceReportsPage = () => {
  const { t: tAttend } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const [tab, setTab] = useState(0);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionReport, setSectionReport] = useState<any>(null);
  const [schoolReport, setSchoolReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ section: '', startDate: '', endDate: '' });

  useEffect(() => {
    sectionsAPI.list({ isActive: true }).then((r) => setSections(r.data.data || []));
  }, []);

  useEffect(() => {
    if (tab === 1 && !schoolReport && !loading) {
      loadSchoolReport();
    }
  }, [tab]);

  const loadSchoolReport = async () => {
    setLoading(true); setError('');
    try {
      const res = await attendanceAPI.schoolSummary({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setSchoolReport(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || tAttend('failedToLoadSchoolReport'));
    } finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (tab === 0) {
      if (!filters.section) { setError(tAttend('selectSection')); return; }
      setLoading(true); setError('');
      try {
        const res = await attendanceAPI.reports({
          section: filters.section,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        setSectionReport(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || tAttend('failedToLoadReport'));
      } finally { setLoading(false); }
    } else {
      loadSchoolReport();
    }
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return '#059669';
    if (rate >= 75) return '#D97706';
    return '#DC2626';
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={0.5}>{tAttend('attendanceReports')}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{tAttend('viewSummaries')}</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}>
        <Tab icon={<Group sx={{ fontSize: 18 }} />} label={tAttend('sectionReport')} iconPosition="start" />
        <Tab icon={<School sx={{ fontSize: 18 }} />} label={tAttend('schoolReport')} iconPosition="start" />
      </Tabs>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            {tab === 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>{tCommon('section')}</InputLabel>
                <Select value={filters.section} label={tCommon('section')} onChange={(e) => setFilters((p) => ({ ...p, section: e.target.value as string }))}>
                  {sections.map((s) => <MenuItem key={s._id} value={s._id}>{tCommon('grade')} {s.grade} — {s.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField type="date" label={tAttend('startDate')} size="small" value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label={tAttend('endDate')} size="small" value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={loading} sx={{ borderRadius: 2 }}>
              {loading ? <CircularProgress size={20} /> : tAttend('generateReport')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress size={32} /></Box>}

      {/* Section Report */}
      {tab === 0 && sectionReport && !loading && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              [tAttend('totalDays'), sectionReport.summary?.totalDays || 0],
              [tAttend('sectionRate'), `${sectionReport.summary?.sectionRate || 0}%`],
              [tAttend('chronicAbsenteesLess75'), sectionReport.summary?.chronicAbsentees || 0],
            ].map(([label, value]) => (
              <Grid item xs={6} md={4} key={label as string}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: getStatusColor(typeof value === 'string' ? parseFloat(value) : value) }}>{value}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {sectionReport.summary?.statusBreakdown && (
            <Box display="flex" gap={2} mb={2.5} flexWrap="wrap">
              {sectionReport.summary.statusBreakdown.map((s: any) => (
                <Chip key={s._id} label={`${tAttend(`status.${s._id}`)}: ${s.count}`} size="small"
                  sx={{ fontWeight: 600, bgcolor: s._id === 'Present' ? 'rgba(5,150,105,0.1)' : s._id === 'Absent' ? 'rgba(220,38,38,0.1)' : s._id === 'Late' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)', color: s._id === 'Present' ? '#059669' : s._id === 'Absent' ? '#DC2626' : s._id === 'Late' ? '#D97706' : '#6B7280' }} />
              ))}
            </Box>
          )}

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAttend('studentAttendanceSummary')}</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{tAttend('studentId')}</TableCell>
                      <TableCell>{tCommon('name')}</TableCell>
                      <TableCell>{tAttend('status.Present')}</TableCell>
                      <TableCell>{tAttend('status.Absent')}</TableCell>
                      <TableCell>{tAttend('status.Late')}</TableCell>
                      <TableCell>{tAttend('status.Excused')}</TableCell>
                      <TableCell>{tAttend('rate')}</TableCell>
                      <TableCell>{tCommon('status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(sectionReport.students || []).length === 0 ? (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>{tAttend('noStudentData')}</TableCell></TableRow>
                    ) : (
                      (sectionReport.students || []).map((s: any) => (
                        <TableRow key={s.studentId || s._id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.studentId}</TableCell>
                          <TableCell><Typography variant="body2" fontWeight={600}>{s.fullName || `${s.firstName} ${s.lastName}`}</Typography></TableCell>
                          <TableCell>{s.present || 0}</TableCell>
                          <TableCell>{s.absent || 0}</TableCell>
                          <TableCell>{s.late || 0}</TableCell>
                          <TableCell>{s.excused || 0}</TableCell>
                          <TableCell>
                            <Typography fontWeight={700} sx={{ color: getStatusColor(s.attendanceRate) }}>
                              {s.attendanceRate || 0}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={(s.attendanceRate || 0) < 75 ? tAttend('chronic') : tAttend('ok')}
                              color={(s.attendanceRate || 0) < 75 ? 'error' : 'success'} size="small"
                              sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* School Report */}
      {tab === 1 && schoolReport && !loading && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              [tAttend('totalRecords'), schoolReport.totalRecords || 0],
              [tAttend('totalStudents'), schoolReport.totalStudents || 0],
              [tAttend('schoolDays'), schoolReport.totalDays || 0],
              [tAttend('chronicAbsentees5Plus'), schoolReport.chronicAbsentees || 0],
            ].map(([label, value]) => (
              <Grid item xs={6} md={3} key={label as string}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                    <Typography variant="h4" fontWeight={800}>{value}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {schoolReport.statusBreakdown && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAttend('statusBreakdown')}</Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {schoolReport.statusBreakdown.map((s: any) => (
                    <Chip key={s._id} label={`${tAttend(`status.${s._id}`)}: ${s.count}`} size="medium"
                      sx={{ fontWeight: 600, fontSize: '0.8rem', px: 1, bgcolor: s._id === 'Present' ? 'rgba(5,150,105,0.1)' : s._id === 'Absent' ? 'rgba(220,38,38,0.1)' : s._id === 'Late' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)', color: s._id === 'Present' ? '#059669' : s._id === 'Absent' ? '#DC2626' : s._id === 'Late' ? '#D97706' : '#6B7280' }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {schoolReport.gradeSummary && schoolReport.gradeSummary.length > 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>{tAttend('attendanceByGrade')}</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{tCommon('grade')}</TableCell>
                        <TableCell>{tAttend('totalRecords')}</TableCell>
                        <TableCell>{tAttend('status.Present')}</TableCell>
                        <TableCell>{tAttend('rate')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schoolReport.gradeSummary.map((g: any) => (
                        <TableRow key={g._id} hover>
                          <TableCell><Typography fontWeight={600}>{tCommon('grade')} {g._id}</Typography></TableCell>
                          <TableCell>{g.total}</TableCell>
                          <TableCell>{g.present}</TableCell>
                          <TableCell>
                            <Typography fontWeight={700} sx={{ color: getStatusColor(g.rate) }}>{g.rate}%</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};
