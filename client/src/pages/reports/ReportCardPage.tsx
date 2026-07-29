import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Chip,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import { School, PictureAsPdf } from '@mui/icons-material';
import { studentsAPI } from '../../services/api';

export const ReportCardPage = () => {
  const { t: tReport } = useTranslation('reports');
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReportCard = async () => {
    if (!studentId.trim()) { setError(tReport('enterStudentId')); return; }
    setLoading(true);
    setError('');
    try {
      const [studentRes, transcriptRes] = await Promise.all([
        studentsAPI.get(studentId.trim()),
        studentsAPI.transcript(studentId.trim()).catch(() => ({ data: { data: null } })),
      ]);
      setStudent(studentRes.data.data);
      setTranscript(transcriptRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || tReport('studentNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="700" mb={3}>{tReport('pageTitle')}</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField size="small" label={tReport('studentId')} value={studentId}
            onChange={(e) => { setStudentId(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && fetchReportCard()}
            sx={{ minWidth: 250 }} />
          <Button variant="contained" onClick={fetchReportCard} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : tReport('loadReport')}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </Paper>

      {student && (
        <Paper sx={{ p: 4 }} id="report-card">
          <Box textAlign="center" mb={4}>
            <School sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="700">{tReport('schoolName')}</Typography>
            <Typography variant="body2" color="text.secondary">{tReport('studentReportCard')}</Typography>
            <Typography variant="body2" color="text.secondary">{tReport('academicYear')} {student?.academicYear || `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} mb={3}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">{tReport('studentName')}</Typography>
              <Typography variant="body1" fontWeight="600">{student.firstName} {student.lastName}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">{tReport('studentId')}</Typography>
              <Typography variant="body1" fontWeight="600">{student.studentId}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">{tReport('grade')}</Typography>
              <Typography variant="body1" fontWeight="600">{student.grade} - {student.section?.name || '-'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">{tReport('stream')}</Typography>
              <Typography variant="body1">{student.stream || tReport('common')}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="text.secondary">{tReport('status')}</Typography>
              <Chip label={student.status} size="small" color={student.status === 'Active' ? 'success' : 'default'} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="h6" fontWeight="600" mb={2}>{tReport('academicPerformance')}</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tReport('colSubject')}</TableCell>
                  <TableCell align="center">{tReport('colMarks')}</TableCell>
                  <TableCell align="center">{tReport('colGrade')}</TableCell>
                  <TableCell align="center">{tReport('colGpa')}</TableCell>
                  <TableCell align="center">{tReport('colRemark')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(transcript?.subjects || []).length > 0 ? transcript.subjects.map((s: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{s.subjectName || s.subject?.name || `${tReport('subject')} ${i + 1}`}</TableCell>
                    <TableCell align="center">{s.marks || s.average || '-'}%</TableCell>
                    <TableCell align="center">
                      <Chip label={s.letterGrade || '-'} size="small"
                        color={s.letterGrade === 'F' ? 'error' : s.letterGrade === 'A' ? 'success' : 'primary'} />
                    </TableCell>
                    <TableCell align="center">{s.gradePoint || s.gpa || '-'}</TableCell>
                    <TableCell align="center">
                      {(s.marks || s.average || 0) >= 90 ? tReport('excellent') : (s.marks || s.average || 0) >= 80 ? tReport('veryGood') : (s.marks || s.average || 0) >= 70 ? tReport('good') : (s.marks || s.average || 0) >= 60 ? tReport('fair') : tReport('needsImprovement')}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {student.status === 'Active' ? tReport('gradesPending') : tReport('noAcademicRecords')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {transcript?.overallAverage && (
            <Box mt={3} display="flex" justifyContent="space-around">
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">{tReport('overallAverage')}</Typography>
                <Typography variant="h5" fontWeight="700" color="primary">{transcript.overallAverage?.toFixed(1)}%</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">{tReport('gpa')}</Typography>
                <Typography variant="h5" fontWeight="700" color="primary">{transcript.gpa?.toFixed(2)}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">{tReport('attendance')}</Typography>
                <Typography variant="h5" fontWeight="700" color="primary">{transcript.attendance || student.attendanceRate || '-'}%</Typography>
              </Box>
            </Box>
          )}

          {transcript?.academicYears?.map((yearEntry: any, yi: number) => (
            yearEntry.termAverages && (
              <Box key={yi} mt={3}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {tReport('academicYearLabel')} {yearEntry.academicYear} — {tReport('termYearAverages')}
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap" mt={1}>
                  {yearEntry.termAverages['1'] !== undefined && (
                    <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120, bgcolor: 'rgba(27,79,138,0.03)' }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">{tReport('term1Average')}</Typography>
                      <Typography variant="h5" fontWeight={800} color="#1B4F8A">{yearEntry.termAverages['1']}%</Typography>
                    </Paper>
                  )}
                  {yearEntry.yearAverage !== undefined && (
                    <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '2px solid rgba(27,79,138,0.2)', textAlign: 'center', flex: 1, minWidth: 120, bgcolor: 'rgba(27,79,138,0.04)' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">{tReport('yearAverage')}</Typography>
                      <Typography variant="h4" fontWeight={800} color="#1B4F8A">{yearEntry.yearAverage}%</Typography>
                      <Typography variant="caption" color="text.secondary">(T1+T2)/2</Typography>
                    </Paper>
                  )}
                  {yearEntry.termAverages['2'] !== undefined && (
                    <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120, bgcolor: 'rgba(124,58,237,0.03)' }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">{tReport('term2Average')}</Typography>
                      <Typography variant="h5" fontWeight={800} color="#7C3AED">{yearEntry.termAverages['2']}%</Typography>
                    </Paper>
                  )}
                </Box>
              </Box>
            )
          ))}

          <Box textAlign="center" mt={4}>
            <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF}>
              {tReport('downloadPrint')}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
