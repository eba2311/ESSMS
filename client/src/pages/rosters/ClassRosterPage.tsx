import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Chip, Grid, Divider, TextField,
  InputAdornment,
} from '@mui/material';
import { Download, Print, ArrowBack, School, People, Person, Search, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sectionsAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

export const ClassRosterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [roster, setRoster] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const currentYear = new Date().getFullYear();
  const academicYear = new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await sectionsAPI.list({ academicYear });
      const data = res.data.data;
      setSections(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sections');
    }
  };

  const fetchRoster = async (sectionId: string) => {
    if (!sectionId) { setRoster(null); return; }
    try {
      setLoading(true);
      setError('');
      const res = await sectionsAPI.getClassRoster(sectionId);
      setRoster(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load class roster');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSearch('');
    setGenderFilter('');
    fetchRoster(sectionId);
  };

  const filteredStudents = useMemo(() => {
    if (!roster?.students) return [];
    let data = roster.students;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s: any) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.guardianName?.toLowerCase().includes(q)
      );
    }
    if (genderFilter) {
      data = data.filter((s: any) => s.gender === genderFilter);
    }
    return data;
  }, [roster, search, genderFilter]);

  const handlePrint = () => { window.print(); };

  const handleExportCSV = () => {
    if (!roster?.students?.length) return;
    const headers = ['#', 'Student ID', 'Name', 'Gender', 'Date of Birth', 'Phone', 'Guardian', 'Guardian Phone'];
    const rows = roster.students.map((s: any) => [
      s.no, s.studentId, s.fullName, s.gender || '', s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '',
      s.phone || '', s.guardianName || '', s.guardianPhone || '',
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `class_roster_${roster.section?.name || 'section'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('classRoster.title')}
        </Typography>
      </Box>

      <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap" sx={{ '@media print': { display: 'none' } }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>{tRoster('classRoster.selectSection')}</InputLabel>
          <Select
            value={selectedSectionId}
            label={tRoster('classRoster.selectSection')}
            onChange={(e) => handleSectionChange(e.target.value)}
          >
            {sections.map((s: any) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name} ({tCommon('grade')} {s.grade} - {s.stream || tCommon('common')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {roster && (
          <>
            <TextField size="small" placeholder={tRoster('classRoster.searchStudents')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>{tCommon('gender')}</InputLabel>
              <Select value={genderFilter} label={tCommon('gender')} onChange={(e) => setGenderFilter(e.target.value)}>
                <MenuItem value="">{tCommon('all')}</MenuItem>
                <MenuItem value="Male">{tCommon('male')}</MenuItem>
                <MenuItem value="Female">{tCommon('female')}</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title={tRoster('classRoster.printRoster')}>
              <IconButton color="primary" onClick={handlePrint}><Print /></IconButton>
            </Tooltip>
            <Tooltip title={tCommon('exportCSV')}>
              <IconButton color="success" onClick={handleExportCSV}><Download /></IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      )}

      {!loading && roster && (
        <>
          {/* Print Header */}
          <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">{tRoster('classRoster.printTitle')}</Typography>
            <Typography variant="body1">
              {roster.section?.name} | {tCommon('grade')} {roster.section?.grade} | {roster.section?.stream || tCommon('common')} | {tCommon('academicYear')}: {roster.section?.academicYear}
            </Typography>
          </Box>

          {/* Section Info */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <School color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>
                      {roster.section?.name}
                    </Typography>
                    <Chip label={`${tCommon('grade')} ${roster.section?.grade}`} size="small" color="primary" variant="outlined" />
                    <Chip label={roster.section?.stream || tCommon('common')} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tCommon('academicYear')}: {roster.section?.academicYear} · {tRoster('classRoster.code')}: {roster.section?.sectionCode || '—'}
                  </Typography>
                  {roster.section?.classroom && (
                    <Typography variant="body2" color="text.secondary">
                      {tRoster('classRoster.classroom')}: {roster.section.classroom?.roomNumber || '—'} ({roster.section.classroom?.building || ''})
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" gap={3} justifyContent="flex-end">
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight={800} color="primary">{roster.summary?.totalStudents || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">{tCommon('students')}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight={800} color="info.main">{roster.summary?.maleCount || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">{tCommon('male')}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight={800} color="secondary">{roster.summary?.femaleCount || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">{tCommon('female')}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight={800} color={roster.summary?.occupancyRate >= 100 ? 'error.main' : 'success.main'}>
                        {roster.summary?.occupancyRate || 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{tRoster('classRoster.occupancy')}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {roster.section?.homeroomTeacher && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person color="action" sx={{ fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {tRoster('classRoster.homeroomTeacher')}: <strong>{(roster.section.homeroomTeacher as any)?.firstName} {(roster.section.homeroomTeacher as any)?.lastName}</strong>
                      {(roster.section.homeroomTeacher as any)?.teacherId && (
                        <Typography variant="caption" color="text.secondary" ml={1}>
                          ({(roster.section.homeroomTeacher as any)?.teacherId})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </>
              )}

              {roster.subjectTeachers?.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                    {tRoster('classRoster.subjectTeachers')}:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {roster.subjectTeachers.map((st: any, i: number) => (
                      <Chip key={i} label={`${st.subject} - ${st.teacher}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Student Table */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              {roster.students?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <People sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3 }} />
                  <Typography color="text.secondary" mt={1}>{tRoster('classRoster.noStudentsInSection')}</Typography>
                </Box>
              ) : (
                <>
                  {(search || genderFilter) && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        {tRoster('classRoster.showing')} {filteredStudents.length} {tCommon('of')} {roster.students.length} {tCommon('students')}
                      </Typography>
                    </Box>
                  )}
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                          <TableCell><b>#</b></TableCell>
                          <TableCell><b>{tCommon('studentId')}</b></TableCell>
                          <TableCell><b>{tCommon('fullName')}</b></TableCell>
                          <TableCell><b>{tCommon('gender')}</b></TableCell>
                          <TableCell><b>{tCommon('dateOfBirth')}</b></TableCell>
                          <TableCell><b>{tCommon('phone')}</b></TableCell>
                          <TableCell><b>{tCommon('guardian')}</b></TableCell>
                          <TableCell><b>{tCommon('guardianPhone')}</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredStudents.map((student: any, idx: number) => (
                          <TableRow key={student._id} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">{student.studentId}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={600}>{student.fullName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={student.gender || '—'} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                            </TableCell>
                            <TableCell>
                              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell>{student.phone || '—'}</TableCell>
                            <TableCell>{student.guardianName || '—'}</TableCell>
                            <TableCell>{student.guardianPhone || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>

          {/* Print Footer */}
          <Box sx={{ '@media print': { display: 'block' }, '@media screen': { display: 'none' }, mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Generated on {new Date().toLocaleString()} · ESSMS
            </Typography>
          </Box>
        </>
      )}

      {!loading && !roster && !error && selectedSectionId === '' && (
        <Box textAlign="center" py={8}>
          <School sx={{ fontSize: 64, color: '#9CA3AF', opacity: 0.3 }} />
          <Typography color="text.secondary" mt={2}>{tRoster('classRoster.selectSectionHint')}</Typography>
        </Box>
      )}
    </Box>
  );
};
