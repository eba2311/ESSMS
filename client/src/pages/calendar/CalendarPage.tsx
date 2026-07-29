import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Alert,
} from '@mui/material';
import { Add, Today } from '@mui/icons-material';
import { eventsAPI } from '../../services/api';

export const CalendarPage = () => {
  const { t: tCal } = useTranslation('calendar');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', eventType: 'Academic',
    startDate: '', endDate: '', startTime: '', endTime: '', location: '',
  });

  const fetchEvents = async () => {
    try {
      const res = await eventsAPI.list();
      setEvents(res.data.data?.events || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async () => {
    try {
      await eventsAPI.create(formData);
      setDialog(false);
      setFormData({ title: '', description: '', eventType: 'Academic', startDate: '', endDate: '', startTime: '', endTime: '', location: '' });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || tCal('failedToCreateEvent'));
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      Academic: '#1E40AF', Examination: '#DC2626', Holiday: '#16A34A',
      Meeting: '#D97706', Ceremony: '#7C3AED', Other: '#64748B',
    };
    return colors[type] || '#64748B';
  };

  const months = [tCal('academic'), tCal('examination'), tCal('holiday'), tCal('sports'), tCal('cultural'), tCal('meeting'),
    tCal('other'), tCal('allDay'), tCal('recurring'), tCal('weekly'), tCal('monthly'), tCal('yearly')];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="700">{tCal('title')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>{tCal('addEvent')}</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" mb={2}>
              <Today sx={{ mr: 1, verticalAlign: 'middle' }} />
              {tCal('upcomingEvents')}
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : events.length === 0 ? (
              <Typography color="text.secondary" py={4} textAlign="center">{tCal('noUpcomingEvents')}</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {events.filter((e: any) => new Date(e.startDate) >= new Date()).slice(0, 10).map((e: any) => (
                  <Card key={e._id} variant="outlined">
                    <CardContent sx={{ display: 'flex', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{
                        minWidth: 60, textAlign: 'center', bgcolor: `${getEventColor(e.eventType)}15`,
                        borderRadius: 2, p: 1,
                      }}>
                        <Typography variant="h5" fontWeight="700" sx={{ color: getEventColor(e.eventType) }}>
                          {new Date(e.startDate).getDate()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: getEventColor(e.eventType) }}>
                          {months[new Date(e.startDate).getMonth()]?.slice(0, 3)}
                        </Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="600">{e.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{e.description}</Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip label={e.eventType} size="small" sx={{ bgcolor: `${getEventColor(e.eventType)}20`, color: getEventColor(e.eventType) }} />
                          {e.location && <Chip label={e.location} size="small" variant="outlined" />}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" mb={2}>{tCal('eventTypes')}</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {[{ v: 'Academic', k: tCal('academic') }, { v: 'Examination', k: tCal('examination') }, { v: 'Holiday', k: tCal('holiday') }, { v: 'Meeting', k: tCal('meeting') }, { v: 'Ceremony', k: tCal('cultural') }].map(type => (
                <Box key={type.v} display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getEventColor(type.v) }} />
                  <Typography variant="body2">{type.k}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight="600" mb={2}>{tCal('academicCalendar')}</Typography>
            {(() => {
              const now = new Date();
              const year = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
              return (
                <>
                  <Typography variant="body2" color="text.secondary">{tCal('term1', { year })}</Typography>
                  <Typography variant="body2" color="text.secondary">{tCal('term2', { year: year + 1 })}</Typography>
                </>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tCal('createEvent')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={tCal('eventName')} value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <TextField fullWidth margin="dense" label={tCal('description')} multiline rows={2} value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <TextField fullWidth margin="dense" label={tCal('eventType')} select value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}>
            {[{ v: 'Academic', k: tCal('academic') }, { v: 'Examination', k: tCal('examination') }, { v: 'Holiday', k: tCal('holiday') }, { v: 'Meeting', k: tCal('meeting') }, { v: 'Ceremony', k: tCal('cultural') }, { v: 'Other', k: tCal('other') }].map(item =>
              <MenuItem key={item.v} value={item.v}>{item.k}</MenuItem>)}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth margin="dense" label={tCal('startDate')} type="date" value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth margin="dense" label={tCal('endDate')} type="date" value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth margin="dense" label={tCal('startTime')} type="time" value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth margin="dense" label={tCal('endTime')} type="time" value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <TextField fullWidth margin="dense" label={tCal('location')} value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCal('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">{tCal('createEvent')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
