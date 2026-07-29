import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Select, MenuItem,
  FormControl, InputLabel, Button, Divider, Paper, Chip, TextField, InputAdornment,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { rosterAPI } from '../../services/roster.service';
import { sectionsAPI } from '../../services/api';
import {
  People, School, CheckCircle, Cancel, TrendingUp, TrendingDown, Functions,
  Class, GroupWork, Assessment, EventAvailable, Search, Edit, SwapHoriz,
  ExpandMore, ExpandLess, Wc, PieChart as PieChartIcon, BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export const RosterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t: tRoster } = useTranslation('rosters');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sectionRoster, setSectionRoster] = useState<any>(null);
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [showAllSections, setShowAllSections] = useState(false);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];
  const [academicYear, setAcademicYear] = useState(
    new Date().getMonth() + 1 >= 9 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`
  );

  useEffect(() => { fetchStats(); fetchSections(); }, [academicYear]);

  useEffect(() => {
    if (selectedSectionId) fetchSectionRoster(selectedSectionId);
  }, [selectedSectionId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await rosterAPI.getEnhancedDashboard(academicYear);
      setStats(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch roster stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await sectionsAPI.list({ academicYear });
      const data = res.data.data;
      setSections(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const fetchSectionRoster = async (sectionId: string) => {
    try {
      const res = await sectionsAPI.getClassRoster(sectionId);
      setSectionRoster(res.data.data);
    } catch { setSectionRoster(null); }
  };

  const filteredSections = useMemo(() => {
    let data = sections;
    if (gradeFilter) data = data.filter((s: any) => s.grade === Number(gradeFilter));
    if (sectionSearch) {
      const q = sectionSearch.toLowerCase();
      data = data.filter((s: any) => s.name?.toLowerCase().includes(q) || s.stream?.toLowerCase().includes(q));
    }
    return data;
  }, [sections, gradeFilter, sectionSearch]);

  const displayedSections = showAllSections ? filteredSections : filteredSections.slice(0, 8);

  // Chart data
  const gradeDistributionData = useMemo(() => {
    if (!stats?.gradeDistribution) return [];
    return Object.entries(stats.gradeDistribution).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const genderData = useMemo(() => {
    if (!stats?.genderBreakdown) return [];
    return [
      { name: 'Male', value: stats.genderBreakdown.male || 0 },
      { name: 'Female', value: stats.genderBreakdown.female || 0 },
    ];
  }, [stats]);

  const gradePerformanceData = useMemo(() => {
    if (!stats?.gradeStats) return [];
    return Object.entries(stats.gradeStats).map(([grade, data]: [string, any]) => ({
      name: `Gr. ${grade}`,
      average: data.avg,
      passed: data.passed,
      total: data.total,
    }));
  }, [stats]);

  if (loading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  const statCards = [
    { title: tRoster('dashboard.totalStudents'), value: stats?.totalStudents || 0, icon: <People color="primary" sx={{ fontSize: 40 }} />, color: '#3B82F6' },
    { title: tRoster('dashboard.totalSections'), value: stats?.totalSections || 0, icon: <School color="secondary" sx={{ fontSize: 40 }} />, color: '#8B5CF6' },
    { title: tRoster('dashboard.totalPassed'), value: stats?.totalPassed || 0, icon: <CheckCircle color="success" sx={{ fontSize: 40 }} />, color: '#10B981' },
    { title: tRoster('dashboard.totalFailed'), value: stats?.totalFailed || 0, icon: <Cancel color="error" sx={{ fontSize: 40 }} />, color: '#EF4444' },
    { title: tRoster('dashboard.highestAverage'), value: `${stats?.highestAverage || 0}%`, icon: <TrendingUp color="success" sx={{ fontSize: 40 }} />, color: '#059669' },
    { title: tRoster('dashboard.lowestAverage'), value: `${stats?.lowestAverage || 0}%`, icon: <TrendingDown color="error" sx={{ fontSize: 40 }} />, color: '#DC2626' },
    { title: tRoster('dashboard.overallAverage'), value: `${stats?.overallSchoolAverage || 0}%`, icon: <Functions color="info" sx={{ fontSize: 40 }} />, color: '#0891B2' },
    { title: tRoster('dashboard.incomplete'), value: stats?.totalIncomplete || 0, icon: <Assessment color="warning" sx={{ fontSize: 40 }} />, color: '#F59E0B' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {tRoster('dashboard.title')}
        </Typography>
        <Box display="flex" gap={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{tCommon('academicYear')}</InputLabel>
            <Select value={academicYear} label={tCommon('academicYear')} onChange={(e) => setAcademicYear(e.target.value)}>
              {academicYears.map(ay => <MenuItem key={ay} value={ay}>{ay}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', bgcolor: 'rgba(59,130,246,0.02)' }}>
        <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>{tRoster('dashboard.quickActions')}</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="contained" startIcon={<Class />} onClick={() => navigate('/rosters/class-roster')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.classRoster')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<Assessment />} onClick={() => navigate('/rosters/semester')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.semesterRoster')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<Assessment />} onClick={() => navigate('/rosters/annual')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.annualRoster')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => navigate('/rosters/marks')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.markEntry')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<SwapHoriz />} onClick={() => navigate('/rosters/promote')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.promotions')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<GroupWork />} onClick={() => navigate('/sections')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.sections')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<EventAvailable />} onClick={() => navigate('/sections/dashboard')} sx={{ borderRadius: 2 }}>
            {tRoster('dashboard.sectionDashboard')}
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {statCards.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{
              display: 'flex', alignItems: 'center', p: 2, borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderLeft: `4px solid ${stat.color}`,
            }}>
              <Box sx={{ mr: 2, opacity: 0.8 }}>{stat.icon}</Box>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="subtitle2" color="textSecondary">{stat.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Grade Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: 280 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PieChartIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>{tRoster('dashboard.resultDistribution')}</Typography>
              </Box>
              {gradeDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={gradeDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {gradeDistributionData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                  <Typography color="text.secondary" variant="body2">{tCommon('noDataAvailable')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gender Breakdown Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: 280 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Wc color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>{tRoster('dashboard.genderBreakdown')}</Typography>
              </Box>
              {genderData.some(g => g.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      <Cell fill="#3B82F6" />
                      <Cell fill="#EC4899" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                  <Typography color="text.secondary" variant="body2">{tCommon('noDataAvailable')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grade Performance Bar Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: 280 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BarChartIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={700}>{tRoster('dashboard.gradePerformance')}</Typography>
              </Box>
              {gradePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gradePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                  <Typography color="text.secondary" variant="body2">{tCommon('noDataAvailable')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Promotion Breakdown Chips */}
      {stats?.promotionBreakdown && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)' }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>{tRoster('dashboard.promotionSummary')}</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label={`${tRoster('dashboard.promoted')}: ${stats.promotionBreakdown.Promoted || 0}`} color="success" variant="outlined" />
            <Chip label={`${tRoster('dashboard.repeat')}: ${stats.promotionBreakdown.Repeat || 0}`} color="error" variant="outlined" />
            <Chip label={`${tRoster('dashboard.incomplete')}: ${stats.promotionBreakdown.Incomplete || 0}`} color="warning" variant="outlined" />
            <Chip label={`${tRoster('dashboard.graduated')}: ${stats.promotionBreakdown.Graduated || 0}`} color="info" variant="outlined" />
          </Box>
        </Paper>
      )}

      {/* Section Overview + Detail */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>{tRoster('dashboard.sectionOverview')}</Typography>
                <Chip label={`${filteredSections.length} ${tRoster('dashboard.sections').toLowerCase()}`} size="small" variant="outlined" />
              </Box>

              <Box display="flex" gap={1} mb={2}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>{tCommon('grade')}</InputLabel>
                  <Select value={gradeFilter} label={tCommon('grade')} onChange={(e) => { setGradeFilter(e.target.value); setShowAllSections(false); }}>
                    <MenuItem value="">{tCommon('all')}</MenuItem>
                    {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{tCommon('grade')} {g}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" placeholder={tCommon('search')} value={sectionSearch}
                  onChange={(e) => { setSectionSearch(e.target.value); setShowAllSections(false); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                  sx={{ flex: 1 }}
                />
              </Box>

              {filteredSections.length === 0 ? (
                <Typography color="text.secondary" variant="body2">{tRoster('dashboard.noSectionsFound')}</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {displayedSections.map((sec: any) => (
                    <Box
                      key={sec._id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1, borderRadius: 2, cursor: 'pointer',
                        bgcolor: selectedSectionId === sec._id ? 'rgba(59,130,246,0.08)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      }}
                      onClick={() => setSelectedSectionId(sec._id)}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{sec.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Grade {sec.grade} · {sec.stream || tCommon('common')}
                          {sec.assistantTeacher && ` · ${(sec.assistantTeacher as any)?.firstName} ${(sec.assistantTeacher as any)?.lastName}`}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${sec.enrolled || 0}/${sec.capacity || 50}`}
                        size="small"
                        color={(sec.enrolled || 0) >= (sec.capacity || 50) ? 'error' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  ))}
                  {filteredSections.length > 8 && (
                    <Button size="small" variant="text" onClick={() => setShowAllSections(!showAllSections)}
                      endIcon={showAllSections ? <ExpandLess /> : <ExpandMore />}>
                      {showAllSections ? tRoster('dashboard.showLess') : tRoster('dashboard.showAll', { count: filteredSections.length })}
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: 300 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                {sectionRoster ? `${sectionRoster.section?.name} - ${tRoster('dashboard.classRoster')}` : tRoster('dashboard.selectSection')}
              </Typography>
              {!sectionRoster ? (
                <Box textAlign="center" py={6}>
                  <School sx={{ fontSize: 48, color: '#9CA3AF', opacity: 0.3 }} />
                  <Typography color="text.secondary" mt={1} variant="body2">
                    {tRoster('dashboard.clickSectionHint')}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <Chip icon={<People />} label={`${sectionRoster.summary?.totalStudents || 0} ${tCommon('students')}`} size="small" />
                    <Chip label={`M: ${sectionRoster.summary?.maleCount || 0} / F: ${sectionRoster.summary?.femaleCount || 0}`} size="small" variant="outlined" />
                    <Chip label={`${sectionRoster.summary?.occupancyRate || 0}% ${tRoster('dashboard.full')}`} size="small"
                      color={sectionRoster.summary?.occupancyRate >= 100 ? 'error' : 'success'} variant="outlined" />
                  </Box>
                  {sectionRoster.section?.homeroomTeacher && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {tRoster('dashboard.homeroom')}: {(sectionRoster.section.homeroomTeacher as any)?.firstName} {(sectionRoster.section.homeroomTeacher as any)?.lastName}
                    </Typography>
                  )}
                  {sectionRoster.students?.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">{tRoster('dashboard.noStudentsAssigned')}</Typography>
                  ) : (
                    <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                      {sectionRoster.students?.slice(0, 25).map((s: any) => (
                        <Box key={s._id} display="flex" justifyContent="space-between" alignItems="center"
                          sx={{ py: 0.5, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>{s.no}.</Typography>
                            <Typography variant="body2" fontWeight={500}>{s.fullName}</Typography>
                          </Box>
                          <Chip label={s.gender || '—'} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                        </Box>
                      ))}
                      {sectionRoster.students?.length > 25 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                          ... and {sectionRoster.students.length - 25} {tRoster('dashboard.moreStudents')}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Box display="flex" gap={1} mt={1}>
                    <Button size="small" variant="text" onClick={() => navigate('/rosters/class-roster')}>
                      {tRoster('dashboard.viewFullRoster')}
                    </Button>
                    <Button size="small" variant="text" onClick={() => navigate('/rosters/marks')}>
                      {tRoster('dashboard.enterMarks')}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
