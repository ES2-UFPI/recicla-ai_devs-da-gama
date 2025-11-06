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
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
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
import { categoriaService } from '../../services/categoria.service';
import type { Scheduling, SchedulingCreate, DisponibilidadeSlot } from '../../types/scheduling';
import type { Residue } from '../../types/residue';
import type { Categoria } from '../../types/categoria';


// Mapa de cores para status
const statusColorMap: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
> = {
  pendente: 'warning',
  aceito: 'success',
  cancelado: 'error',
  coletado: 'info',
  concluido: 'success',
};

// Mapa de labels para status
const statusLabelMap: Record<string, string> = {
  pendente: 'PENDENTE',
  aceito: 'ACEITO',
  cancelado: 'CANCELADO',
  coletado: 'COLETADO',
  concluido: 'CONCLUÍDO',
};

// Função para formatar disponibilidade (converte UTC para horário local)
const formatarDisponibilidade = (disponibilidade: DisponibilidadeSlot[]): string => {
  return disponibilidade
    .map((slot) => {
      // Backend retorna em UTC (formato: dd/mm/yyyy HH:mm)
      // Precisamos converter para horário local do navegador para exibição
      try {
        const [dia, mes, ano] = slot.data.split('/');
        const [horaInicio, minutoInicio] = slot.hora_inicio.split(':');
        const [horaFim, minutoFim] = slot.hora_fim.split(':');
        
        // Criar Date UTC - backend envia tudo em UTC
        const dataHoraInicioUTC = new Date(Date.UTC(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia),
          parseInt(horaInicio),
          parseInt(minutoInicio)
        ));
        
        const dataHoraFimUTC = new Date(Date.UTC(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia),
          parseInt(horaFim),
          parseInt(minutoFim)
        ));
        
        // Formatar em horário local do navegador (Brasília: UTC-3)
        // toLocaleDateString e toLocaleTimeString já convertem automaticamente para o timezone local do navegador
        const dataLocal = dataHoraInicioUTC.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        
        const horaInicioLocal = dataHoraInicioUTC.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        
        const horaFimLocal = dataHoraFimUTC.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        
        return `${dataLocal}: ${horaInicioLocal} - ${horaFimLocal}`;
      } catch (error) {
        // Fallback se houver erro na conversão
        console.error('Erro ao converter timezone:', error);
        return `${slot.data}: ${slot.hora_inicio} - ${slot.hora_fim}`;
      }
    })
    .join(' | ');
};

