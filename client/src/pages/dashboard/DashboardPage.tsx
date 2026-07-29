import { useState, useEffect, Component, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  Skeleton,
} from '@mui/material';
import {
  School,
  People,
  Assessment,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  MenuBook,
  CheckCircle,
  Star,
  Event,
  PersonAdd,
  HowToReg,
  Schedule,
  ArrowForward,
  GroupWork,
  MeetingRoom,
} from '@mui/icons-material';
import {
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';
import { AnnouncementWidget } from '../../components/AnnouncementWidget';
import type { DashboardStats, TeacherDashboard, StudentDashboard, TermPerformance, Event as AppEvent } from '../../types';

const COLORS = ['#1B4F8A', '#2D7D3A', '#C9920A', '#B5251A', '#0F766E', '#7C3AED'];
const COLORS_PIE = ['#1B4F8A', '#C9920A', '#2D7D3A', '#0F766E', '#7C3AED'];

class ChartErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback || (
      <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary">Chart unavailable</Typography>
      </Box>
    );
    return this.props.children;
  }
}

const StatCard = ({ title, value, icon, color, subtitle, trend, trendLabel }: {
  title: string; value: string | number; icon: React.ReactNode; color: string;
  subtitle?: string; trend?: 'up' | 'down'; trendLabel?: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      height: '100%',
      borderRadius: 3,
      border: '1px solid rgba(229,231,235,0.6)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 8px 32px rgba(27,79,138,0.12)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${color}20, ${color}08)`,
          '& .MuiSvgIcon-root': { fontSize: 22, color },
        }}
      >
        {icon}
      </Box>
      {trend && (
        <Chip
          icon={trend === 'up' ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
          label={trendLabel || ''}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: trend === 'up' ? 'rgba(45,125,58,0.1)' : 'rgba(181,37,26,0.1)',
            color: trend === 'up' ? '#2D7D3A' : '#B5251A',
            '& .MuiChip-icon': { ml: 0.5 },
          }}
        />
      )}
    </Box>
    <Typography variant="h4" fontWeight={800} sx={{ fontSize: '1.75rem', lineHeight: 1.2, mb: 0.25 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" fontWeight={500}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.muted" sx={{ mt: 0.25, display: 'block' }}>
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const QuickActionCard = ({ label, icon, color, onClick }: {
  label: string; icon: React.ReactNode; color: string; onClick: () => void;
}) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 2.5,
      border: '1px solid rgba(229,231,235,0.6)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: color,
        bgcolor: `${color}08`,
        boxShadow: `0 4px 16px ${color}20`,
        transform: 'translateY(-1px)',
      },
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: `${color}15`,
        '& .MuiSvgIcon-root': { fontSize: 20, color },
      }}
    >
      {icon}
    </Box>
    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
      {label}
    </Typography>
    <ArrowForward sx={{ fontSize: 16, color: 'text.muted', opacity: 0.5 }} />
  </Paper>
);

