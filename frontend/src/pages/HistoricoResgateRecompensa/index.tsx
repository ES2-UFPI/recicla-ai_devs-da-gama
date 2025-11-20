import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import StarsIcon from '@mui/icons-material/Stars';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Navbar } from '../../components/Navbar';
import recompensaService, { type ResgateResponse, type Recompensa } from '../../services/recompensaService';

const tipoIcons: Record<string, React.ReactElement> = {
  produto: <ShoppingBasketIcon fontSize="small" />,
  desconto: <DiscountIcon fontSize="small" />,
  voucher: <CardGiftcardIcon fontSize="small" />,
  cupom: <LocalOfferIcon fontSize="small" />,
};

const tipoLabels: Record<string, string> = {
  produto: 'Produto',
  desconto: 'Desconto',
  voucher: 'Voucher',
  cupom: 'Cupom',
};

const FALLBACK_IMAGE = '/reciclaAi-logo.png';

export default function HistoricoResgateRecompensa() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [resgates, setResgates] = useState<ResgateResponse[]>([]);
  const [recompensasMap, setRecompensasMap] = useState<Map<string, Recompensa>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal de detalhes
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<Recompensa | null>(null);
  
  // Controle de imagens com erro
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set());

  // Carregar histórico de resgates
  useEffect(() => {
    const fetchResgates = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await recompensaService.getMeusResgates({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        });
        setResgates(data);

        // Buscar dados das recompensas
        const recompensasIds = [...new Set(data.map(r => r.recompensa_id))];
        const recompensasData = await Promise.allSettled(
          recompensasIds.map(id => recompensaService.getRecompensa(id))
        );

        const newMap = new Map<string, Recompensa>();
        recompensasData.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            newMap.set(recompensasIds[index], result.value);
          }
        });
        setRecompensasMap(newMap);
      } catch (err) {
        console.error('Erro ao carregar histórico de resgates:', err);
        setError('Erro ao carregar histórico de resgates. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchResgates();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatarData = (data: string) => {
    // Converte de UTC para timezone local do usuário
    return new Date(data).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImageError = (recompensaId: string) => {
    setImagensComErro((prev) => new Set(prev).add(recompensaId));
  };

  const getImageUrl = (recompensa: Recompensa) => {
    if (imagensComErro.has(recompensa.id) || !recompensa.foto_url) {
      return FALLBACK_IMAGE;
    }
    return recompensa.foto_url;
  };

  const handleAbrirDetalhes = async (recompensaId: string) => {
    const recompensa = recompensasMap.get(recompensaId);
    if (recompensa) {
      setRecompensaSelecionada(recompensa);
    } else {
      // Se não estiver no map, buscar na API
      try {
        const data = await recompensaService.getRecompensa(recompensaId);
        setRecompensaSelecionada(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes da recompensa:', err);
        setError('Erro ao carregar detalhes da recompensa.');
      }
    }
  };

  const handleFecharDetalhes = () => {
    setRecompensaSelecionada(null);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Voltar
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon
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
              Histórico de Resgates
            </Typography>
          </Box>

          {/* Info Card */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '0.5rem',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Acompanhe seu histórico de resgates e veja os detalhes de cada recompensa.
            </Typography>
          </Paper>
        </Box>

        {/* Mensagens */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabela de Resgates */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : resgates.length === 0 ? (
          <Card sx={{ borderRadius: '0.75rem' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <HistoryIcon
                sx={{
                  fontSize: '4rem',
                  color: 'text.secondary',
                  opacity: 0.5,
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum resgate encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Você ainda não resgatou nenhuma recompensa. Visite a loja de recompensas para começar!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/recompensas')}
              >
                Ver Recompensas Disponíveis
              </Button>
            </CardContent>
          </Card>
        ) : (
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
                            onClick={() => handleAbrirDetalhes(resgate.recompensa_id)}
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
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Resgates por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </>
        )}

        {/* Modal de Detalhes da Recompensa */}
        <Dialog
          open={!!recompensaSelecionada}
          onClose={handleFecharDetalhes}
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
                          bgcolor: 'grey.100',
                          borderRadius: '0.75rem',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <StarsIcon color="primary" />
                          <Typography variant="h5" fontWeight={700}>
                            {recompensaSelecionada.pontos_necessarios.toLocaleString('pt-BR')} pontos
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Valor da recompensa
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                  onClick={handleFecharDetalhes}
                  variant="contained"
                  sx={{
                    borderRadius: '0.5rem',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Fechar
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </>
  );
}
