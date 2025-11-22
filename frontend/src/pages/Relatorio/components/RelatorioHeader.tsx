import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

export function RelatorioHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ mb: 4, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <AssessmentIcon
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
          Relatório de Reciclagem
        </Typography>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Veja o quanto você contribuiu para a missão de reciclagem
      </Typography>
    </Box>
  );
}
