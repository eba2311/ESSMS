import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert, Avatar, Divider, Button,
  Card, CardContent, CardActionArea,
} from '@mui/material';
import { ArrowBack, Group, School, Book, Star, Assignment, EditNote } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../services/api';

export const MyTeacherSections = () => {
  const { t: tTeacher } = useTranslation('teacher');
  const { t: tCommon } = useTranslation('common');
  const { t: tMyTeach } = useTranslation('myTeaching');
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teachersAPI.my.sections().then((r) => {
      setData(r.data.data);
    }).catch(() => setError(tTeacher('failedToLoad')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!data) return null;

  const sections = Array.isArray(data.sections) ? data.sections : [];
  const teacher = data.teacher || {};

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={1.5}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/my-teacher/dashboard')} sx={{ borderRadius: 2 }}>{tCommon('back')}</Button>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', flex: 1 }}>{tTeacher('mySections')}</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A' }}>{teacher.fullName?.[0]}</Avatar>
          <Box>
            <Typography variant="body1" fontWeight={700}>{teacher.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{tTeacher('sectionsAssigned', { count: sections.length })}</Typography>
          </Box>
        </Box>
      </Paper>

      {sections.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 6, textAlign: 'center' }}>
          <Group sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{tTeacher('noSectionsAssigned')}</Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {sections.map((sec: any) => (
            <Card key={sec._id} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
              <CardActionArea onClick={() => navigate(`/my-teacher/sections/${sec._id}/students`)} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'rgba(27,79,138,0.12)', color: '#1B4F8A' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={700}>
                          {tCommon('grade')} {sec.grade} - {sec.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{sec.stream || '—'}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box textAlign="center">
                      <Typography variant="body1" fontWeight={700}>{sec.studentCount}</Typography>
                      <Typography variant="caption" color="text.secondary">{tTeacher('students')}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body1" fontWeight={700}>{sec.subjects.length}</Typography>
                      <Typography variant="caption" color="text.secondary">{tTeacher('subjects')}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box mt={1.5} display="flex" gap={0.75} flexWrap="wrap">
                  {sec.subjects.map((sub: any) => (
                    <Chip key={sub._id} label={sub.name} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                  ))}
                </Box>
              </CardActionArea>
              <Divider />
              <Box display="flex" gap={0.5} px={2} py={1}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<Assignment />}
                  onClick={() => navigate(`/my-teacher/sections/${sec._id}/assessments`)}
                  sx={{ borderRadius: 1.5, fontSize: '0.7rem' }}
                >
                  {tTeacher('assessments')}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<EditNote />}
                  onClick={() => navigate(`/my-teacher/marks?section=${sec._id}`)}
                  sx={{ borderRadius: 1.5, fontSize: '0.7rem' }}
                >
                  {tTeacher('enterMarks')}
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
