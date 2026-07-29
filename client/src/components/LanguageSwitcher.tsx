import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import { Translate } from '@mui/icons-material';
import { LANGUAGES } from '../i18n/i18n';

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleChange = (code: string) => {
    void i18n.changeLanguage(code);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleOpen} size="small" sx={{ color: 'inherit' }} title={t('languageSwitcher')}>
        <Translate fontSize="small" />
        <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600, display: { xs: 'none', md: 'inline' } }}>
          {currentLang.nativeLabel}
        </Typography>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === i18n.language}
            onClick={() => handleChange(lang.code)}
          >
            <ListItemText primary={lang.nativeLabel} secondary={lang.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
