import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Chip, Divider, IconButton, Paper,
} from '@mui/material';
import {
  Notifications, NotificationsNone, CheckCircle, School,
  AttachMoney, HowToReg, Warning, Info, DoneAll,
} from '@mui/icons-material';
import { communicationAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const typeIcon: Record<string, JSX.Element> = {
  Academic: <School color="primary" />,
  Financial: <AttachMoney color="warning" />,
  Attendance: <HowToReg color="info" />,
  Disciplinary: <Warning color="error" />,
  Announcement: <Notifications color="secondary" />,
  System: <Info />,
  General: <NotificationsNone />,
};

const priorityColor: Record<string, any> = {
  Critical: 'error', High: 'warning', Medium: 'info', Low: 'default',
};

export const NotificationsPage = () => {
  const { t: tComm } = useTranslation('communications');
  const { showSuccess, showError } = useNotification();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await communicationAPI.notifications({
        unread: filter === 'unread' ? 'true' : undefined,
        limit: 50,
      });
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      showError(tComm('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const markRead = async (id: string) => {
    try {
      await communicationAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      showError(tComm('failedToMarkRead'));
    }
  };

  const markAllRead = async () => {
    try {
      await communicationAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess(tComm('allRead'));
    } catch {
      showError(tComm('failedToMarkAllRead'));
    }
  };  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" fontWeight={700}>{tComm('notifications')}</Typography>
          {unreadCount > 0 && (
            <Chip label={tComm('unreadCount', { count: unreadCount })} size="small" color="error" />
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Box display="flex" bgcolor="grey.100" borderRadius={1} p={0.5}>
            {(['all', 'unread'] as const).map(f => (
              <Button key={f} size="small" variant={filter === f ? 'contained' : 'text'}
                onClick={() => setFilter(f)} sx={{ textTransform: 'capitalize' }}>
                {tComm(f)}
              </Button>
            ))}
          </Box>
          {unreadCount > 0 && (
            <Button startIcon={<DoneAll />} variant="outlined" size="small" onClick={markAllRead}>
              {tComm('markAllRead')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper component={Box}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" py={6} color="text.secondary">
            <NotificationsNone sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography>{filter === 'unread' ? tComm('noUnreadNotifications') : tComm('noNotifications')}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n: any, i: number) => (
              <Box key={n._id}>
                <ListItem
                  sx={{ bgcolor: n.isRead ? 'transparent' : 'primary.50', px: 3, py: 1.5 }}
                  secondaryAction={
                    !n.isRead && (
                      <IconButton size="small" onClick={() => markRead(n._id)} title={tComm('markAsRead')}>
                        <CheckCircle fontSize="small" color="primary" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {typeIcon[n.type] || <Info />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>
                          {n.title}
                        </Typography>
                        <Chip label={n.priority} size="small" color={priorityColor[n.priority] || 'default'}
                          sx={{ height: 16, fontSize: '0.65rem' }} />
                        {!n.isRead && <Box width={8} height={8} borderRadius="50%" bgcolor="primary.main" />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {i < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
