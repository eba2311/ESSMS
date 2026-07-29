import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Grid, Chip, CircularProgress, Alert, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Tooltip,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Add, School, Group, Book, Assignment } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { subjectsAPI, sectionsAPI, teachersAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export const SubjectDetailPage = () => {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === 'system_admin' || role === 'academic_head' || role === 'school_director';
  const canManageMaterials = role === 'teacher' || role === 'system_admin';

  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const [assignDialog, setAssignDialog] = useState(false);
  const [resourceDialog, setResourceDialog] = useState(false);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCurrentAY = () => { const n = new Date(); return n.getMonth() + 1 >= 9 ? `${n.getFullYear()}/${n.getFullYear() + 1}` : `${n.getFullYear() - 1}/${n.getFullYear()}`; };
  const [assignForm, setAssignForm] = useState({ gradeLevel: 9, section: '', teacher: '', academicYear: getCurrentAY() });
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'Textbook', description: '', quantity: 1 });
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'Note', fileUrl: '', section: '', description: '' });
  const [scheduleForm, setScheduleForm] = useState({ section: '', teacher: '', dayOfWeek: 'Monday', startTime: '08:00', endTime: '08:50', academicYear: getCurrentAY(), semester: 1 });
  const [delItem, setDelItem] = useState<{ type: string; id: string } | null>(null);

  const [sections, setSections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await subjectsAPI.get(id!);
      setSubject(res.data.data);
    } catch { setError(t('failedToLoadSubject')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubject(); }, [id]);
  useEffect(() => {
    sectionsAPI.list({ isActive: true }).then((r) => setSections(r.data.data || []));
    teachersAPI.list({ limit: 100 }).then((r) => setTeachers(r.data.data || []));
  }, []);

  const handleAssign = async () => {
    if (!assignForm.gradeLevel || !assignForm.academicYear) { showError(t('gradeAndAcademicYearRequired')); return; }
    setSaving(true);
    try {
      await subjectsAPI.assignments.create({ subject: id, ...assignForm, section: assignForm.section || undefined, teacher: assignForm.teacher || undefined });
      showSuccess(t('assignmentCreated'));
      setAssignDialog(false);
      setAssignForm({ gradeLevel: 9, section: '', teacher: '', academicYear: getCurrentAY() });
      fetchSubject();
    } catch (err: any) { showError(err.response?.data?.message || t('failedToAssign')); }
    finally { setSaving(false); }
  };

  const handleDeleteAssignment = (aid: string) => {
    setDelItem({ type: 'assignment', id: aid });
  };

  const handleAddResource = async () => {
    if (!resourceForm.name) { showError(t('resourceNameRequired')); return; }
    setSaving(true);
    try {
      await subjectsAPI.resources.create({ subject: id, ...resourceForm });
      showSuccess(t('resourceAdded'));
      setResourceDialog(false);
      setResourceForm({ name: '', type: 'Textbook', description: '', quantity: 1 });
      fetchSubject();
    } catch { showError(t('failedToAddResource')); }
    finally { setSaving(false); }
  };

  const handleDelConfirm = async () => {
    if (!delItem) return;
    const { type, id } = delItem;
    try {
      if (type === 'assignment') { await subjectsAPI.assignments.delete(id); showSuccess(t('assignmentRemoved')); }
      else if (type === 'resource') { await subjectsAPI.resources.delete(id); showSuccess(t('resourceDeleted')); }
      else if (type === 'material') { await subjectsAPI.materials.delete(id); showSuccess(t('materialDeleted')); }
      else if (type === 'schedule') { await subjectsAPI.schedules.delete(id); showSuccess(t('scheduleSlotDeleted')); }
      fetchSubject();
    } catch { showError(t('failedToDelete')); }
    finally { setDelItem(null); }
  };

  const handleDeleteResource = (rid: string) => { setDelItem({ type: 'resource', id: rid }); };

  const handleAddMaterial = async () => {
    if (!materialForm.title) { showError(t('titleRequired')); return; }
    setSaving(true);
    try {
      await subjectsAPI.materials.create({ subject: id, ...materialForm, section: materialForm.section || undefined });
      showSuccess(t('materialAdded'));
      setMaterialDialog(false);
      setMaterialForm({ title: '', type: 'Note', fileUrl: '', section: '', description: '' });
      fetchSubject();
    } catch { showError(t('failedToAddMaterial')); }
    finally { setSaving(false); }
  };

  const handleDeleteMaterial = (mid: string) => { setDelItem({ type: 'material', id: mid }); };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!subject) return null;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/subjects')} sx={{ borderRadius: 2 }}>{t('back')}</Button>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{subject.name}</Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">{subject.code}</Typography>
        </Box>
        {canManage && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/subjects/${id}/edit`)} sx={{ borderRadius: 2 }}>{t('edit')}</Button>
        )}
      </Box>

      <Grid container spacing={2} mb={3}>
        {[
          [t('type'), subject.subjectType || (subject.isCore ? t('compulsory') : t('elective'))],
          [t('department'), subject.department || '—'],
          [t('shortName'), subject.shortName || '—'],
          [t('grades'), subject.grades?.join(', ') || '—'],
          [t('periodsWeek'), subject.weeklyPeriods ?? 4],
          [t('year'), subject.academicYear || '—'],
          [t('semester'), `${t('semester')} ${subject.semester ?? 1}`],
          [t('status'), subject.status || t('active')],
          [t('assignments'), subject.assignments?.length || 0],
          [t('resources'), subject.resources?.length || 0],
          [t('materials'), subject.materials?.length || 0],
          [t('enrolledStudents'), subject.studentCount || 0],
          [t('teacherAssignments'), subject.teacherAssignments?.length || 0],
          [t('scheduleSlots'), subject.schedule?.length || 0],
        ].map(([label, value]) => (
          <Grid item xs={6} md={2} key={String(label)}>
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', p: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}>
        <Tab icon={<Assignment sx={{ fontSize: 18 }} />} label={t('assignments')} iconPosition="start" />
        <Tab icon={<Book sx={{ fontSize: 18 }} />} label={t('resources')} iconPosition="start" />
        <Tab icon={<School sx={{ fontSize: 18 }} />} label={t('materials')} iconPosition="start" />
        <Tab icon={<Group sx={{ fontSize: 18 }} />} label={t('schedule')} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{t('gradeSectionAssignments')}</Typography>
            {canManage && (
              <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setAssignDialog(true)} sx={{ borderRadius: 2 }}>{t('assign')}</Button>
            )}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('grade')}</TableCell>
                    <TableCell>{t('section')}</TableCell>
                    <TableCell>{t('teacher')}</TableCell>
                    <TableCell>{t('academicYear')}</TableCell>
                    <TableCell>{t('status')}</TableCell>
                    {canManage && <TableCell align="right">{t('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subject.assignments || []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('noAssignments')}</TableCell></TableRow>
                  ) : (
                    (subject.assignments || []).map((a: any) => (
                      <TableRow key={a._id} hover>
                        <TableCell><Chip label={`${t('grade')} ${a.gradeLevel}`} size="small" variant="outlined" /></TableCell>
                        <TableCell>{a.section ? `${a.section.name}` : '—'}</TableCell>
                        <TableCell>{a.teacher ? `${a.teacher.firstName} ${a.teacher.lastName}` : '—'}</TableCell>
                        <TableCell>{a.academicYear}</TableCell>
                        <TableCell>
                          <Chip label={a.status} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: a.status === 'Active' ? 'rgba(45,125,58,0.1)' : 'rgba(107,114,128,0.1)', color: a.status === 'Active' ? '#2D7D3A' : '#6B7280' }} />
                        </TableCell>
                        {canManage && (
                          <TableCell align="right">
                            <Tooltip title={t('remove')}><IconButton size="small" color="error" onClick={() => handleDeleteAssignment(a._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {(subject.teacherAssignments || []).length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>{t('teacherAssignmentsFromTimetable')}</Typography>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('teacher')}</TableCell>
                        <TableCell>{t('section')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(subject.teacherAssignments || []).map((a: any) => (
                        <TableRow key={a._id} hover>
                          <TableCell>{a.teacher?.firstName} {a.teacher?.lastName}</TableCell>
                          <TableCell>{a.section?.name} ({t('grade')} {a.section?.grade})</TableCell>
                          <TableCell><Chip label={a.isActive ? t('active') : t('inactive')} size="small" color={a.isActive ? 'success' : 'default'} sx={{ fontSize: '0.65rem' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{t('subjectResources')}</Typography>
            {canManage && (
              <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setResourceDialog(true)} sx={{ borderRadius: 2 }}>{t('addResource')}</Button>
            )}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('name')}</TableCell>
                    <TableCell>{t('type')}</TableCell>
                    <TableCell>{t('quantity')}</TableCell>
                    <TableCell>{t('status')}</TableCell>
                    {canManage && <TableCell align="right">{t('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subject.resources || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('noResources')}</TableCell></TableRow>
                  ) : (
                    (subject.resources || []).map((r: any) => (
                      <TableRow key={r._id} hover>
                        <TableCell><Typography fontWeight={600}>{r.name}</Typography></TableCell>
                        <TableCell><Chip label={r.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell>
                          <Chip label={r.status} size="small"
                            sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: r.status === 'Available' ? 'rgba(45,125,58,0.1)' : r.status === 'Limited' ? 'rgba(245,158,11,0.1)' : 'rgba(220,38,38,0.1)', color: r.status === 'Available' ? '#2D7D3A' : r.status === 'Limited' ? '#B45309' : '#DC2626' }} />
                        </TableCell>
                        {canManage && (
                          <TableCell align="right">
                            <Tooltip title={t('delete')}><IconButton size="small" color="error" onClick={() => handleDeleteResource(r._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{t('learningMaterials')}</Typography>
            {canManageMaterials && (
              <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setMaterialDialog(true)} sx={{ borderRadius: 2 }}>{t('addMaterial')}</Button>
            )}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('title')}</TableCell>
                    <TableCell>{t('type')}</TableCell>
                    <TableCell>{t('section')}</TableCell>
                    <TableCell>{t('uploadedBy')}</TableCell>
                    <TableCell>{t('date')}</TableCell>
                    {(canManageMaterials || canManage) && <TableCell align="right">{t('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subject.materials || []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('noMaterials')}</TableCell></TableRow>
                  ) : (
                    (subject.materials || []).map((m: any) => (
                      <TableRow key={m._id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{m.title}</Typography>
                          {m.description && <Typography variant="caption" color="text.secondary">{m.description}</Typography>}
                        </TableCell>
                        <TableCell><Chip label={m.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell>{m.section || '—'}</TableCell>
                        <TableCell>{m.uploadedBy?.firstName} {m.uploadedBy?.lastName}</TableCell>
                        <TableCell>{m.createdAt?.split('T')[0]}</TableCell>
                        {(canManageMaterials || canManage) && (
                          <TableCell align="right">
                            <Tooltip title={t('delete')}><IconButton size="small" color="error" onClick={() => handleDeleteMaterial(m._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>{t('subjectSchedule')}</Typography>
            {canManage && (
              <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setScheduleDialog(true)} sx={{ borderRadius: 2 }}>{t('addSlot')}</Button>
            )}
          </Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('day')}</TableCell>
                    <TableCell>{t('start')}</TableCell>
                    <TableCell>{t('end')}</TableCell>
                    <TableCell>{t('section')}</TableCell>
                    <TableCell>{t('teacher')}</TableCell>
                    <TableCell>{t('semester')}</TableCell>
                    {canManage && <TableCell align="right">{t('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subject.schedule || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>{t('noScheduleSlots')}</TableCell></TableRow>
                  ) : (
                    (subject.schedule || []).map((slot: any) => (
                      <TableRow key={slot._id} hover>
                        <TableCell><Chip label={slot.dayOfWeek} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }} /></TableCell>
                        <TableCell>{slot.startTime}</TableCell>
                        <TableCell>{slot.endTime}</TableCell>
                        <TableCell>{slot.section?.name} ({t('grade')} {slot.section?.grade})</TableCell>
                        <TableCell>{slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : '—'}</TableCell>
                        <TableCell>{t('semester')} {slot.semester}</TableCell>
                        {canManage && (
                          <TableCell align="right">
                            <Tooltip title={t('delete')}><IconButton size="small" color="error" onClick={() => setDelItem({ type: 'schedule', id: slot._id })}><Delete fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('assignSubject')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('gradeLevel')} *</InputLabel>
              <Select value={assignForm.gradeLevel} label={`${t('gradeLevel')} *`} onChange={(e) => setAssignForm((p) => ({ ...p, gradeLevel: e.target.value as number }))}>
                {[9, 10, 11, 12].map((g) => <MenuItem key={g} value={g}>{t('grade')} {g}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('sectionOptional')}</InputLabel>
              <Select value={assignForm.section} label={t('sectionOptional')} onChange={(e) => setAssignForm((p) => ({ ...p, section: e.target.value }))}>
                <MenuItem value="">{t('allSections')}</MenuItem>
                {sections.map((s) => <MenuItem key={s._id} value={s._id}>{t('grade')} {s.grade} {s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('teacherOptional')}</InputLabel>
              <Select value={assignForm.teacher} label={t('teacherOptional')} onChange={(e) => setAssignForm((p) => ({ ...p, teacher: e.target.value }))}>
                <MenuItem value="">{t('notAssigned')}</MenuItem>
                {teachers.map((tch) => <MenuItem key={tch._id} value={tch._id}>{tch.firstName} {tch.lastName}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={`${t('academicYear')} *`} size="small" value={assignForm.academicYear} onChange={(e) => setAssignForm((p) => ({ ...p, academicYear: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleAssign} disabled={saving}>{saving ? t('saving') : t('assign')}</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('addScheduleSlot')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('section')} *</InputLabel>
              <Select value={scheduleForm.section} label={`${t('section')} *`} onChange={(e) => setScheduleForm((p) => ({ ...p, section: e.target.value }))}>
                {sections.map((s) => <MenuItem key={s._id} value={s._id}>{t('grade')} {s.grade} {s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('teacherOptional')}</InputLabel>
              <Select value={scheduleForm.teacher} label={t('teacherOptional')} onChange={(e) => setScheduleForm((p) => ({ ...p, teacher: e.target.value }))}>
                <MenuItem value="">{t('notAssigned')}</MenuItem>
                {teachers.map((tch) => <MenuItem key={tch._id} value={tch._id}>{tch.firstName} {tch.lastName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('dayOfWeek')}</InputLabel>
              <Select value={scheduleForm.dayOfWeek} label={t('dayOfWeek')} onChange={(e) => setScheduleForm((p) => ({ ...p, dayOfWeek: e.target.value }))}>
                {[{ v: 'Monday', k: t('monday') }, { v: 'Tuesday', k: t('tuesday') }, { v: 'Wednesday', k: t('wednesday') }, { v: 'Thursday', k: t('thursday') }, { v: 'Friday', k: t('friday') }, { v: 'Saturday', k: t('saturday') }].map((d) => <MenuItem key={d.v} value={d.v}>{d.k}</MenuItem>)}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField fullWidth label={t('startTime')} type="time" size="small" value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm((p) => ({ ...p, startTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth label={t('endTime')} type="time" size="small" value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm((p) => ({ ...p, endTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField fullWidth label={t('academicYear')} size="small" value={scheduleForm.academicYear} onChange={(e) => setScheduleForm((p) => ({ ...p, academicYear: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>{t('semester')}</InputLabel>
              <Select value={scheduleForm.semester} label={t('semester')} onChange={(e) => setScheduleForm((p) => ({ ...p, semester: e.target.value as number }))}>
                <MenuItem value={1}>{t('semester1')}</MenuItem>
                <MenuItem value={2}>{t('semester2')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={async () => {
            if (!scheduleForm.section || !scheduleForm.dayOfWeek) { showError(t('sectionAndDayRequired')); return; }
            setSaving(true);
            try {
              await subjectsAPI.schedules.create({ subject: id, ...scheduleForm, teacher: scheduleForm.teacher || undefined });
              showSuccess(t('scheduleSlotAdded'));
              setScheduleDialog(false);
              setScheduleForm({ section: '', teacher: '', dayOfWeek: 'Monday', startTime: '08:00', endTime: '08:50', academicYear: getCurrentAY(), semester: 1 });
              fetchSubject();
            } catch (err: any) { showError(err.response?.data?.message || t('failedToAddSlot')); }
            finally { setSaving(false); }
          }} disabled={saving}>{saving ? t('saving') : t('addSlot')}</Button>
        </DialogActions>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialog} onClose={() => setResourceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('addResource')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField fullWidth label={`${t('name')} *`} size="small" value={resourceForm.name} onChange={(e) => setResourceForm((p) => ({ ...p, name: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>{t('type')}</InputLabel>
              <Select value={resourceForm.type} label={t('type')} onChange={(e) => setResourceForm((p) => ({ ...p, type: e.target.value }))}>
                {['Textbook', 'Laboratory', 'Equipment', 'Other'].map((rt) => <MenuItem key={rt} value={rt}>{rt}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={t('quantity')} type="number" size="small" value={resourceForm.quantity} onChange={(e) => setResourceForm((p) => ({ ...p, quantity: Number(e.target.value) }))} inputProps={{ min: 0 }} />
            <TextField fullWidth label={t('description')} multiline rows={2} size="small" value={resourceForm.description} onChange={(e) => setResourceForm((p) => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialog(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleAddResource} disabled={saving}>{saving ? t('saving') : t('add')}</Button>
        </DialogActions>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialog} onClose={() => setMaterialDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('addLearningMaterial')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField fullWidth label={`${t('title')} *`} size="small" value={materialForm.title} onChange={(e) => setMaterialForm((p) => ({ ...p, title: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>{t('type')}</InputLabel>
              <Select value={materialForm.type} label={t('type')} onChange={(e) => setMaterialForm((p) => ({ ...p, type: e.target.value }))}>
                {['Note', 'PDF', 'Assignment', 'Project', 'Other'].map((mt) => <MenuItem key={mt} value={mt}>{mt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t('sectionOptional')}</InputLabel>
              <Select value={materialForm.section} label={t('sectionOptional')} onChange={(e) => setMaterialForm((p) => ({ ...p, section: e.target.value }))}>
                <MenuItem value="">{t('allSections')}</MenuItem>
                {sections.map((s) => <MenuItem key={s._id} value={s._id}>{t('grade')} {s.grade} {s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={t('fileUrl')} size="small" value={materialForm.fileUrl} onChange={(e) => setMaterialForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." />
            <TextField fullWidth label={t('description')} multiline rows={2} size="small" value={materialForm.description} onChange={(e) => setMaterialForm((p) => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialog(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleAddMaterial} disabled={saving}>{saving ? t('saving') : t('add')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!delItem} onClose={() => setDelItem(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('confirmDeletion')}</DialogTitle>
        <DialogContent>
          <Typography>
            {delItem?.type === 'assignment' ? t('removeAssignmentConfirm') :
             delItem?.type === 'resource' ? t('deleteResourceConfirm') :
             delItem?.type === 'material' ? t('deleteMaterialConfirm') :
             delItem?.type === 'schedule' ? t('deleteScheduleConfirm') : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelItem(null)} sx={{ borderRadius: 2 }}>{t('cancel')}</Button>
          <Button onClick={handleDelConfirm} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
