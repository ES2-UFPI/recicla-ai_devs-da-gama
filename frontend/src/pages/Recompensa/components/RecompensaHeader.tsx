import { Box, Typography, Paper, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RedeemIcon from '@mui/icons-material/Redeem';
import StarsIcon from '@mui/icons-material/Stars';

interface RecompensaHeaderProps {
  userPoints: number;
}

export function RecompensaHeader({ userPoints }: RecompensaHeaderProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      {/* Esquerda: Título e Saldo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RedeemIcon
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: theme.palette.primary.main,
            }}
          />
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Recompensas
          </Typography>
        </Box>

        {/* Saldo de Pontos */}
        <Paper
          elevation={2}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: '0.75rem',
          }}
        >
          <StarsIcon sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
              Saldo
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {userPoints.toLocaleString('pt-BR')}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Direita: Botão Ver Histórico */}
      <Button
        variant="contained"
        color="secondary"
        onClick={() => navigate('/recompensas/historico')}
        sx={{
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontWeight: 600,
          px: { xs: 2, md: 3 },
          height: { xs: 'auto', md: '48px' },
        }}
      >
        Ver Histórico de Resgates
      </Button>
    </Box>
  );
}
