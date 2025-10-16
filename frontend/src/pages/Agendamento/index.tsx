import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Stack,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Navbar } from '../../components/Navbar';

// Interface para Resíduo (simplificado para exibição)
interface ResiduoAgendamento {
  id: string;
  quantidade: number;
  unidade: string;
  categoria: string;
}

// Interface para Agendamento
interface Agendamento {
  id: string;
  produtorId: string;
  residuosId: string[];
  disponibilidade: string[]; // [horarioInicio1, horarioFim1, horarioInicio2, horarioFim2, ...]
  local: string;
  status: 'pendente' | 'aceito' | 'cancelado';
  observacoes?: string;
  residuos?: ResiduoAgendamento[]; // Dados populados para exibição
}

// Mock data
const mockAgendamentos: Agendamento[] = [
  {
    id: '1',
    produtorId: 'user123',
    residuosId: ['res1', 'res2'],
    disponibilidade: ['2025-10-20T14:00', '2025-10-20T16:00', '2025-10-21T09:00', '2025-10-21T11:00'],
    local: 'Rua A, 123 - Centro',
    status: 'aceito',
    observacoes: 'Portão verde',
    residuos: [
      { id: 'res1', quantidade: 15, unidade: 'kg', categoria: 'Eletrônicos' },
      { id: 'res2', quantidade: 8, unidade: 'kg', categoria: 'Plástico' },
    ],
  },
  {
    id: '2',
    produtorId: 'user123',
    residuosId: ['res3'],
    disponibilidade: ['2025-10-22T10:00', '2025-10-22T12:00'],
    local: 'Avenida B, 456 - Bairro X',
    status: 'pendente',
    residuos: [
      { id: 'res3', quantidade: 25, unidade: 'kg', categoria: 'Papel' },
    ],
  },
  {
    id: '3',
    produtorId: 'user123',
    residuosId: ['res4', 'res5'],
    disponibilidade: ['2025-10-18T16:00', '2025-10-18T18:00'],
    local: 'Rua C, 789 - Zona Industrial',
    status: 'cancelado',
    observacoes: 'Cancelado por indisponibilidade',
    residuos: [
      { id: 'res4', quantidade: 50, unidade: 'kg', categoria: 'Metal' },
      { id: 'res5', quantidade: 12, unidade: 'unidade', categoria: 'Vidro' },
    ],
  },
];

// Mapa de cores para status
const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  pendente: 'warning',
  aceito: 'success',
  cancelado: 'error',
};

// Mapa de labels para status
const statusLabelMap: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  cancelado: 'Cancelado',
};

// Função para formatar disponibilidade
const formatarDisponibilidade = (disponibilidade: string[]): string => {
  const periodos: string[] = [];
  for (let i = 0; i < disponibilidade.length; i += 2) {
    if (i + 1 < disponibilidade.length) {
      const inicio = new Date(disponibilidade[i]);
      const fim = new Date(disponibilidade[i + 1]);
      const data = inicio.toLocaleDateString('pt-BR');
      const horaInicio = inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const horaFim = fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      periodos.push(`${data}: ${horaInicio} - ${horaFim}`);
    }
  }
  return periodos.join(' | ');
};

