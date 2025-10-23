import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Collapse,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import { coletaService, type Coleta } from '../../../services/coleta.service';
import type { ResiduoDetalhado } from '../../../services/residuo.service';
import { useCategorias } from '../../LocalizarColeta/hooks/useCategorias';

interface AvaliacaoState {
  [residuoId: string]: {
    avaliado: boolean;
    aceito: boolean;
    motivoRejeicao?: string;
  };
}

interface AvaliacaoResiduosProps {
  coleta: Coleta;
  residuos: ResiduoDetalhado[];
  onColetaAtualizada?: (coleta: Coleta) => void;
  onFinalizar: () => void;
}

export default function AvaliacaoResiduos({ 
  coleta, 
  residuos, 
  onFinalizar 
}: AvaliacaoResiduosProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getCategoriaById } = useCategorias();
  
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoState>({});
  const [expandedResiduo, setExpandedResiduo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular se todos foram avaliados
  const todosAvaliados = residuos.every((r) => avaliacoes[r.id]?.avaliado);

  const handleAceitar = (residuoId: string) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [residuoId]: {
        avaliado: true,
        aceito: true,
      },
    }));
    setExpandedResiduo(null);
  };

  const handleRejeitar = (residuoId: string) => {
    // Apenas marca como rejeitado, mas requer motivo
    setExpandedResiduo(residuoId);
  };

  const confirmarRejeicao = (residuoId: string, motivo: string) => {
    if (!motivo || motivo.trim().length < 3) {
      return;
    }

    setAvaliacoes((prev) => ({
      ...prev,
      [residuoId]: {
        avaliado: true,
        aceito: false,
        motivoRejeicao: motivo,
      },
    }));
    setExpandedResiduo(null);
  };

  const handleFinalizarAvaliacao = async () => {
    setLoading(true);
    setError(null);

    try {
      // Separar resíduos aceitos e rejeitados
      const aceitos = residuos
        .filter((r) => avaliacoes[r.id]?.aceito)
        .map((r) => r.id);
      
      const rejeitados = residuos
        .filter((r) => !avaliacoes[r.id]?.aceito && avaliacoes[r.id]?.avaliado)
        .map((r) => ({
          id: r.id,
          motivo: avaliacoes[r.id]?.motivoRejeicao || 'Sem motivo especificado',
        }));

      // Coletar resíduos aceitos
      if (aceitos.length > 0) {
        await coletaService.coletarResiduos(coleta.id, {
          residuos_ids: aceitos,
          observacao: 'Resíduos avaliados e coletados',
        });
      }

      // Rejeitar resíduos rejeitados (um por um)
      for (const rejeitado of rejeitados) {
        await coletaService.rejeitarResiduos(coleta.id, {
          residuos_ids: [rejeitado.id],
          motivo: rejeitado.motivo,
        });
      }

      // Finalizar
      onFinalizar();
    } catch (err) {
      console.error('Erro ao finalizar avaliação:', err);
      setError('Erro ao finalizar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Avalie cada resíduo abaixo. Você deve aceitar ou rejeitar todos antes de finalizar.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lista de Resíduos */}
      <Box sx={{ mb: 3 }}>
        {residuos.map((residuo, index) => {
          const avaliacao = avaliacoes[residuo.id];
          const isExpanded = expandedResiduo === residuo.id;
          
          // Buscar categoria pelo ID
          const categoria = getCategoriaById(residuo.categoriaId);
          
          // Usar valorEstimado do backend (já calculado)
          const valorEstimado = residuo.valorEstimado.toFixed(2);

          return (
            <Card
              key={residuo.id}
              sx={{
                mb: 2,
                border: 2,
                borderColor: avaliacao?.avaliado
                  ? avaliacao.aceito
                    ? 'success.main'
                    : 'error.main'
                  : 'divider',
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Resíduo #{index + 1} - {categoria?.tipo || 'Categoria desconhecida'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip
                        label={`${residuo.quantidade} ${residuo.tipo_medida}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`R$ ${valorEstimado}`}
                        color="success"
                        variant="filled"
                        size="small"
                      />
                      <Chip
                        label={residuo.status}
                        color="default"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    {categoria?.descricao && (
                      <Typography variant="body2" color="text.secondary">
                        {categoria.descricao}
                      </Typography>
                    )}
                  </Box>

                  {avaliacao?.avaliado && (
                    <Chip
                      icon={avaliacao.aceito ? <CheckCircleIcon /> : <CancelIcon />}
                      label={avaliacao.aceito ? 'Aceito' : 'Rejeitado'}
                      color={avaliacao.aceito ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                {!avaliacao?.avaliado && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1.5,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth={isMobile}
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAceitar(residuo.id)}
                        sx={{ flex: 1, fontWeight: 600 }}
                      >
                        Aceitar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth={isMobile}
                        startIcon={<CancelIcon />}
                        onClick={() => handleRejeitar(residuo.id)}
                        sx={{ flex: 1, fontWeight: 600 }}
                      >
                        Rejeitar
                      </Button>
                    </Box>

                    {/* Campo de motivo ao rejeitar */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Por que você está rejeitando este resíduo?
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Ex: Material contaminado, quantidade incorreta..."
                          variant="outlined"
                          size="small"
                          id={`motivo-${residuo.id}`}
                          required
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => {
                              const input = document.getElementById(
                                `motivo-${residuo.id}`
                              ) as HTMLInputElement;
                              if (input && input.value.trim().length >= 3) {
                                confirmarRejeicao(residuo.id, input.value);
                              } else {
                                alert('O motivo deve ter pelo menos 3 caracteres');
                              }
                            }}
                          >
                            Confirmar Rejeição
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setExpandedResiduo(null)}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </>
                )}

                {avaliacao?.avaliado && !avaliacao.aceito && avaliacao.motivoRejeicao && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>Motivo da rejeição:</strong> {avaliacao.motivoRejeicao}
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Resumo e botão de finalização */}
      <Card sx={{ bgcolor: 'primary.50', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            📊 Resumo da Avaliação
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Chip
              label={`Total: ${residuos.length} resíduos`}
              color="primary"
              variant="filled"
            />
            <Chip
              label={`Aceitos: ${Object.values(avaliacoes).filter((a) => a.aceito).length}`}
              color="success"
              variant="filled"
            />
            <Chip
              label={`Rejeitados: ${Object.values(avaliacoes).filter((a) => !a.aceito && a.avaliado).length}`}
              color="error"
              variant="filled"
            />
            <Chip
              label={`Pendentes: ${residuos.length - Object.keys(avaliacoes).length}`}
              color="warning"
              variant="filled"
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={!todosAvaliados || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            onClick={handleFinalizarAvaliacao}
            sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem' }}
          >
            {loading ? 'Finalizando...' : 'Finalizar Avaliação/Coleta'}
          </Button>

          {!todosAvaliados && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Você deve avaliar todos os resíduos antes de finalizar a coleta.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
