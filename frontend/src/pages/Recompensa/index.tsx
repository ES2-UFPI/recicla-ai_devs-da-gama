import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RedeemIcon from '@mui/icons-material/Redeem';
import StarsIcon from '@mui/icons-material/Stars';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import recompensaService, { type Recompensa } from '../../services/recompensaService';

const ITEMS_PER_PAGE = 18;

type TipoRecompensa = 'produto' | 'desconto' | 'voucher' | 'cupom' | 'todos';
type OrdenacaoPontos = 'menor' | 'maior';

const tipoIcons: Record<Exclude<TipoRecompensa, 'todos'>, React.ReactElement> = {
  produto: <ShoppingBasketIcon fontSize="small" />,
  desconto: <DiscountIcon fontSize="small" />,
  voucher: <CardGiftcardIcon fontSize="small" />,
  cupom: <LocalOfferIcon fontSize="small" />,
};

const tipoLabels: Record<TipoRecompensa, string> = {
  produto: 'Produto',
  desconto: 'Desconto',
  voucher: 'Voucher',
  cupom: 'Cupom',
  todos: 'Todos',
};

const FALLBACK_IMAGE = '/reciclaAi-logo.png';

export default function Recompensas() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [recompensasFiltradas, setRecompensasFiltradas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros e ordenação
  const [tipoFiltro, setTipoFiltro] = useState<TipoRecompensa>('todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPontos>('menor');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Modal de detalhes
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<Recompensa | null>(null);
  const [resgatando, setResgatando] = useState(false);

  // Controle de imagens com erro
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set());

  const userPoints = user?.points || 0;

  const handleImageError = (recompensaId: string) => {
    setImagensComErro((prev) => new Set(prev).add(recompensaId));
  };

  const getImageUrl = (recompensa: Recompensa) => {
    if (imagensComErro.has(recompensa.id) || !recompensa.foto_url) {
      return FALLBACK_IMAGE;
    }
    return recompensa.foto_url;
  };

  // Carregar recompensas
  useEffect(() => {
    const fetchRecompensas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await recompensaService.getRecompensasAtivas({ com_estoque: true });
        setRecompensas(data);
      } catch (err) {
        console.error('Erro ao carregar recompensas:', err);
        setError('Erro ao carregar recompensas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecompensas();
  }, []);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = [...recompensas];

    // Filtrar por tipo
    if (tipoFiltro !== 'todos') {
      filtered = filtered.filter((r) => r.tipo === tipoFiltro);
    }

    // Ordenar por pontos
    filtered.sort((a, b) => {
      if (ordenacao === 'menor') {
        return a.pontos_necessarios - b.pontos_necessarios;
      }
      return b.pontos_necessarios - a.pontos_necessarios;
    });

    setRecompensasFiltradas(filtered);
    setPaginaAtual(1); // Resetar página ao filtrar
  }, [recompensas, tipoFiltro, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(recompensasFiltradas.length / ITEMS_PER_PAGE);
  const recompensasPaginadas = recompensasFiltradas.slice(
    (paginaAtual - 1) * ITEMS_PER_PAGE,
    paginaAtual * ITEMS_PER_PAGE
  );

  const handleChangePagina = (_: React.ChangeEvent<unknown>, value: number) => {
    setPaginaAtual(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbrirModal = (recompensa: Recompensa) => {
    setRecompensaSelecionada(recompensa);
  };

  const handleFecharModal = () => {
    setRecompensaSelecionada(null);
  };

  const handleResgatar = async () => {
    if (!recompensaSelecionada) return;

    setResgatando(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await recompensaService.resgatarRecompensa(recompensaSelecionada.id);
      setSuccessMessage('Recompensa resgatada com sucesso!');
      
      // Recarregar recompensas
      const data = await recompensaService.getRecompensasAtivas({ com_estoque: true });
      setRecompensas(data);
      
      handleFecharModal();
      
      // Auto-esconder mensagem após 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Erro ao resgatar recompensa:', err);
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail 
        || 'Erro ao resgatar recompensa. Tente novamente.';
      setError(errorMessage);
    } finally {
      setResgatando(false);
    }
  };

  const temPontosParaResgatar = (pontos_necessarios: number) => {
    return userPoints >= pontos_necessarios;
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho com Saldo de Pontos */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <RedeemIcon
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Recompensas
            </Typography>
          </Box>

          {/* Saldo de Pontos */}
          <Paper
            elevation={3}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '1rem',
            }}
          >
            <StarsIcon sx={{ fontSize: '2rem' }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                Seu Saldo
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {userPoints.toLocaleString('pt-BR')} pontos
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Mensagens */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filtros e Ordenação */}
        <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: '0.75rem' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tipoFiltro}
                  label="Tipo"
                  onChange={(e) => setTipoFiltro(e.target.value as TipoRecompensa)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="produto">Produtos</MenuItem>
                  <MenuItem value="voucher">Vouchers</MenuItem>
                  <MenuItem value="cupom">Cupons</MenuItem>
                  <MenuItem value="desconto">Descontos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por Pontos</InputLabel>
                <Select
                  value={ordenacao}
                  label="Ordenar por Pontos"
                  onChange={(e) => setOrdenacao(e.target.value as OrdenacaoPontos)}
                >
                  <MenuItem value="menor">Menor para Maior</MenuItem>
                  <MenuItem value="maior">Maior para Menor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'center', md: 'right' }}>
                {recompensasFiltradas.length} recompensa(s) encontrada(s)
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Grid de Recompensas */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : recompensasPaginadas.length === 0 ? (
          <Alert severity="info">
            Nenhuma recompensa disponível no momento.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {recompensasPaginadas.map((recompensa) => {
                const podResgatar = temPontosParaResgatar(recompensa.pontos_necessarios);
                
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recompensa.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '0.75rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={getImageUrl(recompensa)}
                        alt={recompensa.nome}
                        onError={() => handleImageError(recompensa.id)}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            icon={tipoIcons[recompensa.tipo]}
                            label={tipoLabels[recompensa.tipo]}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {recompensa.estoque < 10 && (
                            <Chip
                              label={`${recompensa.estoque} restantes`}
                              size="small"
                              color="warning"
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {recompensa.nome}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            flex: 1,
                          }}
                        >
                          {recompensa.descricao}
                        </Typography>

                        {recompensa.parceiro && (
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Patrocinador:</strong> {recompensa.parceiro}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            bgcolor: podResgatar ? 'success.50' : 'grey.100',
                            borderRadius: '0.5rem',
                            mb: 2,
                          }}
                        >
                          <StarsIcon color={podResgatar ? 'success' : 'disabled'} />
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color={podResgatar ? 'success.main' : 'text.disabled'}
                          >
                            {recompensa.pontos_necessarios.toLocaleString('pt-BR')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            pontos
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => handleAbrirModal(recompensa)}
                          sx={{
                            borderRadius: '0.5rem',
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPaginas}
                  page={paginaAtual}
                  onChange={handleChangePagina}
                  color="primary"
                  size={isMobile ? 'small' : 'large'}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Modal de Detalhes da Recompensa */}
        <Dialog
          open={!!recompensaSelecionada}
          onClose={handleFecharModal}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : '1rem',
            },
          }}
        >
          {recompensaSelecionada && (
            <>
              <DialogContent sx={{ p: 0 }}>
                <Grid container>
                  {/* Imagem */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box
                      component="img"
                      src={getImageUrl(recompensaSelecionada)}
                      alt={recompensaSelecionada.nome}
                      onError={() => handleImageError(recompensaSelecionada.id)}
                      sx={{
                        width: '100%',
                        height: { xs: 250, md: '100%' },
                        objectFit: 'cover',
                      }}
                    />
                  </Grid>

                  {/* Detalhes */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ p: 3 }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          icon={tipoIcons[recompensaSelecionada.tipo]}
                          label={tipoLabels[recompensaSelecionada.tipo]}
                          color="primary"
                        />
                        {recompensaSelecionada.estoque < 10 && (
                          <Chip
                            label={`Apenas ${recompensaSelecionada.estoque} disponíveis`}
                            color="warning"
                          />
                        )}
                      </Stack>

                      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                        {recompensaSelecionada.nome}
                      </Typography>

                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {recompensaSelecionada.descricao}
                      </Typography>

                      {recompensaSelecionada.parceiro && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Patrocinado por:</strong> {recompensaSelecionada.parceiro}
                          </Typography>
                        </Box>
                      )}

                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: temPontosParaResgatar(recompensaSelecionada.pontos_necessarios)
                            ? 'success.50'
                            : 'error.50',
                          borderRadius: '0.75rem',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <StarsIcon
                            color={
                              temPontosParaResgatar(recompensaSelecionada.pontos_necessarios)
                                ? 'success'
                                : 'error'
                            }
                          />
                          <Typography variant="h5" fontWeight={700}>
                            {recompensaSelecionada.pontos_necessarios.toLocaleString('pt-BR')} pontos
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Seu saldo: {userPoints.toLocaleString('pt-BR')} pontos
                        </Typography>
                      </Paper>

                      {!temPontosParaResgatar(recompensaSelecionada.pontos_necessarios) && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Seu saldo é insuficiente. Recicle mais cadastrando seus resíduos!
                        </Alert>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                  onClick={handleFecharModal}
                  variant="outlined"
                  sx={{
                    borderRadius: '0.5rem',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Voltar
                </Button>
                {temPontosParaResgatar(recompensaSelecionada.pontos_necessarios) ? (
                  <Button
                    onClick={handleResgatar}
                    variant="contained"
                    color="primary"
                    disabled={resgatando}
                    sx={{
                      borderRadius: '0.5rem',
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {resgatando ? <CircularProgress size={24} /> : 'Confirmar Resgate'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleFecharModal();
                      navigate('/residuos');
                    }}
                    variant="contained"
                    color="primary"
                    sx={{
                      borderRadius: '0.5rem',
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Cadastrar Resíduos
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </>
  );
}
