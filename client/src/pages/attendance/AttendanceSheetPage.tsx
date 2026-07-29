import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { attendanceAPI, sectionsAPI, studentsAPI, teachersAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

type AtStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export const AttendanceSheetPage = () => {
  const { t: tAttend } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const role = user?.role;
  const canMark = role === 'teacher' || role === 'system_admin';
  const canDelete = role === 'system_admin';
  const canRequestCorrection = role === 'teacher';

  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AtStatus>>({});
  const [arrivalTimes, setArrivalTimes] = useState<Record<string, string>>({});
  const [lateReasons, setLateReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingRecords, setExistingRecords] = useState<any[]>([]);
  const [correctionModal, setCorrectionModal] = useState({ open: false, attendanceId: '', currentStatus: '' as AtStatus, reason: '', requestedStatus: 'Present' as AtStatus });
  const [editModal, setEditModal] = useState({ open: false, attendanceId: '', status: 'Present' as AtStatus, arrivalTime: '', lateReason: '', remarks: '' });
  const [delRecordId, setDelRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'teacher') {
      teachersAPI.my.sections().then((r) => {
        const d = r.data.data?.sections || [];
        setSections(d);
        if (d.length === 1) setSelectedSection(d[0]._id);
      }).catch(() => {});
    } else {
      sectionsAPI.list({ isActive: true }).then((r) => setSections(r.data.data || []));
    }
  }, []);

  useEffect(() => {
    if (!selectedSection) { setStudents([]); return; }
    setLoading(true);
    Promise.all([
      studentsAPI.list({ section: selectedSection, status: 'Active', limit: 150 }),
      attendanceAPI.sectionSheet(selectedSection, date),
    ])
      .then(([sRes, aRes]) => {
        const list = sRes.data.data?.students || [];
        setStudents(list);
        const records = aRes.data.data || [];
        setExistingRecords(records);
        const initial: Record<string, AtStatus> = {};
        const times: Record<string, string> = {};
        const reasons: Record<string, string> = {};
        list.forEach((s: any) => {
          const found = records.find((r: any) => r.student?._id === s._id || r.student === s._id);
          initial[s._id] = found?.status || 'Present';
          if (found?.arrivalTime) times[s._id] = found.arrivalTime;
          if (found?.lateReason) reasons[s._id] = found.lateReason;
        });
        setAttendance(initial);
        setArrivalTimes(times);
        setLateReasons(reasons);
      })
      .catch(() => setError(tAttend('failedToLoadData')))
      .finally(() => setLoading(false));
  }, [selectedSection, date]);

  const handleStatusChange = (studentId: string, status: AtStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    if (status !== 'Late') {
      setLateReasons((prev) => ({ ...prev, [studentId]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSection || students.length === 0) { showError(tAttend('selectSectionWithStudents')); return; }
    setSaving(true); setError('');
    try {
      const records = students.map((s) => ({
        student: s._id,
        status: attendance[s._id] || 'Present',
        arrivalTime: attendance[s._id] === 'Late' ? (arrivalTimes[s._id] || '') : undefined,
        lateReason: attendance[s._id] === 'Late' ? (lateReasons[s._id] || '') : undefined,
        date,
      }));
      await attendanceAPI.mark({ sectionId: selectedSection, date, records });
      showSuccess(tAttend('attendanceSaved'));
    } catch (err: any) {
      const msg = err.response?.data?.message || tAttend('failedToSaveAttendance');
      setError(msg); showError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delRecordId) return;
    try {
      await attendanceAPI.delete(delRecordId);
      showSuccess(tAttend('recordDeleted'));
      setExistingRecords((prev) => prev.filter((r) => r._id !== delRecordId));
    } catch { showError(tAttend('failedToDelete')); } finally { setDelRecordId(null); }
  };

  const handleCorrectionSubmit = async () => {
    try {
      await attendanceAPI.corrections.request({
        attendance: correctionModal.attendanceId,
        reason: correctionModal.reason,
        requestedStatus: correctionModal.requestedStatus,
      });
      showSuccess(tAttend('correctionRequestSubmitted'));
      setCorrectionModal({ open: false, attendanceId: '', currentStatus: '' as AtStatus, reason: '', requestedStatus: 'Present' });
    } catch { showError(tAttend('failedToSubmitCorrection')); }
  };

  const handleEditSubmit = async () => {
    try {
      await attendanceAPI.update(editModal.attendanceId, {
        status: editModal.status,
        arrivalTime: editModal.arrivalTime || undefined,
        lateReason: editModal.lateReason || undefined,
        remarks: editModal.remarks,
      });
      showSuccess(tAttend('attendanceUpdated'));
      setEditModal({ open: false, attendanceId: '', status: 'Present', arrivalTime: '', lateReason: '', remarks: '' });
    } catch { showError(tAttend('failedToUpdate')); }
  };

  const statusColorMap: Record<AtStatus, string> = {
    Present: '#059669', Absent: '#DC2626', Late: '#D97706', Excused: '#6B7280',
  };

  const counts = Object.values(attendance).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }} mb={0.5}>{tAttend('attendanceSheet')}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{tAttend('recordAndManageDaily')}</Typography>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{tCommon('section')}</InputLabel>
              <Select value={selectedSection} label={tCommon('section')} onChange={(e) => setSelectedSection(e.target.value as string)}>
                {sections.map((s) => <MenuItem key={s._id} value={s._id}>{tCommon('grade')} {s.grade} — {s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="date" label={tCommon('date')} size="small" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split('T')[0] }} />
            {students.length > 0 && (
              <Box display="flex" gap={1.5} flexWrap="wrap">
                {Object.entries(counts).map(([status, count]) => (
                  <Typography key={status} variant="caption" sx={{ color: statusColorMap[status as AtStatus], fontWeight: 600 }}>
                    {tAttend(`status.${status}`)}: {count}
                  </Typography>
                ))}
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{tCommon('total')}: {students.length}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>
      ) : students.length > 0 ? (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>{tAttend('studentId')}</TableCell>
                  <TableCell>{tCommon('name')}</TableCell>
                  <TableCell>{tCommon('status')}</TableCell>
                  {canRequestCorrection && <TableCell>{tCommon('actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, idx) => {
                  const existing = existingRecords.find((r: any) => r.student?._id === student._id || r.student === student._id);
                  return (
                    <TableRow key={student._id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{student.studentId}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{student.firstName} {student.lastName}</Typography>
                      </TableCell>
                      <TableCell>
                        {canMark ? (
                          <Box>
                            <ToggleButtonGroup size="small" value={attendance[student._id] || 'Present'} exclusive
                              onChange={(_, v) => v && handleStatusChange(student._id, v)}
                            >
                              {(['Present', 'Absent', 'Late', 'Excused'] as AtStatus[]).map((s) => (
                                <ToggleButton key={s} value={s}
                                  sx={{
                                    fontSize: '0.7rem', px: 1, py: 0.3,
                                    '&.Mui-selected': { bgcolor: `${statusColorMap[s]}18`, color: statusColorMap[s], fontWeight: 700 },
                                  }}
                                >{tAttend(`status.${s}`)}</ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                            {attendance[student._id] === 'Late' && (
                              <Box display="flex" gap={1} mt={0.5}>
                                <TextField size="small" type="time" label={tAttend('arrivalTime')} value={arrivalTimes[student._id] || ''}
                                  onChange={(e) => setArrivalTimes((p) => ({ ...p, [student._id]: e.target.value }))}
                                  InputLabelProps={{ shrink: true }} sx={{ maxWidth: 140 }} />
                                <TextField size="small" label={tAttend('reason')} value={lateReasons[student._id] || ''}
                                  onChange={(e) => setLateReasons((p) => ({ ...p, [student._id]: e.target.value }))}
                                  sx={{ maxWidth: 200 }} />
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Chip
                            label={existing?.status || attendance[student._id] || '—'}
                            size="small"
                            sx={{
                              fontWeight: 600, fontSize: '0.7rem',
                              bgcolor: `${statusColorMap[(existing?.status || attendance[student._id]) as AtStatus] || '#6B7280'}18`,
                              color: statusColorMap[(existing?.status || attendance[student._id]) as AtStatus] || '#6B7280',
                            }}
                          />
                        )}
                      </TableCell>
                      {(canMark || canRequestCorrection || canDelete) && (
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            {canMark && existing && (
                              <Tooltip title={tCommon('edit')}><Button size="small" variant="text" sx={{ fontSize: '0.65rem', minWidth: 0, px: 0.5 }}
                                onClick={() => setEditModal({
                                  open: true, attendanceId: existing._id,
                                  status: existing.status as AtStatus,
                                  arrivalTime: existing.arrivalTime || '',
                                  lateReason: existing.lateReason || '',
                                  remarks: existing.remarks || '',
                                })}>{tCommon('edit')}</Button></Tooltip>
                            )}
                            {canRequestCorrection && existing && (
                              <Tooltip title={tAttend('requestCorrection')}><Button size="small" variant="text" sx={{ fontSize: '0.65rem', minWidth: 0, px: 0.5 }}
                                onClick={() => setCorrectionModal({
                                  open: true, attendanceId: existing._id,
                                  currentStatus: existing.status as AtStatus, reason: '', requestedStatus: 'Present',
                                })}>{tAttend('correct')}</Button></Tooltip>
                            )}
                            {canDelete && existing && (
                              <Tooltip title={tCommon('delete')}><Button size="small" color="error" variant="text" sx={{ fontSize: '0.65rem', minWidth: 0, px: 0.5 }}
                                onClick={() => setDelRecordId(existing._id)}>{tCommon('delete')}</Button></Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {canMark && (
            <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2, px: 3 }}>
                {saving ? <CircularProgress size={20} /> : tAttend('saveAttendance')}
              </Button>
            </Box>
          )}
        </>
      ) : selectedSection ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>{tAttend('noActiveStudents')}</Alert>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>{tAttend('selectSectionToMark')}</Alert>
      )}

      <Dialog open={!!delRecordId} onClose={() => setDelRecordId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tAttend('deleteRecord')}</DialogTitle>
        <DialogContent><Typography>{tAttend('deleteRecordConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDelRecordId(null)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModal.open} onClose={() => setEditModal((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>{tAttend('editAttendanceRecord')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>{tCommon('status')}</InputLabel>
              <Select value={editModal.status} label={tCommon('status')}
                onChange={(e) => setEditModal((p) => ({ ...p, status: e.target.value as AtStatus }))}>
                {(['Present', 'Absent', 'Late', 'Excused'] as AtStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{tAttend(`status.${s}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {editModal.status === 'Late' && (
              <TextField fullWidth label={tAttend('arrivalTime')} size="small" type="time" value={editModal.arrivalTime}
                onChange={(e) => setEditModal((p) => ({ ...p, arrivalTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
            )}
            {editModal.status === 'Late' && (
              <TextField fullWidth label={tAttend('lateReason')} size="small" value={editModal.lateReason}
                onChange={(e) => setEditModal((p) => ({ ...p, lateReason: e.target.value }))} />
            )}
            <TextField fullWidth label={tAttend('remarks')} size="small" multiline rows={2} value={editModal.remarks}
              onChange={(e) => setEditModal((p) => ({ ...p, remarks: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModal((p) => ({ ...p, open: false }))}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleEditSubmit}>{tCommon('update')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={correctionModal.open} onClose={() => setCorrectionModal((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>{tAttend('requestAttendanceCorrection')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Typography variant="body2" color="text.secondary">{tAttend('current')}: <strong>{correctionModal.currentStatus}</strong></Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{tAttend('requestedStatus')}</InputLabel>
              <Select value={correctionModal.requestedStatus} label={tAttend('requestedStatus')}
                onChange={(e) => setCorrectionModal((p) => ({ ...p, requestedStatus: e.target.value as AtStatus }))}>
                {(['Present', 'Absent', 'Late', 'Excused'] as AtStatus[]).map((s) => (
                  <MenuItem key={s} value={s} disabled={s === correctionModal.currentStatus}>{tAttend(`status.${s}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label={tAttend('reason')} multiline rows={3} size="small" value={correctionModal.reason}
              onChange={(e) => setCorrectionModal((p) => ({ ...p, reason: e.target.value }))} required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionModal((p) => ({ ...p, open: false }))}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleCorrectionSubmit} disabled={!correctionModal.reason}>{tAttend('submitRequest')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
