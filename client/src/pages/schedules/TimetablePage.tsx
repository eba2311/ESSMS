import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, FormControl, InputLabel, Select, IconButton, Tooltip,
} from '@mui/material';
import {
  Add, Delete, Edit, AccessTime, CalendarToday, Refresh,
} from '@mui/icons-material';
import { timetablesAPI, sectionsAPI, subjectsAPI, classroomsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:50', end: '09:35' },
  3: { start: '09:40', end: '10:25' },
  4: { start: '10:30', end: '11:15' },
  5: { start: '11:20', end: '12:05' },
  6: { start: '13:00', end: '13:45' },
  7: { start: '13:50', end: '14:35' },
  8: { start: '14:40', end: '15:25' },
};

export const TimetablePage = () => {
  const { t } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const [timetable, setTimetable] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionId, setSectionId] = useState('');
  const getCurrentAY = () => { const n = new Date(); return n.getMonth() + 1 >= 9 ? `${n.getFullYear()}/${String(n.getFullYear() + 1).slice(-2)}` : `${n.getFullYear() - 1}/${String(n.getFullYear()).slice(-2)}`; };
  const [academicYear, setAcademicYear] = useState(getCurrentAY());
  const [slotDialog, setSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 'Monday', periodNumber: 1,
    startTime: '', endTime: '',
    subjectId: '', teacherId: '', classroomId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (sectionId) {
        const [ttRes, subjectsRes, classroomsRes] = await Promise.all([
          timetablesAPI.getBySection(sectionId, academicYear),
          subjectsAPI.list({ limit: 100 }),
          classroomsAPI.list({ limit: 100 }),
        ]);
        setTimetable(ttRes.data.data);
        setSubjects(subjectsRes.data.data?.subjects || []);
        setClassrooms(classroomsRes.data.data?.classrooms || []);
      }
    } catch { showError(t('failedToLoadData')) }
    finally { setLoading(false) }
  };

  const fetchSections = async () => {
    try {
      const res = await sectionsAPI.list({ limit: 100 });
      setSections(res.data.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchSections(); }, []);

  useEffect(() => { if (sectionId) fetchData(); }, [sectionId, academicYear]);

  const getSlotInfo = (day: string, period: number) => {
    return timetable?.schedule?.find((s: any) => s.dayOfWeek === day && s.periodNumber === period);
  };

  const openAddSlot = (day?: string, period?: number) => {
    setEditingSlot(null);
    const defaults = PERIOD_TIMES[period || 1];
    setSlotForm({
      dayOfWeek: day || 'Monday',
      periodNumber: period || 1,
      startTime: defaults?.start || '08:00',
      endTime: defaults?.end || '08:45',
      subjectId: '', teacherId: '', classroomId: '',
    });
    setSlotDialog(true);
  };

  const openEditSlot = (slot: any) => {
    setEditingSlot(slot);
    setSlotForm({
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      subjectId: slot.subject?._id || slot.subject || '',
      teacherId: '', classroomId: slot.classroom?._id || slot.classroom || '',
    });
    setSlotDialog(true);
  };

  const handleSaveSlot = async () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      showError(t('startAndEndTimesRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editingSlot) {
        await timetablesAPI.removeSlot(timetable._id, editingSlot._id);
        await timetablesAPI.addSlot(timetable._id, slotForm);
        showSuccess(t('slotUpdated'));
      } else {
        await timetablesAPI.addSlot(timetable._id, slotForm);
        showSuccess(t('slotAdded'));
      }
      setSlotDialog(false);
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || t('failedToSaveSlot'));
    } finally { setSaving(false) }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await timetablesAPI.removeSlot(timetable._id, slotId);
      showSuccess(t('slotRemoved'));
      fetchData();
    } catch { showError(t('failedToRemoveSlot')) }
  };

  const handleCreateTimetable = async () => {
    if (!sectionId) return;
    setSaving(true);
    try {
      const schedule = [];
      for (const day of DAYS) {
        for (const period of PERIODS) {
          const times = PERIOD_TIMES[period];
          schedule.push({
            dayOfWeek: day, periodNumber: period,
            startTime: times.start, endTime: times.end,
          });
        }
      }
      await timetablesAPI.create({
        sectionId, academicYear, schedule,
        effectiveFrom: new Date().toISOString(),
      });
      showSuccess(t('timetableCreated'));
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || t('failedToCreateTimetable'));
    } finally { setSaving(false) }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Typography variant="h5" fontWeight={700}>{t('timetable')}</Typography>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <TextField select size="small" label={t('section')} value={sectionId}
            onChange={e => setSectionId(e.target.value)} sx={{ minWidth: 200 }}>
            {sections.map((s: any) => (
              <MenuItem key={s._id} value={s._id}>{s.name} (Grade {s.grade})</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label={t('year')} value={academicYear}
            onChange={e => setAcademicYear(e.target.value)} sx={{ minWidth: 120 }}>
            {(() => {
              const now = new Date();
              const baseYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
              return [baseYear - 1, baseYear, baseYear + 1].map(y => {
                const short = `${y}/${String(y + 1).slice(-2)}`;
                return <MenuItem key={short} value={short}>{short}</MenuItem>;
              });
            })()}
          </TextField>
          {sectionId && !timetable && (
            <Button variant="outlined" startIcon={<Add />} onClick={handleCreateTimetable}
              disabled={saving} size="small">
              {saving ? t('creating') : t('createTimetable')}
            </Button>
          )}
          <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {!sectionId ? (
        <Box textAlign="center" py={8} color="text.secondary">
          <CalendarToday sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>{t('selectSection')}</Typography>
        </Box>
      ) : loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : !timetable ? (
        <Box textAlign="center" py={6} color="text.secondary">
          <CalendarToday sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>{t('noTimetableForSection')}</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateTimetable} disabled={saving} sx={{ mt: 2 }}>
            {saving ? t('creating') : t('createTimetable')}
          </Button>
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                   <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>{t('period')}</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>{t('time')}</TableCell>
                  {DAYS.map(day => (
                    <TableCell key={day} sx={{ fontWeight: 700, minWidth: 180 }}>{day}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PERIODS.map(period => {
                  const times = PERIOD_TIMES[period];
                  return (
                    <TableRow key={period} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                       <TableCell sx={{ fontWeight: 600 }}>{t('period')} {period}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTime sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{times.start} - {times.end}</Typography>
                        </Box>
                      </TableCell>
                      {DAYS.map(day => {
                        const slot = getSlotInfo(day, period);
                        return (
                          <TableCell key={day} sx={{ p: 0.5, minWidth: 180, height: 80 }}>
                            {slot ? (
                              <Box
                                sx={{
                                  p: 0.75, borderRadius: 1, bgcolor: slot.subject ? 'primary.50' : 'grey.50',
                                  border: '1px solid', borderColor: slot.subject ? 'primary.200' : 'grey.200',
                                  position: 'relative', minHeight: 60,
                                  '&:hover .slot-actions': { opacity: 1 },
                                }}
                              >
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Box flex={1}>
                                    <Typography variant="caption" fontWeight={700} display="block">
                                       {slot.subject?.name || t('free')}
                                    </Typography>
                                    {slot.teacher && (
                                      <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
                                        {slot.teacher?.firstName} {slot.teacher?.lastName}
                                      </Typography>
                                    )}
                                    {slot.classroom && (
                                      <Typography variant="caption" color="text.disabled" display="block" fontSize="0.6rem">
                                        {slot.classroom?.roomNumber}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <Box className="slot-actions" sx={{ position: 'absolute', top: 2, right: 2, opacity: 0, transition: 'opacity 0.2s' }}>
                                  <IconButton size="small" sx={{ p: 0.3 }} onClick={() => openEditSlot(slot)}>
                                    <Edit sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton size="small" sx={{ p: 0.3 }} color="error" onClick={() => handleDeleteSlot(slot._id)}>
                                    <Delete sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            ) : (
                              <Button fullWidth size="small" sx={{ height: '100%', minHeight: 60, opacity: 0.3, '&:hover': { opacity: 0.6 } }}
                                onClick={() => openAddSlot(day, period)}>
                                <Add fontSize="small" />
                              </Button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={slotDialog} onClose={() => setSlotDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSlot ? t('editSlot') : t('addSlot')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}>
              <TextField select fullWidth label={t('day')} size="small" value={slotForm.dayOfWeek}
                onChange={e => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}>
                {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label={t('period')} size="small" value={slotForm.periodNumber}
                onChange={e => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) })}>
                {PERIODS.map(p => <MenuItem key={p} value={p}>{t('period')} {p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={t('startTime')} type="time" size="small"
                value={slotForm.startTime} InputLabelProps={{ shrink: true }}
                onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={t('endTime')} type="time" size="small"
                value={slotForm.endTime} InputLabelProps={{ shrink: true }}
                onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label={t('subject')} size="small" value={slotForm.subjectId}
                onChange={e => setSlotForm({ ...slotForm, subjectId: e.target.value })}>
                <MenuItem value=""><em>{t('freePeriod')}</em></MenuItem>
                {subjects.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label={t('classroom')} size="small" value={slotForm.classroomId}
                onChange={e => setSlotForm({ ...slotForm, classroomId: e.target.value })}>
                <MenuItem value=""><em>{t('notAssigned')}</em></MenuItem>
                {classrooms.map((c: any) => (
                  <MenuItem key={c._id} value={c._id}>{c.roomNumber} {c.building ? `(${c.building})` : ''}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotDialog(false)}>{t('cancel')}</Button>
          {editingSlot && (
            <Button color="error" onClick={() => { handleDeleteSlot(editingSlot._id); setSlotDialog(false); }}>
              {t('delete')}
            </Button>
          )}
          <Button onClick={handleSaveSlot} variant="contained" disabled={saving}>
            {saving ? t('saving') : editingSlot ? t('update') : t('add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
