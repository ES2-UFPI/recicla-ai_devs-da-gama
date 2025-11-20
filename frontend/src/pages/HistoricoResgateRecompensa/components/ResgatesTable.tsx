import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { tipoIcons } from '../icons';
import { tipoLabels } from '../constants';
import { formatarData } from '../utils/dateFormatter';
import type { ResgateResponse, Recompensa } from '../../../services/recompensaService';

interface ResgatesTableProps {
  resgates: ResgateResponse[];
  recompensasMap: Map<string, Recompensa>;
  page: number;
  rowsPerPage: number;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVerDetalhes: (recompensaId: string) => void;
}

export function ResgatesTable({
  resgates,
  recompensasMap,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onVerDetalhes,
}: ResgatesTableProps) {
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>
                Recompensa
              </TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>
                Tipo
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                Pontos Gastos
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
                Data do Resgate
              </TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resgates.map((resgate) => {
              const recompensa = recompensasMap.get(resgate.recompensa_id);
              
              return (
                <TableRow
                  key={resgate.id}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    {recompensa?.nome || 'Recompensa não disponível'}
                  </TableCell>
                  <TableCell align="center">
                    {recompensa?.tipo && (
                      <Chip
                        icon={tipoIcons[recompensa.tipo]}
                        label={tipoLabels[recompensa.tipo]}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <StarsIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {resgate.pontos_gastos.toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {formatarData(resgate.data_resgate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => onVerDetalhes(resgate.recompensa_id)}
                      disabled={!recompensa}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={resgates.length >= rowsPerPage ? (page + 1) * rowsPerPage + 1 : page * rowsPerPage + resgates.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Resgates por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
        }
      />
    </>
  );
}
