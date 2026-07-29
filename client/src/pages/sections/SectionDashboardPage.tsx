import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress, Alert, Card, CardContent,
  LinearProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, Avatar, TextField, MenuItem
} from '@mui/material';
import { Group, Class, Speed, PeopleAlt, Warning, CheckCircle } from '@mui/icons-material';
import { sectionsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SectionDashboardPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t: tSections } = useTranslation('sections');
  const { t: tCommon } = useTranslation('common');
  const curYear = new Date().getFullYear();
  const curAY = new Date().getMonth() + 1 >= 9 ? `${curYear}/${curYear + 1}` : `${curYear - 1}/${curYear}`;
  const [selectedAY, setSelectedAY] = useState(curAY);
  const navigate = useNavigate();

  const academicYears = [
    `${curYear - 1}/${curYear}`,
    `${curYear}/${curYear + 1}`,
  ];

  useEffect(() => {
    setLoading(true);
    sectionsAPI.dashboard({ academicYear: selectedAY })
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || tSections('messages.failedToLoadDashboard'));
      })
      .finally(() => setLoading(false));
  }, [selectedAY, tSections]);

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress size={36} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!data) return <Alert severity="info" sx={{ m: 2 }}>{tSections('dashboard.noData')}</Alert>;

  const metrics = data.metrics || {};
  const sections = data.sections || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={800} color="#111827">
          {tSections('dashboard.title')}
        </Typography>
        <Box display="flex" gap={1}>
          <TextField
            select size="small" label={tSections('dialog.academicYear')} value={selectedAY}
            onChange={(e) => setSelectedAY(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={() => navigate('/sections')}>
            {tSections('dashboard.manageSections')}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{tSections('dashboard.totalStudents')}</Typography>
                  <Typography variant="h4" fontWeight={800} color="#111827">{metrics.totalStudents}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', width: 48, height: 48 }}>
                  <Group />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{tSections('dashboard.activeSections')}</Typography>
                  <Typography variant="h4" fontWeight={800} color="#10B981">{metrics.activeSections}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', width: 48, height: 48 }}>
                  <Class />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{tSections('dashboard.capacityUtilization')}</Typography>
                  <Typography variant="h4" fontWeight={800} color={metrics.capacityUtilization > 90 ? '#EF4444' : '#F59E0B'}>
                    {metrics.capacityUtilization}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', width: 48, height: 48 }}>
                  <Speed />
                </Avatar>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={metrics.capacityUtilization} 
                sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: metrics.capacityUtilization > 90 ? '#EF4444' : '#F59E0B' } }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{tSections('dashboard.availableSeats')}</Typography>
                  <Typography variant="h4" fontWeight={800} color="#6366F1">{metrics.availableSeats}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366F1', width: 48, height: 48 }}>
                  <PeopleAlt />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {tSections('dashboard.sectionsCompletelyFull', { count: metrics.fullSections })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sections Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.8)', overflow: 'hidden' }}>
        <Box p={3} borderBottom="1px solid rgba(229,231,235,0.8)">
          <Typography variant="h6" fontWeight={700}>{tSections('dashboard.activeSectionsDistribution')}</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 600 }}>{tSections('dashboard.gradeAndSection')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{tCommon('capacity')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{tSections('dashboard.enrolled')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{tCommon('status.title')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{tSections('list.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.filter((s: any) => s.isActive).map((section: any) => (
                <TableRow key={section._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{tCommon('grade')} {section.grade}{section.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{section.stream || tSections('dashboard.commonStream')}</Typography>
                  </TableCell>
                  <TableCell align="center">{section.capacity}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700} color={section.isFull ? 'error' : 'success.main'}>
                      {section.studentCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {section.isFull ? (
                      <Chip icon={<Warning fontSize="small" />} label={tSections('dashboard.full')} color="error" size="small" />
                    ) : (
                      <Chip icon={<CheckCircle fontSize="small" />} label={tSections('dashboard.available')} color="success" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none' }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/sections/${section._id}`)}>{tSections('dashboard.viewProfile')}</Button>
                  </TableCell>
                </TableRow>
              ))}
              {sections.filter((s: any) => s.isActive).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{tSections('dashboard.noActiveSections')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
