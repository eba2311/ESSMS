import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B4F8A',
      light: '#3B82F6',
      dark: '#16437A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F766E',
      light: '#14B8A6',
      dark: '#0D5E58',
    },
    success: {
      main: '#2D7D3A',
      light: '#22C55E',
      dark: '#1F5C2A',
    },
    warning: {
      main: '#C9920A',
      light: '#F59E0B',
      dark: '#A67A08',
    },
    error: {
      main: '#B5251A',
      light: '#EF4444',
      dark: '#8F1D15',
    },
    info: {
      main: '#1B4F8A',
      light: '#DBEAFE',
    },
    background: {
      default: '#F8F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Ethiopic", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1 },
    h2: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 },
    h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h5: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, lineHeight: 1.5 },
    body1: { lineHeight: 1.65, fontSize: '0.9375rem' },
    body2: { lineHeight: 1.6, fontSize: '0.8125rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    caption: { lineHeight: 1.5 },
    overline: { letterSpacing: '0.08em', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
    '0 2px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
    '0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
    '0 6px 16px rgba(0,0,0,0.06), 0 3px 6px rgba(0,0,0,0.03)',
    '0 8px 24px rgba(0,0,0,0.07), 0 4px 8px rgba(0,0,0,0.03)',
    '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.03)',
    '0 16px 40px rgba(0,0,0,0.09), 0 6px 12px rgba(0,0,0,0.03)',
    '0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.03)',
    '0 24px 56px rgba(0,0,0,0.11), 0 8px 16px rgba(0,0,0,0.03)',
    '0 28px 64px rgba(0,0,0,0.12), 0 10px 20px rgba(0,0,0,0.03)',
    '0 32px 72px rgba(0,0,0,0.13), 0 12px 24px rgba(0,0,0,0.03)',
    '0 36px 80px rgba(0,0,0,0.14), 0 12px 24px rgba(0,0,0,0.03)',
    '0 40px 88px rgba(0,0,0,0.15), 0 14px 28px rgba(0,0,0,0.03)',
    '0 44px 96px rgba(0,0,0,0.16), 0 14px 28px rgba(0,0,0,0.03)',
    '0 48px 104px rgba(0,0,0,0.17), 0 16px 32px rgba(0,0,0,0.03)',
    '0 52px 112px rgba(0,0,0,0.18), 0 16px 32px rgba(0,0,0,0.03)',
    '0 56px 120px rgba(0,0,0,0.19), 0 18px 36px rgba(0,0,0,0.03)',
    '0 60px 128px rgba(0,0,0,0.20), 0 18px 36px rgba(0,0,0,0.03)',
    '0 64px 136px rgba(0,0,0,0.21), 0 20px 40px rgba(0,0,0,0.03)',
    '0 68px 144px rgba(0,0,0,0.22), 0 20px 40px rgba(0,0,0,0.03)',
    '0 72px 152px rgba(0,0,0,0.23), 0 22px 44px rgba(0,0,0,0.03)',
    '0 76px 160px rgba(0,0,0,0.24), 0 22px 44px rgba(0,0,0,0.03)',
    '0 80px 168px rgba(0,0,0,0.25), 0 24px 48px rgba(0,0,0,0.03)',
    '0 84px 176px rgba(0,0,0,0.26), 0 24px 48px rgba(0,0,0,0.03)',
    '0 88px 184px rgba(0,0,0,0.27), 0 26px 52px rgba(0,0,0,0.03)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '9px 20px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 14px -3px rgba(27,79,138,0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: 'none',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1B4F8A 0%, #2563EB 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #16437A 0%, #1D4ED8 100%)',
            boxShadow: '0 6px 20px -4px rgba(27,79,138,0.45)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, backgroundColor: 'rgba(27,79,138,0.04)' },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(27,79,138,0.06)' },
        },
        sizeSmall: {
          padding: '5px 14px',
          fontSize: '0.75rem',
          borderRadius: 8,
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '0.9375rem',
          borderRadius: 12,
        },
        colorInherit: {
          background: 'linear-gradient(135deg, #374151 0%, #4B5563 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
            boxShadow: '0 4px 14px -3px rgba(0,0,0,0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid rgba(229,231,235,0.8)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 24px -6px rgba(0,0,0,0.08)',
            borderColor: 'rgba(27,79,138,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' },
        elevation2: { boxShadow: '0 2px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' },
        elevation3: { boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)' },
        elevation4: { boxShadow: '0 6px 16px rgba(0,0,0,0.06), 0 3px 6px rgba(0,0,0,0.03)' },
        elevation8: { boxShadow: '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.03)' },
        elevation16: { boxShadow: '0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.03)' },
        elevation24: { boxShadow: '0 24px 56px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.03)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#111827',
          boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F172A',
          color: '#E2E8F0',
          border: 'none',
          backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #0C1322 100%)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '10px 14px',
          color: 'rgba(255,255,255,0.55)',
          transition: 'all 0.15s ease',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: '#FFFFFF',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(59,130,246,0.15)',
            color: '#FFFFFF',
            fontWeight: 600,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 18,
              borderRadius: '0 3px 3px 0',
              background: 'linear-gradient(180deg, #3B82F6, #2563EB)',
            },
            '&:hover': {
              backgroundColor: 'rgba(59,130,246,0.2)',
            },
            '& .MuiListItemIcon-root': { color: '#FFFFFF' },
            '& .MuiTypography-root': { fontWeight: 600 },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.4)',
          minWidth: 38,
          transition: 'color 0.15s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.01em',
          height: 26,
          transition: 'all 0.15s ease',
        },
        outlined: { borderWidth: 1 },
        filled: {
          '&.MuiChip-colorSuccess': {
            background: 'rgba(34,197,94,0.1)',
            color: '#15803D',
          },
          '&.MuiChip-colorWarning': {
            background: 'rgba(245,158,11,0.1)',
            color: '#B45309',
          },
          '&.MuiChip-colorError': {
            background: 'rgba(239,68,68,0.1)',
            color: '#DC2626',
          },
          '&.MuiChip-colorInfo': {
            background: 'rgba(59,130,246,0.1)',
            color: '#2563EB',
          },
          '&.MuiChip-colorDefault': {
            background: 'rgba(107,114,128,0.08)',
            color: '#6B7280',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F9FAFB',
            color: '#6B7280',
            fontWeight: 700,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid #E5E7EB',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.1s ease',
          '&:hover': { backgroundColor: 'rgba(59,130,246,0.02)' },
          '&:last-of-type .MuiTableCell-body': { borderBottom: 'none' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#F3F4F6',
          padding: '14px 16px',
          fontSize: '0.8125rem',
        },
        body: { color: '#374151' },
        head: { whiteSpace: 'nowrap' },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#F9FAFB',
            fontSize: '0.875rem',
            transition: 'all 0.15s ease',
            '& fieldset': { borderColor: '#E5E7EB', transition: 'border-color 0.15s ease' },
            '&:hover fieldset': { borderColor: '#93C5FD' },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
              '& fieldset': { borderColor: '#3B82F6', borderWidth: 1 },
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2563EB',
            fontWeight: 600,
          },
          '& .MuiFormHelperText-root': { marginLeft: 4, fontSize: '0.75rem' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#F9FAFB',
          fontSize: '0.875rem',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          padding: '8px 12px',
          fontSize: '0.8125rem',
          transition: 'all 0.1s ease',
          '&:hover': { backgroundColor: 'rgba(59,130,246,0.06)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(59,130,246,0.1)',
            color: '#1D4ED8',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'rgba(59,130,246,0.14)' },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: '0.8125rem' } },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#E0E7FF',
          color: '#1D4ED8',
          fontWeight: 700,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E5E7EB' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          backgroundColor: '#111827',
          fontSize: '0.6875rem',
          padding: '5px 10px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          lineHeight: 1.4,
        },
        arrow: { color: '#111827' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
          '& .MuiTabs-flexContainer': { gap: 2 },
          '& .MuiTabs-indicator': {
            height: 2.5,
            borderRadius: '2px 2px 0 0',
            background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          minHeight: 40,
          padding: '8px 16px',
          borderRadius: '10px 10px 0 0',
          transition: 'all 0.15s ease',
          color: '#9CA3AF',
          borderBottom: '2px solid transparent',
          '&:hover': { color: '#374151', backgroundColor: 'rgba(0,0,0,0.02)' },
          '&.Mui-selected': { color: '#1B4F8A' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, padding: '12px 16px', fontSize: '0.8125rem', fontWeight: 500 },
        standardSuccess: {
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1px solid #BBF7D0',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          border: '1px solid #FDE68A',
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #BFDBFE',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem', padding: '20px 24px 8px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '8px 24px 16px', fontSize: '0.875rem' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '8px 24px 20px', gap: 8 },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15,23,42,0.4)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 6, backgroundColor: 'rgba(27,79,138,0.08)' },
        bar: { borderRadius: 999, background: 'linear-gradient(90deg, #2563EB, #3B82F6)' },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: '#2563EB' } },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.8125rem',
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            },
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: '1px solid #F3F4F6' },
        toolbar: { paddingLeft: 3 },
        selectLabel: { fontSize: '0.8125rem' },
        displayedRows: { fontSize: '0.8125rem' },
      },
    },
  },
});

export default theme;
