import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Chip, CircularProgress, Alert, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  Campaign, Info, Event, PriorityHigh, ArrowForward, CheckCircle, Schedule, Flag,
} from '@mui/icons-material';
import { announcementsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const categoryColor: Record<string, string> = {
  Academic: '#1B4F8A', Administrative: '#0F766E', Financial: '#2D7D3A', Events: '#7C3AED', Emergency: '#B5251A',
};
const priorityColor: Record<string, string> = {
  Low: '#6B7280', Normal: '#1B4F8A', High: '#C9920A', Urgent: '#B5251A',
};

export const AnnouncementWidget = ({ limit = 3, showCreate = false }: { limit?: number; showCreate?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t: tComm } = useTranslation('communications');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    announcementsAPI.list({ status: 'Published', limit }).then((r: any) => {
      setItems(r.data.data || []);
    }).catch(() => setError(tComm('failedToLoadAnnouncements')))
      .finally(() => setLoading(false));
  }, [limit]);

  const canManage = ['system_admin', 'school_director', 'academic_head'].includes(user?.role || '');

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(229,231,235,0.6)', height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'rgba(27,79,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Campaign sx={{ fontSize: 18, color: '#1B4F8A' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{           color: '#111827' }}>
            {tComm('announcements')}
          </Typography>
          {items.length > 0 && (
            <Chip label={items.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(27,79,138,0.1)', color: '#1B4F8A', '& .MuiChip-label': { px: 0.75 } }} />
          )}
        </Box>
        <Box display="flex" gap={0.5}>
          {canManage && showCreate && (
            <Tooltip title={tComm('createAnnouncement')}>
              <IconButton size="small" onClick={() => navigate('/announcements')} sx={{ color: '#1B4F8A' }}>
                <Flag sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={tComm('viewAll')}>
            <IconButton size="small" onClick={() => navigate('/announcements')} sx={{ color: '#6B7280' }}>
              <ArrowForward sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ mb: 1.5 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>
      ) : error ? (
        <Alert severity="info" sx={{ borderRadius: 2, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>{error}</Alert>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={3}>
          <Info sx={{ fontSize: 28, color: '#E5E7EB', mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary">{tComm('noAnnouncementsYet')}</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {items.map((a: any) => (
            <Box
              key={a._id}
              sx={{
                p: 1.5, borderRadius: 2, cursor: 'pointer',
                border: '1px solid rgba(229,231,235,0.5)',
                borderLeft: `3px solid ${priorityColor[a.priority] || '#1B4F8A'}`,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(27,79,138,0.04)', borderColor: 'rgba(27,79,138,0.2)' },
              }}
              onClick={() => navigate('/announcements')}
            >
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem',           color: '#111827', mb: 0.25, lineHeight: 1.3 }}>
                {a.title}
              </Typography>
              {a.content && (
                <Typography variant="caption" color="text.secondary" sx={{
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.7rem', mb: 0.5,
                }}>
                  {a.content.replace(/<[^>]*>/g, '')}
                </Typography>
              )}
              <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                {a.category && (
                  <Chip label={a.category} size="small" sx={{
                    height: 18, fontSize: '0.6rem', fontWeight: 600,
                    bgcolor: `${categoryColor[a.category]}15`, color: categoryColor[a.category],
                    '& .MuiChip-label': { px: 0.75 },
                  }} />
                )}
                {a.priority && a.priority !== 'Normal' && (
                  <Chip icon={<PriorityHigh sx={{ fontSize: 10 }} />} label={a.priority} size="small" sx={{
                    height: 18, fontSize: '0.6rem', fontWeight: 600,
                    bgcolor: `${priorityColor[a.priority]}15`, color: priorityColor[a.priority],
                    '& .MuiChip-icon': { fontSize: 10, ml: 0.5 }, '& .MuiChip-label': { px: 0.5 },
                  }} />
                )}
                {a.scheduledAt && new Date(a.scheduledAt) > new Date() ? (
                  <Chip icon={<Schedule sx={{ fontSize: 10 }} />} label={tComm('scheduled')} size="small" sx={{
                    height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(15,118,110,0.1)', color: '#0F766E',
                    '& .MuiChip-icon': { fontSize: 10, ml: 0.5 }, '& .MuiChip-label': { px: 0.5 },
                  }} />
                ) : (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {a.readCount !== undefined && (
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <CheckCircle sx={{ fontSize: 10 }} /> {a.readCount}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#9CA3AF' }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};
