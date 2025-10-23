import { Chip } from '@mui/material';
import type { Categoria } from '../../../types/residuo';
import { categoriaColor } from '../constants';

export const CategoriaChip = ({ categoriaId, categorias }: { categoriaId: string; categorias: Categoria[] }) => {
  const categoria = categorias.find((c) => c.id === categoriaId);
  const nome = categoria?.nome ?? categoriaId;
  
  // Buscar cor: tenta com o nome original, depois sem acentos
  const corKey = (categoria?.nome ?? '').trim().toLowerCase();
  let cor = categoriaColor[corKey];
  
  // Se não encontrou, tenta remover acentos
  if (!cor) {
    const corKeySemAcento = corKey
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    cor = categoriaColor[corKeySemAcento];
  }
  
  // Fallback para cinza se não encontrar
  cor = cor || '#9e9e9e';
  
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