const DashboardSkeleton = () => (
  <Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Box>
        <Skeleton variant="text" width={200} height={36} />
        <Skeleton variant="text" width={280} height={20} sx={{ mt: 0.5 }} />
      </Box>
      <Skeleton variant="rounded" width={160} height={32} sx={{ borderRadius: 2 }} />
    </Box>
    <Grid container spacing={2} mb={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  </Box>
);

type DashboardData = DashboardStats | TeacherDashboard | StudentDashboard | Record<string, never>;

export const DashboardPage = () => {
  const { t: tDash } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData>({});
  const [error, setError] = useState('');

  const isAdmin = ['system_admin', 'school_director', 'academic_head', 'registrar'].includes(user?.role || '');
  const isTeacher = ['teacher'].includes(user?.role || '');
  const isStudent = user?.role === 'student';
  const isFinance = user?.role === 'finance_officer';
  const isCounselor = user?.role === 'counselor';
  const isLibrarian = user?.role === 'librarian';
  const isParent = user?.role === 'parent';

  const isDashboardStats = (d: DashboardData): d is DashboardStats =>
    d != null && 'recentStudents' in d && Array.isArray((d as DashboardStats).recentStudents);

  const dashboardStats = isDashboardStats(stats) ? stats : null;
  const safeRecentStudents = dashboardStats?.recentStudents || [];
  const safeEvents = dashboardStats?.events || [];

  useEffect(() => {
    if (isFinance) { navigate('/finance'); return; }
    if (isCounselor) { navigate('/counseling'); return; }
    if (isLibrarian) { navigate('/library'); return; }
    if (isParent) { navigate('/guardians'); return; }

    const fetchData = async () => {
      try {
        if (isAdmin) {
          const res = await dashboardAPI.stats();
          setStats(res.data.data || {});
        } else if (isTeacher) {
          const res = await dashboardAPI.teacher();
          setStats(res.data.data || {});
        } else if (isStudent) {
          const res = await dashboardAPI.student();
          setStats(res.data.data || {});
        } else {
          setStats({});
        }
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate, isAdmin, isTeacher, isStudent, isFinance, isCounselor, isLibrarian, isParent]);

  if (loading) return <DashboardSkeleton />;

  const getAY = () => { const n = new Date(); return n.getMonth() + 1 >= 9 ? `${n.getFullYear()}/${n.getFullYear() + 1}` : `${n.getFullYear() - 1}/${n.getFullYear()}`; };

  const rawAttendance = (dashboardStats as any)?.weeklyAttendance;
  const attendanceData = (Array.isArray(rawAttendance) && rawAttendance.length > 0)
    ? rawAttendance
    : [
        { month: 'Mon', rate: dashboardStats?.attendanceRate || 85 },
        { month: 'Tue', rate: dashboardStats?.attendanceRate || 88 },
        { month: 'Wed', rate: dashboardStats?.attendanceRate || 92 },
        { month: 'Thu', rate: dashboardStats?.attendanceRate || 87 },
        { month: 'Fri', rate: dashboardStats?.attendanceRate || 90 },
      ];

  const rawPie = (dashboardStats as any)?.studentsByGrade;
  const fallbackPie = [
    { name: 'Grade 9', value: (dashboardStats as any)?.grade9 || 0 },
    { name: 'Grade 10', value: (dashboardStats as any)?.grade10 || 0 },
    { name: 'Grade 11', value: (dashboardStats as any)?.grade11 || 0 },
    { name: 'Grade 12', value: (dashboardStats as any)?.grade12 || 0 },
  ];
  const pieData = (Array.isArray(rawPie) && rawPie.length > 0) ? rawPie : fallbackPie;
  const hasPieData = pieData.some((p: any) => (p.value || 0) > 0);

  const quickActions = [
    { label: `${tCommon('create', { defaultValue: 'Create' })} Student`, icon: <PersonAdd />, color: '#1B4F8A', path: '/students/new' },
    { label: tDash('totalTeachers'), icon: <People />, color: '#2D7D3A', path: '/teachers' },
    { label: tDash('totalSections'), icon: <GroupWork />, color: '#C9920A', path: '/sections' },
    { label: `${tCommon('classrooms', { defaultValue: 'Classrooms' })}`, icon: <MeetingRoom />, color: '#0F766E', path: '/classrooms' },
    { label: tDash('attendanceRate'), icon: <HowToReg />, color: '#7C3AED', path: '/attendance' },
    { label: `${tCommon('create', { defaultValue: 'Create' })} Assessment`, icon: <Assessment />, color: '#B5251A', path: '/assessments/new' },
  ].filter(a => isAdmin || (!['/students/new', '/teachers', '/sections', '/classrooms'].includes(a.path)));

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={1}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ fontSize: '1.5rem', letterSpacing: '-0.025em', color: '#111827' }}
          >
            {tDash('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {tDash('welcome')}, <Box component="span" fontWeight={600} color="#111827">{user?.firstName}</Box>
            {' '}· {dateStr}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Chip
            icon={<Schedule sx={{ fontSize: 14 }} />}
            label={`${tCommon('academicYear')} ${dashboardStats?.academicYear || getAY()}`}
            sx={{
              borderRadius: 2,
              height: 30,
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: 'rgba(27,79,138,0.08)',
              color: '#1B4F8A',
              '& .MuiChip-icon': { color: '#1B4F8A' },
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {isAdmin && dashboardStats && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title={tDash('totalStudents')}
                value={dashboardStats.totalStudents || 0}
                icon={<School />}
                color="#1B4F8A"
                subtitle={tDash('activeStudents')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title={tDash('totalTeachers')}
                value={dashboardStats.totalTeachers || 0}
                icon={<People />}
                color="#2D7D3A"
                subtitle={tDash('activeStudents')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title={tDash('attendanceRate')}
                value={`${dashboardStats.attendanceRate || 0}%`}
                icon={<CheckCircle />}
                color="#C9920A"
                subtitle={tDash('averageGrade')}
                trend={dashboardStats.attendanceRate >= 90 ? 'up' : 'down'}
                trendLabel={dashboardStats.attendanceRate >= 90 ? '+2%' : '-1%'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title={`${tDash('pendingFees')} (ETB)`}
                value={(dashboardStats.pendingFees || 0).toLocaleString()}
                icon={<AttachMoney />}
                color="#B5251A"
                subtitle={tDash('feeCollection')}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(229,231,235,0.6)',
                  height: '100%',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
                      {tDash('recentEnrollments')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tDash('recentEnrollments')}
                    </Typography>
                  </Box>
                  <Chip
                    label={tCommon('viewAll', { defaultValue: 'View All' })}
                    size="small"
                    onClick={() => navigate('/students')}
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(27,79,138,0.1)' },
                    }}
                  />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{tCommon('name')}</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>{tCommon('grade')}</TableCell>
                        <TableCell>{tCommon('section')}</TableCell>
                        <TableCell align="right">{tCommon('status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!dashboardStats || safeRecentStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.muted' }}>
                            {tCommon('noData')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        safeRecentStudents.map((s) => (
                          <TableRow
                            key={s._id}
                            sx={{
                              '&:last-child td': { borderBottom: 0 },
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'rgba(27,79,138,0.03)' },
                            }}
                            onClick={() => navigate(`/students/${s._id}`)}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'rgba(27,79,138,0.12)',
                                    color: '#1B4F8A',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.firstName?.[0]}{s.lastName?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {s.firstName} {s.lastName}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace" fontSize="0.8rem">
                                {s.studentId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={s.grade || '-'}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {s.section?.name || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={s.status || tCommon('active')}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  bgcolor: s.status === 'Active' ? 'rgba(45,125,58,0.12)' : 'rgba(156,163,175,0.15)',
                                  color: s.status === 'Active' ? '#2D7D3A' : '#6B7280',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(229,231,235,0.6)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
                    {tDash('upcomingEvents')}
                  </Typography>
                  <Event sx={{ fontSize: 20, color: '#C9920A' }} />
                </Box>

                {!dashboardStats || safeEvents.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ flex: 1, py: 4 }}
                  >
                    <Event sx={{ fontSize: 40, color: 'text.muted', mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2" color="text.muted">
                      {tCommon('noData')}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1 }}>
                    {safeEvents.map((e: AppEvent, i: number) => (
                      <Box
                        key={e._id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          pb: i < safeEvents.length - 1 ? 2 : 0,
                          mb: i < safeEvents.length - 1 ? 2 : 0,
                          borderBottom: i < safeEvents.length - 1 ? '1px solid rgba(229,231,235,0.6)' : 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'rgba(201,146,10,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} sx={{ color: '#C9920A', lineHeight: 1.1 }}>
                            {new Date(e.startDate).getDate()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#C9920A', fontSize: '0.55rem', lineHeight: 1 }}>
                            {new Date(e.startDate).toLocaleDateString('en', { month: 'short' })}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {e.title}
                          </Typography>
                          {e.description && (
                            <Typography variant="caption" color="text.secondary" sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {e.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {dashboardStats && safeEvents.length > 0 && (
                  <Chip
                    label={`${tCommon('view')} ${tCommon('calendar')}`}
                    size="small"
                    onClick={() => navigate('/calendar')}
                    sx={{
                      mt: 2,
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(27,79,138,0.1)' },
                    }}
                  />
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(229,231,235,0.6)',
                  height: '100%',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
                  {tDash('quickStats')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {quickActions.map((action) => (
                    <QuickActionCard
                      key={action.label}
                      label={action.label}
                      icon={action.icon}
                      color={action.color}
                      onClick={() => navigate(action.path)}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(229,231,235,0.6)',
                  height: '100%',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
                  {tDash('attendanceOverview')}
                </Typography>
                <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B4F8A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#1B4F8A"
                      strokeWidth={2}
                      fill="url(#attendanceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </ChartErrorBoundary>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(229,231,235,0.6)',
                  height: '100%',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }} mb={2}>
                  {tDash('gradeWiseDistribution')}
                </Typography>
                <ChartErrorBoundary>
                {hasPieData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                ) : (
                <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 200 }}>
                  <Typography variant="body2" color="text.secondary">{tCommon('noData')}</Typography>
                </Box>
                )}
                </ChartErrorBoundary>
                <Box display="flex" justifyContent="center" gap={2} mt={1}>
                  {pieData.map((entry, index) => (
                    <Box key={entry.name} display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: COLORS_PIE[index % COLORS_PIE.length] }} />
                      <Typography variant="caption" color="text.secondary">{entry.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box mt={3}>
            <AnnouncementWidget limit={4} showCreate />
          </Box>
        </>
      )}

      {isTeacher && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title={tDash('totalSections')} value={(stats as TeacherDashboard).classes || 0} icon={<School />} color="#1B4F8A" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title={tDash('totalStudents')} value={(stats as TeacherDashboard).students || 0} icon={<People />} color="#2D7D3A" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title={tCommon('subject', { defaultValue: 'Assessments' })} value={(stats as TeacherDashboard).assessments || 0} icon={<Assessment />} color="#C9920A" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title={tDash('attendanceRate')} value="—" icon={<CheckCircle />} color="#0F766E" />
          </Grid>
        </Grid>
      )}

      {isStudent && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title={`${tCommon('term1')} GPA`} value={(stats as StudentDashboard).term1?.gpa || 0} icon={<Star />} color="#C9920A" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title={`${tCommon('term2')} GPA`} value={(stats as StudentDashboard).term2?.gpa || 0} icon={<Star />} color="#2D7D3A" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title={tDash('averageGrade')} value={
                (stats as StudentDashboard).term1?.overallAverage && (stats as StudentDashboard).term2?.overallAverage
                  ? `${Math.round(((stats as StudentDashboard).term1!.overallAverage + (stats as StudentDashboard).term2!.overallAverage) / 2 * 10) / 10}%`
                  : (stats as StudentDashboard).term1?.overallAverage
                    ? `${(stats as StudentDashboard).term1!.overallAverage}%`
                    : (stats as StudentDashboard).term2?.overallAverage
                      ? `${(stats as StudentDashboard).term2!.overallAverage}%`
                      : '—'
              } icon={<Assessment />} color="#1B4F8A" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title={tDash('attendanceRate')} value={`${(stats as StudentDashboard).attendanceRate || 0}%`} icon={<CheckCircle />} color="#1B4F8A" />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            {(['term1', 'term2'] as const).map((termKey) => {
              const termData = (stats as StudentDashboard)[termKey] as TermPerformance | undefined;
              const termLabel = termKey === 'term1' ? tCommon('term1') : tCommon('term2');
              return (
                <Grid item xs={12} md={6} key={termKey}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827' }}>
                        {termLabel} — {tCommon('subject', { defaultValue: 'Subject' })} {tCommon('average', { defaultValue: 'Averages' })}
                      </Typography>
                      <Chip
                        label={`${tCommon('average')}: ${termData?.overallAverage ?? '-'}`}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A' }}
                      />
                    </Box>

                    {termData?.subjects && termData.subjects.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>{tCommon('subject')}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>{tCommon('average')}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>{tCommon('grade')}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>GPA</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {termData.subjects.map((s) => (
                              <TableRow key={s.subject._id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{s.subject.name}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600}>{s.average}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={s.letterGrade}
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                      minWidth: 28,
                                      bgcolor: s.letterGrade === 'A' ? 'rgba(45,125,58,0.15)' :
                                               s.letterGrade === 'B' ? 'rgba(27,79,138,0.15)' :
                                               s.letterGrade === 'C' ? 'rgba(201,146,10,0.15)' :
                                               s.letterGrade === 'D' ? 'rgba(181,37,26,0.15)' :
                                               'rgba(107,114,128,0.15)',
                                      color: s.letterGrade === 'A' ? '#2D7D3A' :
                                             s.letterGrade === 'B' ? '#1B4F8A' :
                                             s.letterGrade === 'C' ? '#C9920A' :
                                             s.letterGrade === 'D' ? '#B5251A' :
                                             '#6B7280',
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary">{s.gpa.toFixed(1)}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ '& td': { borderBottom: 0, pt: 1 } }}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{tCommon('total', { defaultValue: 'Overall' })}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700}>{termData.overallAverage}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={termData.overallAverage >= 90 ? 'A' : termData.overallAverage >= 80 ? 'B' : termData.overallAverage >= 70 ? 'C' : termData.overallAverage >= 60 ? 'D' : 'F'}
                                  size="small"
                                  sx={{ fontWeight: 700, fontSize: '0.7rem', minWidth: 28 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700}>{termData.gpa.toFixed(1)}</Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.muted">{tCommon('noData')}</Typography>
                      </Box>
                    )}

                    {termData?.ranking && (
                      <Box mt={2} pt={2} sx={{ borderTop: '1px solid rgba(229,231,235,0.6)' }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
                          {tCommon('rank', { defaultValue: 'Rankings' })}
                        </Typography>
                        <Grid container spacing={1}>
                          {[
                            { label: tCommon('section'), value: termData.ranking.sectionRank, total: termData.ranking.totalStudentsInSection },
                            { label: tCommon('grade'), value: termData.ranking.gradeRank, total: termData.ranking.totalStudentsInGrade },
                            ...(termData.ranking.streamRank != null ? [{ label: tDash('streamDistribution'), value: termData.ranking.streamRank, total: termData.ranking.totalStudentsInStream }] : []),
                            { label: tCommon('dashboard', { defaultValue: 'School' }), value: termData.ranking.schoolRank, total: termData.ranking.totalStudentsInSchool },
                          ].map((r) => (
                            <Grid item xs={6} sm={3} key={r.label}>
                              <Box sx={{ textAlign: 'center', p: 0.75, borderRadius: 1.5, bgcolor: 'rgba(27,79,138,0.04)' }}>
                                <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {r.value != null ? `#${r.value}` : '-'}
                                </Typography>
                                <Typography variant="caption" color="text.muted">
                                  {tCommon('pagination.of')} {r.total ?? '-'}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        {termData.ranking.meritCategory && (
                          <Box mt={0.75} display="flex" justifyContent="center">
                            <Chip
                              label={termData.ranking.meritCategory}
                              size="small"
                              sx={{
                                fontWeight: 600, fontSize: '0.65rem',
                                bgcolor: termData.ranking.meritCategory === 'Academic Excellence' ? 'rgba(45,125,58,0.12)' :
                                        termData.ranking.meritCategory === 'Honor Student' ? 'rgba(27,79,138,0.12)' :
                                        'rgba(201,146,10,0.12)',
                                color: termData.ranking.meritCategory === 'Academic Excellence' ? '#2D7D3A' :
                                       termData.ranking.meritCategory === 'Honor Student' ? '#1B4F8A' :
                                       '#C9920A',
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title={tDash('libraryStats')} value={(stats as StudentDashboard).booksBorrowed || 0} icon={<MenuBook />} color="#7C3AED" subtitle={tCommon('library', { defaultValue: 'Library books checked out' })} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
