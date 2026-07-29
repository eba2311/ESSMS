import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, IconButton, Collapse, Grid, Card, CardContent, TextField, MenuItem,
  TablePagination, Tooltip, InputAdornment, Divider, ButtonGroup, Button, Fade,
} from '@mui/material';
import {
  KeyboardArrowDown, Refresh, Search, Shield, CheckCircle, ErrorOutline,
  Category, Timeline, ContentCopy, AccessTime, Person, Wifi, Storage,
  BugReport, KeyboardArrowRight, Download, FilterListOff, FilterList,
} from '@mui/icons-material';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const meta = (type: string, t: (key: string) => string): { icon: string; color: string; bg: string; label: string } => {
  const cfg: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    LOGIN_SUCCESS: { icon: '🔑', color: '#2D7D3A', bg: 'rgba(45,125,58,0.08)', label: t('loginSuccess') },
    LOGIN_FAILED: { icon: '🚫', color: '#B5251A', bg: 'rgba(181,37,26,0.08)', label: t('loginFailed') },
    LOGOUT: { icon: '🚪', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', label: t('logout') },
    CREATE: { icon: '➕', color: '#1B4F8A', bg: 'rgba(27,79,138,0.08)', label: t('create') },
    UPDATE: { icon: '✏️', color: '#C9920A', bg: 'rgba(201,146,10,0.08)', label: t('update') },
    DELETE: { icon: '🗑️', color: '#B5251A', bg: 'rgba(181,37,26,0.08)', label: t('delete') },
    EXPORT: { icon: '📊', color: '#0F766E', bg: 'rgba(15,118,110,0.08)', label: t('export') },
    REGISTER: { icon: '📝', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', label: t('register') },
    ROLE_CHANGE: { icon: '👤', color: '#C9920A', bg: 'rgba(201,146,10,0.08)', label: t('roleChange') },
    PASSWORD: { icon: '🔐', color: '#B45309', bg: 'rgba(180,83,9,0.08)', label: t('password') },
  };
  for (const [key, val] of Object.entries(cfg)) {
    if (type.includes(key)) return val;
  }
  if (type.includes('FAILED') || type.includes('ERROR')) return { icon: '⚠️', color: '#B5251A', bg: 'rgba(181,37,26,0.08)', label: t('error') };
  return { icon: '📋', color: '#1B4F8A', bg: 'rgba(27,79,138,0.08)', label: type || t('unknown') };
};

const relTime = (ts: string, now: number, t: (key: string, opts?: any) => string): string => {
  const diff = now - new Date(ts).getTime();
  if (diff < 0) return t('justNow');
  const s = Math.floor(diff / 1000);
  if (s < 60) return t('secondsAgo', { count: s });
  const m = Math.floor(s / 60);
  if (m < 60) return t('minutesAgo', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('hoursAgo', { count: h });
  const d = Math.floor(h / 24);
  if (d === 1) return t('yesterday');
  if (d < 7) return t('daysAgo', { count: d });
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d > 365 ? 'numeric' : undefined });
};

const dateKey = (ts: string): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const timeOnly = (ts: string): string => {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const highlight = (text: string, query: string): JSX.Element => {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Box component="span" key={i} sx={{ bgcolor: '#FEF08A', borderRadius: 0.25, px: 0.25 }}>{part}</Box>
        ) : (
          <Box component="span" key={i}>{part}</Box>
        )
      )}
    </>
  );
};

