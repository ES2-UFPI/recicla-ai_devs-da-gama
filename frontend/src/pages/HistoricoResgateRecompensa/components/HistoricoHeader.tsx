import { Box, Typography, Paper, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';

export function HistoricoHeader() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        Voltar
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HistoryIcon
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: theme.palette.primary.main,
          }}
        />
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          Histórico de Resgates
        </Typography>
      </Box>

      {/* Info Card */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: '0.5rem',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Acompanhe seu histórico de resgates e veja os detalhes de cada recompensa.
        </Typography>
      </Paper>
    </Box>
  );
}
