import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import ScaleIcon from '@mui/icons-material/Scale';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import type { CategoryQuantity } from '../../../services/relatorio.service';
import { categoriaColor } from '../../../utils/categoriaColor';

interface RelatorioTableProps {
  data: CategoryQuantity[];
}

export function RelatorioTable({ data }: RelatorioTableProps) {
  const getTipoMedidaIcon = (tipo: string) => {
    return tipo === 'kg' ? <ScaleIcon fontSize="small" /> : <FormatListNumberedIcon fontSize="small" />;
  };

  const getTipoMedidaColor = (tipo: string) => {
    return tipo === 'kg' ? 'primary' : 'secondary';
  };

  const getCategoriaColor = (categoria: string) => {
    const normalized = categoria.toLowerCase();
    return categoriaColor[normalized] || '#9E9E9E';
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          mb: 4,
          maxWidth: '800px',
        }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  width: '40%',
                }}
              >
                Categoria
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  width: '35%',
                }}
              >
                Quantidade
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  width: '25%',
                }}
              >
                Medida
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={`${item.categoria}-${item.tipo_medida}-${index}`}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RecyclingIcon sx={{ color: getCategoriaColor(item.categoria) }} fontSize="small" />
                    <Chip
                      label={item.categoria}
                      size="small"
                      sx={{
                        bgcolor: getCategoriaColor(item.categoria),
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ py: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                  >
                    {item.quantidade.toLocaleString('pt-BR', {
                      minimumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
                      maximumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
                    })}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 2 }}>
                  <Chip
                    icon={getTipoMedidaIcon(item.tipo_medida)}
                    label={item.tipo_medida === 'kg' ? 'kg' : 'Unidade'}
                    color={getTipoMedidaColor(item.tipo_medida)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
