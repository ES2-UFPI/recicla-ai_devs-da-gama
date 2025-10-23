import { Box, Button, Card, CardActions, CardContent, Collapse, Stack, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import type { Categoria, Residuo } from '../../../types/residuo';
import { formatarData } from '../constants';
import { StatusChip } from './StatusChip';
import { CategoriaChip } from './CategoriaChip';

export const MobileCards = ({
  itens,
  categorias,
  expandedId,
  onToggle,
}: {
  itens: Residuo[];
  categorias: Categoria[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) => (
  <Stack spacing={2} sx={{ mt: 2 }}>
    {itens.map((r) => (
      <Card key={r.id} variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <CategoriaChip categoriaId={r.categoriaId} categorias={categorias} />
            <StatusChip s={r.status} />
          </Stack>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Quantidade:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {r.quantidade} {r.unidade}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Data:
              </Typography>
              <Typography variant="body2">{formatarData(r.dataCadastro)}</Typography>
            </Box>
          </Stack>

          <Collapse in={expandedId === r.id} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Histórico
              </Typography>
              <Stack spacing={1}>
                {(r.historico ?? [
                  { etapa: r.status, dataHora: r.dataCadastro, descricao: 'Registro atual' },
                ]).map((h, idx) => (
                  <Box key={`${r.id}-hist-${idx}`} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <StatusChip s={h.etapa} />
                      <Typography variant="caption" color="text.secondary">
                        {formatarData(h.dataHora)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2">{h.descricao}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button size="small" startIcon={<ImageIcon />} onClick={() => window.open(r.foto, '_blank')} sx={{ textTransform: 'none' }}>
            Ver Foto
          </Button>
          <Button size="small" startIcon={expandedId === r.id ? <ExpandLessIcon /> : <VisibilityIcon />} onClick={() => onToggle(r.id)} sx={{ textTransform: 'none' }}>
            {expandedId === r.id ? 'Ocultar' : 'Detalhes'}
          </Button>
        </CardActions>
      </Card>
    ))}
  </Stack>
);
