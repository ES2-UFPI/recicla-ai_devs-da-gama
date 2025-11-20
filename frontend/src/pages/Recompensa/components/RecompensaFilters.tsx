import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import type { TipoRecompensa, OrdenacaoPontos } from '../types';

interface RecompensaFiltersProps {
  tipoFiltro: TipoRecompensa;
  onTipoChange: (tipo: TipoRecompensa) => void;
  ordenacao: OrdenacaoPontos;
  onOrdenacaoChange: (ordenacao: OrdenacaoPontos) => void;
  totalResultados: number;
}

export function RecompensaFilters({
  tipoFiltro,
  onTipoChange,
  ordenacao,
  onOrdenacaoChange,
  totalResultados,
}: RecompensaFiltersProps) {
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: '0.75rem' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={tipoFiltro}
              label="Tipo"
              onChange={(e) => onTipoChange(e.target.value as TipoRecompensa)}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="produto">Produtos</MenuItem>
              <MenuItem value="voucher">Vouchers</MenuItem>
              <MenuItem value="cupom">Cupons</MenuItem>
              <MenuItem value="desconto">Descontos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Ordenar por Pontos</InputLabel>
            <Select
              value={ordenacao}
              label="Ordenar por Pontos"
              onChange={(e) => onOrdenacaoChange(e.target.value as OrdenacaoPontos)}
            >
              <MenuItem value="menor">Menor para Maior</MenuItem>
              <MenuItem value="maior">Maior para Menor</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'center', md: 'right' }}>
            {totalResultados} recompensa(s) encontrada(s)
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
