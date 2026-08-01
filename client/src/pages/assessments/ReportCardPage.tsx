import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Chip,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import { ArrowBack, Print } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentsAPI, studentsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const ministryLogo = new URL('../../assets/ministry-logo.svg', import.meta.url).href;

const getCurrentAcademicYear = () => {
  const now = new Date();
  const y = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}/${y + 1}`;
};

const curYear = new Date().getFullYear();
const ACADEMIC_YEARS = new Date().getMonth() + 1 >= 9
  ? [`${curYear - 1}/${curYear}`, `${curYear}/${curYear + 1}`, `${curYear + 1}/${curYear + 2}`]
  : [`${curYear - 2}/${curYear - 1}`, `${curYear - 1}/${curYear}`, `${curYear}/${curYear + 1}`];

export const ReportCardPage = () => {
  const { t } = useTranslation('assessment');
  const { t: tCommon } = useTranslation('common');
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { user } = useAuth();
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAY, setSelectedAY] = useState(getCurrentAcademicYear());
  const [selectedTerm, setSelectedTerm] = useState('');
  const [myStudentId, setMyStudentId] = useState('');

  useEffect(() => {
    if (isStudentOrParent && studentId) {
      studentsAPI.me.get().then((res) => {
        const s = res.data.data;
        const myId = s.studentId || s._id;
        setMyStudentId(myId);
        if (myId !== studentId) {
          setError(t('noData', { ns: 'common' }));
          setLoading(false);
        }
      }).catch(() => {
        setError(t('noData', { ns: 'common' }));
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (!studentId) return;
    if (isStudentOrParent && myStudentId && myStudentId !== studentId) return;
    setLoading(true);
    setError('');
    assessmentsAPI.reportCard(studentId, { academicYear: selectedAY, ...(selectedTerm ? { term: selectedTerm } : {}) })
      .then((r) => setData(r.data.data))
      .catch((err) => setError(err.response?.data?.message || t('failedToLoad')))
      .finally(() => setLoading(false));
  }, [studentId, selectedAY, selectedTerm, myStudentId]);

  const handlePrint = () => window.print();

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!data) return <Alert severity="info">{t('noData', { ns: 'common' })}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2} className="no-print">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>{t('back', { ns: 'common' })}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>{t('reportCard')}</Typography>
        <Box flex={1} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('academicYear', { ns: 'common' })}</InputLabel>
          <Select value={selectedAY} label={t('academicYear', { ns: 'common' })} onChange={(e) => setSelectedAY(e.target.value)}>
            {ACADEMIC_YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>{t('term', { ns: 'common' })}</InputLabel>
          <Select value={selectedTerm} label={t('term', { ns: 'common' })} onChange={(e) => setSelectedTerm(e.target.value)}>
            <MenuItem value="">{t('all', { ns: 'common' })}</MenuItem>
            <MenuItem value="1">{t('term1', { ns: 'common' })}</MenuItem>
            <MenuItem value="2">{t('term2', { ns: 'common' })}</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} sx={{ borderRadius: 2 }}>{t('print', { ns: 'common' })}</Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 4 }} id="report-card">
        {/* Header */}
        <Box textAlign="center" mb={3}>
          <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
            <img src={ministryLogo} alt="Ministry of Education" style={{ width: 48, height: 48 }} />
            <Box textAlign="center">
              <Typography variant="subtitle2" fontWeight={700} color="#1B4F8A" sx={{ fontSize: '0.8rem' }}>
                ትምህርት ሚኒስቴር
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em' }}>{t('appTitle', { ns: 'common' })}</Typography>
            </Box>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">{t('reportCard')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('academicYear', { ns: 'common' })}: {data.academicYear} | {t('term', { ns: 'common' })}: {data.term}</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Student Info */}
        <Box display="flex" gap={4} mb={3} flexWrap="wrap">
          <Box>
            <Typography variant="body2" color="text.secondary">{t('name', { ns: 'common' })}</Typography>
            <Typography fontWeight={600}>{data.student?.firstName} {data.student?.lastName}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{t('studentId')}</Typography>
            <Typography fontWeight={600}>{data.student?.studentId}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{t('section', { ns: 'common' })}</Typography>
            <Typography fontWeight={600}>{data.student?.section?.name || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{t('grade', { ns: 'common' })}</Typography>
            <Typography fontWeight={600}>{data.student?.section?.grade || '—'}</Typography>
          </Box>
        </Box>

        {/* Subjects Table */}
        {data.subjects?.length === 0 ? (
          <Alert severity="info">{t('noMarksEntered')}</Alert>
        ) : (
          data.subjects.map((sub: any, i: number) => (
            <Paper key={i} elevation={0} sx={{ mb: 2, border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(27,79,138,0.04)', borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>{sub.subject?.name || tCommon('subject')}</Typography>
                  <Typography fontWeight={600}>
                    {sub.totalObtained} / {sub.totalPossible} ({sub.average}%)
                  </Typography>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('assessment')}</TableCell>
                      <TableCell>{t('assessmentType')}</TableCell>
                      <TableCell>{t('score')}</TableCell>
                      <TableCell>{t('outOfTable')}</TableCell>
                      <TableCell>%</TableCell>
                      <TableCell>{t('remarks')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sub.assessments.map((a: any, j: number) => (
                      <TableRow key={j}>
                        <TableCell><Typography variant="body2">{a.title}</Typography></TableCell>
                        <TableCell><Chip label={a.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell><Typography fontWeight={600}>{a.marksObtained}</Typography></TableCell>
                        <TableCell>{a.totalMarks}</TableCell>
                        <TableCell>
                          <Chip label={`${Math.round(a.percentage)}%`} size="small" color={a.percentage >= 50 ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{a.remarks || '—'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))
        )}

        <Divider sx={{ my: 3 }} />

        {/* Summary */}
        {/* Attendance Summary */}
        {data.attendance && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('attendanceRate', { ns: 'attendance' })}</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700} color="success.main">{data.attendance.attendanceRate}%</Typography>
                <Typography variant="caption" color="text.secondary">{t('rate', { ns: 'attendance' })}</Typography>
              </Paper>
              <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700}>{data.attendance.presentDays}</Typography>
                <Typography variant="caption" color="text.secondary">{t('present', { ns: 'attendance' })}</Typography>
              </Paper>
              <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700} color="error.main">{data.attendance.absentDays}</Typography>
                <Typography variant="caption" color="text.secondary">{t('absent', { ns: 'attendance' })}</Typography>
              </Paper>
              <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700} color="warning.main">{data.attendance.lateDays}</Typography>
                <Typography variant="caption" color="text.secondary">{t('late', { ns: 'attendance' })}</Typography>
              </Paper>
            </Box>
          </Box>
        )}

        <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
          <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120 }}>
            <Typography variant="h4" fontWeight={800} color="primary">{data.overallAverage ?? '—'}%</Typography>
            <Typography variant="body2" color="text.secondary">{data.term === 'All' ? t('overallAverageAll') : t('overallAverage')}</Typography>
          </Paper>
          <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120 }}>
            <Typography variant="h4" fontWeight={800} color="primary">{data.subjectCount}</Typography>
            <Typography variant="body2" color="text.secondary">{t('subject', { ns: 'common' })}</Typography>
          </Paper>
          <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120 }}>
            <Typography variant="h4" fontWeight={800} color="primary">{data.totalObtained}</Typography>
            <Typography variant="body2" color="text.secondary">{t('totalMarks')}</Typography>
          </Paper>
          {data.ranking && (
            <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 120 }}>
              <Typography variant="h4" fontWeight={800} color="secondary">#{data.ranking.sectionRank || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('sectionRank')}</Typography>
              {data.ranking.meritCategory && (
                <Chip label={data.ranking.meritCategory} size="small" color={data.ranking.meritCategory === 'Academic Excellence' ? 'warning' : 'primary'} sx={{ mt: 0.5, fontWeight: 600 }} />
              )}
            </Paper>
          )}
        </Box>

        {/* Term 1 / Term 2 / Year Average Summary */}
        {data.term === 'All' && (data.term1 || data.term2) && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              {t('termYearAverages')}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {/* Term 1 Average */}
              <Paper elevation={0} sx={{ px: 3, py: 2.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 160, bgcolor: data.term1 ? 'rgba(27,79,138,0.03)' : undefined }}>
                {data.term1 ? (
                  <>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>{t('term1Average')}</Typography>
                    <Typography variant="h4" fontWeight={800} color="#1B4F8A">{data.term1.overallAverage}%</Typography>
                    <Chip
                      size="small"
                      label={`${data.term1.letterGrade} — GPA ${data.term1.gpa}`}
                      color={data.term1.overallAverage >= 60 ? 'success' : 'error'}
                      sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {data.term1.subjectCount} subjects · {data.term1.totalObtained} marks
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">{t('noTerm1Data')}</Typography>
                )}
              </Paper>

              {/* Year Average (center, emphasized) */}
              {data.yearAverage !== null && (
                <Paper elevation={0} sx={{ px: 3, py: 2.5, borderRadius: 2, border: '2px solid rgba(27,79,138,0.2)', textAlign: 'center', flex: 1, minWidth: 160, bgcolor: 'rgba(27,79,138,0.04)' }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>{t('yearAverageT1T2')}</Typography>
                  <Typography variant="h3" fontWeight={800} color="#1B4F8A">{data.yearAverage}%</Typography>
                  <Chip
                    size="small"
                    label={data.yearAverage >= 90 ? 'A' : data.yearAverage >= 80 ? 'B' : data.yearAverage >= 70 ? 'C' : data.yearAverage >= 60 ? 'D' : 'F'}
                    color={data.yearAverage >= 60 ? 'success' : 'error'}
                    sx={{ mt: 0.75, fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {t('t1PlusT2DividedBy2')}
                  </Typography>
                </Paper>
              )}

              {/* Term 2 Average */}
              <Paper elevation={0} sx={{ px: 3, py: 2.5, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', flex: 1, minWidth: 160, bgcolor: data.term2 ? 'rgba(124,58,237,0.03)' : undefined }}>
                {data.term2 ? (
                  <>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>{t('term2Average')}</Typography>
                    <Typography variant="h4" fontWeight={800} color="#7C3AED">{data.term2.overallAverage}%</Typography>
                    <Chip
                      size="small"
                      label={`${data.term2.letterGrade} — GPA ${data.term2.gpa}`}
                      color={data.term2.overallAverage >= 60 ? 'success' : 'error'}
                      sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {data.term2.subjectCount} subjects · {data.term2.totalObtained} marks
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">{t('noTerm2Data')}</Typography>
                )}
              </Paper>
            </Box>

            {/* Per-subject term comparison */}
            {data.term1?.subjects?.length > 0 && data.term2?.subjects?.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                  {t('subjectComparisonByTerm')}
                </Typography>
                <Paper elevation={0} sx={{ border: '1px solid rgba(229,231,235,0.6)', borderRadius: 2, overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(27,79,138,0.04)' }}>
                          <TableCell sx={{ fontWeight: 700 }}>{tCommon('subject')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#1B4F8A' }}>{t('term1')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#7C3AED' }}>{t('term2')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#C9920A' }}>{t('yearAvg')}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{t('change')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.term1.subjects.map((t1Sub: any) => {
                          const t2Sub = data.term2?.subjects?.find((s: any) => s.subject?._id === t1Sub.subject?._id);
                          const yearAvg = t2Sub
                            ? Math.round(((t1Sub.average + t2Sub.average) / 2) * 10) / 10
                            : t1Sub.average;
                          const change = t2Sub ? Math.round((t2Sub.average - t1Sub.average) * 10) / 10 : null;

                          return (
                            <TableRow key={t1Sub.subject?._id} hover>
                              <TableCell>
                                <Typography fontWeight={600}>{t1Sub.subject?.name || t('unknown')}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={`${t1Sub.average}%`}
                                  color={t1Sub.average >= 60 ? 'success' : 'error'}
                                  variant="outlined"
                                  sx={{ fontWeight: 600, minWidth: 56 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {t2Sub ? (
                                  <Chip
                                    size="small"
                                    label={`${t2Sub.average}%`}
                                    color={t2Sub.average >= 60 ? 'success' : 'error'}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, minWidth: 56 }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight={700}>{yearAvg}%</Typography>
                              </TableCell>
                              <TableCell align="center">
                                {change !== null ? (
                                  <Chip
                                    size="small"
                                    label={`${change > 0 ? '+' : ''}${change}%`}
                                    color={change > 0 ? 'success' : change < 0 ? 'error' : 'default'}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, minWidth: 56 }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* Teacher Comments */}
        {data.teacherComments && data.teacherComments.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('teacherRemarks')}</Typography>
            {data.teacherComments.map((tc: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ p: 2, mb: 1, borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)' }}>
                <Typography variant="body2" fontWeight={600}>{tc.subject} — {tc.assessmentTitle}</Typography>
                {tc.teacherRemarks && <Typography variant="body2" color="text.secondary" mt={0.5}>{t('teacher')}: {tc.teacherRemarks}</Typography>}
                {tc.markRemarks && <Typography variant="body2" color="text.secondary">{t('mark', { ns: 'common' })}: {tc.markRemarks}</Typography>}
              </Paper>
            ))}
          </Box>
        )}

        <Box textAlign="center" mt={4}>
          <Typography variant="caption" color="text.secondary">
            {t('generatedOn')} {new Date(data.generatedAt).toLocaleDateString()} {t('at')} {new Date(data.generatedAt).toLocaleTimeString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
