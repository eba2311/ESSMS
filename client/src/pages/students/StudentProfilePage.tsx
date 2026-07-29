import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Alert, Avatar, Paper, Menu, MenuItem,
  ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Checkbox, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import {
  ArrowBack, Edit, School, EmojiEvents, TrendingUp,
  MoreVert, Block, Archive, Unarchive, PersonAdd, Assessment,
  Female, Male, UploadFile,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { studentsAPI, sectionsAPI, attendanceAPI, assessmentsAPI, studentHealthAPI, counselingAPI, behavioralAPI, financeAPI, rankingsAPI, documentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canEditStudents } from '../../utils/permissions';
import { StudentProfileTabs } from './StudentProfileTabs';

export const StudentProfilePage = () => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any>(null);
  const [healthRecord, setHealthRecord] = useState<any>(null);
  const [counseling, setCounseling] = useState<any[]>([]);
  const [behavioral, setBehavioral] = useState<any[]>([]);
  const [feeStatus, setFeeStatus] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; title: string }>({ open: false, action: '', title: '' });
  const [statusReason, setStatusReason] = useState('');

  const [sectionDialog, setSectionDialog] = useState(false);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loadingSections, setLoadingSections] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchStudent = async () => {
    try {
      const [sRes, attRes, marksRes, rankRes, healthRes, counselRes, behaveRes, feeRes] = await Promise.all([
        studentsAPI.get(id!),
        attendanceAPI.studentHistory(id!).catch(() => ({ data: { data: { records: [] } } })),
        assessmentsAPI.studentMarksSummary(id!).catch(() => ({ data: { data: { subjects: [] } } })),
        rankingsAPI.studentRanking(id!).catch(() => ({ data: { data: null } })),
        studentHealthAPI.get(id!).catch(() => ({ data: { data: null } })),
        counselingAPI.list({ studentId: id, limit: 50 }).catch(() => ({ data: { data: { sessions: [] } } })),
        behavioralAPI.list({ studentId: id, limit: 50 }).catch(() => ({ data: { data: { reports: [] } } })),
        financeAPI.studentFeeStatus(id!, new Date().getMonth() + 1 >= 9 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`).catch(() => ({ data: { data: null } })),
      ]);
      setStudent(sRes.data.data);
      setAttendance(attRes.data.data?.records || []);
      const summary = marksRes.data.data;
      setMarks(
        summary?.subjects?.flatMap((s: any) =>
          s.assessments.map((a: any) => ({
            obtainedMarks: a.marksObtained,
            totalMarks: a.totalMarks,
            assessment: { subject: s.subject, type: a.assessmentType, totalMarks: a.totalMarks },
          }))
        ) || []
      );
      setRanking(rankRes.data.data);
      setHealthRecord(healthRes.data.data);
      setCounseling(counselRes.data.data?.sessions || []);
      setBehavioral(behaveRes.data.data?.reports || []);
      setFeeStatus(feeRes.data.data);
      const histRes = await studentsAPI.history(id!).catch(() => ({ data: { data: { history: [] } } }));
      setStatusHistory(histRes.data.data?.history || student?.statusHistory || []);
    } catch {
      showError(tStudent('failedToLoadStudent'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSectionDialog = async () => {
    if (!student?.grade) return;
    setSelectedSectionId(student.section?._id || '');
    setSectionDialog(true);
    setLoadingSections(true);
    try {
      const ay = new Date().getMonth() + 1 >= 9 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
      const res = await sectionsAPI.list({ grade: student.grade, academicYear: student.academicYear || ay });
      setAvailableSections(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      showError(tStudent('failedToLoadSections'));
    }
    setLoadingSections(false);
  };

  const handleAssignSection = async () => {
    if (!selectedSectionId) { showError(tStudent('selectASection')); return; }
    setAssigning(true);
    try {
      await studentsAPI.assignSection(id!, { sectionId: selectedSectionId });
      showSuccess(tStudent('assignedSuccessfully'));
      setSectionDialog(false);
      await fetchStudent();
    } catch (err: any) {
      showError(err.response?.data?.message || tStudent('failedToAssignSection'));
    }
    setAssigning(false);
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (!student) return <Alert severity="error" sx={{ borderRadius: 2 }}>{tStudent('failedToLoadStudent')}</Alert>;

  const average = student.average ?? student.gpa ?? 0;

  const getAvgColor = (avg: number) => {
    if (avg >= 85) return '#2D7D3A';
    if (avg >= 70) return '#1B4F8A';
    if (avg >= 50) return '#C9920A';
    return '#B5251A';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')} sx={{ borderRadius: 2 }}>
          {tCommon('back')}
        </Button>
        <Box sx={{ flex: 1 }} />
        {canEditStudents(user?.role) && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/students/${id}/edit`)}
            sx={{ borderRadius: 2 }}
          >
            {tCommon('edit')}
          </Button>
        )}
        {canEditStudents(user?.role) && student?.status === 'Active' && (
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleOpenSectionDialog}
            sx={{ borderRadius: 2 }}
          >
            {tStudent('assignSection')}
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<MoreVert />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ borderRadius: 2, minWidth: 40, px: 1 }}
        >
          {tCommon('actions')}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {student && (
            <MenuItem onClick={() => { setAnchorEl(null); navigate(`/assessments/report-card/${student._id}`); }}>
              <ListItemIcon><Assessment fontSize="small" color="primary" /></ListItemIcon>
              {tStudent('viewReportCard')}
            </MenuItem>
          )}
          {student?.status === 'Active' && (
            <MenuItem onClick={() => { setAnchorEl(null); setConfirmDialog({ open: true, action: 'suspend', title: tStudent('suspendStudent') }); }}>
              <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
              {tStudent('suspend')}
            </MenuItem>
          )}
          {student?.status !== 'Archived' && (
            <MenuItem onClick={() => { setAnchorEl(null); setConfirmDialog({ open: true, action: 'archive', title: tStudent('archiveStudent') }); }}>
              <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
              {tStudent('archive')}
            </MenuItem>
          )}
          {(student?.status === 'Suspended' || student?.status === 'Archived') && (
            <MenuItem onClick={() => { setAnchorEl(null); setConfirmDialog({ open: true, action: 'restore', title: tStudent('restoreStudent') }); }}>
              <ListItemIcon><Unarchive fontSize="small" /></ListItemIcon>
              {tStudent('restoreToActive')}
            </MenuItem>
          )}
          {student?.status === 'Active' && student?.grade === 12 && (
            <MenuItem onClick={() => { setAnchorEl(null); setConfirmDialog({ open: true, action: 'graduate', title: tStudent('graduateStudent') }); }}>
              <ListItemIcon><School fontSize="small" color="primary" /></ListItemIcon>
              {tStudent('graduate')}
            </MenuItem>
          )}
        </Menu>
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {tStudent('areYouSureAction', { action: confirmDialog.action })}
            </Typography>
            <TextField
              fullWidth
              size="small"
              label={tStudent('reasonOptional')}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>{tCommon('cancel')}</Button>
            <Button
              variant="contained"
              color={confirmDialog.action === 'suspend' ? 'error' : 'primary'}
              onClick={async () => {
                try {
                  const payload = { reason: statusReason || `${confirmDialog.action} by administrator` };
                  if (confirmDialog.action === 'suspend') await studentsAPI.suspend(id!, payload);
                  else if (confirmDialog.action === 'archive') await studentsAPI.archive(id!, payload);
                  else if (confirmDialog.action === 'restore') await studentsAPI.restore(id!, payload);
                  else if (confirmDialog.action === 'graduate') await studentsAPI.graduate(id!, {});
                  showSuccess(`${confirmDialog.action}ed successfully`);
                  setConfirmDialog({ ...confirmDialog, open: false });
                  setStatusReason('');
                  fetchStudent();
                } catch (err: any) {
                  showError(err.response?.data?.message || tCommon('error'));
                }
              }}
            >
              {tCommon('confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: student.gender === 'Female' ? 'rgba(201,146,10,0.15)' : 'rgba(27,79,138,0.15)',
                    color: student.gender === 'Female' ? '#C9920A' : '#1B4F8A',
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.025em' }}>
                    {student.firstName} {student.lastName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {student.studentId}
                    </Typography>
                    <Chip
                      icon={student.gender === 'Female' ? <Female sx={{ fontSize: 13 }} /> : <Male sx={{ fontSize: 13 }} />}
                      label={student.gender}
                      size="small"
                      sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'rgba(27,79,138,0.06)', color: '#6B7280' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip
                  icon={<EmojiEvents sx={{ fontSize: 14 }} />}
                  label={`${tCommon('rank')} ${ranking?.rank || '—'}`}
                  sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }}
                />
                <Chip
                  icon={<TrendingUp sx={{ fontSize: 14 }} />}
                  label={`${tCommon('average')}: ${average > 0 ? `${average}%` : '—'}`}
                  sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', bgcolor: `${getAvgColor(average)}15`, color: getAvgColor(average) }}
                />
                <Chip
                  icon={<School sx={{ fontSize: 14 }} />}
                  label={student.section?.name || '—'}
                  variant="outlined"
                  sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem', borderColor: '#E5E7EB' }}
                />
                <Chip
                  label={student.status || tStudent('active')}
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: student.status === 'Active' ? 'rgba(45,125,58,0.12)' : 'rgba(156,163,175,0.15)',
                    color: student.status === 'Active' ? '#2D7D3A' : '#6B7280',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <StudentProfileTabs
        student={student}
        attendance={attendance}
        marks={marks}
        ranking={ranking}
        healthRecord={healthRecord}
        counseling={counseling}
        behavioral={behavioral}
        feeStatus={feeStatus}
        statusHistory={statusHistory}
        tab={tab}
        setTab={setTab}
        getAvgColor={getAvgColor}
      />

      {tab === 10 && <StudentDocumentsTab studentId={id!} />}

      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {tStudent('assignSection')}
          <Typography variant="body2" color="text.secondary" fontWeight={400}>
            {student.firstName} {student.lastName} · {tCommon('grade')} {student.grade} · {student.studentId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {student.section?.name && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              {tStudent('currentlyAssignedTo')} <strong>{student.section.name}</strong>
              {student.section.grade && ` (${tCommon('grade')} ${student.section.grade})`}
            </Alert>
          )}
          {loadingSections ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
          ) : availableSections.length === 0 ? (
            <Box py={3} textAlign="center">
              <School sx={{ fontSize: 36, color: '#9CA3AF', opacity: 0.3 }} />
              <Typography color="text.secondary" variant="body2">{tStudent('noSectionsAvailableForGrade', { grade: student.grade })}</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {tStudent('selectSectionForGrade', { grade: student.grade })}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}></TableCell>
                      <TableCell>{tStudent('section')}</TableCell>
                      <TableCell>{tStudent('streamLabel')}</TableCell>
                      <TableCell align="right">{tStudent('capacity')}</TableCell>
                      <TableCell align="right">{tStudent('available')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableSections
                      .filter((s: any) => s.isActive !== false && !s.isArchived)
                      .map((s: any) => {
                        const currentCount = s.studentCount || s.currentCount || 0;
                        const cap = s.capacity || 0;
                        const available = Math.max(0, cap - currentCount);
                        const isFull = available <= 0;
                        const isSelected = selectedSectionId === s._id;
                        return (
                          <TableRow
                            key={s._id}
                            hover={!isFull}
                            selected={isSelected}
                            onClick={() => !isFull && setSelectedSectionId(s._id)}
                            sx={{
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              opacity: isFull ? 0.5 : 1,
                              '&.Mui-selected': { bgcolor: 'rgba(27,79,138,0.08)' },
                            }}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                disabled={isFull}
                                size="small"
                                onChange={() => !isFull && setSelectedSectionId(s._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                              {s.sectionCode && <Typography variant="caption" color="text.secondary">#{s.sectionCode}</Typography>}
                            </TableCell>
                            <TableCell>
                              <Chip label={s.stream || tStudent('common')} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontFamily="monospace">{currentCount}/{cap}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={isFull ? tStudent('full') : tStudent('seatsAvailable', { count: available })}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  bgcolor: isFull ? 'rgba(181,37,26,0.1)' : 'rgba(45,125,58,0.1)',
                                  color: isFull ? '#B5251A' : '#2D7D3A',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSectionDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button
            onClick={handleAssignSection}
            variant="contained"
            disabled={!selectedSectionId || selectedSectionId === student.section?._id || assigning || loadingSections}
            sx={{ borderRadius: 2 }}
          >
            {assigning ? tStudent('assigning') : tStudent('assignSection')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const StudentDocumentsTab = ({ studentId }: { studentId: string }) => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = user?.role === 'system_admin' || user?.role === 'academic_head' || user?.role === 'registrar';
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [deleteDocDialog, setDeleteDocDialog] = useState<{ open: boolean; docId: string }>({ open: false, docId: '' });
  const [form, setForm] = useState({ title: '', type: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    try {
      const r = await documentsAPI.list({ student: studentId });
      setDocs(r.data.data?.documents || r.data.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [studentId]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('documentType', form.type || 'Other');
      fd.append('notes', form.description);
      fd.append('student', studentId);
      fd.append('file', file);
      await documentsAPI.upload(fd);
      showSuccess(tStudent('documentUploaded'));
      setDialog(false);
      setForm({ title: '', type: '', description: '' });
      setFile(null);
      fetchDocs();
    } catch { showError(tStudent('failedToUploadDocument')); }
  };

  const handleDelete = async (id: string) => {
    try { await documentsAPI.delete(id); showSuccess(tStudent('deleted')); fetchDocs(); } catch { showError(tStudent('failedToDelete')); }
    setDeleteDocDialog({ open: false, docId: '' });
  };

  const handleVerify = async (id: string) => {
    try { await documentsAPI.verify(id); showSuccess(tStudent('verifiedLabel')); fetchDocs(); } catch { showError(tStudent('failedToVerify')); }
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const r = await documentsAPI.download(id);
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = title; a.click();
      URL.revokeObjectURL(url);
    } catch { showError(tStudent('downloadFailed')); }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>{tStudent('documents', { count: docs.length })}</Typography>
          {canManage && (
            <Button variant="contained" size="small" startIcon={<UploadFile />} onClick={() => setDialog(true)} sx={{ borderRadius: 2 }}>{tCommon('upload')}</Button>
          )}
        </Box>
        {docs.length === 0 ? (
          <Typography color="text.secondary">{tStudent('noDocumentsUploaded')}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tStudent('title')}</TableCell>
                  <TableCell>{tCommon('type')}</TableCell>
                  <TableCell>{tStudent('notes')}</TableCell>
                  <TableCell>{tStudent('uploaded')}</TableCell>
                  <TableCell>{tStudent('verified')}</TableCell>
                  <TableCell align="right">{tCommon('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d: any) => (
                  <TableRow key={d._id}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.title}</Typography></TableCell>
                    <TableCell><Chip label={d.documentType || tStudent('other')} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{d.notes || '\u2014'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{d.createdAt?.split('T')[0] || '\u2014'}</Typography></TableCell>
                    <TableCell><Chip label={d.isVerified ? tCommon('yes') : tCommon('no')} size="small" color={d.isVerified ? 'success' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => handleDownload(d._id, d.title)} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tCommon('download')}</Button>
                        {canManage && !d.isVerified && (
                          <Button size="small" color="primary" onClick={() => handleVerify(d._id)} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tStudent('verified')}</Button>
                        )}
                        {canManage && (
                          <Button size="small" color="error" onClick={() => setDeleteDocDialog({ open: true, docId: d._id })} sx={{ minWidth: 0, fontSize: '0.65rem', p: '2px 6px' }}>{tStudent('deleteAction')}</Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tStudent('uploadDocument')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth label={tStudent('title')} size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextField select fullWidth label={tCommon('type')} size="small" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {[tStudent('birthCertificate'), tStudent('idCard'), tStudent('transcript'), tStudent('medicalRecord'), tStudent('transferLetter'), tStudent('photo'), tStudent('other')].map((t, i) => <MenuItem key={['Birth Certificate', 'ID Card', 'Transcript', 'Medical Record', 'Transfer Letter', 'Photo', 'Other'][i]} value={['Birth Certificate', 'ID Card', 'Transcript', 'Medical Record', 'Transfer Letter', 'Photo', 'Other'][i]}>{t}</MenuItem>)}
            </TextField>
            <TextField fullWidth label={tCommon('description')} size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button variant="outlined" component="label" sx={{ textTransform: 'none' }}>
              {file ? file.name : tStudent('chooseFile')}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!file}>{tCommon('upload')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDocDialog.open} onClose={() => setDeleteDocDialog({ open: false, docId: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tStudent('deleteDocument')}</DialogTitle>
        <DialogContent>
          <Typography>{tStudent('deleteDocumentConfirm')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDocDialog({ open: false, docId: '' })} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button onClick={() => handleDelete(deleteDocDialog.docId)} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tCommon('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