function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(0);
  const ref = useRef({ raf: 0, start: 0, from: 0, to: 0 });

  useEffect(() => {
    const state = ref.current;
    if (state.from === target) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.from = value;
    state.to = target;
    state.start = performance.now();
    const duration = 800;

    const tick = (now: number) => {
      const elapsed = now - state.start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(state.from + (state.to - state.from) * eased);
      setValue(current);
      if (progress < 1) {
        state.raf = requestAnimationFrame(tick);
      }
    };
    state.raf = requestAnimationFrame(tick);
    return () => { if (state.raf) cancelAnimationFrame(state.raf); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

const AnimatedStat = ({ target, label, icon, color, bg, border }: {
  target: number; label: string; icon: JSX.Element; color: string; bg: string; border: string;
}) => {
  const val = useAnimatedNumber(target);
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3, border: `1px solid ${border}`, bgcolor: bg, position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${border}` },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {val.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, mt: 0.5, display: 'block', letterSpacing: '0.02em' }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: `${color}15` }}>
          <Box sx={{ height: '100%', width: '100%', bgcolor: color, opacity: 0.4 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

const DetailBlock = ({ icon, label, value, mono }: { icon: JSX.Element; label: string; value: string; mono?: boolean }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
      <Box sx={{ color: '#9CA3AF', '& svg': { fontSize: 13 } }}>{icon}</Box>
      <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
    </Box>
    <Typography
      variant="body2"
      sx={{
        fontSize: '0.8rem', color: '#374151', bgcolor: '#fff', px: 1.25, py: 0.5, borderRadius: 1,
        border: '1px solid #E5E7EB', fontFamily: mono ? 'Consolas, Monaco, monospace' : 'inherit',
        wordBreak: 'break-all', lineHeight: 1.5,
      }}
    >
      {value || '—'}
    </Typography>
  </Box>
);

const SkeletonRows = ({ rows = 8 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.75 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.75 }}>
          <Box sx={{ width: 80, height: 14, borderRadius: 1, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
          <Box sx={{ width: 120, height: 10, borderRadius: 1, bgcolor: '#F3F4F6', mt: 0.75, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05 + 0.1}s` }} />
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.75 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <Box>
              <Box sx={{ width: 100, height: 12, borderRadius: 1, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
              <Box sx={{ width: 80, height: 9, borderRadius: 1, bgcolor: '#F3F4F6', mt: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05 + 0.1}s` }} />
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.75 }}>
          <Box sx={{ width: 90, height: 24, borderRadius: 2, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.75 }}>
          <Box sx={{ width: 64, height: 22, borderRadius: 2, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
        </TableCell>
      </TableRow>
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  </>
);

export const AuditLogPage = () => {
  const { t } = useTranslation('common');
  const { showError } = useNotification();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState({ activityType: '', success: '', search: '' });
  const [pagination, setPagination] = useState({ page: 0, limit: 25, total: 0 });
  const [viewMode, setViewMode] = useState<'detailed' | 'compact' | 'timeline'>('detailed');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pagination.limit };
      if (filter.activityType) params.activityType = filter.activityType;
      if (filter.success) params.success = filter.success;
      const [res, statsRes] = await Promise.all([
        api.get('/audit-logs', { params }),
        page === 1 ? api.get('/audit-logs/stats') : Promise.resolve(null),
      ]);
      setLogs(res.data.data?.logs || []);
      setPagination((p) => ({ ...p, page: page - 1, total: res.data.data?.pagination?.total || 0 }));
      if (statsRes) setStats(statsRes.data.data);
    } catch {
      showError(t('failedToLoadAuditLogs'));
    } finally {
      setLoading(false);
    }
  }, [filter.activityType, filter.success, pagination.limit]); // eslint-disable-line

  useEffect(() => { fetchLogs(1); }, [filter.activityType, filter.success]); // eslint-disable-line

  const clientFiltered = useMemo(() => {
    if (!filter.search) return logs;
    const s = filter.search.toLowerCase();
    return logs.filter((log) => {
      const name = `${log.userId?.firstName || ''} ${log.userId?.lastName || ''}`.toLowerCase();
      const act = (log.activityType || '').toLowerCase();
      const ip = (log.ipAddress || '').toLowerCase();
      const err = (log.errorMessage || '').toLowerCase();
      return name.includes(s) || act.includes(s) || ip.includes(s) || err.includes(s);
    });
  }, [logs, filter.search]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    clientFiltered.forEach((log) => {
      const key = dateKey(log.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [clientFiltered]);

  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    logs.forEach((log) => {
      const h = new Date(log.timestamp).getHours();
      hours[h]++;
    });
    return hours;
  }, [logs]);

  const maxHourCount = useMemo(() => Math.max(...hourlyData, 1), [hourlyData]);

  const activeFilterCount = [filter.activityType, filter.success, filter.search].filter(Boolean).length;

  const clearFilters = () => {
    setFilter({ activityType: '', success: '', search: '' });
    setPagination((p) => ({ ...p, page: 0 }));
  };

  const handleExportCSV = () => {
    const headers = [t('csvTimestamp'), t('csvUser'), t('csvEmail'), t('csvRole'), t('activityType'), t('status'), t('csvIpAddress'), t('csvUserAgent'), t('errorMessage')];
    const rows = clientFiltered.map((log) => [
      new Date(log.timestamp).toISOString(),
      `${log.userId?.firstName || ''} ${log.userId?.lastName || ''}`,
      log.userId?.email || '',
      log.userId?.role || '',
      log.activityType || '',
      log.success ? t('successful') : t('failed'),
      log.ipAddress || '',
      log.userAgent || '',
      log.errorMessage || '',
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = stats
    ? [
        { label: t('totalEvents'), value: stats.total || 0, icon: <Timeline sx={{ fontSize: 28 }} />, color: '#1B4F8A', bg: 'rgba(27,79,138,0.06)', border: 'rgba(27,79,138,0.15)' },
        { label: t('successful'), value: stats.successRate?.success || 0, icon: <CheckCircle sx={{ fontSize: 28 }} />, color: '#2D7D3A', bg: 'rgba(45,125,58,0.06)', border: 'rgba(45,125,58,0.15)' },
        { label: t('failed'), value: (stats.successRate?.total || 0) - (stats.successRate?.success || 0), icon: <ErrorOutline sx={{ fontSize: 28 }} />, color: '#B5251A', bg: 'rgba(181,37,26,0.06)', border: 'rgba(181,37,26,0.15)' },
        { label: t('activityTypes'), value: (stats.byType || []).length, icon: <Category sx={{ fontSize: 28 }} />, color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)' },
      ]
    : [];

  const successPct = stats && stats.successRate?.total > 0
    ? Math.round((stats.successRate.success / stats.successRate.total) * 100)
    : 0;

  const hourBarColor = (count: number) => {
    if (count === 0) return '#D1D5DB';
    const ratio = count / maxHourCount;
    if (ratio > 0.7) return '#B5251A';
    if (ratio > 0.35) return '#D97706';
    return '#1B4F8A';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FC' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        {/* Header */}
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #1B4F8A, #0F766E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(27,79,138,0.3)',
            }}>
              <Shield sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: '#111827', lineHeight: 1.2 }}>
                {t('auditLogs')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.25, fontSize: '0.82rem' }}>
                {t('systemActivityTracking')}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download sx={{ fontSize: 16 }} />}
              onClick={handleExportCSV}
              disabled={clientFiltered.length === 0}
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                borderColor: '#D1D5DB', color: '#374151',
                '&:hover': { borderColor: '#1B4F8A', bgcolor: 'rgba(27,79,138,0.04)' },
                '&.Mui-disabled': { borderColor: '#E5E7EB', color: '#D1D5DB' },
              }}
            >
              {t('exportCsv')}
            </Button>
            <Tooltip title={t('refreshLogs')}>
              <IconButton
                onClick={() => fetchLogs(pagination.page + 1)}
                size="small"
                sx={{
                  borderRadius: 2, border: '1px solid #E5E7EB',
                  '&:hover': { bgcolor: '#F3F4F6', borderColor: '#D1D5DB' },
                }}
              >
                <Refresh fontSize="small" sx={{ color: '#374151' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stat Cards */}
        {stats && (
          <Grid container spacing={2} mb={3}>
            {statCards.map((card) => (
              <Grid item xs={6} md={3} key={card.label}>
                <AnimatedStat {...card} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Success Rate Bar */}
        {stats && stats.successRate?.total > 0 && (
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle sx={{ fontSize: 16, color: '#2D7D3A' }} />
              <Typography variant="caption" fontWeight={600} sx={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
                {t('successRate')}
              </Typography>
              <Box sx={{ flex: 1, height: 8, bgcolor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%', borderRadius: 4,
                  width: `${successPct}%`,
                  background: 'linear-gradient(90deg, #2D7D3A, #0F766E)',
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#2D7D3A', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {successPct}%
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Activity Type Breakdown */}
        {stats && (stats.byType || []).length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Category sx={{ fontSize: 16, color: '#6B7280' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t('activityBreakdown')}
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.75}>
              {(stats.byType || []).map((entry: any) => {
                const cfg = meta(entry._id, t);
                const isActive = filter.activityType === entry._id;
                return (
                     <Tooltip key={entry._id} title={t('clickToFilterBy', { label: cfg.label })} arrow>
                    <Chip
                      icon={<span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{cfg.icon}</span>}
                      label={`${cfg.label} (${entry.count})`}
                      size="small"
                      onClick={() => {
                        setFilter((f) => ({ ...f, activityType: isActive ? '' : entry._id }));
                        setPagination((p) => ({ ...p, page: 0 }));
                      }}
                      sx={{
                        fontWeight: 600, fontSize: '0.72rem', height: 28,
                        bgcolor: isActive ? cfg.color : cfg.bg,
                        color: isActive ? '#fff' : cfg.color,
                        border: `1px solid ${isActive ? cfg.color : `${cfg.color}25`}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: cfg.color, color: '#fff', transform: 'scale(1.03)' },
                        '& .MuiChip-icon': { color: isActive ? '#fff' : cfg.color },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Hourly Distribution */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AccessTime sx={{ fontSize: 16, color: '#6B7280' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t('hourlyDistribution')}
            </Typography>
          </Box>
          <Box display="flex" alignItems="flex-end" gap={0.5} sx={{ height: 100 }}>
            {hourlyData.map((count, hour) => (
                     <Tooltip key={hour} title={`${hour}:00 — ${count} ${t('events')}`} arrow>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                  <Box sx={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: count > 0 ? `${Math.max((count / maxHourCount) * 80, 4)}px` : '3px',
                    bgcolor: hourBarColor(count),
                    opacity: count === 0 ? 0.4 : 0.85,
                    transition: 'height 0.3s ease, background 0.2s ease',
                    '&:hover': { opacity: 1 },
                  }} />
                  {hour % 3 === 0 && (
                    <Typography sx={{ fontSize: '0.55rem', color: '#9CA3AF', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
                      {hour}h
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Paper>

        {/* Filter Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <FilterList sx={{ fontSize: 16, color: '#6B7280' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t('filters')}
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} ${t('active')}`}
                size="small"
                sx={{
                  height: 20, fontSize: '0.65rem', fontWeight: 700,
                  bgcolor: 'rgba(27,79,138,0.08)', color: '#1B4F8A',
                }}
              />
            )}
            <Box sx={{ flex: 1 }} />
            {activeFilterCount > 0 && (
              <Button
                size="small"
                startIcon={<FilterListOff sx={{ fontSize: 14 }} />}
                onClick={clearFilters}
                sx={{
                  textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280',
                  '&:hover': { bgcolor: '#F3F4F6', color: '#111827' },
                }}
              >
                {t('clearAll')}
              </Button>
            )}
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small"                 placeholder={t('searchPlaceholder')}
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                select fullWidth label={t('activityType')} size="small" value={filter.activityType}
                onChange={(e) => { setFilter({ ...filter, activityType: e.target.value }); setPagination((p) => ({ ...p, page: 0 })); }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
              >
                <MenuItem value="">{t('allActivityTypes')}</MenuItem>
                {(stats?.byType || []).map((entry: any) => {
                  const cfg = meta(entry._id, t);
                  return (
                    <MenuItem key={entry._id} value={entry._id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{cfg.icon}</span>
                        <span>{entry._id.replace(/_/g, ' ')}</span>
                        <Chip label={entry.count} size="small" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto', bgcolor: '#F3F4F6' }} />
                      </Box>
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                select fullWidth label={t('status')} size="small" value={filter.success}
                onChange={(e) => { setFilter({ ...filter, success: e.target.value }); setPagination((p) => ({ ...p, page: 0 })); }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
              >
                <MenuItem value="">{t('allStatus')}</MenuItem>
                <MenuItem value="true">✓ {t('successful')}</MenuItem>
                <MenuItem value="false">✗ {t('failed')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <ButtonGroup size="small" fullWidth sx={{ '& .MuiButton-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' } }}>
                <Button
                  variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('detailed')}
                  sx={{
                    color: viewMode === 'detailed' ? '#fff' : '#6B7280',
                    bgcolor: viewMode === 'detailed' ? '#1B4F8A' : 'transparent',
                    borderColor: viewMode === 'detailed' ? '#1B4F8A' : '#E5E7EB',
                    '&:hover': { bgcolor: viewMode === 'detailed' ? '#154070' : '#F3F4F6', borderColor: '#1B4F8A' },
                  }}
                >
                  {t('detailed')}
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('compact')}
                  sx={{
                    color: viewMode === 'compact' ? '#fff' : '#6B7280',
                    bgcolor: viewMode === 'compact' ? '#1B4F8A' : 'transparent',
                    borderColor: viewMode === 'compact' ? '#1B4F8A' : '#E5E7EB',
                    '&:hover': { bgcolor: viewMode === 'compact' ? '#154070' : '#F3F4F6', borderColor: '#1B4F8A' },
                  }}
                >
                  {t('compact')}
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('timeline')}
                  sx={{
                    color: viewMode === 'timeline' ? '#fff' : '#6B7280',
                    bgcolor: viewMode === 'timeline' ? '#1B4F8A' : 'transparent',
                    borderColor: viewMode === 'timeline' ? '#1B4F8A' : '#E5E7EB',
                    '&:hover': { bgcolor: viewMode === 'timeline' ? '#154070' : '#F3F4F6', borderColor: '#1B4F8A' },
                  }}
                >
                  {t('timeline')}
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {loading ? (
            <Box>
              {viewMode === 'timeline' ? (
                <Box p={4}>
                  {Array.from({ length: 3 }).map((_, gi) => (
                    <Box key={gi} mb={3}>
                      <Box sx={{ width: 200, height: 18, borderRadius: 1, bgcolor: '#F3F4F6', mb: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Box key={i} display="flex" gap={2} mb={2} pl={2}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F3F4F6', mt: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                          <Box sx={{ flex: 1, height: 56, borderRadius: 2, bgcolor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                        </Box>
                      ))}
                    </Box>
                  ))}
                  <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                </Box>
              ) : (
                <TableContainer>
                  <Table size={viewMode === 'compact' ? 'small' : 'small'}>
                    <TableBody>
                      <SkeletonRows rows={viewMode === 'compact' ? 12 : 8} />
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : clientFiltered.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} px={3}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%', bgcolor: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5,
              }}>
                <Search sx={{ fontSize: 36, color: '#D1D5DB' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#374151', mb: 0.5 }}>
                {t('noAuditLogs')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2, textAlign: 'center' }}>
                {activeFilterCount > 0
                  ? t('tryAdjustingFilters')
                  : t('noEventsRecorded')}
              </Typography>
              {activeFilterCount > 0 && (
                <Button
                  variant="outlined" size="small" startIcon={<FilterListOff sx={{ fontSize: 14 }} />}
                  onClick={clearFilters}
                  sx={{
                    textTransform: 'none', fontWeight: 600, borderColor: '#D1D5DB', color: '#6B7280',
                    '&:hover': { borderColor: '#1B4F8A', color: '#1B4F8A', bgcolor: 'rgba(27,79,138,0.04)' },
                  }}
                >
                  {t('clearAllFilters')}
                </Button>
              )}
            </Box>
          ) : viewMode === 'timeline' ? (
            <Box p={3}>
              {Object.entries(groupedLogs).map(([date, items]) => (
                <Box key={date} mb={3}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <AccessTime sx={{ fontSize: 16, color: '#1B4F8A' }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827', fontSize: '0.82rem' }}>
                      {date}
                    </Typography>
                    <Box sx={{ flex: 1, height: 1, bgcolor: '#E5E7EB' }} />
                    <Chip label={items.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F3F4F6', color: '#6B7280' }} />
                  </Box>
                  <Box sx={{ ml: 2, pl: 3, borderLeft: '2px solid #E5E7EB' }}>
                    {items.map((log: any) => {
                      const cfg = meta(log.activityType, t);
                      const isFailed = log.success === false;
                      return (
                        <Box key={log._id} display="flex" gap={2} mb={1.5} position="relative">
                          <Box sx={{
                            position: 'absolute', left: -31, top: 6,
                            width: 12, height: 12, borderRadius: '50%', bgcolor: isFailed ? '#B5251A' : cfg.color,
                            border: '2px solid #fff',
                            boxShadow: isFailed ? '0 0 0 2px rgba(181,37,26,0.2)' : `0 0 0 2px ${cfg.color}30`,
                          }} />
                          <Paper
                            elevation={0}
                            sx={{
                              flex: 1, p: 1.5, borderRadius: 2, border: '1px solid #E5E7EB',
                              transition: 'all 0.15s ease',
                              '&:hover': { borderColor: isFailed ? 'rgba(181,37,26,0.3)' : `${cfg.color}40`, bgcolor: '#FAFBFD' },
                            }}
                          >
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
                                <Typography sx={{ fontSize: '0.85rem', flexShrink: 0 }}>{cfg.icon}</Typography>
                                <Box minWidth={0} flex={1}>
                                  <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#111827' }}>
                                      {log.userId?.firstName} {log.userId?.lastName}
                                    </Typography>
                                    <KeyboardArrowRight sx={{ fontSize: 14, color: '#D1D5DB' }} />
                                    <Typography
                                      variant="caption" fontWeight={600} sx={{ color: cfg.color, bgcolor: cfg.bg, px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.68rem' }}
                                    >
                                      {log.activityType?.replace(/_/g, ' ')}
                                    </Typography>
                                  </Box>
                                  {log.errorMessage && (
                                    <Typography variant="caption" sx={{ color: '#B5251A', mt: 0.25, display: 'block', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                      {log.errorMessage}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1.5} flexShrink={0}>
                                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
                                  {timeOnly(log.timestamp)}
                                </Typography>
                                <Chip
                                  label={isFailed ? t('failed') : t('ok')}
                                  size="small"
                                  sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: isFailed ? 'rgba(181,37,26,0.08)' : 'rgba(45,125,58,0.08)',
                                    color: isFailed ? '#B5251A' : '#2D7D3A',
                                    border: `1px solid ${isFailed ? 'rgba(181,37,26,0.15)' : 'rgba(45,125,58,0.15)'}`,
                                  }}
                                />
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size={viewMode === 'compact' ? 'small' : 'medium'}>
                {viewMode === 'detailed' && (
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: '#F8F9FC', borderBottom: '2px solid #E5E7EB' } }}>
                      <TableCell sx={{ width: 44, borderBottom: 'none' }} />
                      <TableCell sx={thStyle}>{t('timestamp')}</TableCell>
                      <TableCell sx={thStyle}>{t('user')}</TableCell>
                      <TableCell sx={thStyle}>{t('activity')}</TableCell>
                      <TableCell sx={thStyle}>{t('status')}</TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {clientFiltered.map((log) => {
                    const cfg = meta(log.activityType, t);
                    const isFailed = log.success === false;
                    const isExpanded = expanded === log._id;

                    if (viewMode === 'compact') {
                      return (
                        <TableRow
                          key={log._id}
                          hover
                          sx={{
                            cursor: 'default', transition: 'background 0.1s',
                            '&:hover': { bgcolor: isFailed ? 'rgba(181,37,26,0.03)' : 'rgba(27,79,138,0.02)' },
                          }}
                        >
                          <TableCell sx={{ py: 0.75, borderBottom: '1px solid #F3F4F6', width: 12 }}>
                            <Box sx={{
                              width: 8, height: 8, borderRadius: '50%', bgcolor: isFailed ? '#B5251A' : '#2D7D3A',
                              boxShadow: isFailed ? '0 0 0 2px rgba(181,37,26,0.15)' : '0 0 0 2px rgba(45,125,58,0.15)',
                            }} />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#111827', fontWeight: 500 }}>
                              {log.userId?.firstName} {log.userId?.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                            <Box display="flex" alignItems="center" gap={0.75}>
                              <Typography sx={{ fontSize: '0.75rem' }}>{cfg.icon}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: cfg.color, fontSize: '0.72rem' }}>
                                {log.activityType?.replace(/_/g, ' ')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                              {relTime(log.timestamp, now, t)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                            <Chip label={isFailed ? t('failed') : t('ok')}
                              size="small"
                              sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: isFailed ? 'rgba(181,37,26,0.08)' : 'rgba(45,125,58,0.08)',
                                color: isFailed ? '#B5251A' : '#2D7D3A',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <Box component="fragment" key={log._id}>
                        <TableRow
                          hover
                          sx={{
                            cursor: 'pointer', transition: 'background 0.15s',
                            bgcolor: isFailed ? 'rgba(181,37,26,0.02)' : isExpanded ? 'rgba(27,79,138,0.03)' : 'transparent',
                            '&:hover': { bgcolor: isFailed ? 'rgba(181,37,26,0.05)' : 'rgba(27,79,138,0.04)' },
                          }}
                          onClick={() => setExpanded(isExpanded ? null : log._id)}
                        >
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <IconButton size="small" sx={{
                              color: '#9CA3AF', transition: 'transform 0.2s ease',
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                            }}>
                              <KeyboardArrowDown fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#111827', fontSize: '0.82rem' }}>
                              {highlight(relTime(log.timestamp, now, t), filter.search)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                              {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{
                                width: 32, height: 32, borderRadius: '50%', bgcolor: cfg.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${cfg.color}20`, flexShrink: 0,
                              }}>
                                <Typography sx={{ fontSize: '0.85rem' }}>{cfg.icon}</Typography>
                              </Box>
                              <Box minWidth={0}>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem', color: '#111827', lineHeight: 1.2 }}>
                                  {highlight(`${log.userId?.firstName || ''} ${log.userId?.lastName || ''}`, filter.search)}
                                </Typography>
                                {log.userId?.email && (
                                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.68rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                    {log.userId.email}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Chip
                              icon={<span style={{ fontSize: '0.7rem' }}>{cfg.icon}</span>}
                              label={log.activityType?.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                fontWeight: 600, fontSize: '0.7rem', height: 26,
                                bgcolor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`,
                                '& .MuiChip-icon': { color: cfg.color },
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                    <Chip
                      label={isFailed ? t('failed') : t('success')}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.7rem', height: 24,
                                bgcolor: isFailed ? 'rgba(181,37,26,0.08)' : 'rgba(45,125,58,0.08)',
                                color: isFailed ? '#B5251A' : '#2D7D3A',
                                border: `1px solid ${isFailed ? 'rgba(181,37,26,0.15)' : 'rgba(45,125,58,0.15)'}`,
                              }}
                            />
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0, borderBottom: 'none' }}>
                            <Collapse in={isExpanded} timeout={200}>
                              <Box sx={{ my: 1.5, mx: 1, p: 2.5, bgcolor: '#F8F9FC', borderRadius: 2, border: '1px solid #E5E7EB' }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                  <Storage sx={{ fontSize: 15, color: '#1B4F8A' }} />
                                  <Typography variant="caption" fontWeight={700} sx={{ color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {t('eventDetails')}
                                  </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6} md={3}>
                                     <DetailBlock icon={<Wifi sx={{ fontSize: 13 }} />} label={t('ipAddress')} value={log.ipAddress || ''} mono />
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                     <DetailBlock icon={<AccessTime sx={{ fontSize: 13 }} />} label={t('fullTimestamp')} value={new Date(log.timestamp).toISOString()} mono />
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                     <DetailBlock icon={<Person sx={{ fontSize: 13 }} />} label={t('user')} value={`${log.userId?.firstName || ''} ${log.userId?.lastName || ''} (${log.userId?.role || ''})`} />
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                     <DetailBlock icon={<BugReport sx={{ fontSize: 13 }} />} label={t('userAgent')} value={log.userAgent || ''} />
                                  </Grid>

                                  {log.errorMessage && (
                                    <Grid item xs={12}>
                                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                        <ErrorOutline sx={{ fontSize: 13, color: '#B5251A' }} />
                                        <Typography variant="caption" sx={{ color: '#B5251A', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                           {t('errorMessage')}
                                        </Typography>
                                      </Box>
                                      <Box sx={{
                                        fontSize: '0.8rem', color: '#B5251A', bgcolor: 'rgba(181,37,26,0.04)',
                                        px: 1.5, py: 1, borderRadius: 1.5, border: '1px solid rgba(181,37,26,0.12)',
                                        fontFamily: 'Consolas, Monaco, monospace', lineHeight: 1.5, wordBreak: 'break-all',
                                      }}>
                                        {log.errorMessage}
                                      </Box>
                                    </Grid>
                                  )}

                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <Grid item xs={12}>
                                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                          <Storage sx={{ fontSize: 13, color: '#9CA3AF' }} />
                                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                             {t('metadata')}
                                          </Typography>
                                        </Box>
                                        <Tooltip title={t('copyJson')}>
                                          <IconButton
                                            size="small" sx={{ p: 0.25 }}
                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(log.metadata, null, 2)); }}
                                          >
                                            <ContentCopy sx={{ fontSize: 14, color: '#9CA3AF', '&:hover': { color: '#1B4F8A' } }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                      <Box sx={{
                                        bgcolor: '#1E293B', borderRadius: 2, p: 2, overflow: 'auto', maxHeight: 200,
                                        border: '1px solid #334155',
                                      }}>
                                        <Box component="pre" sx={{
                                          fontSize: '0.72rem', fontFamily: 'Consolas, Monaco, monospace',
                                          color: '#E2E8F0', m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6,
                                        }}>
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Box>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {pagination.total > 0 && <Divider />}
          {pagination.total > 0 && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              rowsPerPage={pagination.limit}
              onPageChange={(_, newPage) => fetchLogs(newPage + 1)}
              rowsPerPageOptions={[25, 50, 100]}
              onRowsPerPageChange={(e) => {
                setPagination((p) => ({ ...p, limit: parseInt(e.target.value), page: 0 }));
                fetchLogs(1);
              }}
              sx={{
                '& .MuiTablePagination-toolbar': { minHeight: 48 },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem' },
              }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

const thStyle = {
  fontWeight: 700 as const,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: '#6B7280',
  borderBottom: 'none',
};
