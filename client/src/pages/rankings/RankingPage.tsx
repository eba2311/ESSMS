import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  Button, CircularProgress, Avatar,
} from '@mui/material';
import { EmojiEvents, Star, TrendingUp } from '@mui/icons-material';
import { rankingsAPI, sectionsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { canCalculateRanking } from '../../utils/permissions';

export const RankingPage = () => {
  const { t: tRank } = useTranslation('rankings');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const canRecalculate = canCalculateRanking(user?.role);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('section');
  const [grade, setGrade] = useState('');

  const [sections, setSections] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [stream, setStream] = useState('');

  useEffect(() => {
    sectionsAPI.list({ limit: 100 }).then((r) => setSections(r.data.data || [])).catch(() => {});
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      let res;
      if (level === 'section' && sectionId) {
        res = await rankingsAPI.sectionRankings(sectionId);
      } else if (level === 'grade' && grade) {
        res = await rankingsAPI.gradeRankings(Number(grade));
      } else if (level === 'stream' && grade && stream) {
        res = await rankingsAPI.streamRankings(Number(grade), stream);
      } else {
        const params: any = {};
        if (grade) params.grade = grade;
        res = await rankingsAPI.list(params);
      }
      setRankings(res?.data?.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRankings(); }, [level, grade, sectionId, stream]);

  const getMedal = (rank: number) => {
    if (rank === 1) return <EmojiEvents sx={{ color: '#FFD700' }} />;
    if (rank === 2) return <EmojiEvents sx={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <EmojiEvents sx={{ color: '#CD7F32' }} />;
    return null;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="700">{tRank('title')}</Typography>
        <Box display="flex" gap={2}>
          <TextField size="small" label={tCommon('level')} select value={level}
            onChange={(e) => setLevel(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="section">{tRank('section')}</MenuItem>
            <MenuItem value="grade">{tCommon('grade')}</MenuItem>
            <MenuItem value="stream">{tCommon('stream')}</MenuItem>
            <MenuItem value="school">{tRank('school')}</MenuItem>
          </TextField>
          <TextField size="small" label={tCommon('grade')} select value={grade}
            onChange={(e) => setGrade(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">{tCommon('all')}</MenuItem>
            {[9, 10, 11, 12].map(g => <MenuItem key={g} value={g}>{`${tCommon('grade')} ${g}`}</MenuItem>)}
          </TextField>
          {level === 'section' && (
            <TextField size="small" label={tCommon('section')} select value={sectionId}
              onChange={(e) => setSectionId(e.target.value)} sx={{ minWidth: 140 }}>
              {sections.map((s: any) => (
                <MenuItem key={s._id} value={s._id}>{s.name} (Gr {s.grade})</MenuItem>
              ))}
            </TextField>
          )}
          {level === 'stream' && (
            <TextField size="small" label={tCommon('stream')} select value={stream}
              onChange={(e) => setStream(e.target.value)} sx={{ minWidth: 120 }}>
              <MenuItem value="Natural">{tCommon('natural')}</MenuItem>
              <MenuItem value="Social">{tCommon('social')}</MenuItem>
            </TextField>
          )}
          {canRecalculate && (
            <Button variant="contained" onClick={() => rankingsAPI.calculate().catch(() => {})}>
              {tRank('recalculate')}
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#FFF9E6' }}><CardContent sx={{ textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 40, color: '#FFD700' }} />
            <Typography variant="h6" fontWeight="700">{tRank('rank1')}</Typography>
            <Typography variant="body2" color="text.secondary">{tRank('topPerformer')}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#F0F7FF' }}><CardContent sx={{ textAlign: 'center' }}>
            <Star sx={{ fontSize: 40, color: '#1E40AF' }} />
            <Typography variant="h6" fontWeight="700">{tRank('excellence')}</Typography>
            <Typography variant="body2" color="text.secondary">{tRank('excellenceDesc')}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#F0FFF4' }}><CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: '#16A34A' }} />
            <Typography variant="h6" fontWeight="700">{tRank('honor')}</Typography>
            <Typography variant="body2" color="text.secondary">{tRank('honorDesc')}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tRank('colRank')}</TableCell>
                  <TableCell>{tCommon('student')}</TableCell>
                  <TableCell>{tCommon('grade')}</TableCell>
                  <TableCell>{tCommon('section')}</TableCell>
                  <TableCell>{tCommon('average')}</TableCell>
                  <TableCell>{tRank('colGpa')}</TableCell>
                  <TableCell>{tRank('colMerit')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankings.map((r: any, i: number) => (
                  <TableRow key={r._id} hover
                    sx={{ bgcolor: i < 3 ? (i === 0 ? '#FFF9E6' : i === 1 ? '#F5F5F5' : '#FFF5EE') : 'inherit' }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getMedal(i + 1)}
                        <Typography fontWeight="700">#{i + 1}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {r.student?.firstName?.[0]}{r.student?.lastName?.[0]}
                        </Avatar>
                        {r.student?.firstName} {r.student?.lastName}
                      </Box>
                    </TableCell>
                    <TableCell>{r.student?.grade || '-'}</TableCell>
                    <TableCell>{r.section?.name || '-'}</TableCell>
                    <TableCell><strong>{r.overallAverage?.toFixed(1)}%</strong></TableCell>
                    <TableCell>{r.gpa?.toFixed(2)}</TableCell>
                    <TableCell>
                      {r.meritCategory === 'Academic Excellence' ? (
                        <Chip label={tCommon('excellence')} color="warning" size="small" />
                      ) : r.meritCategory === 'Honor Student' ? (
                        <Chip label={tCommon('honor')} color="success" size="small" />
                      ) : (
                        <Chip label={tRank('regular')} variant="outlined" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rankings.length === 0 && <TableRow><TableCell colSpan={7} align="center">{tRank('noRankings')}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};
