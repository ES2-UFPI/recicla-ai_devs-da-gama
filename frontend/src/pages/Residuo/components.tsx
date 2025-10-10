import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import type { Categoria, Residuo, ResiduoStatus } from '../../types/residuo';
import { categoriaColor, formatarData, statusColor } from './constants';

export const StatusChip = ({ s }: { s: ResiduoStatus }) => (
  <Chip size="small" label={s} color={statusColor[s]} variant={s === 'CRIADO' ? 'outlined' : 'filled'} />
);

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

export const DesktopTable = ({
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
  <Box sx={{ mt: 2, overflowX: 'auto' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Categoria</TableCell>
          <TableCell>Quantidade</TableCell>
          <TableCell>Data de Cadastro</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {itens.map((r) => (
          <React.Fragment key={r.id}>
            <TableRow hover>
              <TableCell>
                <CategoriaChip categoriaId={r.categoriaId} categorias={categorias} />
              </TableCell>
              <TableCell>
                {r.quantidade} {r.unidade}
              </TableCell>
              <TableCell>{formatarData(r.dataCadastro)}</TableCell>
              <TableCell>
                <StatusChip s={r.status} />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="primary" aria-label="ver-foto" onClick={() => window.open(r.foto, '_blank')}>
                  <ImageIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="secondary" aria-label="detalhes" onClick={() => onToggle(r.id)}>
                  {expandedId === r.id ? <ExpandLessIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                <Collapse in={expandedId === r.id} timeout="auto" unmountOnExit>
                  <Box sx={{ my: 1, mx: { xs: 0.5, sm: 2 } }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Detalhes do Resíduo
                    </Typography>
                    <Stack spacing={1}>
                      {(r.historico ?? [
                        { etapa: r.status, dataHora: r.dataCadastro, descricao: 'Registro atual' },
                      ]).map((h, idx) => (
                        <Stack key={`${r.id}-hist-${idx}`} direction="row" spacing={1} alignItems="center">
                          <StatusChip s={h.etapa} />
                          <Typography variant="body2" color="text.secondary">
                            {formatarData(h.dataHora)}
                          </Typography>
                          <Typography variant="body2">— {h.descricao}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  </Box>
);
