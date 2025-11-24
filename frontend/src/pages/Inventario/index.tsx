import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import type { ResiduoDetalhado } from '../../services/residuo.service';
import { useCategorias } from '../LocalizarColeta/hooks/useCategorias';
import api from '../../services/api';

interface ResiduoComColeta extends ResiduoDetalhado {
  coletaId: string;
  dataColeta: string;
}

type TabValue = 'pendentes' | 'entregues';
type OrdenacaoValue = 'recente' | 'antigo';

export default function Inventario() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getCategoriaById, categorias } = useCategorias();

  const [tabAtiva, setTabAtiva] = useState<TabValue>('pendentes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [residuos, setResiduos] = useState<ResiduoComColeta[]>([]);
  
  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoValue>('recente');

  // Buscar inventário do coletor usando a rota específica
  useEffect(() => {
    const buscarInventario = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar inventário completo do coletor (rota otimizada que retorna dados completos)
        const response = await api.get<ResiduoDetalhado[]>('/coletas/inventory/me');
        const residuosDetalhados = response.data;

        // Mapear resíduos com informações adicionais para exibição
        const residuosComColeta: ResiduoComColeta[] = residuosDetalhados.map(residuo => ({
          ...residuo,
          coletaId: 'inventario', // Resíduos no inventário (fisicamente coletados)
          dataColeta: residuo.dataCadastro || new Date().toISOString(),
        }));

        setResiduos(residuosComColeta);
      } catch (err) {
        console.error('Erro ao buscar inventário:', err);
        setError('Erro ao carregar inventário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    buscarInventario();
  }, []);

  // Filtrar e ordenar resíduos do inventário
  const residuosFiltrados = useMemo(() => {
    let resultado = residuos;

    // Filtrar por status (pendentes = COLETADO, entregues = ENTREGUE)
    if (tabAtiva === 'pendentes') {
      resultado = resultado.filter(r => r.status === 'COLETADO');
    } else {
      resultado = resultado.filter(r => r.status === 'ENTREGUE');
    }

    // Filtrar por categoria
    if (categoriaFiltro !== 'todas') {
      resultado = resultado.filter(r => r.categoriaId === categoriaFiltro);
    }

    // Ordenar por data de coleta
    resultado = [...resultado].sort((a, b) => {
      const dataA = new Date(a.dataColeta).getTime();
      const dataB = new Date(b.dataColeta).getTime();
      return ordenacao === 'recente' ? dataB - dataA : dataA - dataB;
    });

    return resultado;
  }, [residuos, tabAtiva, categoriaFiltro, ordenacao]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const pendentes = residuos.filter(r => r.status === 'COLETADO');
    const entregues = residuos.filter(r => r.status === 'ENTREGUE');
    
    const valorPendente = pendentes.reduce((sum, r) => sum + r.valorEstimado, 0);
    const valorEntregue = entregues.reduce((sum, r) => sum + r.valorEstimado, 0);

    return {
      totalPendentes: pendentes.length,
      totalEntregues: entregues.length,
      valorPendente,
      valorEntregue,
      valorTotal: valorPendente + valorEntregue,
    };
  }, [residuos]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setTabAtiva(newValue);
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
              Carregando inventário...
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            📦 Inventário
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seus resíduos coletados e entregues
          </Typography>
        </Box>

        {/* Botão Realizar Entrega */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth={isMobile}
          startIcon={<LocalShippingIcon />}
          onClick={() => navigate('/entregas')}
          sx={{ 
            mb: 3, 
            py: 1.5, 
            fontWeight: 600,
            ...(isMobile ? {} : { maxWidth: '300px' })
          }}
        >
          Realizar Entrega
        </Button>

        {/* Estatísticas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
            <Card sx={{ bgcolor: 'warning.50', borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PendingIcon color="warning" />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Pendentes
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="warning.main">
                  {estatisticas.totalPendentes}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
            <Card sx={{ bgcolor: 'success.50', borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Entregues
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {estatisticas.totalEntregues}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Abas e Filtros */}
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <Tabs
            value={tabAtiva}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label={`Pendentes (${estatisticas.totalPendentes})`} 
              value="pendentes"
              icon={<PendingIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab 
              label={`Entregues (${estatisticas.totalEntregues})`} 
              value="entregues"
              icon={<CheckCircleIcon fontSize="small" />}
              iconPosition="start"
            />
          </Tabs>

          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              mb: 2 
            }}>
              {/* Filtro por Categoria */}
              <FormControl fullWidth={isMobile} sx={{ minWidth: 200 }}>
                <InputLabel id="categoria-filtro-label">
                  <FilterListIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  Categoria
                </InputLabel>
                <Select
                  labelId="categoria-filtro-label"
                  value={categoriaFiltro}
                  label="Categoria"
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <MenuItem value="todas">Todas as categorias</MenuItem>
                  {Array.from(categorias.values()).map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Ordenação */}
              <ToggleButtonGroup
                value={ordenacao}
                exclusive
                onChange={(_e, newValue) => newValue && setOrdenacao(newValue)}
                size="small"
                fullWidth={isMobile}
              >
                <ToggleButton value="recente">
                  <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Mais Recentes
                </ToggleButton>
                <ToggleButton value="antigo">
                  <SortIcon fontSize="small" sx={{ mr: 0.5, transform: 'scaleY(-1)' }} />
                  Mais Antigos
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Lista de Resíduos */}
            {residuosFiltrados.length === 0 ? (
              <Alert severity="info">
                {tabAtiva === 'pendentes'
                  ? 'Nenhum resíduo pendente de entrega.'
                  : 'Nenhum resíduo entregue ainda.'}
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {residuosFiltrados.map((residuo, index) => {
                  const categoria = getCategoriaById(residuo.categoriaId);
                  return (
                    <Card
                      key={residuo.id}
                      sx={{
                        border: 2,
                        borderColor: residuo.status === 'COLETADO' ? 'warning.main' : 'success.main',
                        bgcolor: residuo.status === 'COLETADO' ? 'warning.50' : 'success.50',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {index + 1}. {categoria?.tipo || 'Categoria desconhecida'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {categoria?.descricao || 'Sem descrição'}
                            </Typography>
                          </Box>
                          <Chip
                            label={residuo.status === 'COLETADO' ? 'PENDENTE' : 'ENTREGUE'}
                            color={residuo.status === 'COLETADO' ? 'warning' : 'success'}
                            size="small"
                            icon={residuo.status === 'COLETADO' ? <PendingIcon /> : <CheckCircleIcon />}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 4px)' } }}>
                            <Typography variant="caption" color="text.secondary">
                              Quantidade
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {residuo.quantidade} {residuo.tipo_medida}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 4px)' } }}>
                            <Typography variant="caption" color="text.secondary">
                              Valor Estimado
                            </Typography>
                            <Typography variant="body1" fontWeight={600} color="success.main">
                              R$ {residuo.valorEstimado.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 4px)' } }}>
                            <Typography variant="caption" color="text.secondary">
                              Data de Coleta
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {formatarData(residuo.dataColeta)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 4px)' } }}>
                            <Typography variant="caption" color="text.secondary">
                              Origem
                            </Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {residuo.coletaId === 'inventario' 
                                ? '📦 Inventário' 
                                : `Coleta ${residuo.coletaId.slice(0, 8)}...`}
                            </Typography>
                          </Box>
                        </Box>

                        {residuo.foto && (
                          <Box
                            component="img"
                            src={residuo.foto}
                            alt={categoria?.tipo}
                            sx={{
                              width: '100%',
                              maxHeight: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mt: 1,
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Resumo da Visualização Atual */}
        {residuosFiltrados.length > 0 && (
          <Card sx={{ bgcolor: 'grey.50', boxShadow: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📊 Resumo da visualização atual:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`${residuosFiltrados.length} itens`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`R$ ${residuosFiltrados.reduce((sum, r) => sum + r.valorEstimado, 0).toFixed(2)}`}
                  size="small"
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
