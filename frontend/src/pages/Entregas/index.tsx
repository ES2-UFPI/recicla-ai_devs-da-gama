import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { Link as RouterLink } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCategorias } from '../LocalizarColeta/hooks/useCategorias';
import { entregaAdapter, type Entrega } from './entrega.adapter.ts';

export default function Entregas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getCategoriaById } = useCategorias();
  
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buscarEntregas();
  }, []);

  const buscarEntregas = async () => {
    setLoading(true);
    setError(null);

    try {
      // Usando adapter para buscar dados (mock por enquanto, API no futuro)
      const resultado = await entregaAdapter.listarMinhasEntregas();
      setEntregas(resultado);
    } catch (err) {
      console.error('Erro ao buscar entregas:', err);
      setError('Erro ao carregar suas entregas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataISO: string) => {
    try {
      // Backend retorna em UTC, converter para horário local de Brasília
      const data = new Date(dataISO);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
    } catch {
      return dataISO;
    }
  };

  /**
   * Agrupa os resíduos por categoria para exibição
   * Separa por tipo de medida (kg e unidade)
   */
  const agruparResiduosPorCategoria = (residuos: Entrega['residuos']) => {
    const grupos = new Map<string, { kg: number; unidade: number; categoriaId: string }>();

    residuos.forEach((residuo: Entrega['residuos'][0]) => {
      const key = residuo.categoriaId;
      const atual = grupos.get(key) || { kg: 0, unidade: 0, categoriaId: residuo.categoriaId };

      if (residuo.tipo_medida === 'kg') {
        atual.kg += residuo.quantidade;
      } else {
        atual.unidade += residuo.quantidade;
      }

      grupos.set(key, atual);
    });

    return Array.from(grupos.values());
  };

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            Minhas Entregas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize e gerencie suas entregas realizadas às receptoras.
          </Typography>
        </Box>

        {/* Botão de ação */}
        <Button
          component={RouterLink}
          to="/localizar-receptora"
          variant="contained"
          color="primary"
          size="large"
          startIcon={<LocationOnIcon />}
          sx={{ mb: 3, py: 1.5, fontWeight: 600 }}
          fullWidth={isMobile}
        >
          Localizar Receptoras para Realizar Entrega
        </Button>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Carregando suas entregas...
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lista de entregas vazia */}
        {!loading && !error && entregas.length === 0 && (
          <Card sx={{ textAlign: 'center', py: 6, boxShadow: 2 }}>
            <CardContent>
              <LocalShippingIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma entrega encontrada
              </Typography>
              <Typography variant="body2" color="text.disabled" mb={3}>
                Você ainda não realizou nenhuma entrega. Comece localizando receptoras disponíveis!
              </Typography>
              <Button
                component={RouterLink}
                to="/localizar-receptoras"
                variant="contained"
                color="primary"
              >
                Localizar Receptoras
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de entregas */}
        {!loading && !error && entregas.length > 0 && (
          <Box>
            <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mb: 2 }}>
              ✅ Entregas Realizadas ({entregas.length})
            </Typography>
            {entregas.map((entrega) => {
              const residuosAgrupados = agruparResiduosPorCategoria(entrega.residuos);

              return (
                <Card 
                  key={entrega.id} 
                  sx={{ 
                    mb: 2, 
                    boxShadow: 3, 
                    border: 2, 
                    borderColor: 'success.main',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent>
                    {/* Cabeçalho do card */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {entrega.receptora.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID da Entrega: {entrega.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                      <Chip
                        icon={<CheckCircleIcon fontSize="small" />}
                        label="ENTREGUE"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Informações da Receptora */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                        📍 Local de Entrega
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2">
                            {entrega.receptora.endereco.logradouro}, {entrega.receptora.endereco.numero}
                          </Typography>
                          {entrega.receptora.endereco.complemento && (
                            <Typography variant="body2" color="text.secondary">
                              {entrega.receptora.endereco.complemento}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            CEP: {entrega.receptora.endereco.cep}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Data e Hora da Entrega:</strong> {formatarData(entrega.data_entrega)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Resumo dos Resíduos por Categoria */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                        📦 Resíduos Entregues
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {residuosAgrupados.map((grupo, index) => {
                          const categoria = getCategoriaById(grupo.categoriaId);
                          
                          return (
                            <Card 
                              key={index} 
                              variant="outlined" 
                              sx={{ 
                                bgcolor: 'success.50', 
                                borderColor: 'success.main',
                                borderWidth: 1,
                              }}
                            >
                              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                  <Typography variant="body1" fontWeight={600}>
                                    {categoria?.tipo || 'Categoria desconhecida'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {grupo.kg > 0 && (
                                      <Chip
                                        label={`${grupo.kg} kg`}
                                        color="success"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    )}
                                    {grupo.unidade > 0 && (
                                      <Chip
                                        label={`${grupo.unidade} ${grupo.unidade === 1 ? 'unidade' : 'unidades'}`}
                                        color="success"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                                {categoria?.descricao && (
                                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                    {categoria.descricao}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Observações */}
                    {entrega.observacoes && (
                      <Alert severity="info" icon={false} sx={{ fontSize: '0.875rem', mt: 2 }}>
                        <strong>Observações:</strong> {entrega.observacoes}
                      </Alert>
                    )}

                    {/* Informações adicionais */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Tipos de materiais aceitos pela receptora: {entrega.receptora.materiais_aceitos.join(', ')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </>
  );
}
