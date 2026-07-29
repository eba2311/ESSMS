import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Tooltip, Card, CardContent, Divider } from '@mui/material';
import { Add, Edit, Refresh, MedicalServices } from '@mui/icons-material';
import { studentHealthAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const HealthPage = () => {
  const { t: tHealth } = useTranslation('health');
  const { showSuccess, showError } = useNotification();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [visitDialog, setVisitDialog] = useState(false);
  const [immunizationDialog, setImmunizationDialog] = useState(false);
  const [form, setForm] = useState({ bloodType: '', allergies: '', chronicConditions: '', medications: '', emergencyName: '', emergencyPhone: '', emergencyRelationship: '' });
  const [visitForm, setVisitForm] = useState({ date: new Date().toISOString().split('T')[0], reason: '', diagnosis: '', treatment: '', notes: '', attendedBy: '' });
  const [immunizationForm, setImmunizationForm] = useState({ name: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => { try { const r = await studentsAPI.list({ limit: 500 }); setStudents(r.data.data?.students || []); } catch {} })();
  }, []);

  const fetchRecord = async (studentId: string) => {
    if (!studentId) return;
    setLoading(true); setRecord(null);
    try { const res = await studentHealthAPI.get(studentId); setRecord(res.data.data); }
    catch { setRecord(null); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedStudent) fetchRecord(selectedStudent); }, [selectedStudent]);

  const handleSave = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const data = { studentId: selectedStudent, bloodType: form.bloodType, allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean), chronicConditions: form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean), medications: form.medications.split(',').map(s => s.trim()).filter(Boolean), emergencyContact: form.emergencyName ? { name: form.emergencyName, phone: form.emergencyPhone, relationship: form.emergencyRelationship } : undefined };
      if (record) { await studentHealthAPI.update(selectedStudent, data); showSuccess(tHealth('recordUpdated')); }
      else { await studentHealthAPI.create(data); showSuccess(tHealth('recordUpdated')); }
      setDialog(false); fetchRecord(selectedStudent);
    } catch (err: any) { showError(err.response?.data?.message || tHealth('failedToSave')); } finally { setSaving(false); }
  };

  const handleAddVisit = async () => {
    if (!selectedStudent || !visitForm.reason) { showError(tHealth('reasonRequired')); return; }
    setSaving(true);
    try { await studentHealthAPI.addVisit(selectedStudent, visitForm); showSuccess(tHealth('visitAdded')); setVisitDialog(false); fetchRecord(selectedStudent); }
    catch (err: any) { showError(err.response?.data?.message || tHealth('failedToSave')); } finally { setSaving(false); }
  };

  const handleAddImmunization = async () => {
    if (!selectedStudent || !immunizationForm.name) { showError(tHealth('nameRequired')); return; }
    setSaving(true);
    try { await studentHealthAPI.addImmunization(selectedStudent, immunizationForm); showSuccess(tHealth('immunizationAdded')); setImmunizationDialog(false); fetchRecord(selectedStudent); }
    catch (err: any) { showError(err.response?.data?.message || tHealth('failedToSave')); } finally { setSaving(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>{tHealth('title')}</Typography>
        <Box display="flex" gap={1}>
          {selectedStudent && <Button variant="contained" startIcon={<Edit />} onClick={() => { if (record) { setForm({ bloodType: record.bloodType || '', allergies: (record.allergies || []).join(', '), chronicConditions: (record.chronicConditions || []).join(', '), medications: (record.medications || []).join(', '), emergencyName: record.emergencyContact?.name || '', emergencyPhone: record.emergencyContact?.phone || '', emergencyRelationship: record.emergencyContact?.relationship || '' }); } setDialog(true); }} size="small">{tHealth('editRecord')}</Button>}
          <Tooltip title={tHealth('title')}><IconButton onClick={() => fetchRecord(selectedStudent)} size="small"><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField select fullWidth label={tHealth('selectStudent')} size="small" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
          <MenuItem value=""><em>— {tHealth('selectStudent')} —</em></MenuItem>
          {students.map(st => <MenuItem key={st._id} value={st._id}>{st.firstName} {st.lastName} ({st.userId || st._id})</MenuItem>)}
        </TextField>
      </Paper>
      {!selectedStudent && <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{tHealth('selectStudentPrompt')}</Typography></Paper>}
      {selectedStudent && loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}
      {selectedStudent && !loading && !record && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>{tHealth('noHealthRecord')}</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={() => { setForm({ bloodType: '', allergies: '', chronicConditions: '', medications: '', emergencyName: '', emergencyPhone: '', emergencyRelationship: '' }); setDialog(true); }}>{tHealth('createRecord')}</Button>
        </Paper>
      )}
      {selectedStudent && !loading && record && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="h6" gutterBottom>{tHealth('basicInfo')}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption">{tHealth('bloodType')}</Typography><Typography variant="body2" fontWeight={600} mb={1}>{record.bloodType || '—'}</Typography>
              <Typography variant="caption">{tHealth('allergies')}</Typography><Typography variant="body2" mb={1}>{record.allergies?.length ? record.allergies.join(', ') : tHealth('none')}</Typography>
              <Typography variant="caption">{tHealth('chronicConditions')}</Typography><Typography variant="body2" mb={1}>{record.chronicConditions?.length ? record.chronicConditions.join(', ') : tHealth('none')}</Typography>
              <Typography variant="caption">{tHealth('medications')}</Typography><Typography variant="body2">{record.medications?.length ? record.medications.join(', ') : tHealth('none')}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">{tHealth('visits')} ({record.visits?.length || 0})</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setVisitDialog(true)}>{tHealth('addVisit')}</Button>
              </Box>
              <Divider />
              {(record.visits || []).length === 0 && <Typography variant="body2" color="text.secondary" mt={1}>{tHealth('noVisitsRecorded')}</Typography>}
              {(record.visits || []).slice(-5).reverse().map((v: any, i: number) => (
                <Box key={i} sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600}>{new Date(v.date).toLocaleDateString()} — {v.reason}</Typography>
                  {v.diagnosis && <Typography variant="caption" display="block">{tHealth('diagnosis')}: {v.diagnosis}</Typography>}
                  {v.treatment && <Typography variant="caption" display="block">{tHealth('treatment')}: {v.treatment}</Typography>}
                </Box>
              ))}
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">{tHealth('immunizations')} ({record.immunizations?.length || 0})</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setImmunizationDialog(true)}>{tHealth('addImmunization')}</Button>
              </Box>
              <Divider />
              {(record.immunizations || []).length === 0 && <Typography variant="body2" color="text.secondary" mt={1}>{tHealth('noImmunizationsRecorded')}</Typography>}
              {(record.immunizations || []).map((im: any, i: number) => (
                <Box key={i} sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600}>{im.name}</Typography>
                  <Typography variant="caption" display="block">{new Date(im.date).toLocaleDateString()}</Typography>
                </Box>
              ))}
            </CardContent></Card>
          </Grid>
        </Grid>
      )}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{record ? tHealth('editHealthRecord') : tHealth('createHealthRecord')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={4}><TextField select fullWidth label={tHealth('bloodType')} size="small" value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}>
              {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <MenuItem key={t} value={t}>{t || '—'}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={8}><TextField fullWidth label={`${tHealth('allergies')} (comma-separated)`} size="small" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tHealth('chronicConditions')} (comma)`} size="small" value={form.chronicConditions} onChange={e => setForm({ ...form, chronicConditions: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tHealth('medications')} (comma)`} size="small" value={form.medications} onChange={e => setForm({ ...form, medications: e.target.value })} /></Grid>
            <Grid item xs={12}><Divider /><Typography variant="subtitle2" mt={1}>{tHealth('emergencyContact')}</Typography></Grid>
            <Grid item xs={4}><TextField fullWidth label={tHealth('name')} size="small" value={form.emergencyName} onChange={e => setForm({ ...form, emergencyName: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={tHealth('phone')} size="small" value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={tHealth('emergencyContact')} size="small" value={form.emergencyRelationship} onChange={e => setForm({ ...form, emergencyRelationship: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tHealth('status')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving...' : tHealth('status')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={visitDialog} onClose={() => setVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tHealth('addVisit')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}><TextField fullWidth label={`${tHealth('date')} *`} type="date" size="small" InputLabelProps={{ shrink: true }} value={visitForm.date} onChange={e => setVisitForm({ ...visitForm, date: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tHealth('attendedBy')} size="small" value={visitForm.attendedBy} onChange={e => setVisitForm({ ...visitForm, attendedBy: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={`${tHealth('reason')} *`} size="small" value={visitForm.reason} onChange={e => setVisitForm({ ...visitForm, reason: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tHealth('diagnosis')} size="small" value={visitForm.diagnosis} onChange={e => setVisitForm({ ...visitForm, diagnosis: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={tHealth('treatment')} size="small" value={visitForm.treatment} onChange={e => setVisitForm({ ...visitForm, treatment: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={tHealth('notes')} multiline rows={2} size="small" value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisitDialog(false)}>{tHealth('status')}</Button>
          <Button onClick={handleAddVisit} variant="contained" disabled={saving}>{saving ? 'Saving...' : tHealth('status')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={immunizationDialog} onClose={() => setImmunizationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tHealth('addImmunization')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}><TextField fullWidth label={`${tHealth('immunizationName')} *`} size="small" value={immunizationForm.name} onChange={e => setImmunizationForm({ ...immunizationForm, name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={`${tHealth('immunizationDate')} *`} type="date" size="small" InputLabelProps={{ shrink: true }} value={immunizationForm.date} onChange={e => setImmunizationForm({ ...immunizationForm, date: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label={tHealth('notes')} multiline rows={2} size="small" value={immunizationForm.notes} onChange={e => setImmunizationForm({ ...immunizationForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImmunizationDialog(false)}>{tHealth('status')}</Button>
          <Button onClick={handleAddImmunization} variant="contained" disabled={saving}>{saving ? 'Saving...' : tHealth('status')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
