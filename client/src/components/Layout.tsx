import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { communicationAPI, messagesAPI } from '../services/api';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Person,
  Assessment,
  EventNote,
  AccountBalance,
  LocalLibrary,
  ExitToApp,
  Settings,
  Notifications,
  NotificationsActive,
  ForwardToInbox,
  AccountCircle,
  GroupWork,
  EmojiEvents,
  Description,
  CalendarMonth,
  SupervisorAccount,
  Grade,
  CalendarToday,
  People,
  MeetingRoom,
  Subject as SubjectIcon,
  HealthAndSafety,
  Gavel,
  Psychology,
  History,
  LockReset,
  Schedule,
  Assignment as AssignmentIcon,
  TrendingUp,
  Book,
  Group,
  GroupAdd,
  Search,
  Campaign,
  SwapHoriz,
  LocalShipping,
  Inventory2,
  DateRange,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
const ministryLogo = 'https://yt3.googleusercontent.com/ytc/AIdro_nLKvPCsGBM-CfxMzpFwyXLtO8DWdcnJ67EIRMh_MVxRQ=s200-c-k-c0x00ffffff-no-rj';

const drawerWidth = 280;

interface NavChild {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles: string[];
}

interface NavGroup {
  label: string;
  icon: React.ReactElement;
  roles: string[];
  children: NavChild[];
}

const navLabel = (text: string): string => {
  const map: Record<string, string> = {
    Dashboard: 'dashboard', Students: 'students', 'Adv. Search': 'advancedSearch',
    'Bulk Promote': 'bulkPromote', Teachers: 'teachers', Assessments: 'assessments',
    Attendance: 'attendance', Finance: 'finance', Library: 'library',
    Announcements: 'announcements', 'Notification Center': 'notificationCenter',
    Messages: 'messages', Settings: 'settings', Timetable: 'timetable',
    Sections: 'sections', Subjects: 'subjects', Rankings: 'rankings',
    'Report Cards': 'reportCards', Calendar: 'calendar', Communications: 'communications',
    'Parent Portal': 'parentPortal', Users: 'users', 'Audit Logs': 'auditLogs',
    'Transfer Logs': 'transferLogs', 'Student Dashboard': 'studentDashboard',
    Notifications: 'notifications', 'My Sections': 'mySections', 'My Marks': 'myMarks',
    'My Reports': 'myReports', 'My Studies': 'myStudies', 'My Profile': 'myProfile',
    'My Attendance': 'myAttendance', 'My Timetable': 'myTimetable', 'My Grades': 'myGrades',
    Classrooms: 'classrooms', Counseling: 'counseling', Discipline: 'discipline',
    Health: 'health', Transport: 'transport', Inventory: 'inventory',
    'Academic Terms': 'academicTerms', 'Password Manager': 'passwordManager',
    Alumni: 'alumni', 'Assignment Dashboard': 'assignmentDashboard',
    'Unassigned Students': 'unassignedStudents', 'Teacher Batch Assign': 'teacherBatchAssign',
    'Section Overview': 'sectionOverview', 'Assignment Reports': 'assignmentReports',
    'Section Assign': 'sectionAssign', 'Section Marks': 'sectionMarks',
    'Teacher Assignments': 'teacherAssignments', 'Attendance Dashboard': 'attendanceDashboard',
    'Attendance Reports': 'attendanceReports', 'Attendance Corrections': 'attendanceCorrections',
    'Fee Structure': 'feeStructure', Payments: 'payments', 'Finance Reports': 'financeReports',
    Borrowing: 'borrowing', 'Section Dashboard': 'sectionDashboard',
    'Section Reports': 'sectionReports', 'Section Analytics': 'sectionAnalytics',
    'Admin Panel': 'adminPanel', 'My Teaching': 'myTeaching',
    'Roster Dashboard': 'rosterDashboard', 'Semester Roster': 'semesterRoster', 'Annual Roster': 'annualRoster', 'Class Roster': 'classRoster', 'Mark Entry': 'markEntry', 'Student Promotions': 'studentPromotions',
    'Year Transition': 'yearTransition', 'My Results': 'myResults',
    'Bulk Assign Students': 'bulkAssignStudents', 'Assignment History': 'assignmentHistory',
    'Health Records': 'healthRecords', Passwords: 'passwords',
    rosters: 'rosters', assignments: 'assignments', schedules: 'schedules',
    studentWellness: 'studentWellness', operations: 'operations', admin: 'admin',
    myStudent: 'myStudent',
  };
  return map[text] || text;
};

