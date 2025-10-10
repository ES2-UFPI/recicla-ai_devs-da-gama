import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  Button,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RedeemIcon from '@mui/icons-material/Redeem';
// Troque DeleteIcon por RecyclingIcon para um ícone mais relacionado a resíduos
import RecyclingIcon from '@mui/icons-material/Recycling';

const navLinks = [
  { label: 'Página Inicial', icon: <HomeIcon fontSize="small" />, to: '/' },
  { label: 'Resíduos', icon: <RecyclingIcon fontSize="small" />, to: '/residuos' },
  { label: 'Agendamentos', icon: <CalendarMonthIcon fontSize="small" />, to: '/agendamentos' },
  { label: 'Recompensas', icon: <RedeemIcon fontSize="small" />, to: '/recompensas' },
  { label: 'Ranking', icon: <EmojiEventsIcon fontSize="small" />, to: '/ranking' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={2}
      sx={{
        bgcolor: 'background.default',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '0.05rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            '&:hover': { opacity: 0.8 },
          }}
        >
          ♻️ ReciclaAi
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: '0.5rem', flex: 1, ml: '2rem' }}>
            {navLinks.map((link) => (
              <Button
                key={link.to}
                component={RouterLink}
                to={link.to}
                startIcon={link.icon}
                sx={{
                  color: isActiveRoute(link.to) ? 'primary.main' : 'text.primary',
                  fontWeight: isActiveRoute(link.to) ? 600 : 500,
                  textTransform: 'none',
                  borderRadius: '0.5rem',
                  px: '1rem',
                  bgcolor: isActiveRoute(link.to) ? 'action.hover' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>
        )}

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleOpenMenu}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* User Avatar */}
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: { xs: '2rem', md: '2.25rem' },
                height: { xs: '2rem', md: '2.25rem' },
                bgcolor: 'primary.main',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Box>

        {/* Mobile Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
          sx={{ mt: '0.5rem' }}
        >
          {navLinks.map((link) => (
            <MenuItem
              key={link.to}
              component={RouterLink}
              to={link.to}
              onClick={handleCloseMenu}
              sx={{
                color: isActiveRoute(link.to) ? 'primary.main' : 'text.primary',
                fontWeight: isActiveRoute(link.to) ? 600 : 400,
                gap: '0.75rem',
              }}
            >
              {link.icon}
              {link.label}
            </MenuItem>
          ))}
        </Menu>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleCloseUserMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: '0.5rem' }}
        >
          <MenuItem
            component={RouterLink}
            to="/perfil"
            onClick={handleCloseUserMenu}
          >
            Meu Perfil
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}