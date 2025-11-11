import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { coletaService, type Coleta } from '../../services/coleta.service';
import { residuoService, type ResiduoDetalhado } from '../../services/residuo.service';
import { useCategorias } from '../LocalizarColeta/hooks/useCategorias';
import MapaDeslocamento from '../ColetaAtiva/components/MapaDeslocamento';
import AvaliacaoResiduos from '../ColetaAtiva/components/AvaliacaoResiduos';

type EstadoPagina = 'deslocamento' | 'avaliacao' | 'finalizada' | 'info';

export default function ColetaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getCategoriaById } = useCategorias();
  
  const [estado, setEstado] = useState<EstadoPagina>('info');
  const [coleta, setColeta] = useState<Coleta | null>(null);
  const [residuos, setResiduos] = useState<ResiduoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estados do diálogo de cancelamento
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // Buscar coleta por ID
  const buscarColeta = useCallback(async () => {
    if (!id) {
      navigate('/coletas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Busca a coleta específica
      const coletas = await coletaService.listarMinhasColetas({ limit: 100 });
      const coletaEncontrada = coletas.find(c => c.id === id);

      if (!coletaEncontrada) {
        setError('Coleta não encontrada.');
        return;
      }

      setColeta(coletaEncontrada);
      
      // Buscar detalhes dos resíduos primeiro
      const detalhes = await buscarDetalhesResiduos(coletaEncontrada.residuos_id);
      
      // Define o estado baseado no estado da coleta e dos resíduos
      if (coletaEncontrada.estado === 'EM_ANDAMENTO') {
        // Verificar se todos os resíduos já foram avaliados
        const todosAvaliados = detalhes.every(r => r.status === 'COLETADO' || r.status === 'REJEITADO');
        if (todosAvaliados) {
          setEstado('finalizada');
        } else {
          setEstado('avaliacao');
        }
      } else if (coletaEncontrada.estado === 'PENDENTE') {
        setEstado('deslocamento');
      } else {
        setEstado('info');
      }
    } catch (err) {
      console.error('Erro ao buscar coleta:', err);
      setError('Erro ao carregar informações da coleta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Buscar detalhes completos dos resíduos
  const buscarDetalhesResiduos = async (residuosIds: string[]): Promise<ResiduoDetalhado[]> => {
    try {
      const detalhes = await residuoService.buscarResiduosColetor(residuosIds);
      setResiduos(detalhes);
      return detalhes;
    } catch (err) {
      console.error('Erro ao buscar detalhes dos resíduos:', err);
      return [];
    }
  };

  useEffect(() => {
    buscarColeta();
  }, [buscarColeta]);

  // Iniciar coleta (transição para avaliação)
  const handleIniciarColeta = async () => {
    if (!coleta) return;

    setActionLoading(true);
    try {
      const coletaAtualizada = await coletaService.iniciarColeta(coleta.id);
      setColeta(coletaAtualizada);
      setEstado('avaliacao');
    } catch (err) {
      console.error('Erro ao iniciar coleta:', err);
      setError('Erro ao iniciar coleta. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancelar coleta
  const handleCancelarColeta = () => {
    setCancelDialogOpen(true);
  };

  const confirmarCancelamento = async () => {
    if (!coleta) return;

    setActionLoading(true);
    setCancelDialogOpen(false);

    try {
      if (coleta.estado === 'PENDENTE') {
        await coletaService.cancelarAntesLocal(coleta.id, { motivo: motivoCancelamento });
      } else {
        await coletaService.cancelarAposLocal(coleta.id, { motivo: motivoCancelamento });
      }

      // Redireciona para /coletas
      navigate('/coletas');
    } catch (err) {
      console.error('Erro ao cancelar coleta:', err);
      setError('Erro ao cancelar coleta. Tente novamente.');
      setActionLoading(false);
    }
  };

  // Atualizar coleta após avaliação
  const handleColetaAtualizada = async (coletaAtualizada: Coleta) => {
    setColeta(coletaAtualizada);
    const detalhes = await buscarDetalhesResiduos(coletaAtualizada.residuos_id);
    
    // Verificar se todos os resíduos foram avaliados
    const todosAvaliados = detalhes.every(r => r.status === 'COLETADO' || r.status === 'REJEITADO');
    if (todosAvaliados) {
      setEstado('finalizada');
    }
  };

  const handleFinalizarAvaliacao = async () => {
    // Recarregar os detalhes dos resíduos após finalizar avaliação
    if (coleta) {
      const detalhes = await buscarDetalhesResiduos(coleta.residuos_id);
      const todosAvaliados = detalhes.every(r => r.status === 'COLETADO' || r.status === 'REJEITADO');
      
      if (todosAvaliados) {
        setEstado('finalizada');
      }
    }
  };

  const getEstadoColor = (estadoColeta: string): 'warning' | 'primary' | 'error' | 'default' => {
    switch (estadoColeta) {
      case 'PENDENTE':
        return 'warning';
      case 'EM_ANDAMENTO':
        return 'primary';
      case 'CANCELADA':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Carregando informações da coleta...
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (error || !coleta) {
    return (
      <>
        <GlobalStyles />
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Coleta não encontrada.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/coletas')}>
            Voltar para Coletas
          </Button>
        </Container>
      </>
    );
  }

  // Renderiza apenas informações se não estiver em andamento
  if (estado === 'info') {
    return (
      <>
        <GlobalStyles />
        <Navbar />
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
              📋 Detalhes da Coleta
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Estado: {coleta.estado}</strong> - Esta coleta não está mais em andamento.
          </Alert>

          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {coleta.local.apelido || 'Local de Coleta'}
                </Typography>
                <Chip label={coleta.estado} color={getEstadoColor(coleta.estado)} />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {coleta.local.logradouro}, {coleta.local.numero}
                  {coleta.local.complemento && ` - ${coleta.local.complemento}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CEP: {coleta.local.cep}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Resíduos ({residuos.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {residuos.map((residuo) => {
                  const categoria = getCategoriaById(residuo.categoriaId);
                  return (
                    <Chip
                      key={residuo.id}
                      label={`${categoria?.tipo || 'Resíduo'}: ${residuo.quantidade} ${residuo.tipo_medida}`}
                      size="small"
                      variant="outlined"
                    />
                  );
                })}
              </Box>

              {coleta.observacoes && (
                <Alert severity="info" icon={false} sx={{ fontSize: '0.875rem' }}>
                  <strong>Observações:</strong> {coleta.observacoes}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Button variant="contained" onClick={() => navigate('/coletas')}>
            Voltar para Coletas
          </Button>
        </Container>
      </>
    );
  }

  // Renderiza interface completa se estiver em andamento
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            {estado === 'deslocamento' ? '🚚 Coleta em Deslocamento' : '📋 Avaliação de Resíduos'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {estado === 'deslocamento' 
              ? 'Desloque-se até o local e inicie a avaliação dos resíduos'
              : 'Avalie cada resíduo e finalize a coleta'
            }
          </Typography>
        </Box>

        {estado === 'deslocamento' ? (
          <>
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  📍 Informações do Local
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {coleta.local.apelido || 'Local de Coleta'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coleta.local.logradouro}, {coleta.local.numero}
                    {coleta.local.complemento && ` - ${coleta.local.complemento}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CEP: {coleta.local.cep}
                  </Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Resíduos ({residuos.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {residuos.map((residuo) => {
                    const categoria = getCategoriaById(residuo.categoriaId);
                    return (
                      <Chip
                        key={residuo.id}
                        label={`${categoria?.tipo || 'Resíduo'}: ${residuo.quantidade} ${residuo.tipo_medida}`}
                        color="success"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>

                {coleta.observacoes && (
                  <Alert severity="info" icon={<LocationOnIcon />}>
                    <strong>Observações:</strong> {coleta.observacoes}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {coleta.local.latitude && coleta.local.longitude && (
              <MapaDeslocamento
                latitude={parseFloat(coleta.local.latitude)}
                longitude={parseFloat(coleta.local.longitude)}
                endereco={`${coleta.local.logradouro}, ${coleta.local.numero}`}
              />
            )}

            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 2, 
              mt: 3 
            }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth={isMobile}
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleIniciarColeta}
                disabled={actionLoading}
                sx={{ py: 1.5, fontWeight: 600, flex: 1 }}
              >
                {actionLoading ? 'Iniciando...' : 'Estou no local: Iniciar avaliação'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="large"
                fullWidth={isMobile}
                startIcon={<CancelIcon />}
                onClick={handleCancelarColeta}
                disabled={actionLoading}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                Desistir/Cancelar
              </Button>
            </Box>
          </>
        ) : estado === 'avaliacao' ? (
          <AvaliacaoResiduos
            coleta={coleta}
            residuos={residuos}
            onColetaAtualizada={handleColetaAtualizada}
            onFinalizar={handleFinalizarAvaliacao}
          />
        ) : estado === 'finalizada' ? (
          <>
            {/* Tela de Visualização Final - Após avaliação completa */}
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Coleta finalizada com sucesso! Veja abaixo o resumo da avaliação.
            </Alert>

            {/* Resíduos Coletados */}
            {residuos.filter(r => r.status === 'COLETADO').length > 0 && (
              <Card sx={{ mb: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
                    ✅ Resíduos Coletados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Os seguintes resíduos foram avaliados e coletados:
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {residuos
                      .filter(r => r.status === 'COLETADO')
                      .map((residuo, index) => {
                        const categoria = getCategoriaById(residuo.categoriaId);
                        return (
                          <Card
                            key={residuo.id}
                            sx={{
                              border: 2,
                              borderColor: 'success.main',
                              bgcolor: 'success.50',
                            }}
                          >
                            <CardContent sx={{ py: 2 }}>
                              <Typography variant="body1" fontWeight={600}>
                                {index + 1}. {categoria?.tipo || 'Categoria desconhecida'}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                <Chip
                                  label={`${residuo.quantidade} ${residuo.tipo_medida}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`R$ ${residuo.valorEstimado.toFixed(2)}`}
                                  size="small"
                                  color="success"
                                  variant="filled"
                                />
                                <Chip
                                  label="COLETADO"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Resíduos Rejeitados */}
            {residuos.filter(r => r.status === 'REJEITADO').length > 0 && (
              <Card sx={{ mb: 3, boxShadow: 3, borderColor: 'error.main', border: 1 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="error">
                    ❌ Resíduos Rejeitados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Os seguintes resíduos foram rejeitados durante a avaliação:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {residuos
                      .filter(r => r.status === 'REJEITADO')
                      .map((residuo, index) => {
                        const categoria = getCategoriaById(residuo.categoriaId);
                        return (
                          <Box key={residuo.id} sx={{ p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {index + 1}. {categoria?.tipo || 'Categoria desconhecida'}
                              </Typography>
                              <Chip
                                label={`${residuo.quantidade} ${residuo.tipo_medida}`}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        );
                      })}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Mensagem caso todos tenham sido rejeitados */}
            {residuos.filter(r => r.status === 'COLETADO').length === 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Nenhum resíduo foi coletado. Todos foram rejeitados durante a avaliação.
              </Alert>
            )}

            {/* Resumo Total */}
            <Card sx={{ mb: 3, bgcolor: 'primary.50', boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  📊 Resumo da Coleta
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Chip
                    label={`Total: ${residuos.length} resíduos`}
                    color="primary"
                    variant="filled"
                  />
                  <Chip
                    label={`Coletados: ${residuos.filter(r => r.status === 'COLETADO').length}`}
                    color="success"
                    variant="filled"
                  />
                  <Chip
                    label={`Rejeitados: ${residuos.filter(r => r.status === 'REJEITADO').length}`}
                    color="error"
                    variant="filled"
                  />
                  <Chip
                    label={`Valor Total: R$ ${residuos
                      .filter(r => r.status === 'COLETADO')
                      .reduce((sum, r) => sum + r.valorEstimado, 0)
                      .toFixed(2)}`}
                    color="success"
                    variant="filled"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Botão de Voltar */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={() => navigate('/coletas')}
              sx={{ py: 2, fontWeight: 600, fontSize: '1.1rem' }}
            >
              Voltar para Minhas Coletas
            </Button>
          </>
        ) : null}
      </Container>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => !actionLoading && setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancelar Coleta</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Tem certeza que deseja cancelar esta coleta? 
            {coleta?.estado === 'PENDENTE' 
              ? ' Os resíduos ficarão disponíveis para outros coletores.'
              : ' Os resíduos não avaliados serão marcados como cancelados.'
            }
          </DialogContentText>
          <TextField
            label="Motivo do cancelamento (opcional)"
            multiline
            rows={3}
            fullWidth
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            placeholder="Ex: Imprevisto no caminho, produtor não estava no local..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            Voltar
          </Button>
          <Button 
            onClick={confirmarCancelamento} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {actionLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
