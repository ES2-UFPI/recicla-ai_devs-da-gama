import { Chip } from '@mui/material';
import type { Categoria } from '../../../types/residuo';
import { categoriaColor } from '../constants';

export const CategoriaChip = ({ categoriaId, categorias }: { categoriaId: string; categorias: Categoria[] }) => {
  const categoria = categorias.find((c) => c.id === categoriaId);
  const nome = categoria?.nome ?? categoriaId;
  const cor = categoriaColor[categoriaId] ?? '#9e9e9e';
  return (
    <Chip
      size="small"
      label={nome}
      sx={{
        bgcolor: cor,
        color: '#fff',
        fontWeight: 600,
        '& .MuiChip-label': { px: 1.5 },
      }}
    />
  );
};
