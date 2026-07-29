import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  IconButton, Tooltip, Grid, Card, CardContent,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Refresh, MenuBook, TrendingUp,
  Campaign, AssignmentReturn,
} from '@mui/icons-material';
import { libraryAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageLibrary } from '../../utils/permissions';

const emptyForm = { isbn: '', title: '', author: '', category: '', publisher: '', publicationYear: '', quantity: 1, location: '' };

export const LibraryBooksPage = () => {
  const { t: tLib } = useTranslation('library');
  const { t: tCommon } = useTranslation('common');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = canManageLibrary(user?.role);
  const [books, setBooks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const fetchBooks = async (q?: string) => {
    setLoading(true);
    try {
      let res;
      if (q) {
        res = await libraryAPI.searchBooks({ q });
      } else {
        res = await libraryAPI.books();
      }
      setBooks(res.data.data?.books || []);
    } catch {
      showError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    libraryAPI.statistics()
      .then((r) => setStats(r.data.data))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDialog(true);
  };

  const openEdit = (book: any) => {
    setEditing(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      category: book.category,
      publisher: book.publisher || '',
      publicationYear: book.publicationYear?.toString() || '',
      quantity: book.quantity,
      location: book.location || '',
    });
    setDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        publicationYear: formData.publicationYear ? Number(formData.publicationYear) : undefined,
        quantity: Number(formData.quantity),
      };
      if (editing) {
        await libraryAPI.updateBook(editing._id, data);
        showSuccess('Book updated successfully');
      } else {
        await libraryAPI.addBook(data);
        showSuccess('Book added successfully');
      }
      setDialog(false);
      fetchBooks(search || undefined);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save book');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await libraryAPI.deleteBook(deleteDialog);
      showSuccess('Book deleted');
      setDeleteDialog(null);
      fetchBooks(search || undefined);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete book');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{tLib('title')}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>{tLib('addBook')}</Button>
        )}
      </Box>

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: tLib('totalTitles'), value: stats.books.totalTitles, icon: <MenuBook />, color: '#1B4F8A' },
            { label: tLib('availableCopies'), value: stats.books.availableCopies, icon: <MenuBook />, color: '#2D7D3A' },
            { label: tLib('borrowed'), value: stats.books.borrowedCopies, icon: <TrendingUp />, color: '#C9920A' },
            { label: tLib('activeBorrowings'), value: stats.borrowings.active, icon: <AssignmentReturn />, color: '#7C3AED' },
            { label: tLib('overdue'), value: stats.borrowings.overdue, icon: <Campaign />, color: stats.borrowings.overdue > 0 ? '#DC2626' : '#2D7D3A' },
            { label: tLib('issues30d'), value: stats.recentActivity.issuesLast30Days, icon: <TrendingUp />, color: '#B45309' },
          ].map((card) => (
            <Grid item xs={6} sm={4} md={2} key={card.label}>
              <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(229,231,235,0.6)', textAlign: 'center', py: 1.5 }}>
                <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                <Typography variant="h6" fontWeight={800}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box display="flex" gap={1} mb={3}>
        <TextField size="small" placeholder={tLib('searchPlaceholder')} value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchBooks(search)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ flex: 1, maxWidth: 400 }} />
        <Button variant="outlined" onClick={() => fetchBooks(search)}>{tCommon('searchButton')}</Button>
        {search && <Button onClick={() => { setSearch(''); fetchBooks(); }}>{tCommon('clear')}</Button>}
        <Button variant="text" startIcon={<Refresh />} onClick={() => fetchBooks()} />
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {[tLib('colTitle'), tLib('colAuthor'), tLib('colCategory'), tLib('colIsbn'), tLib('colTotal'), tLib('colAvailable'), tLib('colLocation'), ...(canManage ? [tCommon('actions')] : [])].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((b: any) => (
                  <TableRow key={b._id} hover>
                    <TableCell><strong>{b.title}</strong></TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell><Chip label={b.category} size="small" variant="outlined" /></TableCell>
                    <TableCell>{b.isbn || '-'}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                    <TableCell>
                      <Chip label={b.availableCopies} size="small"
                        color={b.availableCopies > 0 ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>{b.location || '-'}</TableCell>
                    <TableCell>
                      {canManage && (
                        <>
                          <Tooltip title={tCommon('edit')}><IconButton size="small" onClick={() => openEdit(b)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={tCommon('delete')}><IconButton size="small" onClick={() => setDeleteDialog(b._id)} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {books.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 8 : 7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {tLib('noBooks')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? tLib('editBook') : tLib('addBook')}</DialogTitle>
        <DialogContent>
          {[
            { label: 'Title *', field: 'title' },
            { label: 'Author *', field: 'author' },
            { label: 'Category *', field: 'category' },
            { label: 'ISBN', field: 'isbn' },
            { label: 'Publisher', field: 'publisher' },
            { label: 'Publication Year', field: 'publicationYear' },
            { label: 'Location', field: 'location' },
          ].map(({ label, field }) => (
            <TextField key={field} fullWidth margin="dense" label={label}
              value={(formData as any)[field]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} />
          ))}
          <TextField fullWidth margin="dense" label={`${tLib('quantity')} *`} type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">{editing ? tCommon('update') : tCommon('add')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>{tLib('deleteBook')}</DialogTitle>
        <DialogContent>
          <Typography>{tLib('deleteBookConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>{tCommon('cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">{tCommon('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
