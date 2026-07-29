import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  AccessTime, CalendarToday, Refresh, Book, Person, MeetingRoom,
} from '@mui/icons-material';
import { studentsAPI, timetablesAPI, teachersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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

const SUBJECT_COLORS = [
  '#1B4F8A', '#2D7D3A', '#7C3AED', '#B5251A', '#C9920A',
  '#065F46', '#831843', '#1E3A5F', '#5B21B6', '#9D174D',
];

export const MyTimetablePage = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetable, setTimetable] = useState<any>(null);
  const [sectionName, setSectionName] = useState('');
  const [mySections, setMySections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isTeacher) {
        const secRes = await teachersAPI.my.sections();
        const secs = secRes.data.data?.sections || [];
        setMySections(secs);
        if (!selectedSectionId && secs.length > 0) {
          setSelectedSectionId(secs[0]._id);
          setSectionName(`${secs[0].name}${secs[0].grade ? ` (Grade ${secs[0].grade})` : ''}`);
          const ttRes = await timetablesAPI.getBySection(secs[0]._id);
          setTimetable(ttRes.data.data);
          setLoading(false);
          return;
        } else if (!selectedSectionId) {
          setError(t('noSectionsAssigned'));
          setLoading(false);
          return;
        }
        const sec = secs.find((s: any) => s._id === selectedSectionId);
        setSectionName(sec ? `${sec.name}${sec.grade ? ` (Grade ${sec.grade})` : ''}` : '');
        const ttRes = await timetablesAPI.getBySection(selectedSectionId);
        setTimetable(ttRes.data.data);
      } else {
        const profileRes = await studentsAPI.me.get();
        const student = profileRes.data.data;
        const section = student.section;
        if (!section || !section._id) {
          setError(t('notAssignedToSection'));
          setLoading(false);
          return;
        }
        setSectionName(`${section.name}${section.grade ? ` (Grade ${section.grade})` : ''}`);
        const ttRes = await timetablesAPI.getBySection(section._id);
        setTimetable(ttRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedToLoadTimetable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isTeacher && selectedSectionId) fetchData();
  }, [selectedSectionId]);

  const getSlotInfo = (day: string, period: number) =>
    timetable?.schedule?.find((s: any) => s.dayOfWeek === day && s.periodNumber === period);

  const getSubjectColor = (index: number) => SUBJECT_COLORS[index % SUBJECT_COLORS.length];

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <CalendarToday sx={{ fontSize: 32, color: '#1B4F8A' }} />
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>
          {t('myTimetable')}
        </Typography>
        {isTeacher && mySections.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('section')}</InputLabel>
            <Select value={selectedSectionId} label={t('section')} onChange={(e) => setSelectedSectionId(e.target.value)}>
              {mySections.map((s: any) => (
                <MenuItem key={s._id} value={s._id}>{s.name}{s.grade ? ` (Grade ${s.grade})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {sectionName && (
          <Chip label={sectionName} size="small" sx={{ fontWeight: 600, borderRadius: 2 }} />
        )}
        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} size="small"><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!timetable ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <CalendarToday sx={{ fontSize: 56, mb: 1.5, opacity: 0.2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>{t('noTimetablePublished')}</Typography>
          <Typography variant="body2" color="text.disabled">{t('checkBackLater')}</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                   <TableCell sx={{ fontWeight: 700, minWidth: 72, bgcolor: 'rgba(229,231,235,0.3)' }}>{t('period')}</TableCell>
                   <TableCell sx={{ fontWeight: 700, minWidth: 110, bgcolor: 'rgba(229,231,235,0.3)' }}>{t('time')}</TableCell>
                  {DAYS.map(day => (
                    <TableCell key={day} sx={{ fontWeight: 700, minWidth: 170, bgcolor: 'rgba(229,231,235,0.3)' }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PERIODS.map(period => {
                  const pt = PERIOD_TIMES[period];
                  return (
                    <TableRow key={period} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                       <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('period')} {period}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTime sx={{ fontSize: 13 }} />
                          {pt.start} - {pt.end}
                        </Box>
                      </TableCell>
                      {DAYS.map((day, dayIdx) => {
                        const slot = getSlotInfo(day, period);
                        const colorIdx = slot?.subject?.name ? slot.subject.name.length : 0;
                        const accent = getSubjectColor(colorIdx);
                        return (
                          <TableCell key={day} sx={{ p: 0.5, minWidth: 170, height: 80 }}>
                            {slot?.subject ? (
                              <Box
                                sx={{
                                  p: 1, borderRadius: 1.5,
                                  bgcolor: `${accent}10`,
                                  border: '1px solid', borderColor: `${accent}30`,
                                  minHeight: 64,
                                }}
                              >
                                <Typography variant="body2" fontWeight={700} color={accent}>
                                  {slot.subject.name || slot.subject}
                                </Typography>
                                {slot.teacher && (
                                  <Box display="flex" alignItems="center" gap={0.3} mt={0.3}>
                                    <Person sx={{ fontSize: 11, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {slot.teacher.firstName || ''} {slot.teacher.lastName || slot.teacher.name || ''}
                                    </Typography>
                                  </Box>
                                )}
                                {slot.classroom && (
                                  <Box display="flex" alignItems="center" gap={0.3} mt={0.1}>
                                    <MeetingRoom sx={{ fontSize: 11, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.disabled">
                                      {slot.classroom.roomNumber || slot.classroom.name || slot.classroom}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  p: 1, borderRadius: 1.5,
                                  border: '1px dashed', borderColor: 'grey.200',
                                  minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Typography variant="caption" color="text.disabled">{t('free')}</Typography>
                              </Box>
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

      <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
        <Typography variant="caption" color="text.secondary">
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTime sx={{ fontSize: 14 }} />
            {t('weeklyScheduleNote')}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
};