const ALL_ADMIN_ROLES = ['system_admin', 'school_director', 'academic_head', 'registrar', 'finance_officer', 'teacher', 'counselor', 'librarian', 'student', 'parent'];

const navigationGroups: NavGroup[] = [
  {
    label: 'myTeaching',
    icon: <School />,
    roles: ['teacher'],
    children: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/my-teacher/dashboard', roles: ['teacher'] },
      { text: 'My Timetable', icon: <Schedule />, path: '/my-teacher/timetable', roles: ['teacher'] },
      { text: 'My Sections', icon: <Group />, path: '/my-teacher/sections', roles: ['teacher'] },
      { text: 'My Marks', icon: <AssignmentIcon />, path: '/my-teacher/marks', roles: ['teacher'] },
      { text: 'My Reports', icon: <TrendingUp />, path: '/my-teacher/reports', roles: ['teacher'] },
    ],
  },
  {
    label: 'myStudent',
    icon: <School />,
    roles: ['student'],
    children: [
      { text: 'My Studies', icon: <School />, path: '/my-dashboard', roles: ['student'] },
      { text: 'My Profile', icon: <Person />, path: '/my-profile', roles: ['student'] },
      { text: 'My Attendance', icon: <EventNote />, path: '/my-attendance', roles: ['student'] },
      { text: 'My Timetable', icon: <CalendarToday />, path: '/my-timetable', roles: ['student'] },
      { text: 'My Grades', icon: <Grade />, path: '/my-grades', roles: ['student'] },
      { text: 'My Results', icon: <AssignmentIcon />, path: '/rosters/my-results', roles: ['student'] },
    ],
  },
  {
    label: 'students',
    icon: <School />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor'],
    children: [
      { text: 'Students', icon: <School />, path: '/students', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor'] },
      { text: 'Adv. Search', icon: <Search />, path: '/students/advanced-search', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor'] },
      { text: 'Bulk Promote', icon: <TrendingUp />, path: '/students/bulk-promote', roles: ['system_admin', 'academic_head'] },
    ],
  },
  {
    label: 'teachers',
    icon: <Person />,
    roles: ['system_admin', 'school_director'],
    children: [
      { text: 'Teachers', icon: <Person />, path: '/teachers', roles: ['system_admin', 'school_director'] },
    ],
  },
  {
    label: 'assessments',
    icon: <Assessment />,
    roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'],
    children: [
      { text: 'Assessments', icon: <Assessment />, path: '/assessments', roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'] },
      { text: 'Rankings', icon: <EmojiEvents />, path: '/rankings', roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'] },
    ],
  },
  {
    label: 'attendance',
    icon: <EventNote />,
    roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'],
    children: [
      { text: 'Attendance', icon: <EventNote />, path: '/attendance', roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'student', 'parent'] },
    ],
  },
  {
    label: 'finance',
    icon: <AccountBalance />,
    roles: ['system_admin', 'school_director', 'finance_officer', 'student', 'parent'],
    children: [
      { text: 'Fee Structure', icon: <AccountBalance />, path: '/finance', roles: ['system_admin', 'school_director', 'finance_officer', 'student', 'parent'] },
      { text: 'Payments', icon: <AccountBalance />, path: '/finance/payments', roles: ['system_admin', 'school_director', 'finance_officer'] },
      { text: 'Finance Reports', icon: <Description />, path: '/finance/reports', roles: ['system_admin', 'school_director', 'finance_officer'] },
    ],
  },
  {
    label: 'library',
    icon: <LocalLibrary />,
    roles: ['system_admin', 'school_director', 'librarian', 'teacher', 'student'],
    children: [
      { text: 'Library', icon: <LocalLibrary />, path: '/library', roles: ['system_admin', 'school_director', 'librarian', 'teacher', 'student'] },
      { text: 'Borrowing', icon: <LocalLibrary />, path: '/library/borrowing', roles: ['system_admin', 'school_director', 'librarian', 'teacher', 'student'] },
    ],
  },
  {
    label: 'communications',
    icon: <Campaign />,
    roles: ALL_ADMIN_ROLES,
    children: [
      { text: 'Announcements', icon: <Campaign />, path: '/announcements', roles: ALL_ADMIN_ROLES },
      { text: 'Notification Center', icon: <NotificationsActive />, path: '/communications/notifications', roles: ALL_ADMIN_ROLES },
      { text: 'Messages', icon: <ForwardToInbox />, path: '/messages', roles: ['system_admin', 'school_director', 'academic_head', 'teacher', 'counselor', 'student', 'parent'] },
    ],
  },
  {
    label: 'sections',
    icon: <GroupWork />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar'],
    children: [
      { text: 'Section Dashboard', icon: <Dashboard />, path: '/sections/dashboard', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
      { text: 'Sections', icon: <GroupWork />, path: '/sections', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
    ],
  },
  {
    label: 'rosters',
    icon: <Description />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent'],
    children: [
      { text: 'Roster Dashboard', icon: <Dashboard />, path: '/rosters/dashboard', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
      { text: 'Semester Roster', icon: <AssignmentIcon />, path: '/rosters/semester', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Annual Roster', icon: <EmojiEvents />, path: '/rosters/annual', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
      { text: 'Class Roster', icon: <People />, path: '/rosters/class-roster', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Mark Entry', icon: <AssignmentIcon />, path: '/rosters/marks', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Student Promotions', icon: <TrendingUp />, path: '/rosters/promote', roles: ['system_admin', 'academic_head'] },
      { text: 'Report Cards', icon: <Description />, path: '/rosters/report-card', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent'] },
      { text: 'Year Transition', icon: <TrendingUp />, path: '/rosters/transition', roles: ['system_admin', 'academic_head'] },
    ],
  },
  {
    label: 'assignments',
    icon: <AssignmentIcon />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'],
    children: [
      { text: 'Assign. Dashboard', icon: <Dashboard />, path: '/assignments/dashboard', roles: ['system_admin', 'school_director', 'academic_head'] },
      { text: 'Unassigned Students', icon: <School />, path: '/assignments/students/unassigned', roles: ['system_admin', 'academic_head', 'registrar'] },
      { text: 'Batch Assign', icon: <Group />, path: '/assignments/teachers/batch', roles: ['system_admin', 'academic_head'] },
      { text: 'Section Overview', icon: <GroupWork />, path: '/assignments/sections', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Section Assign', icon: <GroupWork />, path: '/assignments/section-assign', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Section Marks', icon: <AssignmentIcon />, path: '/assignments/section-marks', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher'] },
      { text: 'Teacher Assignments', icon: <Person />, path: '/assignments/teacher-assignments', roles: ['system_admin', 'school_director', 'academic_head'] },
      { text: 'Bulk Assign Students', icon: <GroupAdd />, path: '/assignments/students/bulk-assign', roles: ['system_admin', 'academic_head', 'registrar'] },
      { text: 'Assign. Reports', icon: <Assessment />, path: '/assignments/reports', roles: ['system_admin', 'school_director', 'academic_head'] },
      { text: 'Assignment History', icon: <History />, path: '/assignments/history', roles: ['system_admin', 'school_director', 'academic_head'] },
    ],
  },
  {
    label: 'schedules',
    icon: <CalendarToday />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor', 'student', 'parent'],
    children: [
      { text: 'Timetable', icon: <CalendarToday />, path: '/timetable', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'counselor', 'student', 'parent'] },
      { text: 'Subjects', icon: <SubjectIcon />, path: '/subjects', roles: ['system_admin', 'school_director', 'academic_head', 'registrar', 'teacher', 'student', 'parent'] },
      { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar', roles: ALL_ADMIN_ROLES },
    ],
  },
  {
    label: 'classrooms',
    icon: <MeetingRoom />,
    roles: ['system_admin', 'school_director', 'academic_head', 'registrar'],
    children: [
      { text: 'Classrooms', icon: <MeetingRoom />, path: '/classrooms', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
    ],
  },
  {
    label: 'studentWellness',
    icon: <HealthAndSafety />,
    roles: ['system_admin', 'school_director', 'academic_head', 'counselor'],
    children: [
      { text: 'Counseling', icon: <Psychology />, path: '/counseling', roles: ['system_admin', 'school_director', 'academic_head', 'counselor'] },
      { text: 'Discipline', icon: <Gavel />, path: '/discipline', roles: ['system_admin', 'school_director', 'academic_head', 'counselor'] },
      { text: 'Health Records', icon: <HealthAndSafety />, path: '/health', roles: ['system_admin', 'school_director', 'academic_head', 'counselor'] },
    ],
  },
  {
    label: 'operations',
    icon: <LocalShipping />,
    roles: ['system_admin', 'school_director'],
    children: [
      { text: 'Transport', icon: <LocalShipping />, path: '/transport', roles: ['system_admin', 'school_director'] },
      { text: 'Inventory', icon: <Inventory2 />, path: '/inventory', roles: ['system_admin', 'school_director'] },
      { text: 'Alumni', icon: <School />, path: '/alumni', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
    ],
  },
  {
    label: 'admin',
    icon: <Settings />,
    roles: ['system_admin'],
    children: [
      { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['system_admin'] },
      { text: 'Users', icon: <People />, path: '/users', roles: ['system_admin'] },
      { text: 'Passwords', icon: <LockReset />, path: '/users/passwords', roles: ['system_admin'] },
      { text: 'Academic Terms', icon: <DateRange />, path: '/academic-terms', roles: ['system_admin'] },
      { text: 'Audit Logs', icon: <History />, path: '/audit-logs', roles: ['system_admin', 'school_director'] },
      { text: 'Transfer Logs', icon: <SwapHoriz />, path: '/transfer-logs', roles: ['system_admin', 'school_director', 'academic_head', 'registrar'] },
    ],
  },
  {
    label: 'parentPortal',
    icon: <SupervisorAccount />,
    roles: ['parent'],
    children: [
      { text: 'My Children', icon: <SupervisorAccount />, path: '/guardians', roles: ['parent'] },
    ],
  },
];

export const Layout: React.FC = () => {
  const { t } = useTranslation('layout');
  const { t: tCommon } = useTranslation('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifUnread, setNotifUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const [notifRes, msgRes] = await Promise.allSettled([
          communicationAPI.notifications({ unread: 'true', limit: 1 }),
          messagesAPI.unreadCount(),
        ]);
        if (notifRes.status === 'fulfilled') {
          setNotifUnread((notifRes.value.data.data as any)?.unreadCount || 0);
        }
        if (msgRes.status === 'fulfilled') {
          setMsgUnread((msgRes.value.data.data as any)?.count || 0);
        }
      } catch { /* ignore */ }
    };

    fetchUnread();

    let socket: import('socket.io-client').Socket | null = null;
    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const token = localStorage.getItem('accessToken');
        const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5002';
        socket = io(API_BASE, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });
        socket.on('notification', () => setNotifUnread((c) => c + 1));
        socket.on('connect_error', () => { /* silent */ });
      } catch { /* socket unavailable, keep polling */ }
    };
    connectSocket();

    const interval = setInterval(fetchUnread, 30000);
    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate(user?.role === 'student' ? '/my-profile' : '/profile');
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      children: group.children.filter(item =>
        user?.role && item.roles.includes(user.role)
      ),
    }))
    .filter(group =>
      user?.role && group.roles.includes(user.role) && group.children.length > 0
    );

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; color: any }> = {
      system_admin: { label: t('systemAdmin', { defaultValue: 'System Admin' }), color: 'error' },
      school_director: { label: t('director', { defaultValue: 'Director' }), color: 'primary' },
      academic_head: { label: t('academicHead', { defaultValue: 'Academic Head' }), color: 'secondary' },
      registrar: { label: t('registrar', { defaultValue: 'Registrar' }), color: 'info' },
      finance_officer: { label: t('financeOfficer', { defaultValue: 'Finance Officer' }), color: 'warning' },
      teacher: { label: t('teacher', { defaultValue: 'Teacher' }), color: 'success' },
      counselor: { label: t('counselor', { defaultValue: 'Counselor' }), color: 'info' },
      librarian: { label: t('librarian', { defaultValue: 'Librarian' }), color: 'secondary' },
      student: { label: t('student', { defaultValue: 'Student' }), color: 'primary' },
      parent: { label: t('parent', { defaultValue: 'Parent' }), color: 'default' },
    };
    return roleMap[role] || { label: role, color: 'default' };
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }}>
        <Box display="flex" alignItems="center" width="100%" gap={1.5}>
          <img src={ministryLogo} alt="Ministry of Education" style={{ width: 36, height: 36 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: '0.6rem', lineHeight: 1.1 }}
            >
              {t('ministryOfEducation', { ns: 'common', defaultValue: 'ትምህርት ሚኒስቴር' })}
            </Typography>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                color: '#FFFFFF',
              }}
            >
              ESSMS
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: '0.65rem' }}
            >
              {t('schoolManagement', { ns: 'common', defaultValue: 'School Management' })}
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

      {user && (
        <Box sx={{ px: 2, py: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#1B4F8A',
                fontSize: '0.875rem',
                fontWeight: 700,
                boxShadow: '0 0 12px rgba(59,130,246,0.3)',
                border: '2px solid rgba(59,130,246,0.2)',
              }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3 }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}
              >
                ID: {user.userId}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getRoleDisplay(user.role).label}
            size="small"
            sx={{
              bgcolor: 'rgba(27,79,138,0.4)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>
      )}

      <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => { navigate('/dashboard'); if (isMobile) setMobileOpen(false); }}
            sx={{
              mx: 1.5, my: 0.5, borderRadius: 2, py: 1.2,
              '&.Mui-selected': { bgcolor: 'rgba(27,79,138,0.35)', '&:hover': { bgcolor: 'rgba(27,79,138,0.45)' }, '& .MuiListItemIcon-root': { color: '#FFFFFF' }, '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 600 } },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.9)' }, '& .MuiListItemText-primary': { color: '#FFFFFF' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: location.pathname === '/dashboard' ? '#FFFFFF' : 'rgba(255,255,255,0.5)', '& .MuiSvgIcon-root': { fontSize: 20 } }}>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary={t(navLabel('Dashboard'))} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: location.pathname === '/dashboard' ? 600 : 400, sx: { color: location.pathname === '/dashboard' ? '#FFFFFF' : 'rgba(255,255,255,0.7)' } }} />
          </ListItemButton>
        </ListItem>

        {filteredGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? group.children.some(child =>
            location.pathname.startsWith(child.path) && (child.path === '/' || location.pathname === child.path || location.pathname.startsWith(child.path + '/'))
          );
          const hasActiveChild = group.children.some(child =>
            location.pathname === child.path || location.pathname.startsWith(child.path + '/')
          );
          return (
            <React.Fragment key={group.label}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={() => toggleGroup(group.label)}
                  sx={{
                    mx: 1.5, my: 0.5, borderRadius: 2, py: 1.2,
                    bgcolor: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.9)' }, '& .MuiListItemText-primary': { color: '#FFFFFF' } },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: isOpen || hasActiveChild ? '#FFFFFF' : 'rgba(255,255,255,0.5)', '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText primary={t(navLabel(group.label))} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isOpen || hasActiveChild ? 600 : 400, sx: { color: isOpen || hasActiveChild ? '#FFFFFF' : 'rgba(255,255,255,0.7)' } }} />
                  {isOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />}
                </ListItemButton>
              </ListItem>

              {isOpen && group.children.map((child) => {
                const isActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                return (
                  <ListItem key={child.text} disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => { navigate(child.path); if (isMobile) setMobileOpen(false); }}
                      sx={{
                        mx: 1.5, my: 0.25, borderRadius: 2, py: 1, pl: 5,
                        '&.Mui-selected': { bgcolor: 'rgba(27,79,138,0.35)', '&:hover': { bgcolor: 'rgba(27,79,138,0.45)' }, '& .MuiListItemIcon-root': { color: '#FFFFFF' }, '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 600 } },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.9)' }, '& .MuiListItemText-primary': { color: '#FFFFFF' } },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)', '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText primary={t(navLabel(child.text))} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 400, sx: { color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)' } }} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </React.Fragment>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.25)', display: 'block', textAlign: 'center', fontSize: '0.6rem' }}
        >
          ESSMS v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F9FC' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%)',
          color: '#111827',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          borderBottom: '1px solid #E5E7EB',
          backdropFilter: 'blur(20px)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <img src={ministryLogo} alt="MoE" style={{ width: 28, height: 28, opacity: 0.7 }} />
              <Typography
                variant="body1"
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#111827',
                }}
              >
                {t('appTitle', { ns: 'common' })} — {t('appSubtitle', { ns: 'common' })}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <LanguageSwitcher />
            <IconButton
              size="small"
              onClick={() => navigate('/messages')}
              sx={{ color: '#6B7280' }}
            >
              <Badge badgeContent={msgUnread} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}>
                <ForwardToInbox sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
            <IconButton
              size="small"
              onClick={() => navigate('/communications/notifications')}
              sx={{ color: '#6B7280' }}
            >
              <Badge badgeContent={notifUnread} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}>
                <Notifications sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>

            <IconButton
              size="small"
              aria-label="account"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ color: '#6B7280' }}
            >
              <AccountCircle sx={{ fontSize: 26 }} />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(27,79,138,0.15)',
                  mt: 1,
                  minWidth: 180,
                },
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}>
                <Settings sx={{ mr: 1.5, fontSize: 20, color: '#6B7280' }} />
                {t('profile')}
              </MenuItem>
              <Divider sx={{ mx: 1, borderColor: '#F3F4F6' }} />
              <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}>
                <ExitToApp sx={{ mr: 1.5, fontSize: 20, color: '#B5251A' }} />
                <Typography color="error">{t('logout', { ns: 'auth' })}</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#0F172A',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#0F172A',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          minHeight: '100vh',
          bgcolor: '#F8F9FC',
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(27,79,138,0.02) 0%, transparent 50%)',
          transition: 'padding 0.2s ease',
        }}
      >
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </Box>
    </Box>
  );
};
