import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Chip, Divider, IconButton, Paper,
  Tabs, Tab, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, FormControl, InputLabel, FormControlLabel,
  Switch, Grid, Tooltip, Badge, TablePagination,
} from '@mui/material';
import {
  Notifications, NotificationsNone, CheckCircle, School,
  AttachMoney, HowToReg, Warning, Info, DoneAll, EmailOutlined,
  SmsOutlined, ReportProblem, Send, FilterList, Refresh,
  ErrorOutline, AccessTime, Delete, DeleteSweep, People,
} from '@mui/icons-material';
import { communicationAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const typeIcon: Record<string, ReactNode> = {
  'Attendance Alert': <HowToReg color="info" />,
  'Grade Published': <School color="primary" />,
  'Fee Reminder': <AttachMoney color="warning" />,
  'Examination Scheduled': <School color="secondary" />,
  Announcement: <Notifications color="secondary" />,
  Message: <EmailOutlined color="info" />,
  'System Alert': <ErrorOutline color="error" />,
  Academic: <School color="primary" />,
  Financial: <AttachMoney color="warning" />,
  Attendance: <HowToReg color="info" />,
  Disciplinary: <Warning color="error" />,
  System: <Info />,
  General: <NotificationsNone />,
};

const priorityColor: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  Critical: 'error', High: 'warning', Medium: 'info', Low: 'default',
};

const channelIcon: Record<string, ReactNode> = {
  'In-App': <Notifications fontSize="small" />,
  'Email': <EmailOutlined fontSize="small" />,
  'SMS': <SmsOutlined fontSize="small" />,
};

const NOTIFICATION_TYPES = ['', 'General', 'Academic', 'Financial', 'Attendance', 'Disciplinary', 'System', 'Announcement'];

type TabValue = 'in-app' | 'sms' | 'email' | 'emergency';

