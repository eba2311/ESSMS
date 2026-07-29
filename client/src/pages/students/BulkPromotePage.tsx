import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Select, InputLabel, FormControl, MenuItem,
  IconButton, Tooltip, Avatar, Checkbox, Stepper, Step, StepLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid,
} from '@mui/material';
import {
  ArrowBack, School, TrendingUp, CheckCircle, Error as ErrorIcon,
  Refresh, ArrowForward, Group, Warning, Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentsAPI, sectionsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const STEPS_KEYS = ['selectStudents', 'reviewAndConfigure', 'resultsStep'];

export const BulkPromotePage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [step, setStep] = useState(0);

  const [fromGrade, setFromGrade] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState('');

  const [toGrade, setToGrade] = useState<number | ''>('');
  const [stream, setStream] = useState('');
  const [newSectionId, setNewSectionId] = useState('');
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [results, setResults] = useState<any>(null);

  const nextGrade = (g: number) => Math.min(g + 1, 12);
  const needsStream = (g: number | '') => Number(g) >= 11;

  const fetchStudents = useCallback(async () => {
    if (!fromGrade) return;
    setLoading(true);
    setFetchError('');
    setSelected([]);
    try {
      const r = await studentsAPI.list({ grade: fromGrade, status: 'Active', limit: 500 });
      const list = r.data.data?.students || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch {
      setFetchError(tStudent('failedToLoadStudents'));
    } finally {
      setLoading(false);
    }
  }, [fromGrade]);

  useEffect(() => {
    if (fromGrade) fetchStudents();
  }, [fromGrade, fetchStudents]);

  useEffect(() => {
    if (!toGrade) { setSections([]); return; }
    setSectionsLoading(true);
    sectionsAPI.list({ grade: toGrade, isActive: true, limit: 100 })
      .then((r) => setSections(r.data.data?.sections || r.data.data || []))
      .catch(() => setSections([]))
      .finally(() => setSectionsLoading(false));
  }, [toGrade]);

  useEffect(() => {
    if (fromGrade) {
      setToGrade(nextGrade(Number(fromGrade)));
      setStream('');
      setNewSectionId('');
    }
  }, [fromGrade]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const selectAll = () =>
    setSelected(selected.length === students.length ? [] : students.map((s) => s._id));

  const goToReview = () => {
    if (selected.length === 0) { showError(tStudent('selectAtLeastOne')); return; }
    setStep(1);
  };

  const handlePromote = async () => {
    if (needsStream(toGrade) && !stream) {
      showError(tStudent('streamRequiredError')); return;
    }
    setConfirmOpen(false);
    setPromoting(true);
    try {
      const payload: any = {
        studentIds: selected,
        newGrade: toGrade,
        reason: reason || `Bulk promotion from Grade ${fromGrade} to Grade ${toGrade}`,
        sendNotification,
      };
      if (stream) payload.stream = stream;
      if (newSectionId) payload.newSectionId = newSectionId;

      const r = await studentsAPI.bulkPromote(payload);
      setResults(r.data.data);
      showSuccess(r.data.message || tStudent('promotionComplete'));
      setStep(2);
    } catch (err: any) {
      showError(err.response?.data?.message || tStudent('bulkPromotionFailed'));
    } finally {
      setPromoting(false);
    }
  };

  const reset = () => {
    setStep(0); setFromGrade(''); setToGrade(''); setStream('');
    setNewSectionId(''); setReason(''); setSelected([]);
    setStudents([]); setResults(null); setFetchError('');
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')} sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tStudent('bulkGradePromotion')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tStudent('promoteMultipleStudents')}
          </Typography>
        </Box>
        {step === 0 && fromGrade && (
          <Tooltip title={tCommon('refresh')}>
            <IconButton onClick={fetchStudents} sx={{ borderRadius: 2 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <Stepper activeStep={step} sx={{ p: 3 }}>
          {STEPS_KEYS.map((key) => (
            <Step key={key}><StepLabel>{tStudent(key)}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

      {step === 0 && (
        <>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 2.5, mb: 2.5 }}>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{tStudent('fromGrade')}</InputLabel>
                <Select
                  value={fromGrade}
                  label={tStudent('fromGrade')}
                  onChange={(e) => setFromGrade(e.target.value as number)}
                >
                  {[9, 10, 11].map((g) => (
                    <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={fetchStudents} disabled={!fromGrade || loading} sx={{ borderRadius: 2 }}>
                {loading ? <CircularProgress size={18} /> : tStudent('loadStudents')}
              </Button>
              {students.length > 0 && (
                <Chip
                  icon={<Group />}
                  label={tStudent('activeStudentsInGrade', { count: students.length, grade: fromGrade })}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </Paper>

          {fetchError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{fetchError}</Alert>}

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
            ) : students.length === 0 ? (
              <Box textAlign="center" py={8}>
                <School sx={{ fontSize: 56, color: '#9CA3AF', opacity: 0.3, mb: 1.5 }} />
                <Typography color="text.secondary" fontWeight={500}>
                  {fromGrade ? tStudent('noActiveStudentsInGrade', { grade: fromGrade }) : tStudent('selectGradeAbove')}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.length === students.length && students.length > 0}
                            indeterminate={selected.length > 0 && selected.length < students.length}
                            onChange={selectAll}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('studentIdCol')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('fullName')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('currentGrade')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('section')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('stream')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tStudent('academicYearCol')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow
                          key={s._id} hover
                          selected={selected.includes(s._id)}
                          onClick={() => toggleSelect(s._id)}
                          sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={selected.includes(s._id)} onChange={() => toggleSelect(s._id)} onClick={(e) => e.stopPropagation()} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={700} fontSize="0.78rem">
                              {s.studentId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', fontSize: '0.65rem', fontWeight: 700 }}>
                                {s.firstName?.[0]}{s.lastName?.[0]}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={`${tCommon('grade')} ${s.grade}`} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{s.section?.name || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{s.stream || tStudent('common')}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">{s.academicYear || '—'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={1.5} sx={{ borderTop: '1px solid rgba(229,231,235,0.6)' }}>
                  <Typography variant="body2" color="text.secondary">
                    {tStudent('studentsSelectedCount', { length: students.length, selected: selected.length })}
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    disabled={selected.length === 0}
                    onClick={goToReview}
                    sx={{ borderRadius: 2 }}
                  >
                    {tStudent('nextReview', { count: selected.length })}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </>
      )}

      {step === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                <TrendingUp sx={{ color: '#C9920A' }} /> {tStudent('promotionConfiguration')}
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Box display="flex" flexDirection="column" gap={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tStudent('toGradeRequired')}</InputLabel>
                  <Select value={toGrade} label={tStudent('toGradeRequired')} onChange={(e) => { setToGrade(e.target.value as number); setStream(''); setNewSectionId(''); }}>
                    {[9, 10, 11, 12].filter((g) => g !== Number(fromGrade)).map((g) => (
                      <MenuItem key={g} value={g}>
                        {tCommon('grade')} {g} {g === nextGrade(Number(fromGrade)) ? tStudent('default') : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {needsStream(toGrade) && (
                  <FormControl fullWidth size="small" required>
                    <InputLabel>{tStudent('streamRequired')}</InputLabel>
                    <Select value={stream} label={tStudent('streamRequired')} onChange={(e) => setStream(e.target.value)}>
                      <MenuItem value="Natural Science">{tStudent('naturalScience')}</MenuItem>
                      <MenuItem value="Social Science">{tStudent('socialScience')}</MenuItem>
                    </Select>
                    {!stream && (
                      <Typography variant="caption" color="error" mt={0.5}>
                        {tStudent('streamRequiredForGrade', { grade: toGrade })}
                      </Typography>
                    )}
                  </FormControl>
                )}

                <FormControl fullWidth size="small">
                  <InputLabel>{tStudent('assignSectionOptional')}</InputLabel>
                  <Select
                    value={newSectionId}
                    label={tStudent('assignSectionOptional')}
                    onChange={(e) => setNewSectionId(e.target.value)}
                    disabled={!toGrade || sectionsLoading}
                  >
                    <MenuItem value="">{tStudent('noSectionChange')}</MenuItem>
                    {sections.map((sec: any) => (
                      <MenuItem key={sec._id} value={sec._id}>
                        {tCommon('grade')} {sec.grade} - {sec.name} ({sec.stream || tStudent('regular')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth size="small" label={tStudent('reason')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tStudent('reasonPlaceholder')}
                  multiline rows={2}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>{tStudent('sendNotifications')}</InputLabel>
                  <Select value={sendNotification ? 'yes' : 'no'} label={tStudent('sendNotifications')} onChange={(e) => setSendNotification(e.target.value === 'yes')}>
                    <MenuItem value="yes">{tStudent('notifyStudentsParents')}</MenuItem>
                    <MenuItem value="no">{tCommon('no')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {toGrade === 12 && (
                <Alert severity="info" icon={<Info />} sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem' }}>
                  {tStudent('promotingToGrade12')}
                </Alert>
              )}
              {Number(fromGrade) === 12 && (
                <Alert severity="warning" icon={<Warning />} sx={{ mt: 2, borderRadius: 2, fontSize: '0.8rem' }}>
                  {tStudent('grade12ShouldGraduate')}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                  <Group sx={{ color: '#C9920A' }} /> {tStudent('selectedStudents', { count: selected.length })}
                </Typography>
                <Button size="small" onClick={() => setStep(0)} sx={{ borderRadius: 2 }}>
                  {tStudent('changeSelection')}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer sx={{ maxHeight: 380 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>{tStudent('studentIdCol')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>{tStudent('fullName')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>{tStudent('fromGrade')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>{tStudent('toGrade')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.filter((s) => selected.includes(s._id)).map((s) => (
                      <TableRow key={s._id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{s.studentId}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={`G${s.grade}`} size="small" sx={{ fontSize: '0.65rem', bgcolor: 'rgba(107,114,128,0.1)' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={`G${toGrade || nextGrade(Number(fromGrade))}`} size="small" color="primary" sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between">
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setStep(0)} sx={{ borderRadius: 2 }}>
                {tCommon('back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => setConfirmOpen(true)}
                disabled={!toGrade || (needsStream(toGrade) && !stream)}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {tStudent('promoteCount', { count: selected.length })}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {step === 2 && results && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3 }}>
          <Box textAlign="center" mb={3}>
            {results.failed === 0 ? (
              <CheckCircle sx={{ fontSize: 56, color: '#2D7D3A', mb: 1 }} />
            ) : results.succeeded === 0 ? (
              <ErrorIcon sx={{ fontSize: 56, color: '#DC2626', mb: 1 }} />
            ) : (
              <Warning sx={{ fontSize: 56, color: '#B45309', mb: 1 }} />
            )}
            <Typography variant="h5" fontWeight={800} sx={{ color: '#111827' }}>
              {tStudent('promotedCount', { succeeded: results.succeeded, failed: results.failed })}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {tStudent('targetGrade', { grade: results.targetGrade })}
              {stream ? ` · ${stream}` : ''}
            </Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={2}>
              <Chip label={`✓ ${results.succeeded} ${tStudent('successful')}`} color="success" sx={{ fontWeight: 700 }} />
              {results.failed > 0 && <Chip label={`✗ ${results.failed} ${tStudent('failed')}`} color="error" sx={{ fontWeight: 700 }} />}
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {results.results && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700 }}>{tStudent('studentIdCol')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tStudent('fullName')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{tStudent('status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tCommon('remarks') || 'Note'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.results.map((r: any, i: number) => (
                    <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.78rem">{r.studentId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{r.fullName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={r.success ? tStudent('promoted') : tStudent('failed')}
                          color={r.success ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ borderRadius: 1, fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color={r.success ? 'text.secondary' : 'error'}>
                          {r.error || (r.success ? tStudent('promotedToGrade', { grade: results.targetGrade }) : '')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button variant="outlined" onClick={reset} sx={{ borderRadius: 2 }}>
              {tStudent('newPromotion')}
            </Button>
            <Button variant="contained" onClick={() => navigate('/students')} sx={{ borderRadius: 2 }}>
              {tStudent('backToStudents')}
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{tStudent('confirmBulkPromotion')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {tStudent('bulkPromotionWarning', { count: selected.length })}
          </Alert>
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2 }}>
            {[
              [tStudent('studentsLabel'), `${selected.length} selected`],
              [tStudent('fromGradeLabel'), `${tCommon('grade')} ${fromGrade}`],
              [tStudent('toGradeLabel'), `${tCommon('grade')} ${toGrade}`],
              [tStudent('stream'), stream || tStudent('noChange')],
              [tStudent('section'), newSectionId ? sections.find((s: any) => s._id === newSectionId)?.name : tStudent('noChange')],
              [tStudent('reasonLabel'), reason || tStudent('notSpecified')],
              [tStudent('notificationsLabel'), sendNotification ? tStudent('studentsAndParents') : tCommon('no')],
            ].map(([label, value]) => (
              <Box key={String(label)} display="flex" justifyContent="space-between" py={0.5}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePromote}
            disabled={promoting}
            startIcon={promoting ? <CircularProgress size={16} /> : <TrendingUp />}
            sx={{ borderRadius: 2 }}
          >
            {promoting ? tStudent('promoting') : tStudent('promoteStudentsButton', { count: selected.length })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
