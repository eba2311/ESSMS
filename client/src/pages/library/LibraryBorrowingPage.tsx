import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, MenuItem, CircularProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Add, AssignmentReturn } from '@mui/icons-material';
import { libraryAPI, studentsAPI, teachersAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { canIssueReturnBook } from '../../utils/permissions';

type Tab = 'active' | 'overdue' | 'returned';

export const LibraryBorrowingPage = () => {
  const { t: tLib } = useTranslation('library');
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const canManage = canIssueReturnBook(user?.role);
  const [tab, setTab] = useState<Tab>('active');
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueDialog, setIssueDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; borrowingId: string }>({ open: false, borrowingId: '' });
  const [formData, setFormData] = useState({
    bookId: '', borrowerId: '', borrowerType: 'Student', dueDate: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusMap: Record<Tab, string | undefined> = {
        active: 'Borrowed',
        overdue: 'Overdue',
        returned: 'Returned',
      };
      const [borrowingsRes, booksRes, studentsRes, teachersRes] = await Promise.all([
        libraryAPI.listBorrowings({ status: statusMap[tab], limit: 100 }),
        libraryAPI.books({ available: 'true' }),
        studentsAPI.list({ limit: 500 }),
        teachersAPI.list({ limit: 100 }),
      ]);
      setBorrowings(borrowingsRes.data.data?.borrowings || []);
      setBooks(booksRes.data.data?.books || []);
      setStudents(studentsRes.data.data?.students || []);
      setTeachers(teachersRes.data.data || []);
    } catch {
      showError(tLib('failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleIssue = async () => {
    try {
      await libraryAPI.borrow({
        bookId: formData.bookId,
        borrowerId: formData.borrowerId,
        borrowerType: formData.borrowerType,
        dueDate: formData.dueDate || undefined,
      });
      showSuccess(tLib('bookIssued'));
      setIssueDialog(false);
      setFormData({ bookId: '', borrowerId: '', borrowerType: 'Student', dueDate: '' });
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || tLib('failedToIssue'));
    }
  };

  const handleReturn = async () => {
    try {
      const res = await libraryAPI.return(returnDialog.borrowingId);
      const fine = res.data.data?.fine?.amount;
      if (fine > 0) {
        showSuccess(tLib('bookReturnedWithFine', { fine }));
      } else {
        showSuccess(tLib('bookReturned'));
      }
      setReturnDialog({ open: false, borrowingId: '' });
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.message || tLib('failedToReturn'));
    }
  };

  const statusChip = (status: string) => {
    const map: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
      Returned: 'success', Borrowed: 'warning', Overdue: 'error',
    };
    return <Chip label={status} size="small" color={map[status] || 'default'} />;
  };

  const borrowers = formData.borrowerType === 'Student' ? students : teachers;
  const borrowerLabel = formData.borrowerType === 'Student' ? tLib('student') : tLib('teacher');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>{tLib('pageTitle')}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setIssueDialog(true)}>
            {tLib('issueBook')}
          </Button>
        )}
      </Box>

      <Box mb={3}>
        <ToggleButtonGroup value={tab} exclusive onChange={(_, v) => v && setTab(v)} size="small">
          <ToggleButton value="active">{tLib('active')}</ToggleButton>
          <ToggleButton value="overdue">{tLib('overdue')}</ToggleButton>
          <ToggleButton value="returned">{tLib('returned')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {[tLib('colId'), tLib('colBook'), tLib('colBorrower'), tLib('colType'), tLib('colIssueDate'), tLib('colDueDate'), tLib('colReturnDate'), tLib('colStatus'), tLib('colFine'), tLib('colActions')].filter((_, i) => tab !== 'returned' || i !== 9).map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {borrowings.map((b: any) => (
                  <TableRow key={b._id} hover>
                    <TableCell>{b.borrowingId}</TableCell>
                    <TableCell>{b.book?.title}</TableCell>
                    <TableCell>{b.borrower?.firstName} {b.borrower?.lastName}</TableCell>
                    <TableCell>{b.borrowerType}</TableCell>
                    <TableCell>{b.issueDate ? new Date(b.issueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{statusChip(b.status)}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>
                      {b.currentFine || b.fine || 0}
                    </TableCell>
                    {tab !== 'returned' && (
                      <TableCell>
                        {canManage && b.status !== 'Returned' && (
                          <Button size="small" variant="outlined" startIcon={<AssignmentReturn />}
                            onClick={() => setReturnDialog({ open: true, borrowingId: b._id })}>
                            {tLib('return')}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {borrowings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {tLib('noBorrowingsFound', { tab })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={issueDialog} onClose={() => setIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tLib('issueBook')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label={tLib('book')} select value={formData.bookId}
            onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}>
            {books.map((b: any) => (
              <MenuItem key={b._id} value={b._id}>
                {b.title} by {b.author} ({b.availableCopies} available)
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth margin="dense" label={tLib('borrowerType')} select value={formData.borrowerType}
            onChange={(e) => setFormData({ ...formData, borrowerType: e.target.value, borrowerId: '' })}>
            <MenuItem value="Student">{tLib('student')}</MenuItem>
            <MenuItem value="Teacher">{tLib('teacher')}</MenuItem>
          </TextField>
          <TextField fullWidth margin="dense" label={borrowerLabel} select value={formData.borrowerId}
            onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value })}>
            {borrowers.map((b: any) => (
              <MenuItem key={b._id} value={b._id}>
                {b.studentId || b.teacherId} — {b.firstName} {b.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth margin="dense" label={tLib('dueDateOptional')} type="date" value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            helperText={tLib('dueDateHelp')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialog(false)}>{tLib('cancel')}</Button>
          <Button onClick={handleIssue} variant="contained">{tLib('issue')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={returnDialog.open} onClose={() => setReturnDialog({ open: false, borrowingId: '' })}>
        <DialogTitle>{tLib('confirmReturn')}</DialogTitle>
        <DialogContent>
          <Typography>{tLib('confirmReturnMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog({ open: false, borrowingId: '' })}>{tLib('cancel')}</Button>
          <Button onClick={handleReturn} variant="contained" color="success">{tLib('confirmReturn')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
