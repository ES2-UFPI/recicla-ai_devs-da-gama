/**
 * Componente para exibir resumo do total selecionado
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScaleIcon from '@mui/icons-material/Scale';
import NumbersIcon from '@mui/icons-material/Numbers';

interface TotalSelecionadoCardProps {
  total: {
    categorias: number;
    residuos: number;
    kg: number;
    unidades: number;
  };
}

export const TotalSelecionadoCard = ({ total }: TotalSelecionadoCardProps) => {
  if (total.categorias === 0) return null;

  return (
    <Card
      elevation={4}
      sx={{
        bgcolor: alpha('#4caf50', 0.1),
        border: '2px solid',
        borderColor: 'success.main',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircleIcon color="success" fontSize="large" />
          <Typography variant="h6" fontWeight={700} color="success.dark">
            Resumo da Seleção
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Categorias selecionadas:
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.dark">
              {total.categorias}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Total de resíduos:
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.dark">
              {total.residuos}
            </Typography>
          </Box>

          {total.kg > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScaleIcon fontSize="small" color="action" />
                <Typography variant="body1" color="text.secondary">
                  Peso total:
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={600} color="success.dark">
                {total.kg.toFixed(2)} kg
              </Typography>
            </Box>
          )}

          {total.unidades > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <NumbersIcon fontSize="small" color="action" />
                <Typography variant="body1" color="text.secondary">
                  Total de unidades:
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={600} color="success.dark">
                {total.unidades}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
