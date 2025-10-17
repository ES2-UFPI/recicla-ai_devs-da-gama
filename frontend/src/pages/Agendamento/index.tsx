import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  useMediaQuery,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RecyclingIcon from '@mui/icons-material/Recycling';
import { Navbar } from '../../components/Navbar';
import { EnderecoSelector } from '../../components/EnderecoSelector';
import { DisponibilidadeSelector } from '../../components/DisponibilidadeSelector';
import { ResiduoSelector } from '../../components/ResiduoSelector';
import { schedulingService } from '../../services/scheduling.service';
import { residueService } from '../../services/residue.service';
import type { Scheduling, SchedulingCreate, DisponibilidadeSlot } from '../../types/scheduling';
import type { Residue } from '../../types/residue';

// Mapa de cores para status
const statusColorMap: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
> = {
  pendente: 'warning',
  aceito: 'success',
  cancelado: 'error',
  coletado: 'info',
};

// Mapa de labels para status
const statusLabelMap: Record<string, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  cancelado: 'Cancelado',
  coletado: 'Coletado',
};

// Função para formatar disponibilidade
const formatarDisponibilidade = (disponibilidade: DisponibilidadeSlot[]): string => {
  return disponibilidade
    .map((slot) => `${slot.data}: ${slot.hora_inicio} - ${slot.hora_fim}`)
    .join(' | ');
};

export function Agendamento() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados principais
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [residuosMap, setResiduosMap] = useState<Map<string, Residue>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados do diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedResiduosIds, setSelectedResiduosIds] = useState<string[]>([]);
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeSlot[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Carregar agendamentos e resíduos ao montar o componente
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar agendamentos e resíduos em paralelo
      const [schedulings, residues] = await Promise.all([
        schedulingService.listMySchedulings(),
        residueService.listMyResidues(),
      ]);
      
      setAgendamentos(schedulings);
      
      // Criar mapa de resíduos para lookup rápido
      const map = new Map<string, Residue>();
      residues.forEach((residue) => map.set(residue.id, residue));
      setResiduosMap(map);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (agendamento?: Scheduling) => {
    if (agendamento) {
      setEditingId(agendamento.id);
      setSelectedAddressId(agendamento.local.address_id);
      setSelectedResiduosIds(agendamento.residuosId);
      setDisponibilidade(agendamento.disponibilidade);
      setObservacoes(agendamento.observacoes || '');
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedAddressId(null);
    setSelectedResiduosIds([]);
    setDisponibilidade([]);
    setObservacoes('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      // Validações
      if (selectedResiduosIds.length === 0) {
        setError('Selecione pelo menos um resíduo');
        return;
      }
      if (!selectedAddressId) {
        setError('Selecione um endereço');
        return;
      }
      if (disponibilidade.length === 0) {
        setError('Adicione pelo menos um horário de disponibilidade');
        return;
      }

      setSubmitting(true);
      setError(null);

      const data: SchedulingCreate = {
        residuosId: selectedResiduosIds,
        disponibilidade,
        address_id: selectedAddressId,
        observacoes: observacoes || undefined,
      };

      if (editingId) {
        // Atualizar existente
        await schedulingService.update(editingId, data);
        setSuccessMessage('Agendamento atualizado com sucesso!');
      } else {
        // Criar novo
        await schedulingService.create(data);
        setSuccessMessage('Agendamento criado com sucesso!');
      }

      // Recarregar dados
      await fetchData();
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Erro ao salvar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este agendamento?')) {
      return;
    }

    try {
      await schedulingService.delete(id);
      setSuccessMessage('Agendamento deletado com sucesso!');
      await fetchData();
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Erro ao deletar agendamento');
    }
  };

  const getResiduoInfo = (residuoId: string) => {
    return residuosMap.get(residuoId);
  };

  const isAgendamentoEditavel = (status: string) => {
    return status === 'pendente';
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

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : agendamentos.length > 0 ? (
          <Stack spacing={2}>
            {agendamentos.map((agendamento) => {
              const isEditable = isAgendamentoEditavel(agendamento.status);
              return (
                <Card
                  key={agendamento.id}
                  sx={{
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={statusLabelMap[agendamento.status]}
                        color={statusColorMap[agendamento.status]}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {isEditable && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(agendamento)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(agendamento.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Endereço */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: '1.2rem', mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {agendamento.local.apelido && `${agendamento.local.apelido}: `}
                          {agendamento.local.logradouro}, {agendamento.local.numero}
                        </Typography>
                        {agendamento.local.complemento && (
                          <Typography variant="caption" color="text.secondary">
                            {agendamento.local.complemento}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Disponibilidade */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: '1.2rem' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatarDisponibilidade(agendamento.disponibilidade)}
                      </Typography>
                    </Box>

                    {/* Resíduos */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <RecyclingIcon sx={{ fontSize: '1.2rem' }} />
                        <Typography variant="body2" fontWeight={600}>
                          Resíduos ({agendamento.residuosId.length})
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ pl: 4 }}>
                        {agendamento.residuosId.map((residuoId) => {
                          const residuo = getResiduoInfo(residuoId);
                          return (
                            <Typography
                              key={residuoId}
                              variant="caption"
                              color="text.secondary"
                            >
                              • {residuo?.quantidade} {residuo?.tipo_medida}
                              {residuo && ` (Categoria: ${residuo.categoriaId})`}
                            </Typography>
                          );
                        })}
                      </Stack>
                    </Box>

                    {/* Observações */}
                    {agendamento.observacoes && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" fontWeight={600}>
                          Observações:
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {agendamento.observacoes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
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
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
            {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              {/* Instruções */}
              <Alert severity="info">
                Apenas resíduos com status "Disponível" podem ser agendados para coleta.
              </Alert>

              {/* Seleção de Resíduos */}
              <ResiduoSelector
                onResiduosSelect={setSelectedResiduosIds}
                residuosSelecionados={selectedResiduosIds}
              />

              <Box sx={{ height: '1px', bgcolor: 'divider', my: 2 }} />

              {/* Seleção de Endereço */}
              <EnderecoSelector
                onEnderecoIdSelect={setSelectedAddressId}
                enderecoIdSelecionado={selectedAddressId}
              />

              <Box sx={{ height: '1px', bgcolor: 'divider', my: 2 }} />

              {/* Disponibilidade */}
              <DisponibilidadeSelector onDisponibilidadeChange={setDisponibilidade} />

              <Box sx={{ height: '1px', bgcolor: 'divider', my: 2 }} />

              {/* Observações */}
              <TextField
                label="Observações (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                size="small"
                placeholder="Informações adicionais sobre a coleta (ex: portão azul, interfone 101)"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={handleCloseDialog} variant="outlined" size="large">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              size="large"
              disabled={
                submitting ||
                selectedResiduosIds.length === 0 ||
                !selectedAddressId ||
                disponibilidade.length === 0
              }
            >
              {submitting ? (
                <CircularProgress size={24} />
              ) : editingId ? (
                'Atualizar'
              ) : (
                'Criar Agendamento'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar de sucesso */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
