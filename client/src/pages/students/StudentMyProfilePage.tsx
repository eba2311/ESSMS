import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, TextField, Button, Grid, Avatar, Divider,
  Alert, CircularProgress, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, LinearProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from '@mui/material';
import {
  Person, Edit, Save, Cancel, School, Phone, LocationOn,
  LocalHospital, Book, CheckCircle, Cancel as CancelIcon, Star, Description,
  UploadFile, Download, Delete, Verified,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { studentsAPI, documentsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const StudentMyProfilePage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [deleteDocDialog, setDeleteDocDialog] = useState<{ open: boolean; docId: string }>({ open: false, docId: '' });

  const [formData, setFormData] = useState({
    phone: '',
    address: { city: '', subcity: '', woreda: '', houseNumber: '' },
    emergencyContact: { name: '', phone: '', relationship: '' },
    medicalInfo: { bloodType: '', allergies: '', chronicConditions: '' },
  });

  const mapBackendToForm = (p: any) => ({
    phone: p.phone || '',
    address: typeof p.address === 'object' && p.address ? { city: p.address.city || '', subcity: p.address.subcity || '', woreda: p.address.woreda || '', houseNumber: p.address.houseNumber || '' } : { city: '', subcity: '', woreda: '', houseNumber: '' },
    emergencyContact: p.emergencyContact || { name: '', phone: '', relationship: '' },
    medicalInfo: {
      bloodType: p.medicalInfo?.bloodType || '',
      allergies: Array.isArray(p.medicalInfo?.allergies) ? p.medicalInfo.allergies.join(', ') : (p.medicalInfo?.allergies || ''),
      chronicConditions: Array.isArray(p.medicalInfo?.chronicConditions) ? p.medicalInfo.chronicConditions.join(', ') : (p.medicalInfo?.chronicConditions || ''),
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, subjectsRes] = await Promise.all([
          studentsAPI.me.get(),
          studentsAPI.me.subjects().catch(() => ({ data: { data: { enrolledSubjects: [] } } })),
        ]);
        const p = profileRes.data.data;
        setProfile(p);
        setFormData(mapBackendToForm(p));
        setSubjects(subjectsRes.data.data?.enrolledSubjects || []);
        const docRes = await documentsAPI.list({ refId: p._id, category: 'student' });
        setDocuments(docRes.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || tStudent('failedToLoadProfile'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('refId', profile._id);
      fd.append('category', 'student');
      fd.append('docType', 'Other');
      await documentsAPI.upload(fd);
      const docRes = await documentsAPI.list({ refId: profile._id, category: 'student' });
      setDocuments(docRes.data.data || []);
    } catch (err: any) {
      showError(err.response?.data?.message || tStudent('uploadFailed'));
    } finally { setDocUploading(false); }
  };

  const handleDocDelete = async (docId: string) => {
    try {
      await documentsAPI.delete(docId);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      showSuccess(tStudent('documentDeleted'));
    } catch { showError(tStudent('failedToDeleteDocument')); }
    setDeleteDocDialog({ open: false, docId: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await studentsAPI.me.update(formData);
      setProfile(res.data.data);
      showSuccess(tStudent('profileUpdated'));
      setEditOpen(false);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || tStudent('failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  if (!profile) {
    return <Alert severity="error">{tStudent('failedToLoadProfile')}</Alert>;
  }

  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  const pct = (score: number, max: number) => max > 0 ? Math.round((score / max) * 100) : 0;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar src={profile.photo} sx={{ width: 56, height: 56, bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A', fontSize: 24 }}>
          {profile.firstName?.[0]}{profile.lastName?.[0]}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {profile.firstName} {profile.lastName}
          </Typography>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">{profile.studentId}</Typography>
            {profile.grade && <Chip label={`${tStudent('gradeLabel')} ${profile.grade}`} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />}
            {profile.section?.name && <Chip label={profile.section.name} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />}
            {profile.stream && <Chip label={profile.stream} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />}
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Description />} onClick={() => navigate(`/assessments/report-card/${profile._id}`)} sx={{ borderRadius: 2, textTransform: 'none' }}>
          {tStudent('reportCard')}
        </Button>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
          {tCommon('editProfile')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tStudent('personalInformation')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('firstName')}</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.firstName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('lastName')}</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('gender')}</Typography>
                <Typography variant="body2">{profile.gender || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('dateOfBirth')}</Typography>
                <Typography variant="body2">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('nationality')}</Typography>
                <Typography variant="body2">{profile.nationality || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('phone')}</Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone sx={{ fontSize: 14, color: 'text.secondary' }} /> {profile.phone || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">{tStudent('address')}</Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} /> {profile.address ? [profile.address.city, profile.address.subcity, profile.address.woreda ? `Woreda ${profile.address.woreda}` : ''].filter(Boolean).join(', ') || tStudent('addressOnFile') : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tStudent('academicInformation')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('studentId')}</Typography>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace">{profile.studentId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('academicYear')}</Typography>
                <Typography variant="body2">{profile.academicYear || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('gradeLabel')}</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.grade || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('stream')}</Typography>
                <Typography variant="body2">{profile.stream || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('section')}</Typography>
                <Typography variant="body2">{profile.section?.name || tStudent('notAssigned')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{tStudent('status')}</Typography>
                <Chip label={profile.status} size="small" color={profile.status === 'Active' ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">{tStudent('enrolledSubjects')}</Typography>
                <Typography variant="body2" fontWeight={600}>{tStudent('activeCount', { count: subjects.length })}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tStudent('emergencyContact')}</Typography>
            <Divider sx={{ mb: 2 }} />
            {profile.emergencyContact ? (
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">{tStudent('emergencyContactName')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{profile.emergencyContact.name || '—'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">{tStudent('emergencyContactRelationship')}</Typography>
                  <Typography variant="body2">{profile.emergencyContact.relationship || '—'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">{tStudent('emergencyContactPhone')}</Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone sx={{ fontSize: 14, color: 'text.secondary' }} /> {profile.emergencyContact.phone || '—'}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary" variant="body2">{tStudent('noEmergencyContact')}</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tStudent('medicalInformation')}</Typography>
            <Divider sx={{ mb: 2 }} />
            {profile.medicalInfo ? (
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">{tStudent('bloodGroup')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{profile.medicalInfo.bloodType || '—'}</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="caption" color="text.secondary">{tCommon('name') || 'Allergies'}</Typography>
                  <Typography variant="body2">{Array.isArray(profile.medicalInfo.allergies) ? profile.medicalInfo.allergies.join(', ') : profile.medicalInfo.allergies || tStudent('none')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">{tStudent('medicalConditions')}</Typography>
                  <Typography variant="body2">{Array.isArray(profile.medicalInfo.chronicConditions) ? profile.medicalInfo.chronicConditions.join(', ') : profile.medicalInfo.chronicConditions || tStudent('none')}</Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary" variant="body2">{tStudent('noMedicalInformation')}</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>{tStudent('mySubjects')}</Typography>
            <Divider sx={{ mb: 2 }} />
            {subjects.length === 0 ? (
              <Typography color="text.secondary" py={2}>
                {tStudent('noSubjectsEnrolled')}
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {subjects.map((enr: any) => (
                  <Grid item xs={6} sm={4} md={3} key={enr._id}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Book sx={{ fontSize: 18, color: '#7C3AED' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{enr.subject?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{enr.subject?.code}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700}>{tStudent('myDocuments')}</Typography>
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={docUploading ? <CircularProgress size={16} /> : <UploadFile />}
                disabled={docUploading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {tCommon('upload')}
                <input hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={handleDocUpload} />
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {documents.length === 0 ? (
              <Typography color="text.secondary" variant="body2" py={2}>{tStudent('noDocumentsYet')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tStudent('nameLabel')}</TableCell>
                      <TableCell>{tCommon('type')}</TableCell>
                      <TableCell>{tStudent('uploaded')}</TableCell>
                      <TableCell>{tStudent('status')}</TableCell>
                      <TableCell align="right">{tCommon('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc: any) => (
                      <TableRow key={doc._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{doc.fileName || doc.originalName}</Typography>
                        </TableCell>
                        <TableCell><Chip label={doc.docType || '—'} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={doc.verified ? tStudent('verified') : tStudent('pendingApproval')}
                            size="small"
                            color={doc.verified ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={tCommon('download')}>
                            <IconButton size="small" onClick={() => documentsAPI.download(doc._id).then((r) => {
                              const url = window.URL.createObjectURL(new Blob([r.data]));
                              const a = document.createElement('a'); a.href = url;
                              a.download = doc.fileName || doc.originalName || 'document';
                              a.click(); window.URL.revokeObjectURL(url);
                            })} sx={{ borderRadius: 1.5 }}>
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={tCommon('delete')}>
                            <IconButton size="small" color="error" onClick={() => setDeleteDocDialog({ open: true, docId: doc._id })} sx={{ borderRadius: 1.5 }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditing(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{tCommon('editProfile')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('phone')} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>{tStudent('address')}</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tCommon('city') || 'City'} value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tCommon('subcity') || 'Subcity'} value={formData.address.subcity} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, subcity: e.target.value } })} />
            </Grid>
            <Grid item xs={2}>
              <TextField fullWidth label={tCommon('woreda') || 'Woreda'} value={formData.address.woreda} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, woreda: e.target.value } })} />
            </Grid>
            <Grid item xs={2}>
              <TextField fullWidth label={tCommon('houseNumber') || 'House Number'} value={formData.address.houseNumber} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, houseNumber: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>{tStudent('emergencyContact')}</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tStudent('contactName')} value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={tStudent('relationship')} value={formData.emergencyContact.relationship} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('contactPhone')} value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>{tStudent('medicalInformation')}</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tStudent('bloodGroup')} value={formData.medicalInfo.bloodType} onChange={(e) => setFormData({ ...formData, medicalInfo: { ...formData.medicalInfo, bloodType: e.target.value } })} placeholder="A+" />
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth label={tStudent('allergiesLabel')} value={formData.medicalInfo.allergies} onChange={(e) => setFormData({ ...formData, medicalInfo: { ...formData.medicalInfo, allergies: e.target.value } })} placeholder={tStudent('allergiesPlaceholder')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tStudent('medicalConditions')} value={formData.medicalInfo.chronicConditions} onChange={(e) => setFormData({ ...formData, medicalInfo: { ...formData.medicalInfo, chronicConditions: e.target.value } })} multiline rows={2} placeholder={tStudent('chronicConditionsHint')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {saving ? <CircularProgress size={20} /> : tStudent('saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDocDialog.open} onClose={() => setDeleteDocDialog({ open: false, docId: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tStudent('deleteDocument')}</DialogTitle>
        <DialogContent>
          <Typography>{tStudent('deleteDocumentConfirm')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDocDialog({ open: false, docId: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={() => handleDocDelete(deleteDocDialog.docId)} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
