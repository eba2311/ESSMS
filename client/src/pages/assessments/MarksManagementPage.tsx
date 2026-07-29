import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, CircularProgress, Alert,
  Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Card, CardContent,
  LinearProgress, Checkbox, Grid,
} from '@mui/material';
import {
  Add, Edit, Grading, CheckCircle, DeleteSweep, Refresh, School,
  EmojiEvents, Lock, LockOpen, Publish, Warning, Download, DeleteForever,
  Dashboard, Assessment, People, TrendingUp, CheckCircleOutline,
  MenuBook, FilterList, MoreVert, ArrowForward, Timeline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { assessmentsAPI, gradeScaleAPI, rankingsAPI, sectionsAPI, subjectsAPI, teachersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const statusColor: Record<string, string> = {
  Draft: 'default', Published: 'success', Locked: 'error',
};

const assessmentTypes = ['Assignment', 'Quiz', 'Class Work', 'Project', 'Mid Exam', 'Final Exam'];

export const MarksManagementPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const isStaff = ['system_admin', 'school_director', 'academic_head', 'teacher'].includes(role || '');
  const isStudent = role === 'student';
  const isParent = role === 'parent';
  const isCounselor = role === 'counselor';
  const isAdmin = role === 'system_admin' || role === 'school_director' || role === 'academic_head';

  const tabs = [
    { label: 'Dashboard', visible: isStaff },
    { label: 'Assessments', visible: isStaff },
    { label: 'Grade Book', visible: isStaff },
    { label: 'My Marks', visible: isStudent || isParent },
    { label: 'Section Overview', visible: isAdmin },
    { label: 'Rankings', visible: true },
    { label: 'At-Risk Students', visible: isCounselor },
    { label: 'Grade Scale', visible: role === 'system_admin' },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {t('marksManagement')}
          </Typography>
          <Typography variant="body2" color="text.secondary">{t('marksManagementDesc')}</Typography>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
        {visibleTabs.map((tabItem) => <Tab key={tabItem.label} label={t('tab' + tabItem.label.replace(/\s+/g, ''))} />)}
      </Tabs>

      {visibleTabs[tab]?.label === 'Dashboard' && <ErrorBoundary><DashboardTab /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'Assessments' && <ErrorBoundary><AssessmentTab role={role} navigate={navigate} /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'Grade Book' && <ErrorBoundary><GradeBookTab /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'My Marks' && <ErrorBoundary><MyMarksTab role={role} /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'Section Overview' && <ErrorBoundary><SectionOverviewTab /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'Rankings' && <ErrorBoundary><RankingsTab /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'At-Risk Students' && <ErrorBoundary><AtRiskStudentsTab /></ErrorBoundary>}
      {visibleTabs[tab]?.label === 'Grade Scale' && <ErrorBoundary><GradeScaleTab /></ErrorBoundary>}
    </Box>
  );
};

/* ────────────── DASHBOARD TAB ────────────── */
const DashboardTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { showError } = useNotification();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentsAPI.dashboard({ limit: 5 })
      .then((r) => setStats(r.data.data || {}))
      .catch(() => showError(t('failedToLoadDashboard')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;

  const cards = [
    { label: t('totalAssessments'), value: stats?.totalAssessments || 0, icon: <Assessment />, color: '#1B4F8A' },
    { label: t('totalStudents'), value: stats?.totalStudents || 0, icon: <People />, color: '#2D7D3A' },
    { label: t('avgCompletion'), value: `${stats?.avgCompletion || 0}%`, icon: <TrendingUp />, color: '#C9920A' },
    { label: t('published', { ns: 'common' }), value: stats?.publishedCount || 0, icon: <CheckCircleOutline />, color: '#2D7D3A' },
  ];

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' } }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${card.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{card.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>{t('recentAssessments')}</Typography>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Timeline sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.muted">{t('noData')}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

/* ────────────── GRADE BOOK TAB ────────────── */
const GradeBookTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { showError, showSuccess } = useNotification();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [gradeBook, setGradeBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const defAY = now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const [academicYear, setAcademicYear] = useState(defAY);
  const [term, setTerm] = useState('1');

  useEffect(() => {
    sectionsAPI.list({ limit: 100 }).then((r) => {
      const d = r.data.data || [];
      if (Array.isArray(d)) { setSections(d); if (d.length) setSelectedSection(d[0]._id); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    assessmentsAPI.gradeBook({ sectionId: selectedSection, academicYear, term })
      .then((r) => setGradeBook(r.data.data))
      .catch(() => showError(t('failedToLoadGradeBook')))
      .finally(() => setLoading(false));
  }, [selectedSection, academicYear, term]);

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('section', { ns: 'common' })}</InputLabel>
          <Select value={selectedSection} label={t('section', { ns: 'common' })} onChange={(e) => setSelectedSection(e.target.value)}>
            {sections.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name} (Grade {s.grade})</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label={t('year')} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} sx={{ minWidth: 120 }} />
        <TextField size="small" label={tCommon('term')} select value={term} onChange={(e) => setTerm(e.target.value)} sx={{ minWidth: 100 }}>
          <MenuItem value="1">{t('term1')}</MenuItem>
          <MenuItem value="2">{t('term2')}</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>
      ) : !gradeBook ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>{t('noData')}</Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', minWidth: 600 }}>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { whiteSpace: 'nowrap', px: 1.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#F8FAFC', zIndex: 2, fontWeight: 700, minWidth: 160 }}>
                      {t('student', { ns: 'common' })}
                    </TableCell>
                    {gradeBook.assessments?.map((a: any) => (
                      <TableCell key={a._id} align="center" sx={{ minWidth: 80 }}>
                        <Tooltip title={`${a.title} (${a.type})`}>
                          <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 80, display: 'block' }}>
                            {a.title}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">/ {a.totalMarks}</Typography>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ bgcolor: 'rgba(27,79,138,0.04)', fontWeight: 700, minWidth: 80 }}>
                      {t('total', { ns: 'common' })}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'rgba(27,79,138,0.04)', fontWeight: 700, minWidth: 80 }}>
                      {t('overallAverage')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradeBook.students?.map((s: any) => (
                    <TableRow key={s._id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.studentId}</Typography>
                      </TableCell>
                      {gradeBook.assessments?.map((a: any) => {
                        const m = s.assessments?.[gradeBook.assessments.indexOf(a)];
                        return (
                          <TableCell key={a._id} align="center">
                            {m ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600} color={m.percentage >= 50 ? 'success.main' : 'error.main'}>
                                  {m.marksObtained}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{m.letterGrade}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center" sx={{ bgcolor: 'rgba(27,79,138,0.02)' }}>
                        <Typography fontWeight={700}>{s.totalMarks}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: 'rgba(27,79,138,0.02)' }}>
                        {s.overallAverage !== null ? (
                          <Chip
                            label={`${s.overallAverage.toFixed(1)}%`}
                            size="small"
                            color={s.overallAverage >= 50 ? 'success' : 'error'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

/* ────────────── ASSESSMENTS TAB ────────────── */
const AssessmentTab = ({ role, navigate }: { role?: string; navigate: any }) => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusF, setStatusF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [sectionF, setSectionF] = useState('');
  const [subjectF, setSubjectF] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [delAssessmentId, setDelAssessmentId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchDialog, setBatchDialog] = useState<'publish' | 'delete' | null>(null);

  const canCreate = ['system_admin', 'academic_head', 'teacher'].includes(role || '');
  const canPublish = ['teacher', 'academic_head', 'school_director', 'system_admin'].includes(role || '');
  const canLock = ['system_admin', 'school_director'].includes(role || '');
  const canDelete = role === 'system_admin';
  const canDeleteAssessment = ['system_admin', 'school_director'].includes(role || '');
  const canExport = ['teacher', 'academic_head', 'school_director', 'system_admin'].includes(role || '');

  useEffect(() => {
    if (role === 'teacher') {
      teachersAPI.my.sections().then((r) => {
        const d = r.data.data?.sections || [];
        setSections(d);
        if (d.length === 1) setSectionF(d[0]._id);
      }).catch(() => {});
    } else {
      sectionsAPI.list({ limit: 100 }).then((r) => {
        const d = r.data.data || [];
        if (Array.isArray(d)) setSections(d);
      }).catch(() => {});
    }
    subjectsAPI.list({ limit: 100 }).then((r) => {
      const d = r.data.data?.subjects || [];
      if (Array.isArray(d)) setSubjects(d);
    }).catch(() => {});
  }, []);

  const fetchAssessments = useCallback(() => {
    setLoading(true);
    const params: any = { limit: 50 };
    if (statusF) params.status = statusF;
    if (typeF) params.type = typeF;
    if (sectionF) params.sectionId = sectionF;
    if (subjectF) params.subjectId = subjectF;
    assessmentsAPI.list(params)
      .then((r) => setData(r.data.data || []))
      .catch(() => setError(t('failedToLoad')))
      .finally(() => setLoading(false));
  }, [statusF, typeF, sectionF, subjectF]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleBatchPublish = async () => {
    setBatchDialog(null);
    let success = 0, fail = 0;
    for (const id of selected) {
      try { await assessmentsAPI.publish(id); success++; }
      catch { fail++; }
    }
    if (success) showSuccess(t('publishedCount', { count: success }));
    if (fail) showError(t('failedCount', { count: fail }));
    setSelected(new Set());
    fetchAssessments();
  };

  const handleBatchDelete = async () => {
    setBatchDialog(null);
    let success = 0, fail = 0;
    for (const id of selected) {
      try { await assessmentsAPI.delete(id); success++; }
      catch { fail++; }
    }
    if (success) showSuccess(t('deletedCount', { count: success }));
    if (fail) showError(t('failedCount', { count: fail }));
    setSelected(new Set());
    fetchAssessments();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map((a) => a._id)));
  };

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/assessments/new')} size="small">
            {t('createAssessment')}
          </Button>
        )}
        {canPublish && selected.size > 0 && (
          <>
            <Button variant="outlined" color="success" startIcon={<Publish />} size="small" onClick={() => setBatchDialog('publish')}>
              {t('batchPublish')} ({selected.size})
            </Button>
            {canDeleteAssessment && (
              <Button variant="outlined" color="error" startIcon={<DeleteSweep />} size="small" onClick={() => setBatchDialog('delete')}>
                {t('batchDelete')} ({selected.size})
              </Button>
            )}
            <Button size="small" onClick={() => setSelected(new Set())}>{t('deselectAll')}</Button>
          </>
        )}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('status', { ns: 'common' })}</InputLabel>
          <Select value={statusF} label={t('status', { ns: 'common' })} onChange={(e) => setStatusF(e.target.value)}>
            <MenuItem value="">{t('all', { ns: 'common' })}</MenuItem>
            {['Draft', 'Published'].map((s) => (
              <MenuItem key={s} value={s}>{t(s.toLowerCase(), { ns: 'common' })}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('assessmentType')}</InputLabel>
          <Select value={typeF} label={t('assessmentType')} onChange={(e) => setTypeF(e.target.value)}>
            <MenuItem value="">{t('allTypes')}</MenuItem>
            {assessmentTypes.map((at) => <MenuItem key={at} value={at}>{at}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>{t('section', { ns: 'common' })}</InputLabel>
          <Select value={sectionF} label={t('section', { ns: 'common' })} onChange={(e) => setSectionF(e.target.value)}>
            <MenuItem value="">{t('allSections')}</MenuItem>
            {sections.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('subject', { ns: 'common' })}</InputLabel>
          <Select value={subjectF} label={t('subject', { ns: 'common' })} onChange={(e) => setSubjectF(e.target.value)}>
            <MenuItem value="">{t('allSubjects')}</MenuItem>
            {subjects.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Tooltip title={t('refresh', { ns: 'common' })}><IconButton size="small" onClick={fetchAssessments}><Refresh /></IconButton></Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                  <Checkbox
                    indeterminate={selected.size > 0 && selected.size < data.length}
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={toggleAll}
                    size="small"
                  />
                </TableCell>
                <TableCell>{t('assessmentTitle')}</TableCell>
                <TableCell>{t('assessmentType')}</TableCell>
                <TableCell>{t('subject', { ns: 'common' })}</TableCell>
                <TableCell>{t('section', { ns: 'common' })} / {t('term', { ns: 'common' })}</TableCell>
                <TableCell>{t('total', { ns: 'common' })}</TableCell>
                <TableCell>{t('completion')}</TableCell>
                <TableCell>{t('status', { ns: 'common' })}</TableCell>
                <TableCell align="center">{t('actions', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!Array.isArray(data) || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <School sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                    <Typography color="text.muted">{t('noAssessmentsFound')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((a: any) => (
                  <TableRow key={a._id} hover selected={selected.has(a._id)} sx={{ '&:last-child td': { borderBottom: 0 }, '&.Mui-selected': { bgcolor: 'rgba(27,79,138,0.04)' } }}>
                    <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                      <Checkbox checked={selected.has(a._id)} onChange={() => toggleSelect(a._id)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{a.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.date ? new Date(a.date).toLocaleDateString() : ''}</Typography>
                    </TableCell>
                    <TableCell><Chip label={a.type} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell><Typography variant="body2">{a.subject?.name || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2">{a.section?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{t('term', { ns: 'common' })} {a.term}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{a.totalMarks}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LinearProgress
                          variant="determinate"
                          value={a.marksCount && a.studentCount ? (a.marksCount / a.studentCount) * 100 : 0}
                          sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(229,231,235,0.6)' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {a.marksCount || 0}/{a.studentCount || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={a.isLocked ? t('locked', { ns: 'common' }) : t(a.status?.toLowerCase() || '', { ns: 'common' })}
                       color={(a.isLocked ? 'error' : statusColor[a.status] as any) || 'default'} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        {canPublish && a.status === 'Draft' && !a.isLocked && (
                          <Tooltip title={t('enterMarks')}>
                            <IconButton size="small" onClick={() => navigate(`/assessments/${a._id}/marks`)}><Grading fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canCreate && a.status === 'Draft' && !a.isLocked && (
                          <Tooltip title={t('edit', { ns: 'common' })}>
                            <IconButton size="small" onClick={() => navigate(`/assessments/${a._id}/edit`)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canPublish && a.status === 'Draft' && !a.isLocked && (
                          <Tooltip title={t('publishResults')}>
                            <IconButton size="small" color="success" onClick={() => setPublishTarget(a)}><Publish fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canExport && (a.status === 'Published' || a.isLocked) && (
                          <Tooltip title={t('exportMarks')}>
                            <IconButton size="small" onClick={() => {
                              setExportingId(a._id);
                              assessmentsAPI.exportMarks(a._id).then((res) => {
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url; link.setAttribute('download', `marks_${a._id}.csv`);
                                document.body.appendChild(link); link.click(); link.remove();
                                window.URL.revokeObjectURL(url);
                                                             }).catch(() => showError(tCommon('failedToExport'))).finally(() => setExportingId(null));
                            }} disabled={exportingId === a._id}>
                              {exportingId === a._id ? <CircularProgress size={16} /> : <Download fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                        {canLock && !a.isLocked && a.status === 'Published' && (
                          <Tooltip title={t('lockAssessment')}>
                            <IconButton size="small" color="warning" onClick={async () => {
                              try { await assessmentsAPI.lock(a._id); showSuccess(t('locked', { ns: 'common' })); fetchAssessments(); }
                              catch { showError(t('operationFailed', { ns: 'common' })); }
                            }}><Lock fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canLock && a.isLocked && (
                          <Tooltip title={t('unlockAssessment')}>
                            <IconButton size="small" color="error" onClick={async () => {
                              try { await assessmentsAPI.unlock(a._id); showSuccess(t('unlocked')); fetchAssessments(); }
                               catch { showError(tCommon('operationFailed')); }
                            }}><LockOpen fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canDelete && a.status !== 'Published' && !a.isLocked && (
                          <Tooltip title={t('deleteAllMarks')}>
                            <IconButton size="small" color="error" onClick={() => setDelId(a._id)}><DeleteSweep fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {canDeleteAssessment && (
                          <Tooltip title={t('deleteAssessment')}>
                            <IconButton size="small" color="error" onClick={() => setDelAssessmentId(a._id)}><DeleteForever fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <BatchDialogs batchDialog={batchDialog} setBatchDialog={setBatchDialog} selected={selected} handleBatchPublish={handleBatchPublish} handleBatchDelete={handleBatchDelete} t={t} />
      <SingleDialogs delId={delId} setDelId={setDelId} delAssessmentId={delAssessmentId} setDelAssessmentId={setDelAssessmentId} handleDeleteAll={async () => {            if (delId) { try { await assessmentsAPI.deleteAllMarks(delId); showSuccess(t('marksDeleted')); setDelId(null); fetchAssessments(); } catch { showError(tCommon('operationFailed')); } }}} handleDeleteAssessment={async () => {            if (delAssessmentId) { try { await assessmentsAPI.delete(delAssessmentId); showSuccess(t('assessmentDeleted')); setDelAssessmentId(null); fetchAssessments(); } catch (e: any) { showError(e.response?.data?.message || tCommon('operationFailed')); } }}} publishTarget={publishTarget} setPublishTarget={setPublishTarget} publishing={publishing} setPublishing={setPublishing} fetchAssessments={fetchAssessments} showSuccess={showSuccess} showError={showError} t={t} />
    </Box>
  );
};

/* ── Batch Operations Dialogs ── */
const BatchDialogs = ({ batchDialog, setBatchDialog, selected, handleBatchPublish, handleBatchDelete, t }: any) => {
  const { t: tCommon } = useTranslation('common');
  return (
  <>
    <Dialog open={batchDialog === 'publish'} onClose={() => setBatchDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('batchPublish')}</DialogTitle>
      <DialogContent>
        <Typography>{t('batchPublishConfirm', { count: selected.size })}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={() => setBatchDialog(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
        <Button onClick={handleBatchPublish} variant="contained" color="success" sx={{ borderRadius: 2 }}>{t('publishAll')}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={batchDialog === 'delete'} onClose={() => setBatchDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('batchDelete')}</DialogTitle>
      <DialogContent>
        <Typography color="error">{t('batchDeleteConfirm', { count: selected.size })}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={() => setBatchDialog(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
        <Button onClick={handleBatchDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('deleteAll')}</Button>
      </DialogActions>
    </Dialog>
  </>
  );
};

const SingleDialogs = ({ delId, setDelId, delAssessmentId, setDelAssessmentId, handleDeleteAll, handleDeleteAssessment, publishTarget, setPublishTarget, publishing, setPublishing, fetchAssessments, showSuccess, showError, t }: any) => {
  const { t: tCommon } = useTranslation('common');
  return (
  <>
    <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('deleteAllMarks')}</DialogTitle>
      <DialogContent><Typography>{t('deleteAllMarksConfirm')}</Typography></DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={() => setDelId(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
        <Button onClick={handleDeleteAll} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('deleteAll')}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={!!delAssessmentId} onClose={() => setDelAssessmentId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('deleteAssessment')}</DialogTitle>
      <DialogContent><Typography>{t('deleteAssessmentConfirm')}</Typography></DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={() => setDelAssessmentId(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
        <Button onClick={handleDeleteAssessment} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('deleteAssessment')}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={!!publishTarget} onClose={() => setPublishTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('publishAssessment')}</DialogTitle>
      <DialogContent>
        <Typography>{t('publishConfirm')}</Typography>
        <Typography mt={1} variant="body2" color="text.secondary">
          {t('assessment')}: <strong>{publishTarget?.title}</strong>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={() => setPublishTarget(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
        <Button onClick={async () => {
          if (!publishTarget) return;
          setPublishing(true);
          try {
            await assessmentsAPI.publish(publishTarget._id);
            showSuccess(t('publishSuccess'));
            setPublishTarget(null);
            fetchAssessments();
          } catch (e: any) {
            showError(e.response?.data?.message || t('failedToPublish'));
          } finally { setPublishing(false); }
        }} variant="contained" color="success" disabled={publishing} sx={{ borderRadius: 2 }}>
          {publishing ? t('publishing') : t('confirmPublish')}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
};

/* ────────────── MY MARKS TAB ────────────── */
const MyMarksTab = ({ role }: { role?: string }) => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    if (role === 'student') {
      assessmentsAPI.myGrades()
        .then((r) => {
          const raw = r.data.data || [];
          if (!raw.length) { setData({ subjects: [], totalMarks: 0, average: 0, subjectCount: 0 }); return; }
          const map = new Map<string, any>();
          for (const m of raw) {
            const ass: any = m.assessment;
            if (!ass?.subject) continue;
            const sid = ass.subject?._id || ass.subject;
            if (!map.has(sid)) map.set(sid, { subject: ass.subject, assessments: [], total: 0 });
            const e = map.get(sid)!;
            e.assessments.push({ title: ass.title, type: ass.type, total: ass.totalMarks, obtained: m.marksObtained, pct: m.percentage });
            e.total += m.marksObtained;
          }
          const subjects = Array.from(map.values()).map((e) => ({ subject: e.subject, assessments: e.assessments, subjectTotal: e.total, subjectPct: e.assessments.reduce((s: number, a: any) => s + a.pct, 0) / e.assessments.length }));
          const subjectAvgs = subjects.map((s: any) => s.subjectPct);
          const totalMarks = subjects.reduce((s: number, x: any) => s + x.subjectTotal, 0);
          const avg = subjectAvgs.length ? subjectAvgs.reduce((s: number, p: number) => s + p, 0) / subjectAvgs.length : 0;
          setData({ subjects, totalMarks, average: Math.round(avg * 100) / 100, subjectCount: subjects.length });
        })
        .catch(() => setError(t('failedToLoadMarks')))
        .finally(() => setLoading(false));
    } else if (role === 'parent') {
      assessmentsAPI.myChildrenMarks()
      .then((r) => setData(r.data.data || []))
        .catch(() => setError(t('failedToLoadChildrenMarks')))
        .finally(() => setLoading(false));
    }
  }, [role]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

  if (role === 'student') {
    const d = data as any;
    return (
      <Box>
        <Box display="flex" gap={2} mb={3}>
          {[
            { label: t('subjects'), value: d.subjectCount },
            { label: t('totalMarks'), value: d.totalMarks },
            { label: t('average'), value: d.average },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ px: 3, py: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary">{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Box>
        {d.subjects?.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>{t('noGradesPublished')}</Alert>
        ) : (
          d.subjects?.map((sub: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ mb: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                   <Typography fontWeight={700}>{sub.subject?.name || tCommon('subject')}</Typography>
                  <Chip label={`${tCommon('total')}: ${sub.subjectTotal}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('assessment', { ns: 'common' })}</TableCell>
                      <TableCell>{t('assessmentType')}</TableCell>
                      <TableCell>{t('score')}</TableCell>
                      <TableCell>{t('outOfTable')}</TableCell>
                      <TableCell>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sub.assessments.map((a: any, j: number) => (
                      <TableRow key={j}>
                        <TableCell><Typography variant="body2">{a.title}</Typography></TableCell>
                        <TableCell><Chip label={a.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell><Typography fontWeight={600}>{a.obtained}</Typography></TableCell>
                        <TableCell>{a.total}</TableCell>
                        <TableCell>
                          <Chip label={`${Math.round(a.pct)}%`} size="small" color={a.pct >= 50 ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))
        )}
      </Box>
    );
  }

  if (role === 'parent') {
    const children = data as any[];
    if (!children?.length) return <Alert severity="info" sx={{ borderRadius: 2 }}>{t('noChildrenMarksFound')}</Alert>;
    return (
      <Box>
        {children.map((child: any, i: number) => (
          <Paper key={i} elevation={0} sx={{ mb: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={700}>{child.student?.firstName} {child.student?.lastName}</Typography>
                   <Typography variant="caption" color="text.secondary">{child.student?.studentId} · {child.student?.section?.name || tCommon('noSection')}</Typography>
                </Box>
                <Chip label={`${tCommon('avg')}: ${child.average}`} color="primary" size="small" sx={{ fontWeight: 600 }} />
              </Box>
            </Box>
            {child.subjects?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('subject', { ns: 'common' })}</TableCell>
                      <TableCell>{t('assessments')}</TableCell>
                      <TableCell>{tCommon('total')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {child.subjects.map((sub: any, j: number) => (
                      <TableRow key={j}>
                        <TableCell><Typography fontWeight={600}>{sub.subject?.name || tCommon('subject')}</Typography></TableCell>
                        <TableCell><Chip label={`${sub.assessments.length} ${t('assessments')}`} size="small" variant="outlined" /></TableCell>
                        <TableCell><Typography fontWeight={600}>{sub.subjectTotal}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 2 }}><Alert severity="info" sx={{ m: 0, borderRadius: 2 }}>{t('noMarksAvailableYet')}</Alert></Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  return null;
};

/* ────────────── SECTION OVERVIEW TAB ────────────── */
const SectionOverviewTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { showError } = useNotification();
  const [sections, setSections] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [sectionData, setSectionData] = useState<any>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    sectionsAPI.list({ limit: 100 }).then((r) => {
      const d = r.data.data || [];
      if (Array.isArray(d)) { setSections(d); if (d.length) setSelected(d[0]._id); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setFetching(true);
    Promise.all([
      assessmentsAPI.list({ sectionId: selected, limit: 100 }),
      sectionsAPI.students(selected),
    ])
      .then(([ar, sr]) => {
        const assessments = ar.data.data || [];
        const studentsData = sr.data.data;
        const students = Array.isArray(studentsData) ? studentsData : (studentsData?.students || []);
        setSectionData({ assessments: Array.isArray(assessments) ? assessments : [], students: Array.isArray(students) ? students : [] });
      })
      .catch(() => showError(t('failedToLoad')))
      .finally(() => setFetching(false));
  }, [selected]);

  return (
    <Box>
      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>{t('section', { ns: 'common' })}</InputLabel>
        <Select value={selected} label={t('section', { ns: 'common' })} onChange={(e) => setSelected(e.target.value)}>
          {sections.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name} (Grade {s.grade})</MenuItem>)}
        </Select>
      </FormControl>
      {fetching ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>
      ) : sectionData ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(229,231,235,0.6)', display: 'flex', gap: 3 }}>
            <Typography variant="body2"><strong>{sectionData.assessments.length}</strong> {t('assessments', { ns: 'common' })}</Typography>
            <Typography variant="body2"><strong>{sectionData.students.length}</strong> {t('students', { ns: 'common' })}</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('student', { ns: 'common' })}</TableCell>
                  <TableCell>{t('studentId')}</TableCell>
                  <TableCell>{t('assessments', { ns: 'common' })}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionData.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <School sx={{ fontSize: 32, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                      <Typography color="text.muted">{t('noStudentsFound')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sectionData.students.map((s: any) => (
                    <TableRow key={s._id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{s.studentId}</Typography></TableCell>
                      <TableCell><Chip label={`${sectionData.assessments.length}`} size="small" /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>{t('selectSectionToView')}</Alert>
      )}
    </Box>
  );
};

/* ────────────── AT-RISK STUDENTS TAB ────────────── */
const AtRiskStudentsTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState('50');

  const fetch = useCallback(() => {
    setLoading(true);
    const ayStart = new Date().getMonth() + 1 >= 9 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    assessmentsAPI.atRiskStudents({ academicYear: `${ayStart}/${ayStart + 1}`, threshold })
      .then((r) => {
        const raw = r.data.data || [];
        setData(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setError(t('failedToLoadAtRiskStudents')))
      .finally(() => setLoading(false));
  }, [threshold]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h6" fontWeight={700}>{t('tabAt-RiskStudents')}</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('threshold')}</InputLabel>
          <Select value={threshold} label={t('threshold')} onChange={(e) => setThreshold(e.target.value)}>
            <MenuItem value="40">{t('criticalBelow40')}</MenuItem>
            <MenuItem value="50">{t('atRiskBelow50')}</MenuItem>
            <MenuItem value="60">{t('borderlineBelow60')}</MenuItem>
          </Select>
        </FormControl>
        <IconButton size="small" onClick={fetch}><Refresh /></IconButton>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          {data.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Warning sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
              <Typography color="text.muted">{t('noAtRiskStudentsFound')}</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t('student', { ns: 'common' })}</TableCell>
                    <TableCell>{t('section', { ns: 'common' })}</TableCell>
                    <TableCell>{t('overallAverage')}</TableCell>
                    <TableCell>{tCommon('status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((s: any, i: number) => (
                    <TableRow key={s.student?._id || i} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{s.student?.firstName} {s.student?.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.student?.studentId}</Typography>
                      </TableCell>
                      <TableCell>{s.student?.section?.name || '—'}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color={s.overallAverage < 40 ? 'error' : 'warning.main'}>
                          {s.overallAverage?.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.flaggedLevel || t('atRisk')} size="small" color={s.flaggedLevel === 'Critical' ? 'error' : 'warning'} sx={{ fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
};

/* ────────────── RANKINGS TAB ────────────── */
const RankingsTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = new Date();
  const defAY = now.getMonth() + 1 >= 9 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const [academicYear, setAcademicYear] = useState(defAY);
  const [term, setTerm] = useState('1');

  useEffect(() => {
    setLoading(true);
    rankingsAPI.list({ academicYear, term, limit: 50 })
      .then((r) => setRankings(r.data.data || []))
      .catch(() => setError(t('failedToLoadRankings')))
      .finally(() => setLoading(false));
  }, [academicYear, term]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <Box display="flex" gap={2} mb={2}>
        <TextField label={t('academicYear', { ns: 'common' })} size="small" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} sx={{ minWidth: 140 }} />
        <TextField label={tCommon('term')} size="small" select value={term} onChange={(e) => setTerm(e.target.value)} sx={{ minWidth: 100 }}>
          <MenuItem value="1">{t('term1')}</MenuItem>
          <MenuItem value="2">{t('term2')}</MenuItem>
        </TextField>
      </Box>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('rank', { ns: 'common' })}</TableCell>
                <TableCell>{t('student', { ns: 'common' })}</TableCell>
                <TableCell>{t('overallAverage')}</TableCell>
                <TableCell>{t('section', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <EmojiEvents sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
                    <Typography color="text.muted">{t('noRankingsAvailable')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map((r: any, i: number) => (
                  <TableRow key={r._id || i} hover>
                    <TableCell>
                      <Chip label={`#${r.schoolRank || i + 1}`} size="small" color={i === 0 ? 'warning' : i < 3 ? 'primary' : 'default'} sx={{ fontWeight: 700, minWidth: 36 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.student?.studentId}</Typography>
                    </TableCell>
                    <TableCell><Typography fontWeight={700}>{r.overallAverage?.toFixed(1) || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{r.student?.section?.name || r.section?.name || '—'}</Typography></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

/* ────────────── GRADE SCALE TAB ────────────── */
const GradeScaleTab = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [scales, setScales] = useState<any[]>([]);
  const [activeScale, setActiveScale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState(false);

  const defaultThresholds = [
    { letter: 'A', minPercent: 90, gradePoint: 4.0 },
    { letter: 'B', minPercent: 80, gradePoint: 3.0 },
    { letter: 'C', minPercent: 70, gradePoint: 2.0 },
    { letter: 'D', minPercent: 60, gradePoint: 1.0 },
    { letter: 'F', minPercent: 0, gradePoint: 0.0 },
  ];

  const defaultWeights = [
    { type: 'Assignment', weight: 10 },
    { type: 'Quiz', weight: 15 },
    { type: 'Class Work', weight: 15 },
    { type: 'Project', weight: 20 },
    { type: 'Mid Exam', weight: 20 },
    { type: 'Final Exam', weight: 20 },
  ];

  const [form, setForm] = useState<any>({
    name: '',
    academicYear: (() => { const n = new Date(); return n.getMonth() + 1 >= 9 ? `${n.getFullYear()}/${n.getFullYear() + 1}` : `${n.getFullYear() - 1}/${n.getFullYear()}`; })(),
    gradeThresholds: defaultThresholds,
    typeWeights: defaultWeights,
    passThreshold: 50,
    isActive: true,
  });

  useEffect(() => {
    Promise.all([
      gradeScaleAPI.list(),
      gradeScaleAPI.active(),
    ]).then(([listRes, activeRes]) => {
      const list = listRes.data.data || [];
      setScales(Array.isArray(list) ? list : []);
      const active = activeRes.data.data;
      if (active) {
        setActiveScale(active);
        setForm({
          name: active.name || '',
          academicYear: active.academicYear || form.academicYear,
          gradeThresholds: active.gradeThresholds || defaultThresholds,
          typeWeights: active.typeWeights || defaultWeights,
          passThreshold: active.passThreshold ?? 50,
          isActive: true,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeScale?._id) {
        await gradeScaleAPI.update(activeScale._id, form);
      } else {
        await gradeScaleAPI.create(form);
      }
      showSuccess(t('scaleSaved'));
      setEditDialog(false);
      const [listRes, activeRes] = await Promise.all([gradeScaleAPI.list(), gradeScaleAPI.active()]);
      setScales(Array.isArray(listRes.data.data) ? listRes.data.data : []);
      setActiveScale(activeRes.data.data);
    } catch (e: any) {
      showError(e.response?.data?.message || t('failedToSave'));
    } finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{t('gradeScale')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('gradeScaleDesc')}</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setEditDialog(true); }}>
          {t('configureScale')}
        </Button>
      </Box>

      {activeScale ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontWeight={700}>{activeScale.name} <Chip label={activeScale.academicYear} size="small" sx={{ ml: 1 }} /></Typography>
            <Chip label={tCommon('active')} color="success" size="small" sx={{ fontWeight: 600 }} />
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('gradeThresholds')}</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('letter')}</TableCell>
                    <TableCell>{t('minPercent')}</TableCell>
                    <TableCell>{t('gradePoints')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeScale.gradeThresholds?.sort((a: any, b: any) => b.minPercent - a.minPercent).map((t: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Typography fontWeight={700}>{t.letter}</Typography></TableCell>
                      <TableCell>{t.minPercent}%</TableCell>
                      <TableCell>{t.gradePoint.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('typeWeights')}</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('assessmentType')}</TableCell>
                    <TableCell>{t('weight')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeScale.typeWeights?.map((w: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{w.type}</TableCell>
                      <TableCell>{w.weight}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={1.5}>
              <Typography variant="body2" color="text.secondary">
                {t('passThreshold')}: <strong>{activeScale.passThreshold}%</strong>
              </Typography>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>{t('noActiveScale')}</Alert>
      )}

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('configureScale')}</DialogTitle>
        <DialogContent>
          <TextField label={t('scaleName')} size="small" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField label={tCommon('academicYear')} size="small" fullWidth value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} sx={{ mb: 2 }} />
          <TextField label={t('passThreshold')} size="small" type="number" fullWidth value={form.passThreshold} onChange={(e) => setForm({ ...form, passThreshold: Number(e.target.value) })} sx={{ mb: 2 }} />

          <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('gradeThresholds')}</Typography>
          {form.gradeThresholds?.map((gt: any, i: number) => (
            <Box key={i} display="flex" gap={1} mb={1}>
              <TextField size="small" label={t('letter')} value={gt.letter} onChange={(e) => {
                const updated = [...form.gradeThresholds];
                updated[i] = { ...updated[i], letter: e.target.value };
                setForm({ ...form, gradeThresholds: updated });
              }} sx={{ width: 80 }} />
              <TextField size="small" label={t('minPercent')} type="number" value={gt.minPercent} onChange={(e) => {
                const updated = [...form.gradeThresholds];
                updated[i] = { ...updated[i], minPercent: Number(e.target.value) };
                setForm({ ...form, gradeThresholds: updated });
              }} sx={{ width: 100 }} />
              <TextField size="small" label={t('gradePoints')} type="number" value={gt.gradePoint} onChange={(e) => {
                const updated = [...form.gradeThresholds];
                updated[i] = { ...updated[i], gradePoint: Number(e.target.value) };
                setForm({ ...form, gradeThresholds: updated });
              }} sx={{ width: 100 }} />
            </Box>
          ))}

          <Typography variant="subtitle2" fontWeight={700} mb={1} mt={2}>{t('typeWeights')}</Typography>
          {form.typeWeights?.map((tw: any, i: number) => (
            <Box key={i} display="flex" gap={1} mb={1}>
              <TextField size="small" label={t('assessmentType')} value={tw.type} sx={{ width: 140 }} />
              <TextField size="small" label={t('weight')} type="number" value={tw.weight} onChange={(e) => {
                const updated = [...form.typeWeights];
                updated[i] = { ...updated[i], weight: Number(e.target.value) };
                setForm({ ...form, typeWeights: updated });
              }} sx={{ width: 100 }} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? tCommon('saving') : t('saveScale')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
