import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Chip, Divider, IconButton, Paper,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Grid, Avatar, Tooltip, TablePagination,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Send, Reply, Delete, ArrowBack, ForwardToInbox, Add, Refresh, People, DoneAll, DeleteSweep,
} from '@mui/icons-material';
import { messagesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

type View = 'inbox' | 'outbox' | 'detail';

const priorityColor: Record<string, 'error' | 'warning' | 'default'> = {
  High: 'error', Medium: 'warning', Low: 'default',
};

export const MessagesPage = () => {
  const { t: tComm } = useTranslation('communications');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [view, setView] = useState<View>('inbox');
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipients: '', subject: '', body: '', priority: 'Medium',
    recipientType: 'role' as 'role' | 'ids',
    recipientRole: 'student' as string,
  });
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [clearAllDialog, setClearAllDialog] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, page: page + 1 };
      if (view === 'inbox') {
        const res = await messagesAPI.inbox(params);
        setMessages(res.data.data?.messages || []);
        setUnreadCount(res.data.data?.unreadCount || 0);
        setTotalCount(res.data.data?.pagination?.total || 0);
      } else {
        const res = await messagesAPI.outbox(params);
        setMessages(res.data.data?.messages || []);
        setTotalCount(res.data.data?.pagination?.total || 0);
      }
    } catch { showError(tComm('failedToLoadMessages')) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchMessages(); }, [view, page, rowsPerPage]);

  const handleTabChange = (_: any, v: number) => {
    setView(v === 0 ? 'inbox' : 'outbox');
    setSelectedMessage(null);
    setPage(0);
  };

  const handleOpenMessage = async (msg: any) => {
    setSelectedMessage(msg);
    setView('detail');
    try {
      const res = await messagesAPI.thread(msg._id);
      setThreadMessages(res.data.data?.messages || []);
      if (!msg.isRead) {
        await messagesAPI.markRead(msg._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { showError(tComm('failedToLoadThread')) }
  };

  const handleSend = async () => {
    if (!sendForm.subject.trim() || !sendForm.body.trim()) {
      showError(tComm('subjectAndBodyRequired'));
      return;
    }
    if (sendForm.recipientType === 'ids' && !sendForm.recipients.trim()) {
      showError(tComm('recipientRequired'));
      return;
    }
    setSending(true);
    try {
      const payload: any = {
        subject: sendForm.subject,
        body: sendForm.body,
        priority: sendForm.priority,
      };
      if (sendForm.recipientType === 'role') {
        payload.recipientRole = sendForm.recipientRole;
      } else {
        payload.recipients = sendForm.recipients.split(',').map((s: string) => s.trim());
      }
      if (replyTo) {
        payload.threadId = replyTo.threadId || replyTo._id;
      }

      if (sendForm.recipientType === 'role') {
        const res = await messagesAPI.send(payload);
        showSuccess(tComm('messageSentToCount', { count: res.data.data?.recipientCount || 0 }));
      } else {
        await messagesAPI.send(payload);
        showSuccess(replyTo ? tComm('replySent') : tComm('messageSent'));
      }
      setComposeOpen(false);
      setReplyTo(null);
      setSendForm({ recipients: '', subject: '', body: '', priority: 'Medium', recipientType: 'role', recipientRole: 'student' });
      fetchMessages();
    } catch (err: any) {
      showError(err.response?.data?.message || tComm('failedToSend'));
    } finally { setSending(false) }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await messagesAPI.delete(deleteDialog);
      showSuccess(tComm('messageDeleted'));
      if (view === 'detail') { setView('inbox'); setSelectedMessage(null); }
      setDeleteDialog(null);
      fetchMessages();
    } catch { showError(tComm('failedToDelete')) }
  };

  const handleMarkAllRead = async () => {
    try {
      await messagesAPI.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
      showSuccess(tComm('allMessagesRead'));
    } catch { showError(tComm('failedToMarkAllRead')) }
  };

  const handleClearAll = async () => {
    if (!clearAllDialog) return;
    setClearAllDialog(false);
    for (const m of messages) {
      try { await messagesAPI.delete(m._id); } catch { /* skip */ }
    }
    setMessages([]);
    showSuccess(tComm('allMessagesCleared'));
    fetchMessages();
  };

  const openReply = (msg: any) => {
    setReplyTo(msg);
    setSendForm({
      recipients: msg.sender?._id || '',
      subject: `Re: ${msg.subject}`,
      body: '', priority: 'Medium',
      recipientType: 'ids', recipientRole: 'student',
    });
    setComposeOpen(true);
  };

  const openCompose = () => {
    setReplyTo(null);
    setSendForm({ recipients: '', subject: '', body: '', priority: 'Medium', recipientType: 'role', recipientRole: 'student' });
    setComposeOpen(true);
  };

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    return date.toDateString() === now.toDateString()
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>{tComm('messages')}</Typography>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<Add />} onClick={openCompose} size="small">{tComm('compose')}</Button>
          {view === 'inbox' && unreadCount > 0 && (
            <Button startIcon={<DoneAll />} size="small" onClick={handleMarkAllRead}>{tComm('markAllRead')}</Button>
          )}
          {messages.length > 0 && (
            <Button startIcon={<DeleteSweep />} size="small" color="error" onClick={() => setClearAllDialog(true)}>{tComm('clearAll')}</Button>
          )}
          <Tooltip title={tComm('refresh')}><IconButton onClick={fetchMessages} size="small"><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={view === 'inbox' ? 0 : view === 'outbox' ? 1 : -1}
          onChange={handleTabChange} variant="fullWidth">
          <Tab label={<Box display="flex" alignItems="center" gap={1}>{tComm('inbox')} {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ height: 18 }} />}</Box>} sx={{ minHeight: 56 }} />
          <Tab label={tComm('outbox')} sx={{ minHeight: 56 }} />
        </Tabs>
      </Paper>

      {view === 'detail' && selectedMessage && (
        <Button startIcon={<ArrowBack />} onClick={() => { setView('inbox'); setSelectedMessage(null); }} sx={{ mb: 2 }} size="small">
          {tComm('back')}
        </Button>
      )}

      {view === 'detail' && selectedMessage ? (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{selectedMessage.subject}</Typography>
            <Box display="flex" gap={1}>
              <Button startIcon={<Reply />} size="small" variant="outlined" onClick={() => openReply(selectedMessage)}>{tComm('reply')}</Button>
              <Button startIcon={<Delete />} size="small" color="error" onClick={() => setDeleteDialog(selectedMessage._id)}>{tComm('delete')}</Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {threadMessages.map((msg, i) => (
            <Box key={msg._id} mb={i < threadMessages.length - 1 ? 2 : 0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                    {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {msg.sender?.firstName} {msg.sender?.lastName}
                      {msg.sender?._id === user?.id && <Chip label={tComm('me')} size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tComm('to')}: {msg.recipients?.map((r: any) => `${r.firstName} ${r.lastName}`).join(', ')}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.disabled">{formatDate(msg.createdAt)}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{msg.body}</Typography>
              <Box display="flex" gap={0.5} mb={1}>
                <Chip label={msg.priority} size="small" color={priorityColor[msg.priority] || 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
              {i < threadMessages.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Paper>
      ) : (
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : messages.length === 0 ? (
            <Box textAlign="center" py={6} color="text.secondary">
              <ForwardToInbox sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>{view === 'inbox' ? tComm('noInboxMessages') : tComm('noSentMessages')}</Typography>
              {view === 'inbox' && <Button startIcon={<Add />} onClick={openCompose} sx={{ mt: 1 }}>{tComm('composeFirst')}</Button>}
            </Box>
          ) : (
            <>
              <List disablePadding>
                {messages.map((msg, i) => (
                  <Box key={msg._id}>
                    <ListItem
                      sx={{ px: 3, py: 1.5, bgcolor: msg.isRead || view === 'outbox' ? 'transparent' : 'action.hover', cursor: 'pointer' }}
                      onClick={() => handleOpenMessage(msg)}
                      secondaryAction={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip label={msg.priority} size="small" color={priorityColor[msg.priority] || 'default'} sx={{ height: 16, fontSize: '0.6rem' }} />
                          <Typography variant="caption" color="text.disabled" sx={{ minWidth: 50, textAlign: 'right' }}>
                            {formatDate(msg.createdAt)}
                          </Typography>
                        </Box>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                          {view === 'inbox'
                            ? `${msg.sender?.firstName?.[0] || ''}${msg.sender?.lastName?.[0] || ''}`
                            : <Send fontSize="small" />
                          }
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={msg.isRead || view === 'outbox' ? 400 : 700}>
                              {msg.subject}
                            </Typography>
                            {!msg.isRead && view === 'inbox' && <Box width={8} height={8} borderRadius="50%" bgcolor="primary.main" />}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {view === 'inbox'
                              ? `${msg.sender?.firstName} ${msg.sender?.lastName} — ${msg.body?.substring(0, 80)}...`
                              : `${tComm('to')}: ${msg.recipients?.map((r: any) => `${r.firstName} ${r.lastName}`).join(', ').substring(0, 60)}...`
                            }
                          </Typography>
                        }
                      />
                    </ListItem>
                    {i < messages.length - 1 && <Divider />}
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
      )}

      <Dialog open={composeOpen} onClose={() => { setComposeOpen(false); setReplyTo(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{replyTo ? tComm('reply') : tComm('composeMessage')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            {replyTo && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {tComm('replyingTo')}: <strong>{replyTo.sender?.firstName} {replyTo.sender?.lastName}</strong>
                </Typography>
              </Grid>
            )}
            {!replyTo && (
              <>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{tComm('recipientType')}</InputLabel>
                    <Select value={sendForm.recipientType} label={tComm('recipientType')}
                      onChange={e => setSendForm({ ...sendForm, recipientType: e.target.value as 'role' | 'ids' })}>
                      <MenuItem value="role"><Box display="flex" alignItems="center" gap={1}><People fontSize="small" /> {tComm('sendByRole')}</Box></MenuItem>
                      <MenuItem value="ids">{tComm('sendByIds')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {sendForm.recipientType === 'role' ? (
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
                ) : (
                  <Grid item xs={6}>
                    <TextField fullWidth label={tComm('recipientIds')} size="small"
                      value={sendForm.recipients}
                      onChange={e => setSendForm({ ...sendForm, recipients: e.target.value })}
                      helperText={tComm('recipientIdsHelp')} />
                  </Grid>
                )}
              </>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label={tComm('subject')} size="small" value={sendForm.subject}
                onChange={e => setSendForm({ ...sendForm, subject: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={tComm('message')} multiline rows={4} size="small" value={sendForm.body}
                onChange={e => setSendForm({ ...sendForm, body: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('priority')}</InputLabel>
                <Select value={sendForm.priority} label={tComm('priority')}
                  onChange={e => setSendForm({ ...sendForm, priority: e.target.value })}>
                  {['Low', 'Medium', 'High'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setComposeOpen(false); setReplyTo(null); }}>{tComm('cancel')}</Button>
          <Button onClick={handleSend} variant="contained" disabled={sending}
            startIcon={sending ? <CircularProgress size={16} /> : <Send />}>
            {sending ? tComm('sending') : replyTo ? tComm('sendReply') : tComm('send')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearAllDialog} onClose={() => setClearAllDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{tComm('clearAllMessages')}</DialogTitle>
        <DialogContent><Typography>{tComm('clearAllMessagesConfirm')}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setClearAllDialog(false)} sx={{ borderRadius: 2 }}>{tComm('cancel')}</Button>
          <Button onClick={handleClearAll} variant="contained" color="error" sx={{ borderRadius: 2 }}>{tComm('deleteAll')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{tComm('deleteMessage')}</DialogTitle>
        <DialogContent>
          <Typography>{tComm('deleteMessageConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>{tComm('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">{tComm('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
