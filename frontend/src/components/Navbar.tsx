import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { coletaService } from '../services/coleta.service';
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RedeemIcon from '@mui/icons-material/Redeem';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RecyclingIcon from '@mui/icons-material/Recycling';
import InventoryIcon from '@mui/icons-material/Inventory';

// Definição de todos os links possíveis com seus roles
const allNavLinks = [
  { label: 'Resíduos', icon: <RecyclingIcon fontSize="small" />, to: '/residuos', roles: ['produtor'] },
  { label: 'Agendamentos', icon: <CalendarMonthIcon fontSize="small" />, to: '/agendamentos', roles: ['produtor'] },
  { label: 'Coletas', icon: <LocalShippingIcon fontSize="small" />, to: '/coletas', roles: ['coletor'] },
  { label: 'Recompensas', icon: <RedeemIcon fontSize="small" />, to: '/recompensas', roles: ['produtor'] },
  { label: 'Ranking', icon: <EmojiEventsIcon fontSize="small" />, to: '/ranking', roles: ['produtor'] },
  { label: 'Relatórios', icon: <AssessmentIcon fontSize="small" />, to: '/relatorio', roles: ['produtor', 'receptor'] },
  { label: 'Inventário', icon: <InventoryIcon fontSize="small" />, to: '/inventario', roles: ['coletor'] },
  { label: 'Entregas', icon: <RedeemIcon fontSize="small" />, to: '/entregas', roles: ['coletor'] },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { hasRole } = useRoleCheck();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Breakpoint adicional: quando há muitos itens, mostrar dropdown mais cedo
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // Filtra links baseado no role do usuário (memoizado para performance)
  const navLinks = useMemo(() => {
    return allNavLinks.filter(link => hasRole(link.roles));
  }, [hasRole]);

  // Determina quantos links mostrar diretamente baseado no espaço disponível
  const maxVisibleLinks = useMemo(() => {
    if (isMobile) return 0; // Mobile: todos no menu hambúrguer
    if (isCompact && navLinks.length > 4) return 3; // Tela média com muitos links: mostrar 3 + dropdown
    return navLinks.length; // Tela grande: mostrar todos
  }, [isMobile, isCompact, navLinks.length]);

  const visibleLinks = navLinks.slice(0, maxVisibleLinks);
  const dropdownLinks = navLinks.slice(maxVisibleLinks);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [temColetaAtiva, setTemColetaAtiva] = useState(false);

  // Verificar se há coleta em andamento (apenas para coletores)
  useEffect(() => {
    const verificarColetaAtiva = async () => {
      if (hasRole(['coletor'])) {
        try {
          const coletaAtiva = await coletaService.buscarColetaAtiva();
          const coletaPendente = await coletaService.buscarColetaPendente();
          setTemColetaAtiva(!!(coletaAtiva || coletaPendente));
        } catch (error) {
          console.error('Erro ao verificar coleta ativa:', error);
        }
      }
    };

    verificarColetaAtiva();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(verificarColetaAtiva, 30000);
    
    return () => clearInterval(interval);
  }, [hasRole]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleOpenDropdown = (event: React.MouseEvent<HTMLElement>) => {
    setDropdownAnchor(event.currentTarget);
  };

  const handleCloseDropdown = () => {
    setDropdownAnchor(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre redireciona, mesmo se houver erro
      navigate('/login');
    }
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <>
      {/* Banner de Coleta Ativa */}
      {temColetaAtiva && !location.pathname.startsWith('/coleta') && (
        <Box
          sx={{
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 1,
            px: 2,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'warning.dark',
            },
          }}
          onClick={() => navigate('/coletas')}
        >
          <Typography variant="body2" fontWeight={600}>
            🚚 Você tem uma coleta em andamento • <strong>Clique aqui para continuar</strong>
          </Typography>
        </Box>
      )}

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
            {visibleLinks.map((link) => (
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
            {dropdownLinks.length > 0 && (
              <>
                <Button
                  onClick={handleOpenDropdown}
                  startIcon={<MenuIcon fontSize="small" />}
                  sx={{
                    color: 'text.primary',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '0.5rem',
                    px: '1rem',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  Mais
                </Button>
                <Menu
                  anchorEl={dropdownAnchor}
                  open={Boolean(dropdownAnchor)}
                  onClose={handleCloseDropdown}
                  sx={{ mt: '0.5rem' }}
                >
                  {dropdownLinks.map((link) => (
                    <MenuItem
                      key={link.to}
                      component={RouterLink}
                      to={link.to}
                      onClick={handleCloseDropdown}
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
              </>
            )}
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
    </>
  );
}