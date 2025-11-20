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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import StarsIcon from '@mui/icons-material/Stars';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';
import { Navbar } from '../../components/Navbar';
import recompensaService, { type ResgateResponse } from '../../services/recompensaService';

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

export default function HistoricoResgateRecompensa() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [resgates, setResgates] = useState<ResgateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    return new Date(data).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            elevation={2}
            sx={{
              p: 2,
              bgcolor: 'info.light',
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '0.5rem',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Visualize todos os resgates de recompensas que você já realizou. Cada registro mostra a recompensa, os pontos gastos e a data do resgate.
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resgates.map((resgate) => (
                    <TableRow
                      key={resgate.id}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {resgate.recompensa?.nome || 'Recompensa Deletada'}
                      </TableCell>
                      <TableCell align="center">
                        {resgate.recompensa?.tipo && (
                          <Chip
                            icon={tipoIcons[resgate.recompensa.tipo]}
                            label={tipoLabels[resgate.recompensa.tipo]}
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
                    </TableRow>
                  ))}
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
      </Container>
    </>
  );
}
