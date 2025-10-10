import React from 'react';
import { Box, Collapse, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import type { Categoria, Residuo } from '../../../types/residuo';
import { formatarData } from '../constants';
import { StatusChip } from './StatusChip';
import { CategoriaChip } from './CategoriaChip';

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
