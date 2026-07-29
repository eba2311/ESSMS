import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Chip, CircularProgress, Alert,
  Button, TextField, Select, InputLabel, FormControl, MenuItem,
  IconButton, Tooltip, Grid, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Avatar, Divider, Badge, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Switch, FormControlLabel,
  LinearProgress, Radio, RadioGroup,
} from '@mui/material';
import {
  Add, Campaign, Edit, Delete, Archive, Send, Publish,
  Unpublished, Visibility, Refresh, FilterList, Search,
  School, Group, Category, Schedule, CheckCircle, Error as ErrorIcon,
  Close, CloudUpload, Circle as CircleIcon, Block,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { announcementsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Academic', 'Administrative', 'Financial', 'Events', 'Emergency'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
const STATUSES = ['Draft', 'Scheduled', 'Published', 'Expired', 'Archived'] as const;
const AUDIENCES = ['All', 'Students', 'Teachers', 'Parents', 'Staff'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Academic: '#1B4F8A', Administrative: '#7C3AED', Financial: '#B45309',
  Events: '#C9920A', Emergency: '#DC2626',
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#6B7280', Medium: '#C9920A', High: '#EA580C', Urgent: '#DC2626',
};
const STATUS_COLORS: Record<string, string> = {
  Draft: '#9CA3AF', Scheduled: '#1B4F8A', Published: '#2D7D3A',
  Expired: '#B45309', Archived: '#6B7280',
};

const ROLE_CAN_PUBLISH = ['system_admin', 'school_director', 'academic_head'];

export const AnnouncementsPage = () => {
  const { t: tComm } = useTranslation('communications');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const role = user?.role || '';
  const canCreate = !['student', 'parent'].includes(role);
  const canPublish = ROLE_CAN_PUBLISH.includes(role);

  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    title: '', content: '', category: 'Academic' as typeof CATEGORIES[number],
    priority: 'Medium' as typeof PRIORITIES[number], status: 'Draft' as typeof STATUSES[number],
    targetAudience: ['All'] as string[], targetGrades: [] as number[],
    publishDate: '', scheduledAt: '', expiryDate: '',
  });

  const [saving, setSaving] = useState(false);

  const statusFilter = ['', 'Draft', 'Scheduled', 'Published', 'Expired', 'Archived'];

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { limit: 50 };
      if (tab > 0) params.status = statusFilter[tab];
      if (search) params.search = search;
      const r = await announcementsAPI.list(params);
      setAnnouncements(r.data.data || []);
    } catch { setError('Failed to load announcements'); }
    finally { setLoading(false); }
  }, [tab, search]);

  const fetchStats = useCallback(async () => {
    try { const r = await announcementsAPI.stats(); setStats(r.data.data); } catch { /* ok */ }
  }, []);

  useEffect(() => { fetch(); fetchStats(); }, [fetch, fetchStats]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: '', content: '', category: 'Academic', priority: 'Medium', status: 'Draft',
      targetAudience: ['All'], targetGrades: [],
      publishDate: new Date().toISOString().slice(0, 10), scheduledAt: '', expiryDate: '',
    });
    setDialog(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a._id);
    setForm({
      title: a.title || '', content: a.content || '', category: a.category || 'Academic',
      priority: a.priority || 'Medium', status: a.status || 'Draft',
      targetAudience: a.targetAudience || ['All'], targetGrades: a.targetGrades || [],
      publishDate: a.publishDate ? a.publishDate.slice(0, 10) : '', scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 10) : '',
      expiryDate: a.expiryDate ? a.expiryDate.slice(0, 10) : '',
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { showError('Title and content required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.publishDate) delete payload.publishDate;
      if (!payload.scheduledAt) delete payload.scheduledAt;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (payload.targetGrades?.length === 0) delete payload.targetGrades;

      if (editingId) {
        await announcementsAPI.update(editingId, payload);
        showSuccess('Announcement updated');
      } else {
        await announcementsAPI.create(payload);
        showSuccess('Announcement created');
      }
      setDialog(false);
      setEditingId(null);
      fetch();
      fetchStats();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await announcementsAPI.delete(deleteId); showSuccess('Archived'); setDeleteId(null); fetch(); fetchStats(); }
    catch { showError('Failed to delete'); }
  };

  const handlePublish = async (id: string) => {
    try { await announcementsAPI.publish(id); showSuccess('Published'); fetch(); fetchStats(); }
    catch (err: any) { showError(err.response?.data?.message || 'Publish failed'); }
  };

  const handleUnpublish = async (id: string) => {
    try { await announcementsAPI.unpublish(id); showSuccess('Unpublished'); fetch(); }
    catch { showError('Unpublish failed'); }
  };

  const handleArchive = async (id: string) => {
    try { await announcementsAPI.archive(id); showSuccess('Archived'); fetch(); fetchStats(); }
    catch { showError('Archive failed'); }
  };

  const handleMarkRead = async (id: string) => {
    try { await announcementsAPI.markRead(id); } catch { /* ignore */ }
  };

  const openDetail = (a: any) => {
    setSelected(a);
    setDetailDialog(true);
    if (!['system_admin', 'school_director', 'academic_head'].includes(role)) {
      handleMarkRead(a._id);
    }
  };

  const filtered = announcements.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q);
  });

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827' }}>
            {tComm('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats ? `${stats.published} published · ${stats.draft} drafts · ${stats.totalReads} reads` : ''}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>
              {tComm('newAnnouncement')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 2, minHeight: 44 }}
          TabIndicatorProps={{ sx: { height: 3, borderRadius: '3px 3px 0 0' } }}>
          <Tab label={`All (${stats?.total || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
          <Tab label={`Draft (${stats?.draft || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
          <Tab label={`Scheduled (${stats?.scheduled || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
          <Tab label={`Published (${stats?.published || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
          <Tab label={`Expired (${stats?.expired || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
          <Tab label={`Archived (${stats?.archived || 0})`} sx={{ textTransform: 'none', fontSize: '0.8rem', minHeight: 44, py: 1 }} />
        </Tabs>
      </Paper>

      <Box display="flex" gap={1.5} mb={2.5}>
        <TextField
          size="small" placeholder={tComm('searchPlaceholder')} value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#9CA3AF', fontSize: 18 }} /> }}
        />
        <Tooltip title={tCommon('refresh')}><IconButton onClick={() => { fetch(); fetchStats(); }}><Refresh /></IconButton></Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={32} /></Box>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', p: 8, textAlign: 'center' }}>
          <Campaign sx={{ fontSize: 56, color: '#9CA3AF', opacity: 0.25, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" mb={0.5}>{tComm('noAnnouncements')}</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {canCreate ? tComm('createFirst') : tComm('checkBackLater')}
          </Typography>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>{tComm('createAnnouncement')}</Button>}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((a) => (
            <Grid item xs={12} md={6} lg={4} key={a._id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)',
                  borderLeft: `4px solid ${PRIORITY_COLORS[a.priority] || '#e5e7eb'}`,
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#C9920A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                  transition: 'all 0.15s ease',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}
                onClick={() => openDetail(a)}
              >
                <CardContent sx={{ flex: 1, pb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, flex: 1 }}
                      color={a.status === 'Expired' || a.status === 'Archived' ? 'text.secondary' : 'text.primary'}>
                      {a.title}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
                      <Chip label={a.category} size="small" sx={{ borderRadius: 1, fontSize: '0.6rem', bgcolor: `${CATEGORY_COLORS[a.category]}15`, color: CATEGORY_COLORS[a.category], fontWeight: 600 }} />
                    </Box>
                  </Box>

                  <Typography variant="body2" color={a.status === 'Expired' ? 'text.disabled' : 'text.secondary'}
                    sx={{
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      mb: 1.5, fontSize: '0.8rem',
                    }}>
                    {a.content}
                  </Typography>

                  <Box display="flex" gap={0.5} flexWrap="wrap" mb={0.5}>
                    <Chip label={a.status} size="small"
                      sx={{ borderRadius: 1, fontSize: '0.6rem', bgcolor: `${STATUS_COLORS[a.status]}15`, color: STATUS_COLORS[a.status], fontWeight: 600 }} />
                    <Chip label={a.priority} size="small"
                      sx={{ borderRadius: 1, fontSize: '0.6rem', bgcolor: `${PRIORITY_COLORS[a.priority]}15`, color: PRIORITY_COLORS[a.priority], fontWeight: 600 }} />
                    {(a.targetAudience || []).map((ta: string) => (
                      <Chip key={ta} label={ta} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.6rem' }} />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between', pt: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {a.publishedBy?.firstName} {a.publishedBy?.lastName}
                  </Typography>
                  <Box display="flex" gap={0.25}>
                    {a.readCount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {a.readCount} read
                      </Typography>
                    )}
                  </Box>
                </CardActions>

                {/* Action bar — visible on hover via the card */}
                {canCreate && (
                  <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {a.status === 'Draft' && canPublish && (
                      <Tooltip title={tComm('publish')}><IconButton size="small" color="success"
                        onClick={(e) => { e.stopPropagation(); handlePublish(a._id); }}><Publish fontSize="small" /></IconButton></Tooltip>
                    )}
                    {a.status === 'Published' && canPublish && (
                      <Tooltip title={tComm('unpublish')}><IconButton size="small" color="warning"
                        onClick={(e) => { e.stopPropagation(); handleUnpublish(a._id); }}><Unpublished fontSize="small" /></IconButton></Tooltip>
                    )}
                    {(a.status === 'Draft' || a.status === 'Scheduled') && (
                      <Tooltip title={tComm('editAction')}><IconButton size="small"
                        onClick={(e) => { e.stopPropagation(); openEdit(a); }}><Edit fontSize="small" /></IconButton></Tooltip>
                    )}
                    {a.status !== 'Archived' && (
                      <Tooltip title={tComm('archiveAction')}><IconButton size="small" color="error"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(a._id); }}><Archive fontSize="small" /></IconButton></Tooltip>
                    )}
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Campaign sx={{ color: '#C9920A' }} />
            {editingId ? tComm('editAnnouncement') : tComm('createAnnouncement')}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField fullWidth label={`${tCommon('title')} *`} value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Grid>

            {/* Category & Priority */}
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('category')}</InputLabel>
                <Select value={form.category} label={tComm('category')}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{tComm('priority')}</InputLabel>
                <Select value={form.priority} label={tComm('priority')}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                  {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Content */}
            <Grid item xs={12}>
              <TextField fullWidth label={`${tCommon('content')} *`} multiline rows={5} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </Grid>

            {/* Target Audience */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>{tComm('targetAudience')}</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {AUDIENCES.map((a) => (
                  <Chip key={a} label={a}
                    color={form.targetAudience.includes(a) ? 'primary' : 'default'}
                    variant={form.targetAudience.includes(a) ? 'filled' : 'outlined'}
                    onClick={() => {
                      const next = form.targetAudience.includes(a)
                        ? form.targetAudience.filter((x) => x !== a)
                        : [...form.targetAudience, a];
                      setForm({ ...form, targetAudience: next.length === 0 ? ['All'] : next });
                    }}
                    sx={{ borderRadius: 2, cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Target Grades */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>{tComm('targetGrades')}</Typography>
              <Box display="flex" gap={1}>
                {[9, 10, 11, 12].map((g) => (
                  <Chip key={g} label={`Grade ${g}`}
                    color={form.targetGrades.includes(g) ? 'primary' : 'default'}
                    variant={form.targetGrades.includes(g) ? 'filled' : 'outlined'}
                    onClick={() => {
                      const next = form.targetGrades.includes(g)
                        ? form.targetGrades.filter((x) => x !== g)
                        : [...form.targetGrades, g];
                      setForm({ ...form, targetGrades: next });
                    }}
                    sx={{ borderRadius: 2, cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Status + Schedule */}
            {canPublish && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tCommon('status')}</InputLabel>
                  <Select value={form.status} label={tCommon('status')}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                    <MenuItem value="Draft">Draft — Save without publishing</MenuItem>
                    <MenuItem value="Published">Published — Publish immediately</MenuItem>
                    <MenuItem value="Scheduled">Scheduled — Publish on date below</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Dates */}
            <Grid item xs={4}>
              <TextField fullWidth label={tComm('publishDate')} type="date" size="small"
                value={form.publishDate} InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tComm('scheduleAt')} type="date" size="small"
                value={form.scheduledAt} InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label={tComm('expiryDate')} type="date" size="small"
                value={form.expiryDate} InputLabelProps={{ shrink: true }}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{tCommon('cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? <CircularProgress size={18} /> : editingId ? tCommon('update') : form.status === 'Published' ? tComm('publish') : tComm('saveDraft')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PRIORITY_COLORS[selected.priority] || '#9CA3AF' }} />
                {selected.title}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip label={selected.category} size="small"
                  sx={{ bgcolor: `${CATEGORY_COLORS[selected.category]}15`, color: CATEGORY_COLORS[selected.category], fontWeight: 600, borderRadius: 1 }} />
                <Chip label={selected.priority} size="small"
                  sx={{ bgcolor: `${PRIORITY_COLORS[selected.priority]}15`, color: PRIORITY_COLORS[selected.priority], fontWeight: 600, borderRadius: 1 }} />
                <Chip label={selected.status} size="small"
                  sx={{ bgcolor: `${STATUS_COLORS[selected.status]}15`, color: STATUS_COLORS[selected.status], fontWeight: 600, borderRadius: 1 }} />
                {(selected.targetAudience || []).map((ta: string) => (
                  <Chip key={ta} label={ta} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                ))}
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{selected.content}</Typography>

              {(selected.attachments?.length > 0) && (
                <Box mt={2}>
                  <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Attachments</Typography>
                  {selected.attachments.map((att: any, i: number) => (
                    <Chip key={i} label={att.filename} component="a" href={att.url} target="_blank"
                      clickable variant="outlined" sx={{ mr: 0.5, mb: 0.5, borderRadius: 1 }} />
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Published by {selected.publishedBy?.firstName} {selected.publishedBy?.lastName}
                  ({selected.publishedBy?.role})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.readCount || 0} reads
                  {selected.expiryDate && ` · Expires ${new Date(selected.expiryDate).toLocaleDateString()}`}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              {canCreate && selected.status !== 'Archived' && (
                <>
                  {selected.status === 'Draft' && canPublish && (
                    <Button startIcon={<Publish />} color="success" onClick={() => { handlePublish(selected._id); setDetailDialog(false); }}>{tComm('publish')}</Button>
                  )}
                  <Button startIcon={<Edit />} onClick={() => { setDetailDialog(false); openEdit(selected); }}>{tCommon('edit')}</Button>
                  <Button startIcon={<Archive />} color="error" onClick={() => { setDeleteId(selected._id); setDetailDialog(false); }}>{tComm('archive')}</Button>
                </>
              )}
              <Button onClick={() => setDetailDialog(false)}>{tCommon('close')}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete/Archive Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{tComm('archiveAnnouncement')}</DialogTitle>
        <DialogContent>
          <Typography>{tComm('archiveConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{tCommon('cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>{tComm('archive')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};