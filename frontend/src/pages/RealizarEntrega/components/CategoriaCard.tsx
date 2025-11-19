/**
 * Componente para exibir uma categoria de resíduos agrupada
 */

import {
  Card,
  CardContent,
  Box,
  Typography,
  Checkbox,
  Chip,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { CategoriaAgrupada } from '../types';

interface CategoriaCardProps {
  categoria: CategoriaAgrupada;
  categoriaNome: string;
  selecionada: boolean;
  onToggle: () => void;
}

export const CategoriaCard = ({
  categoria,
  categoriaNome,
  selecionada,
  onToggle,
}: CategoriaCardProps) => {
  const { totalKg, totalUnidades, quantidadeResiduos } = categoria;

  return (
    <Card
      onClick={onToggle}
      sx={{
        cursor: 'pointer',
        border: 2,
        borderColor: selecionada ? 'success.main' : 'grey.300',
        bgcolor: selecionada ? alpha('#4caf50', 0.08) : 'background.paper',
        transition: 'all 0.3s ease',
        transform: selecionada ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selecionada ? 4 : 1,
        '&:hover': {
          borderColor: selecionada ? 'success.dark' : 'grey.400',
          boxShadow: 3,
          transform: 'scale(1.01)',
        },
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Checkbox */}
          <Checkbox
            checked={selecionada}
            icon={<RadioButtonUncheckedIcon />}
            checkedIcon={<CheckCircleIcon />}
            color="success"
            sx={{ p: 0 }}
          />

          {/* Informações da Categoria */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600} color={selecionada ? 'success.main' : 'text.primary'}>
              {categoriaNome}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip
                label={`${quantidadeResiduos} resíduo${quantidadeResiduos !== 1 ? 's' : ''}`}
                size="small"
                color={selecionada ? 'success' : 'default'}
                variant={selecionada ? 'filled' : 'outlined'}
              />
              
              {totalKg > 0 && (
                <Chip
                  label={`${totalKg.toFixed(2)} kg`}
                  size="small"
                  color={selecionada ? 'success' : 'default'}
                  variant={selecionada ? 'filled' : 'outlined'}
                />
              )}
              
              {totalUnidades > 0 && (
                <Chip
                  label={`${totalUnidades} unidade${totalUnidades !== 1 ? 's' : ''}`}
                  size="small"
                  color={selecionada ? 'success' : 'default'}
                  variant={selecionada ? 'filled' : 'outlined'}
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
