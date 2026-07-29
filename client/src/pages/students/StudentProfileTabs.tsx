import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, Grid, Typography, Chip, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, LinearProgress, Tab, Tabs,
} from '@mui/material';
import {
  School, EmojiEvents, TrendingUp, CalendarToday, CheckCircle, Cancel, Schedule,
  Assessment, LocalHospital, Psychology, Gavel, AccountBalance,
  Phone, Email, LocationOn, Male, Female, Star, History,
} from '@mui/icons-material';

const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
  <Box hidden={value !== index} pt={2}>{value === index && children}</Box>
);

interface Props {
  student: any;
  attendance: any[];
  marks: any[];
  ranking: any;
  healthRecord: any;
  counseling: any[];
  behavioral: any[];
  feeStatus: any;
  statusHistory: any[];
  tab: number;
  setTab: (v: number) => void;
  getAvgColor: (avg: number) => string;
}

export const StudentProfileTabs = ({
  student, attendance, marks, ranking, healthRecord,
  counseling, behavioral, feeStatus, statusHistory,
  tab, setTab, getAvgColor,
}: Props) => {
  const { t: tStudent } = useTranslation('student');
  const { t: tCommon } = useTranslation('common');
  const presentCount = attendance.filter((a: any) => a.status === 'Present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 44 },
            '& .Mui-selected': { color: '#1B4F8A' },
            '& .MuiTabs-indicator': { bgcolor: '#1B4F8A' },
          }}
        >
          <Tab label={tStudent('personalInformation')} />
          <Tab label={tStudent('academicInformation')} />
          <Tab label={tStudent('guardians')} />
          <Tab label={tStudent('myAttendance')} />
          <Tab label={`${tCommon('rank')} & ${tCommon('average')}`} />
          <Tab label={tCommon('health') || 'Health'} />
          <Tab label={tCommon('counseling') || 'Counseling'} />
          <Tab label={tCommon('discipline') || 'Discipline'} />
          <Tab label={`${tCommon('status')} ${tCommon('status') === 'Status' ? 'History' : ''}`} />
          <Tab label={tStudent('statusHistory')} />
          <Tab label={tStudent('documents', { count: '' }).replace(' ()', '')} />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {[
                { label: tStudent('dateOfBirth'), value: student.dateOfBirth?.split('T')[0] || '—', icon: <CalendarToday sx={{ fontSize: 16 }} /> },
                { label: tStudent('gender'), value: student.gender || '—', icon: student.gender === 'Female' ? <Female sx={{ fontSize: 16 }} /> : <Male sx={{ fontSize: 16 }} /> },
                { label: tStudent('email'), value: student.email || '—', icon: <Email sx={{ fontSize: 16 }} /> },
                { label: tStudent('phone'), value: student.phone || '—', icon: <Phone sx={{ fontSize: 16 }} /> },
                { label: tCommon('city') || 'City', value: student.address?.city || '—', icon: <LocationOn sx={{ fontSize: 16 }} /> },
                { label: tCommon('subcity') || 'Subcity', value: student.address?.subcity || '—', icon: <LocationOn sx={{ fontSize: 16 }} /> },
                { label: tCommon('woreda') || 'Woreda', value: student.address?.woreda || '—', icon: <LocationOn sx={{ fontSize: 16 }} /> },
                { label: tCommon('houseNumber') || 'House Number', value: student.address?.houseNumber || '—', icon: <LocationOn sx={{ fontSize: 16 }} /> },
              ].map(({ label, value, icon }) => (
                <Grid item xs={12} md={6} key={label}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ color: '#9CA3AF', display: 'flex' }}>{icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.muted">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mt: 1.5 }} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {[
                { label: tStudent('studentId'), value: student.studentId, icon: <School sx={{ fontSize: 16 }} /> },
                { label: tStudent('academicYear'), value: student.academicYear || '—', icon: <CalendarToday sx={{ fontSize: 16 }} /> },
                { label: tStudent('enrollmentDate'), value: student.enrollmentDate?.split('T')[0] || '—', icon: <Schedule sx={{ fontSize: 16 }} /> },
                { label: tStudent('section'), value: student.section?.name || '—', icon: <School sx={{ fontSize: 16 }} /> },
                { label: tStudent('stream'), value: student.stream?.replace('_', ' ') || '—', icon: <TrendingUp sx={{ fontSize: 16 }} /> },
                { label: `${tCommon('average')} ${tCommon('mark') || 'Score'}`, value: (student.average ?? student.gpa ?? 0) > 0 ? `${student.average ?? student.gpa ?? 0}%` : '—', icon: <Star sx={{ fontSize: 16 }} /> },
                { label: tStudent('status'), value: student.status || tStudent('active'), icon: <CheckCircle sx={{ fontSize: 16 }} /> },
              ].map(({ label, value, icon }) => (
                <Grid item xs={12} md={6} key={label}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ color: '#9CA3AF', display: 'flex' }}>{icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.muted">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mt: 1.5 }} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            {(!student.guardians || student.guardians.length === 0) ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <School sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                <Typography color="text.muted">{tStudent('noGuardiansLinked')}</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {student.guardians.map((g: any) => (
                  <Grid item xs={12} sm={6} key={g._id}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{g.firstName} {g.lastName}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Phone sx={{ fontSize: 14, color: '#9CA3AF' }} />
                        <Typography variant="body2" color="text.secondary">{g.phone}</Typography>
                      </Box>
                      {g.email && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Email sx={{ fontSize: 14, color: '#9CA3AF' }} />
                          <Typography variant="body2" color="text.secondary">{g.email}</Typography>
                        </Box>
                      )}
                      <Chip label={g.relationship} size="small" sx={{ mt: 1, fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{tStudent('attendanceRate')}</Typography>
                <Box display="flex" alignItems="center" gap={1.5} mt={0.5}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={attendanceRate}
                      sx={{
                        height: 8, borderRadius: 4, bgcolor: 'rgba(229,231,235,0.6)',
                        '& .MuiLinearProgress-bar': { bgcolor: attendanceRate >= 80 ? '#2D7D3A' : attendanceRate >= 60 ? '#C9920A' : '#B5251A' },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: attendanceRate >= 80 ? '#2D7D3A' : attendanceRate >= 60 ? '#C9920A' : '#B5251A' }}>
                    {attendanceRate}%
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="center" px={2}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#2D7D3A' }}>{presentCount}</Typography>
                <Typography variant="caption" color="text.muted">{tStudent('present')}</Typography>
              </Box>
              <Box textAlign="center" px={2}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#B5251A' }}>{attendance.length - presentCount}</Typography>
                <Typography variant="caption" color="text.muted">{tStudent('absent')}</Typography>
              </Box>
              <Box textAlign="center" px={2}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#1B4F8A' }}>{attendance.length}</Typography>
                <Typography variant="caption" color="text.muted">{tCommon('total')}</Typography>
              </Box>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tStudent('status')}</TableCell>
                  <TableCell>{tStudent('section')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography color="text.muted">{tStudent('noAttendanceRecords')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((a: any, i: number) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography variant="body2">{a.date ? new Date(a.date).toLocaleDateString() : '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={a.status === 'Present' ? <CheckCircle sx={{ fontSize: 14 }} /> : a.status === 'Absent' ? <Cancel sx={{ fontSize: 14 }} /> : <Schedule sx={{ fontSize: 14 }} />}
                          label={a.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: a.status === 'Present' ? 'rgba(45,125,58,0.12)' : a.status === 'Absent' ? 'rgba(181,37,26,0.12)' : 'rgba(201,146,10,0.12)',
                            color: a.status === 'Present' ? '#2D7D3A' : a.status === 'Absent' ? '#B5251A' : '#C9920A',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{a.subject?.name || '—'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
              <EmojiEvents sx={{ fontSize: 32, color: '#C9920A', mb: 0.5 }} />
              <Typography variant="h4" fontWeight={800}>{ranking?.rank || '—'}</Typography>
              <Typography variant="caption" color="text.muted">{tStudent('classRank')}</Typography>
              {ranking?.totalStudents && (
                <Typography variant="caption" display="block" color="text.muted">
                  {tStudent('ofStudents', { count: ranking.totalStudents })}
                </Typography>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
              <TrendingUp sx={{ fontSize: 32, color: '#1B4F8A', mb: 0.5 }} />
              <Typography variant="h4" fontWeight={800}>{ranking?.gpa || (student.average ?? student.gpa ?? 0) || '—'}</Typography>
              <Typography variant="caption" color="text.muted">{tStudent('gpaAverage')}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 2 }}>
              <Star sx={{ fontSize: 32, color: '#2D7D3A', mb: 0.5 }} />
              <Typography variant="h4" fontWeight={800}>{marks.length}</Typography>
              <Typography variant="caption" color="text.muted">{tStudent('assessments')}</Typography>
            </Card>
          </Grid>
        </Grid>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tStudent('section')}</TableCell>
                  <TableCell>{tCommon('type')}</TableCell>
                  <TableCell align="right">{tCommon('mark') || 'Score'}</TableCell>
                  <TableCell align="right">{tCommon('average')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.muted">{tStudent('noAssessmentsRecorded')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  marks.map((g: any, i: number) => {
                    const score = g.obtainedMarks ?? g.score ?? 0;
                    const total = g.assessment?.totalMarks ?? g.totalMarks ?? 100;
                    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                    return (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{g.assessment?.subject?.name || g.subject?.name || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={g.assessment?.type || g.type || '—'} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: 'rgba(27,79,138,0.06)', color: '#6B7280' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontFamily="monospace">{score}/{total}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                            <Box sx={{ px: 1.5, py: 0.25, borderRadius: 1, bgcolor: `${getAvgColor(pct)}15`, color: getAvgColor(pct), fontWeight: 700, fontSize: '0.8rem' }}>
                              {pct}%
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tab} index={5}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            {!healthRecord ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <LocalHospital sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                <Typography color="text.muted">{tStudent('noHealthRecordFound')}</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.muted">{tStudent('bloodType')}</Typography>
                  <Typography variant="body2" fontWeight={700}>{healthRecord.bloodType || '—'}</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="caption" color="text.muted">{tCommon('name') || 'Allergies'}</Typography>
                  <Typography variant="body2">{healthRecord.allergies?.join(', ') || tStudent('none')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.muted">{tStudent('chronicConditionsLabel')}</Typography>
                  <Typography variant="body2">{healthRecord.chronicConditions?.join(', ') || tStudent('none')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.muted">{tStudent('medicationsLabel')}</Typography>
                  <Typography variant="body2">{healthRecord.medications?.join(', ') || tStudent('none')}</Typography>
                </Grid>
                {healthRecord.emergencyContact && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>{tStudent('emergencyContact')}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.muted">{tStudent('emergencyContactName')}</Typography>
                      <Typography variant="body2" fontWeight={600}>{healthRecord.emergencyContact.name}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.muted">{tStudent('emergencyContactPhone')}</Typography>
                      <Typography variant="body2" fontWeight={600}>{healthRecord.emergencyContact.phone}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.muted">{tStudent('emergencyContactRelationship')}</Typography>
                      <Typography variant="body2" fontWeight={600}>{healthRecord.emergencyContact.relationship}</Typography>
                    </Grid>
                  </>
                )}
                {healthRecord.immunizations?.length > 0 && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>{tStudent('immunizations')}</Typography>
                    </Grid>
                    {healthRecord.immunizations.map((im: any, i: number) => (
                      <Grid item xs={4} key={i}>
                        <Typography variant="body2">{im.name}</Typography>
                        <Typography variant="caption" color="text.muted">{im.date ? new Date(im.date).toLocaleDateString() : ''}</Typography>
                      </Grid>
                    ))}
                  </>
                )}
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={6}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tCommon('type')}</TableCell>
                  <TableCell>{tStudent('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {counseling.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Psychology sx={{ fontSize: 32, color: '#9CA3AF', opacity: 0.4, mb: 0.5 }} />
                      <Typography color="text.muted">{tStudent('noCounselingSessions')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  counseling.map((s: any) => (
                    <TableRow key={s._id} hover>
                      <TableCell>
                        <Typography variant="body2">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString() : '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.sessionType} size="small" sx={{
                          fontWeight: 600, fontSize: '0.7rem',
                          bgcolor: s.sessionType === 'Academic' ? 'rgba(27,79,138,0.1)' : s.sessionType === 'Behavioral' ? 'rgba(201,146,10,0.1)' : 'rgba(15,118,110,0.1)',
                          color: s.sessionType === 'Academic' ? '#1B4F8A' : s.sessionType === 'Behavioral' ? '#C9920A' : '#0F766E',
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={s.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: s.status === 'Completed' ? 'rgba(45,125,58,0.12)' : 'rgba(27,79,138,0.08)', color: s.status === 'Completed' ? '#2D7D3A' : '#1B4F8A' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tab} index={7}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('date')}</TableCell>
                  <TableCell>{tCommon('type')}</TableCell>
                  <TableCell>{tCommon('severity') || 'Severity'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {behavioral.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Gavel sx={{ fontSize: 32, color: '#9CA3AF', opacity: 0.4, mb: 0.5 }} />
                      <Typography color="text.muted">{tStudent('noBehavioralRecords')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  behavioral.map((r: any) => (
                    <TableRow key={r._id} hover>
                      <TableCell>
                        <Typography variant="body2">{r.incidentDate ? new Date(r.incidentDate).toLocaleDateString() : '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={r.incidentType} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: r.incidentType === 'Achievement' ? 'rgba(45,125,58,0.12)' : 'rgba(181,37,26,0.12)', color: r.incidentType === 'Achievement' ? '#2D7D3A' : '#B5251A' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={r.severity} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: r.severity === 'Minor' ? 'rgba(45,125,58,0.1)' : r.severity === 'Moderate' ? 'rgba(201,146,10,0.1)' : 'rgba(181,37,26,0.1)', color: r.severity === 'Minor' ? '#2D7D3A' : r.severity === 'Moderate' ? '#C9920A' : '#B5251A' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tab} index={8}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            {!feeStatus ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <AccountBalance sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                <Typography color="text.muted">{tStudent('noFeeInformation')}</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.muted">{tStudent('totalFees')}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#111827' }}>{feeStatus.totalFee || 0} ETB</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, borderColor: 'rgba(45,125,58,0.3)' }}>
                    <Typography variant="caption" color="text.muted">{tStudent('paid')}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#2D7D3A' }}>{feeStatus.totalPaid || 0} ETB</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, borderColor: 'rgba(181,37,26,0.3)' }}>
                    <Typography variant="caption" color="text.muted">{tStudent('balance')}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#B5251A' }}>
                      {((feeStatus.totalFee || 0) - (feeStatus.totalPaid || 0))} ETB
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={9}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
              {tStudent('statusHistory')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {(!statusHistory || statusHistory.length === 0) && !student?.suspensionDate && !student?.archivedDate ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <History sx={{ fontSize: 40, color: '#9CA3AF', opacity: 0.4, mb: 1 }} />
                <Typography color="text.muted">{tStudent('noStatusChanges')}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{tCommon('date')}</TableCell>
                      <TableCell>{tStudent('status')}</TableCell>
                      <TableCell>{tCommon('remarks') || 'Reason'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statusHistory?.map((h: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Typography variant="body2">{h.changedAt ? new Date(h.changedAt).toLocaleString() : '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={h.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{h.reason || '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {student?.suspensionDate && (
                      <TableRow hover>
                        <TableCell><Typography variant="body2">{new Date(student.suspensionDate).toLocaleString()}</Typography></TableCell>
                        <TableCell><Chip label={tStudent('suspended')} size="small" color="error" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{student.suspensionReason || '—'}</Typography></TableCell>
                      </TableRow>
                    )}
                    {student?.archivedDate && (
                      <TableRow hover>
                        <TableCell><Typography variant="body2">{new Date(student.archivedDate).toLocaleString()}</Typography></TableCell>
                        <TableCell><Chip label={tStudent('archived')} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{student.archivedReason || '—'}</Typography></TableCell>
                      </TableRow>
                    )}
                    {student?.withdrawalDate && (
                      <TableRow hover>
                        <TableCell><Typography variant="body2">{new Date(student.withdrawalDate).toLocaleString()}</Typography></TableCell>
                        <TableCell><Chip label={tStudent('withdrawn')} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{student.withdrawalReason || '—'}</Typography></TableCell>
                      </TableRow>
                    )}
                    {student?.graduationDate && (
                      <TableRow hover>
                        <TableCell><Typography variant="body2">{new Date(student.graduationDate).toLocaleString()}</Typography></TableCell>
                        <TableCell><Chip label={tStudent('graduated')} size="small" color="primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{tStudent('completedGrade', { grade: student.grade })}</Typography></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </>
  );
};