export function Agendamento() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados principais
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [residuosMap, setResiduosMap] = useState<Map<string, Residue>>(new Map());
  const [categoriasMap, setCategoriasMap] = useState<Map<string, Categoria>>(new Map());
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
      
      // Buscar agendamentos, resíduos e categorias em paralelo
      const [schedulings, residues, categorias] = await Promise.all([
        schedulingService.listMySchedulings(),
        residueService.listMyResidues(),
        categoriaService.listActive(),
      ]);
      
      setAgendamentos(schedulings);
      
      // Criar mapa de resíduos para lookup rápido
      const residuesMap = new Map<string, Residue>();
      residues.forEach((residue) => residuesMap.set(residue.id, residue));
      setResiduosMap(residuesMap);
      
      // Criar mapa de categorias para lookup rápido
      const categoriasMapTemp = new Map<string, Categoria>();
      categorias.forEach((cat) => categoriasMapTemp.set(cat.id, cat));
      setCategoriasMap(categoriasMapTemp);
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
      // Validações no frontend
      if (selectedResiduosIds.length === 0) {
        setError('⚠️ Selecione pelo menos um resíduo para agendar a coleta');
        return;
      }
      if (!selectedAddressId) {
        setError('⚠️ Selecione um endereço para a coleta');
        return;
      }
      if (disponibilidade.length === 0) {
        setError('⚠️ Adicione pelo menos um horário de disponibilidade');
        return;
      }

      // Validação adicional: verificar se todos os slots têm data, hora início e fim
      const slotsInvalidos = disponibilidade.some(
        slot => !slot.data || !slot.hora_inicio || !slot.hora_fim
      );
      if (slotsInvalidos) {
        setError('⚠️ Preencha todos os campos de data, hora de início e hora de fim nos horários de disponibilidade');
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

      // Recarregar dados e fechar diálogo apenas em caso de sucesso
      await fetchData();
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      
      // Tratamento detalhado de erros
      const error = err as { 
        response?: { 
          data?: { 
            detail?: string | { msg: string; type: string }[];
          };
          status?: number;
        };
        message?: string;
      };

      let mensagemErro = 'Erro ao salvar agendamento. Tente novamente.';

      // Se o erro vier do backend com mensagem específica
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // Se for um array de erros de validação do Pydantic
        if (Array.isArray(detail)) {
          const erros = detail.map(e => e.msg).join('; ');
          mensagemErro = `❌ Erro de validação: ${erros}`;
        } 
        // Se for uma string de erro
        else if (typeof detail === 'string') {
          // Verificar erros comuns e torná-los mais amigáveis
          if (detail.includes('passado') || detail.includes('past')) {
            mensagemErro = '🕐 A data/horário selecionado já passou. Por favor, escolha uma data/horário futura.';
          } else if (detail.includes('início') && detail.includes('fim')) {
            mensagemErro = '⏰ O horário de início deve ser anterior ao horário de fim.';
          } else if (detail.includes('formato') || detail.includes('format')) {
            mensagemErro = '📅 Formato de data ou horário inválido. Use o formato correto (dd/mm/aaaa e hh:mm).';
          } else if (detail.includes('tolerância') || detail.includes('tolerance')) {
            mensagemErro = '⏳ ' + detail;
          } else {
            mensagemErro = `❌ ${detail}`;
          }
        }
      }
      // Se for erro de rede ou timeout
      else if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        mensagemErro = '🌐 Erro de conexão. Verifique sua internet e tente novamente.';
      }
      // Se for erro 400 (bad request)
      else if (error.response?.status === 400) {
        mensagemErro = '⚠️ Dados inválidos. Verifique os campos preenchidos e tente novamente.';
      }
      // Se for erro 401/403 (não autorizado)
      else if (error.response?.status === 401 || error.response?.status === 403) {
        mensagemErro = '🔒 Você não tem permissão para realizar esta ação. Faça login novamente.';
      }

      setError(mensagemErro);
      // NÃO fecha o diálogo para permitir correção
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento? Os resíduos voltarão a ficar disponíveis para nova coleta.')) {
      return;
    }

    try {
      await schedulingService.updateStatus(id, 'cancelado');
      setSuccessMessage('Agendamento cancelado com sucesso!');
      await fetchData();
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Erro ao cancelar agendamento');
    }
  };

  const getResiduoInfo = (residuoId: string) => {
    return residuosMap.get(residuoId);
  };

  const isAgendamentoEditavel = (status: string) => {
    // Apenas agendamentos pendentes podem ser editados
    return status === 'pendente';
  };

  const isAgendamentoCancelavel = (status: string) => {
    // Agendamentos pendentes ou aceitos podem ser cancelados
    return status === 'pendente' || status === 'aceito';
  };

  // Converter DisponibilidadeSlot UTC (dd/mm/aaaa) para FaixaDisponibilidade local (YYYY-MM-DD)
  const convertToFaixaDisponibilidade = (disponibilidades: DisponibilidadeSlot[]) => {
    return disponibilidades.map((slot) => {
      try {
        // Backend retorna em UTC no formato dd/mm/yyyy HH:mm
        const [dia, mes, ano] = slot.data.split('/');
        const [horaInicio, minutoInicio] = slot.hora_inicio.split(':');
        const [horaFim, minutoFim] = slot.hora_fim.split(':');
        
        // Criar Date UTC - backend envia tudo em UTC
        const dataHoraInicioUTC = new Date(Date.UTC(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia),
          parseInt(horaInicio),
          parseInt(minutoInicio)
        ));
        
        const dataHoraFimUTC = new Date(Date.UTC(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia),
          parseInt(horaFim),
          parseInt(minutoFim)
        ));
        
        // Converter para horário local do navegador (Brasília: UTC-3)
        // getFullYear/getMonth/getDate/getHours/getMinutes já retornam valores no timezone local
        const anoLocal = dataHoraInicioUTC.getFullYear();
        const mesLocal = String(dataHoraInicioUTC.getMonth() + 1).padStart(2, '0');
        const diaLocal = String(dataHoraInicioUTC.getDate()).padStart(2, '0');
        const dataYYYYMMDD = `${anoLocal}-${mesLocal}-${diaLocal}`;
        
        const horaInicioLocal = `${String(dataHoraInicioUTC.getHours()).padStart(2, '0')}:${String(dataHoraInicioUTC.getMinutes()).padStart(2, '0')}`;
        const horaFimLocal = `${String(dataHoraFimUTC.getHours()).padStart(2, '0')}:${String(dataHoraFimUTC.getMinutes()).padStart(2, '0')}`;
        
        return {
          data: dataYYYYMMDD,
          horarioInicio: horaInicioLocal,
          horarioFim: horaFimLocal,
        };
      } catch (error) {
        // Fallback se houver erro na conversão
        console.error('Erro ao converter timezone na edição:', error);
        const [dia, mes, ano] = slot.data.split('/');
        const dataYYYYMMDD = `${ano}-${mes}-${dia}`;
        
        return {
          data: dataYYYYMMDD,
          horarioInicio: slot.hora_inicio,
          horarioFim: slot.hora_fim,
        };
      }
    });
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

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : agendamentos.length > 0 ? (
          <Stack spacing={2}>
            {agendamentos.map((agendamento, idx) => {
              const isEditable = isAgendamentoEditavel(agendamento.status);
              const isCancelable = isAgendamentoCancelavel(agendamento.status);
              return (
                <Card
                  key={`${agendamento.id}-${idx}`}
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
                        label={statusLabelMap[agendamento.status] || agendamento.status || 'Desconhecido'}
                        color={statusColorMap[agendamento.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Botão Editar - apenas para pendentes */}
                        {isEditable && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(agendamento)}
                            title="Editar agendamento"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        {/* Botão Cancelar - para pendentes e aceitos */}
                        {isCancelable && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancel(agendamento.id)}
                            title="Cancelar agendamento"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
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
                        {agendamento.residuosId.map((residuoId, idx) => {
                          const residuo = getResiduoInfo(residuoId);
                          const categoria = residuo ? categoriasMap.get(residuo.categoriaId) : null;
                          const categoriaNome = categoria?.tipo || 'Categoria não encontrada';
                          return (
                            <Typography
                              key={`${residuoId}-${idx}`}
                              variant="caption"
                              color="text.secondary"
                            >
                              • {residuo?.quantidade || '?'} {residuo?.tipo_medida || 'unidade'} ({categoriaNome})
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
              <DisponibilidadeSelector 
                onDisponibilidadeChange={setDisponibilidade}
                disponibilidadeInicial={
                  disponibilidade.length > 0 
                    ? convertToFaixaDisponibilidade(disponibilidade)
                    : []
                }
              />

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

              {/* Alerta de erro - exibido no final do dialog */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
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