export function Agendamento() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(mockAgendamentos);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Agendamento, 'id'>>({
    produtorId: 'user123', // Em produção, virá do contexto de autenticação
    residuosId: [],
    disponibilidade: [],
    local: '',
    status: 'pendente',
    observacoes: '',
  });

  // Handlers
  const handleOpenDialog = (agendamento?: Agendamento) => {
    if (agendamento) {
      setEditingId(agendamento.id);
      setFormData({
        produtorId: agendamento.produtorId,
        residuosId: agendamento.residuosId,
        disponibilidade: agendamento.disponibilidade,
        local: agendamento.local,
        status: agendamento.status,
        observacoes: agendamento.observacoes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        produtorId: 'user123',
        residuosId: [],
        disponibilidade: [],
        local: '',
        status: 'pendente',
        observacoes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      // Editar existente
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === editingId ? { ...a, ...formData } : a
        )
      );
    } else {
      // Criar novo
      const novoAgendamento: Agendamento = {
        id: Date.now().toString(),
        ...formData,
      };
      setAgendamentos([...agendamentos, novoAgendamento]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setAgendamentos(agendamentos.filter((a) => a.id !== id));
  };

  const handleInputChange = (
    field: keyof Omit<Agendamento, 'id'>,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleToggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon
              sx={{
                fontSize: '2rem',
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Meus Agendamentos
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: '0.5rem',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Novo Agendamento
          </Button>
        </Box>

        {/* Grid de Agendamentos */}
        {agendamentos.length > 0 ? (
          <>
            {/* Desktop: Tabela com linhas expansíveis */}
            {!isMobile && (
              <Box sx={{ mt: 2, overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                      <TableCell sx={{ fontWeight: 700, width: '25%' }}>Endereço</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '30%' }}>Disponibilidade</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '15%' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: '30%' }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agendamentos.map((agendamento) => (
                      <Box key={agendamento.id} component={TableRow}>
                        <TableRow hover>
                          <TableCell sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {agendamento.local}
                          </TableCell>
                          <TableCell>
                            {formatarDisponibilidade(agendamento.disponibilidade)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabelMap[agendamento.status]}
                              color={statusColorMap[agendamento.status]}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="secondary"
                              aria-label="detalhes"
                              onClick={() => handleToggleExpanded(agendamento.id)}
                            >
                              {expandedId === agendamento.id ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="editar"
                              onClick={() => handleOpenDialog(agendamento)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{ color: theme.palette.error.main }}
                              aria-label="deletar"
                              onClick={() => handleDelete(agendamento.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                            <Collapse
                              in={expandedId === agendamento.id}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ my: 2, mx: { xs: 0.5, sm: 2 } }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                  Resíduos para Coleta
                                </Typography>
                                {agendamento.residuos && agendamento.residuos.length > 0 ? (
                                  <Stack spacing={1}>
                                    {agendamento.residuos.map((residuo, idx) => (
                                      <Box
                                        key={residuo.id}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2,
                                          p: 1,
                                          bgcolor: theme.palette.action.hover,
                                          borderRadius: '0.5rem',
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {idx + 1}.
                                        </Typography>
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                          {residuo.categoria}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {residuo.quantidade} {residuo.unidade}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Nenhum resíduo cadastrado
                                  </Typography>
                                )}
                                {agendamento.observacoes && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      Observações:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {agendamento.observacoes}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Box>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Mobile: Cards em coluna única */}
            {isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {agendamentos.map((agendamento) => (
                  <Card
                    key={agendamento.id}
                    sx={{
                      borderRadius: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:active': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={statusLabelMap[agendamento.status]}
                          color={statusColorMap[agendamento.status]}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          mb: 1.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        <LocationOnIcon sx={{ fontSize: '1.2rem', mt: 0.25 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {agendamento.local}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        <AccessTimeIcon sx={{ fontSize: '1.2rem' }} />
                        <Typography variant="body2">
                          {formatarDisponibilidade(agendamento.disponibilidade)}
                        </Typography>
                      </Box>
                      {agendamento.residuos && agendamento.residuos.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Resíduos: {agendamento.residuos.length}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleToggleExpanded(agendamento.id)}
                        sx={{
                          color: theme.palette.secondary.main,
                          textTransform: 'none',
                        }}
                      >
                        {expandedId === agendamento.id ? 'Ocultar' : 'Ver'}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(agendamento)}
                        sx={{
                          color: theme.palette.primary.main,
                          textTransform: 'none',
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(agendamento.id)}
                        sx={{
                          color: theme.palette.error.main,
                          textTransform: 'none',
                        }}
                      >
                        Deletar
                      </Button>
                    </CardActions>
                    {expandedId === agendamento.id && (
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Resíduos para Coleta
                        </Typography>
                        {agendamento.residuos && agendamento.residuos.length > 0 ? (
                          <Stack spacing={1}>
                            {agendamento.residuos.map((residuo, idx) => (
                              <Box
                                key={residuo.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 1,
                                  bgcolor: theme.palette.action.hover,
                                  borderRadius: '0.5rem',
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {idx + 1}.
                                </Typography>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {residuo.categoria}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {residuo.quantidade} {residuo.unidade}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Nenhum resíduo cadastrado
                          </Typography>
                        )}
                        {agendamento.observacoes && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Observações:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {agendamento.observacoes}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: theme.palette.action.hover,
              borderRadius: '0.75rem',
              border: `2px dashed ${theme.palette.divider}`,
            }}
          >
            <CalendarMonthIcon
              sx={{
                fontSize: '3rem',
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Nenhum agendamento encontrado
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: '0.5rem',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Criar primeiro agendamento
            </Button>
          </Box>
        )}

        {/* Dialog para criar/editar agendamento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Local de Coleta"
              value={formData.local}
              onChange={(e) => handleInputChange('local', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Ex: Rua A, 123 - Centro"
            />
            <TextField
              label="Observações"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              size="small"
              placeholder="Informações adicionais sobre a coleta"
            />
            <TextField
              label="Status"
              select
              value={formData.status}
              onChange={(e) =>
                handleInputChange(
                  'status',
                  e.target.value as Agendamento['status']
                )
              }
              fullWidth
              variant="outlined"
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="pendente">Pendente</option>
              <option value="aceito">Aceito</option>
              <option value="cancelado">Cancelado</option>
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Nota: A seleção de resíduos e horários de disponibilidade será implementada em breve.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
            >
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
