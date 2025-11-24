import { Box, Paper, Typography } from '@mui/material';

interface SummaryCardsProps {
  totalKg: number;
  totalUnidades: number;
}

export function SummaryCards({ totalKg, totalUnidades }: SummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        flexWrap: 'wrap',
        mb: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '1rem',
          minWidth: '150px',
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Total em Peso
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {totalKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg
        </Typography>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'secondary.main',
          color: 'white',
          borderRadius: '1rem',
          minWidth: '150px',
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Total em Unidades
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {totalUnidades.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </Typography>
      </Paper>
    </Box>
  );
}
