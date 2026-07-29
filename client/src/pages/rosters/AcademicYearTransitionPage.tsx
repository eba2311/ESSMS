import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, IconButton, Tooltip, TextField, Grid, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Step, StepLabel, Stepper,
} from '@mui/material';
import {
  ArrowBack, Search, FilterList, SwapHoriz, School, CheckCircle,
  PersonAdd, GroupAdd, Warning,
} from '@mui/icons-material';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const stepsKeys = ['selectYear', 'reviewStudents', 'assignSections', 'confirm'];

export const AcademicYearTransitionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [roster, setRoster] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [transitionResult, setTransitionResult] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
    `${currentYear + 2}/${currentYear + 3}`,
  ];
  const [currentAcademicYear, setCurrentAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );
  const [newAcademicYear, setNewAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear + 1}/${currentYear + 2}` : `${currentYear}/${currentYear + 1}`
  );

  const [gradeFilter, setGradeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { if (activeStep === 1) fetchRoster(); }, [activeStep, currentAcademicYear]);
  useEffect(() => { if (activeStep === 2) fetchSections(); }, [activeStep, newAcademicYear]);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await rosterAPI.getAnnualRoster({ academicYear: currentAcademicYear });
      const promoted = (res.data.data || []).filter((r: any) => r.promotionStatus === 'Promoted');
      setRoster(promoted);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch promoted students');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await sectionsAPI.list({ academicYear: newAcademicYear });
      setSections(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const filteredRoster = useMemo(() => {
    let data = roster;
    if (gradeFilter) data = data.filter((r: any) => r.grade === Number(gradeFilter));
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r: any) => r.fullName?.toLowerCase().includes(q) || r.studentId?.toLowerCase().includes(q));
    }
    return data;
  }, [roster, gradeFilter, search]);

  const handleAssignSection = (studentId: string, sectionId: string) => {
    setAssignments(prev => ({ ...prev, [studentId]: sectionId }));
  };

  const handleTransition = async () => {
    const sectionAssignments = Object.entries(assignments).map(([studentId, newSectionId]) => ({
      studentId, newSectionId,
    }));

    if (sectionAssignments.length === 0) {
      showError('Please assign at least one student to a section');
      return;
    }

    try {
      setTransitioning(true);
      const res = await rosterAPI.transitionAcademicYear({
        currentAcademicYear,
        newAcademicYear,
        sectionAssignments,
      });
      setTransitionResult(res.data.data);
      showSuccess(res.data.message || 'Academic year transition completed');
      setActiveStep(3);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const getAvailableSections = (grade: number) => {
    return sections.filter((s: any) => s.grade === grade);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3} className="no-print">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rosters/dashboard')} size="small" sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('transition.title')}
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }} className="no-print">
        <Stepper activeStep={activeStep} alternativeLabel>
          {stepsKeys.map((key) => (
            <Step key={key}>
              <StepLabel>{tRoster(`transition.step.${key}`)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Step 0: Select Years */}
      {activeStep === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <School color="primary" />
              <Typography variant="h6" fontWeight={700}>{tRoster('transition.selectAcademicYears')}</Typography>
            </Box>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              {tRoster('transition.transitionDesc')}
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{tRoster('transition.currentAcademicYear')}</InputLabel>
                  <Select value={currentAcademicYear} label={tRoster('transition.currentAcademicYear')}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}>
                    {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{tRoster('transition.newAcademicYear')}</InputLabel>
                  <Select value={newAcademicYear} label={tRoster('transition.newAcademicYear')}
                    onChange={(e) => setNewAcademicYear(e.target.value)}>
                    {academicYears.map(ay => (
                      <MenuItem key={ay} value={ay} disabled={ay === currentAcademicYear}>{ay}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button variant="contained" onClick={() => setActiveStep(1)} sx={{ borderRadius: 2 }}>
                {tRoster('transition.nextReviewStudents')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Review Promoted Students */}
      {activeStep === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PersonAdd color="primary" />
              <Typography variant="h6" fontWeight={700}>{tRoster('transition.reviewPromotedStudents')}</Typography>
              <Chip label={`${roster.length} students`} size="small" color="success" variant="outlined" />
            </Box>

            <Box display="flex" gap={2} mb={2}>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>{tCommon('grade')}</InputLabel>
                <Select value={gradeFilter} label={tCommon('grade')} onChange={(e) => setGradeFilter(e.target.value)}>
                  <MenuItem value="">{tCommon('all')}</MenuItem>
                  {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" placeholder={tCommon('search')} value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ flex: 1 }}
              />
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell><b>#</b></TableCell>
                      <TableCell><b>{tCommon('studentId')}</b></TableCell>
                      <TableCell><b>{tCommon('name')}</b></TableCell>
                      <TableCell><b>{tRoster('transition.currentGrade')}</b></TableCell>
                      <TableCell><b>{tCommon('section')}</b></TableCell>
                      <TableCell><b>{tRoster('annual.annualAvg')}</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoster.map((row, idx) => (
                      <TableRow key={row.studentId || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{row.studentId}</Typography></TableCell>
                        <TableCell><Typography fontWeight={600}>{row.fullName}</Typography></TableCell>
                          <TableCell>{tCommon('grade')} {row.grade}</TableCell>
                        <TableCell>{row.section}</TableCell>
                        <TableCell><Typography fontWeight={700}>{row.annualAverage ? `${row.annualAverage}%` : '—'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={() => setActiveStep(0)} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} disabled={roster.length === 0} sx={{ borderRadius: 2 }}>
                {tRoster('transition.nextAssignSections', { count: roster.length })}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Assign Sections */}
      {activeStep === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <GroupAdd color="primary" />
              <Typography variant="h6" fontWeight={700}>{tRoster('transition.assignSections')} {newAcademicYear}</Typography>
            </Box>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {tRoster('transition.assignSectionsDesc')}
            </Alert>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell><b>{tCommon('student')}</b></TableCell>
                      <TableCell><b>{tRoster('transition.currentGrade')}</b></TableCell>
                      <TableCell><b>{tRoster('transition.newGrade')}</b></TableCell>
                      <TableCell><b>{tRoster('transition.assignToSection')}</b></TableCell>
                      <TableCell><b>{tCommon('status')}</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoster.map((row) => {
                      const newGrade = (row.grade || 9) + 1;
                      const availableSections = getAvailableSections(newGrade);
                      const assigned = assignments[row.studentId];
                      return (
                        <TableRow key={row.studentId} hover>
                          <TableCell><Typography fontWeight={600}>{row.fullName}</Typography></TableCell>
                        <TableCell>{tCommon('grade')} {row.grade}</TableCell>
                          <TableCell>
                            {newGrade > 12 ? (
                              <Chip label={tRoster('transition.graduated')} size="small" color="info" />
                            ) : (
                              <Typography fontWeight={700}>{tCommon('grade')} {newGrade}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {newGrade <= 12 && (
                              <FormControl size="small" sx={{ minWidth: 180 }}>
                                <Select
                                  value={assigned || ''}
                                  onChange={(e) => handleAssignSection(row.studentId, e.target.value)}
                                  displayEmpty
                                >
                                  <MenuItem value="" disabled>{tRoster('transition.selectSection')}</MenuItem>
                                  {availableSections.map((s: any) => (
                                    <MenuItem key={s._id} value={s._id}>
                                      {s.name} ({s.stream || tCommon('common')})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          <TableCell>
                            {assigned ? (
                              <Chip icon={<CheckCircle />} label={tRoster('transition.assigned')} size="small" color="success" variant="outlined" />
                            ) : (
                              <Chip icon={<Warning />} label={tRoster('transition.notAssigned')} size="small" color="warning" variant="outlined" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={() => setActiveStep(1)} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" alignSelf="center">
                  {Object.keys(assignments).length}/{filteredRoster.length} {tRoster('transition.assigned').toLowerCase()}
                </Typography>
                <Button variant="contained" color="secondary" onClick={() => setActiveStep(3)} sx={{ borderRadius: 2 }}>
                  {tRoster('transition.nextConfirm')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm & Execute */}
      {activeStep === 3 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent>
            {transitionResult ? (
              <>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={700}>{tRoster('transition.transitionComplete')}</Typography>
                  <Typography variant="body2">
                    {tRoster('transition.studentsAssigned')}: {transitionResult.assigned} · {tRoster('promotion.skipped')}: {transitionResult.skipped}
                  </Typography>
                </Alert>
                <Box display="flex" gap={2}>
                  <Button variant="contained" onClick={() => navigate('/rosters/dashboard')} sx={{ borderRadius: 2 }}>
                    {tRoster('transition.returnToDashboard')}
                  </Button>
                  <Button variant="outlined" onClick={() => { setActiveStep(0); setTransitionResult(null); setAssignments({}); }} sx={{ borderRadius: 2 }}>
                    {tRoster('transition.startNewTransition')}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Warning color="warning" />
                  <Typography variant="h6" fontWeight={700}>{tRoster('transition.confirmTransition')}</Typography>
                </Box>
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    {tRoster('transition.confirmMessage', { from: currentAcademicYear, to: newAcademicYear, count: Object.keys(assignments).length })}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>{tRoster('transition.cannotUndo')}</strong> {tRoster('transition.reviewBeforeProceeding')}
                  </Typography>
                </Alert>

                <Box display="flex" gap={2} mb={3}>
                  <Chip label={`${tCommon('students')}: ${Object.keys(assignments).length}`} />
                  <Chip label={`${tRoster('transition.currentYear')}: ${currentAcademicYear}`} />
                  <Chip label={`${tRoster('transition.newYear')}: ${newAcademicYear}`} />
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Button onClick={() => setActiveStep(2)} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
                  <Button variant="contained" color="warning" onClick={handleTransition}
                    disabled={transitioning} sx={{ borderRadius: 2 }}>
                    {transitioning ? tRoster('promotion.processing') : tRoster('transition.executeTransition')}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