export const NotificationCenterPage = () => {
  const { t: tComm } = useTranslation('communications');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>('in-app');
  const [filterUnread, setFilterUnread] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sendDialog, setSendDialog] = useState(false);
  const [sendForm, setSendForm] = useState({
    title: '', message: '', type: 'General',
    priority: 'Medium', isEmergency: false,
    recipientType: 'self' as 'self' | 'role' | 'all',
    recipientRole: 'student' as string,
  });
  const [sending, setSending] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const canSend = user?.role && ['system_admin', 'school_director', 'academic_head', 'finance_officer'].includes(user.role);

  const buildParams = useCallback(() => {
    const params: any = { limit: rowsPerPage, page: page + 1 };
    if (filterUnread) params.unread = 'true';
    if (typeFilter) params.type = typeFilter;
    if (tab === 'sms') params.channel = 'SMS';
    else if (tab === 'email') params.channel = 'Email';
    else if (tab === 'emergency') params.priority = 'Critical';
    return params;
  }, [tab, filterUnread, typeFilter, page, rowsPerPage]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communicationAPI.notifications(buildParams());
      let items = res.data.data?.notifications || [];
      const totalUnread = res.data.data?.unreadCount || 0;
      const total = res.data.data?.pagination?.total || 0;

      if (tab === 'emergency') {
        items = items.filter((n: any) => n.priority === 'Critical' || n.priority === 'High');
      }

      setNotifications(items);
      setUnreadCount(totalUnread);
      setTotalCount(total);
    } catch (err: any) {
      showError(err?.response?.data?.message || tComm('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [buildParams, tab, showError]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => { setPage(0); }, [tab, filterUnread, typeFilter]);

  const markRead = async (id: string) => {
    try {
      await communicationAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      showError(err?.response?.data?.message || tComm('failedToMarkRead'));
    }
  };

  const markAllRead = async () => {
    try {
      await communicationAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess(tComm('allRead'));
    } catch (err: any) {
      showError(err?.response?.data?.message || tComm('failedToMarkAllRead'));
    }
  };

  const handleDeleteNotification = async () => {
    if (!deleteDialog) return;
    try {
      await communicationAPI.deleteNotification(deleteDialog);
      setNotifications(prev => prev.filter(n => n._id !== deleteDialog));
      showSuccess(tComm('notificationDeleted'));
      setDeleteDialog(null);
    } catch (err: any) {
      showError(err?.response?.data?.message || tComm('failedToDelete'));
    }
  };

  const handleSendNotification = async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      showError(tComm('titleAndMessageRequired'));
      return;
    }
    setSending(true);
    try {
      const payload: any = {
        title: sendForm.title,
        message: sendForm.message,
        type: sendForm.isEmergency ? 'System' : sendForm.type,
        priority: sendForm.isEmergency ? 'Critical' : sendForm.priority,
      };
      if (sendForm.recipientType === 'all') {
        const roles = ['student', 'teacher', 'parent',
          'system_admin', 'school_director', 'academic_head', 'registrar',
          'finance_officer', 'counselor', 'librarian'];
        let totalSent = 0;
        for (const role of roles) {
          try {
            const r = await communicationAPI.sendNotification({ ...payload, recipientRole: role });
            totalSent += r.data.data?.recipientCount || 0;
          } catch { /* skip roles with no users */ }
        }
        showSuccess(tComm('sentToAllRoles', { count: totalSent }));
      } else if (sendForm.recipientType === 'role') {
        payload.recipientRole = sendForm.recipientRole;
        const res = await communicationAPI.sendNotification(payload);
        showSuccess(tComm('sentToRole', { count: res.data.data?.recipientCount || 0 }));
      } else {
        payload.recipientId = user?.id;
        await communicationAPI.sendNotification(payload);
        showSuccess(tComm('sentToSelf'));
      }
      setSendDialog(false);
      setSendForm({
        title: '', message: '', type: 'General',
        priority: 'Medium', isEmergency: false,
        recipientType: 'self', recipientRole: 'student',
      });
      fetchNotifications();
    } catch (err: any) {
      showError(err.response?.data?.message || tComm('failedToSend'));
    } finally {
      setSending(false);
    }
  };

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>{tComm('pageTitle')}</Typography>
        <Box display="flex" gap={1}>
          {canSend && (
            <Button variant="contained" startIcon={<Send />} onClick={() => setSendDialog(true)}>
              {tComm('sendNotification')}
            </Button>
          )}
          <Tooltip title={tComm('refresh')}>
            <IconButton onClick={fetchNotifications}><Refresh /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v as TabValue)} variant="fullWidth">
          <Tab
            value="in-app"
            icon={<Badge badgeContent={filterUnread ? 0 : unreadCount} color="error" max={99}><Notifications /></Badge>}
            label={tComm('inApp')}
            sx={{ minHeight: 64 }}
          />
          <Tab value="sms" icon={<SmsOutlined />} label="SMS" sx={{ minHeight: 64 }} />
          <Tab value="email" icon={<EmailOutlined />} label={tComm('email')} sx={{ minHeight: 64 }} />
          <Tab
            value="emergency"
            icon={<ReportProblem />}
            label={tComm('emergency')}
            sx={{ minHeight: 64, '&.Mui-selected': { color: 'error.main' } }}
          />
        </Tabs>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Chip
            icon={<FilterList />}
            label={filterUnread ? tComm('unreadOnly') : tComm('all')}
            variant={filterUnread ? 'filled' : 'outlined'}
            color={filterUnread ? 'primary' : 'default'}
            onClick={() => setFilterUnread(!filterUnread)}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              displayEmpty
              renderValue={(v) => v || tComm('allTypes')}
            >
              <MenuItem value="">{tComm('allTypes')}</MenuItem>
              {NOTIFICATION_TYPES.filter(Boolean).map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            {tComm('notificationCount', { count: totalCount })}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {tab === 'in-app' && unreadCount > 0 && (
            <Button startIcon={<DoneAll />} size="small" onClick={markAllRead}>
              {tComm('markAllRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button startIcon={<DeleteSweep />} size="small" color="error"
              onClick={async () => {
                for (const n of notifications) {
                  try { await communicationAPI.deleteNotification(n._id); } catch { /* skip */ }
                }
                setNotifications([]);
                setUnreadCount(0);
                showSuccess(tComm('allCleared'));
              }}>
              {tComm('clearAll')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" py={6} color="text.secondary">
            {tab === 'in-app' && <NotificationsNone sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />}
            {tab === 'sms' && <SmsOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />}
            {tab === 'email' && <EmailOutlined sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />}
            {tab === 'emergency' && <ReportProblem sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />}
            <Typography>
              {filterUnread ? tComm('noUnreadPrefix') : tComm('noPrefix')}
              {tab === 'emergency' ? tComm('emergencyAlerts') : tComm('tabNotifications', { tab })}
            </Typography>
          </Box>
        ) : (
          <>
            <List disablePadding>
              {notifications.map((n: any, i: number) => (
                <Box key={n._id}>
                  <ListItem
                    sx={{
                      bgcolor: n.isRead ? 'transparent' : 'action.hover',
                      borderLeft: tab === 'emergency' || n.priority === 'Critical'
                        ? '3px solid #ef4444'
                        : n.priority === 'High'
                          ? '3px solid #f59e0b'
                          : '3px solid transparent',
                      px: 3, py: 1.5,
                    }}
                    secondaryAction={
                      <Box display="flex" gap={0.5}>
                        {!n.isRead && tab === 'in-app' && (
                          <Tooltip title={tComm('markAsRead')}>
                            <IconButton size="small" onClick={() => markRead(n._id)}>
                              <CheckCircle fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={tComm('delete')}>
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog(n._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {typeIcon[n.type] || <Info />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>
                            {n.title}
                          </Typography>
                          <Chip label={n.priority} size="small"
                            color={priorityColor[n.priority] || 'default'}
                            sx={{ height: 16, fontSize: '0.65rem' }} />
                          {n.channels?.map((ch: string) => (
                            <Chip key={ch} icon={channelIcon[ch]} label={ch}
                              size="small" variant="outlined"
                              sx={{ height: 16, fontSize: '0.6rem' }} />
                          ))}
                          {!n.isRead && <Box width={8} height={8} borderRadius="50%" bgcolor="primary.main" />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {n.message}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {i < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </Paper>

      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tComm('sendNotification')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField fullWidth label={`${tComm('title')} *`} value={sendForm.title}
                onChange={e => setSendForm({ ...sendForm, title: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={`${tComm('message')} *`} multiline rows={3} value={sendForm.message}
                onChange={e => setSendForm({ ...sendForm, message: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('recipient')}</InputLabel>
                <Select value={sendForm.recipientType} label={tComm('recipient')}
                  onChange={e => setSendForm({ ...sendForm, recipientType: e.target.value as 'self' | 'role' | 'all' })}>
                  <MenuItem value="self">{tComm('sendToSelf')}</MenuItem>
                  <MenuItem value="role">{tComm('sendByRole')}</MenuItem>
                  <MenuItem value="all"><Box display="flex" alignItems="center" gap={1}><People fontSize="small" /> {tComm('sendToAll')}</Box></MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {sendForm.recipientType === 'role' && (
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tComm('targetRole')}</InputLabel>
                  <Select value={sendForm.recipientRole} label={tComm('targetRole')}
                    onChange={e => setSendForm({ ...sendForm, recipientRole: e.target.value })}>
                    <MenuItem value="student">{tComm('students')}</MenuItem>
                    <MenuItem value="teacher">{tComm('teachers')}</MenuItem>
                    <MenuItem value="parent">{tComm('parents')}</MenuItem>
                    <MenuItem value="system_admin">{tComm('systemAdmins')}</MenuItem>
                    <MenuItem value="school_director">{tComm('schoolDirectors')}</MenuItem>
                    <MenuItem value="academic_head">{tComm('academicHeads')}</MenuItem>
                    <MenuItem value="registrar">{tComm('registrars')}</MenuItem>
                    <MenuItem value="finance_officer">{tComm('financeOfficers')}</MenuItem>
                    <MenuItem value="counselor">{tComm('counselors')}</MenuItem>
                    <MenuItem value="librarian">{tComm('librarians')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {sendForm.recipientType === 'all' && (
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" height="100%" px={1}>
                  <Typography variant="body2" color="text.secondary">
                    {tComm('sendToAllMessage')}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('type')}</InputLabel>
                <Select value={sendForm.type} label={tComm('type')}
                  onChange={e => setSendForm({ ...sendForm, type: e.target.value })}>
                  {['General', 'Academic', 'Financial', 'Attendance', 'Disciplinary', 'System'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('priority')}</InputLabel>
                <Select value={sendForm.priority} label={tComm('priority')}
                  onChange={e => setSendForm({ ...sendForm, priority: e.target.value })}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={sendForm.isEmergency}
                  onChange={e => setSendForm({ ...sendForm, isEmergency: e.target.checked })} />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <ReportProblem color="error" fontSize="small" />
                    <Typography variant="body2" color="error.main">{tComm('emergencyAlert')}</Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog(false)}>{tComm('cancel')}</Button>
          <Button onClick={handleSendNotification} variant="contained"
            disabled={sending} startIcon={sending ? <CircularProgress size={16} /> : <Send />}>
            {sending ? tComm('sending') : tComm('send')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{tComm('deleteNotification')}</DialogTitle>
        <DialogContent>
          <Typography>{tComm('deleteNotificationConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>{tComm('cancel')}</Button>
          <Button onClick={handleDeleteNotification} variant="contained" color="error">{tComm('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
