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
import CancelIcon from '@mui/icons-material/Cancel';
import { coletaService, type Coleta } from '../../services/coleta.service';
import { residuoService, type ResiduoDetalhado } from '../../services/residuo.service';
import { useCategorias } from '../LocalizarColeta/hooks/useCategorias';

export default function Coleta() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getCategoriaById } = useCategorias();
  
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [residuosMap, setResiduosMap] = useState<Map<string, ResiduoDetalhado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separar coletas em andamento e outras
  const coletasEmAndamento = coletas.filter(c => c.estado === 'EM_ANDAMENTO' || c.estado === 'PENDENTE');
  const outrasColetas = coletas.filter(c => c.estado !== 'EM_ANDAMENTO' && c.estado !== 'PENDENTE');

  useEffect(() => {
    buscarColetas();
  }, []);

  const buscarColetas = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await coletaService.listarMinhasColetas({ limit: 50 });
      setColetas(resultado);

      // Buscar detalhes de todos os resíduos
      const todosResiduosIds = resultado.flatMap(c => c.residuos_id);
      const residuosUnicos = [...new Set(todosResiduosIds)];
      
      if (residuosUnicos.length > 0) {
        const residuos = await residuoService.buscarResiduosColetor(residuosUnicos);
        const map = new Map<string, ResiduoDetalhado>();
        residuos.forEach(r => map.set(r.id, r));
        setResiduosMap(map);
      }
    } catch (err) {
      console.error('Erro ao buscar coletas:', err);
      setError('Erro ao carregar suas coletas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string): 'warning' | 'primary' | 'error' | 'default' => {
    switch (estado) {
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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDENTE':
        return <CalendarTodayIcon fontSize="small" />;
      case 'EM_ANDAMENTO':
        return <LocalShippingIcon fontSize="small" />;
      case 'CANCELADA':
        return <CancelIcon fontSize="small" />;
      default:
        return <CalendarTodayIcon fontSize="small" />;
    }
  };

  const formatarData = (dataISO: string) => {
    try {
      // Backend retorna em UTC, converter para horário local de Brasília
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR', {
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

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            Minhas Coletas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize e gerencie suas coletas em andamento e concluídas.
          </Typography>
        </Box>

        {/* Botão de ação */}
        <Button
          component={RouterLink}
          to="/localizar-coleta"
          variant="contained"
          color="primary"
          size="large"
          startIcon={<LocalShippingIcon />}
          sx={{ mb: 3, py: 1.5, fontWeight: 600 }}
          fullWidth={isMobile}
        >
          Localizar Resíduos para Coletar
        </Button>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Carregando suas coletas...
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lista de coletas */}
        {!loading && !error && coletas.length === 0 && (
          <Card sx={{ textAlign: 'center', py: 6, boxShadow: 2 }}>
            <CardContent>
              <LocalShippingIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma coleta encontrada
              </Typography>
              <Typography variant="body2" color="text.disabled" mb={3}>
                Você ainda não realizou nenhuma coleta. Comece procurando resíduos disponíveis!
              </Typography>
              <Button
                component={RouterLink}
                to="/localizar-coleta"
                variant="contained"
                color="primary"
              >
                Localizar Coletas
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && coletas.length > 0 && (
          <Box>
            {/* Seção: Coletas em Andamento */}
            {coletasEmAndamento.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                  🚚 Coletas em Andamento ({coletasEmAndamento.length})
                </Typography>
                {coletasEmAndamento.map((coleta) => (
                  <Card key={coleta.id} sx={{ mb: 2, boxShadow: 3, border: 2, borderColor: 'primary.main' }}>
                    <CardContent>
                  {/* Cabeçalho do card */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {coleta.local.apelido || 'Ponto de Coleta'}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getEstadoIcon(coleta.estado)}
                      label={coleta.estado}
                      color={getEstadoColor(coleta.estado)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Informações */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {coleta.local.logradouro}, {coleta.local.numero}
                        </Typography>
                        {coleta.local.complemento && (
                          <Typography variant="body2" color="text.secondary">
                            {coleta.local.complemento}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          CEP: {coleta.local.cep}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatarData(coleta.data_hora)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Resíduos */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Resíduos ({coleta.residuos_id.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {coleta.residuos_id.map((residuoId) => {
                        const residuo = residuosMap.get(residuoId);
                        if (!residuo) {
                          return (
                            <Chip 
                              key={residuoId} 
                              label="Carregando..." 
                              size="small" 
                              variant="outlined" 
                            />
                          );
                        }
                        
                        const categoria = getCategoriaById(residuo.categoriaId);
                        const label = `${categoria?.tipo || 'Resíduo'}: ${residuo.quantidade} ${residuo.tipo_medida}`;
                        
                        return (
                          <Chip 
                            key={residuoId} 
                            label={label}
                            size="small" 
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Observações */}
                  {coleta.observacoes && (
                    <Alert severity="info" icon={false} sx={{ fontSize: '0.875rem', mb: 2 }}>
                      <strong>Observações:</strong> {coleta.observacoes}
                    </Alert>
                  )}

                  {/* Botão Acessar Coleta */}
                  <Button
                    component={RouterLink}
                    to={`/coleta/${coleta.id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<LocalShippingIcon />}
                    sx={{ mt: 2, py: 1.5, fontWeight: 600 }}
                  >
                    Acessar Coleta
                  </Button>
                </CardContent>
              </Card>
            ))}
              </Box>
            )}

            {/* Seção: Outras Coletas */}
            {outrasColetas.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 2 }}>
                  📋 Outras Coletas ({outrasColetas.length})
                </Typography>
                {outrasColetas.map((coleta) => (
                  <Card key={coleta.id} sx={{ mb: 2, boxShadow: 2 }}>
                    <CardContent>
                  {/* Cabeçalho do card */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {coleta.local.apelido || 'Ponto de Coleta'}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getEstadoIcon(coleta.estado)}
                      label={coleta.estado}
                      color={getEstadoColor(coleta.estado)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Informações */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {coleta.local.logradouro}, {coleta.local.numero}
                        </Typography>
                        {coleta.local.complemento && (
                          <Typography variant="body2" color="text.secondary">
                            {coleta.local.complemento}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          CEP: {coleta.local.cep}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatarData(coleta.data_hora)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Resíduos */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Resíduos ({coleta.residuos_id.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {coleta.residuos_id.map((residuoId) => {
                        const residuo = residuosMap.get(residuoId);
                        if (!residuo) {
                          return (
                            <Chip 
                              key={residuoId} 
                              label="Carregando..." 
                              size="small" 
                              variant="outlined" 
                            />
                          );
                        }
                        
                        const categoria = getCategoriaById(residuo.categoriaId);
                        const label = `${categoria?.tipo || 'Resíduo'}: ${residuo.quantidade} ${residuo.tipo_medida}`;
                        
                        return (
                          <Chip 
                            key={residuoId} 
                            label={label}
                            size="small" 
                            color="default"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Observações */}
                  {coleta.observacoes && (
                    <Alert severity="info" icon={false} sx={{ fontSize: '0.875rem' }}>
                      <strong>Observações:</strong> {coleta.observacoes}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}
