import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RecyclingIcon from '@mui/icons-material/Recycling';
import ScaleIcon from '@mui/icons-material/Scale';
import NumbersIcon from '@mui/icons-material/Numbers';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { relatorioService, type CategoryQuantity } from '../../services/relatorio.service';

export default function Relatorio() {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<CategoryQuantity[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await relatorioService.getMyReport();
        setReportData(response.by_category);
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 403) {
            setError('Relatório disponível apenas para produtores e receptores.');
          } else {
            setError('Erro ao carregar relatório. Tente novamente.');
          }
        } else {
          setError('Erro ao carregar relatório. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  // Calcula totais
  const totalKg = reportData
    .filter(item => item.tipo_medida === 'kg')
    .reduce((sum, item) => sum + item.quantidade, 0);
  
  const totalUnidades = reportData
    .filter(item => item.tipo_medida === 'unidade')
    .reduce((sum, item) => sum + item.quantidade, 0);

  const getTipoMedidaIcon = (tipo: string) => {
    return tipo === 'kg' ? <ScaleIcon fontSize="small" /> : <NumbersIcon fontSize="small" />;
  };

  const getTipoMedidaColor = (tipo: string) => {
    return tipo === 'kg' ? 'primary' : 'secondary';
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <AssessmentIcon
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
              Relatório de Reciclagem
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Veja o quanto você contribuiu para a missão de reciclagem
          </Typography>

          {/* Cards de Resumo */}
          {!loading && reportData.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mb: 3,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '1rem',
                  minWidth: '150px',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Total em Peso
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {totalKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg
                </Typography>
              </Paper>

              <Paper
                elevation={3}
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: 'secondary.main',
                  color: 'white',
                  borderRadius: '1rem',
                  minWidth: '150px',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Total em Unidades
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {totalUnidades.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </Typography>
              </Paper>

              <Paper
                elevation={3}
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: 'success.main',
                  color: 'white',
                  borderRadius: '1rem',
                  minWidth: '150px',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Categorias
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {reportData.length}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Conteúdo */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : reportData.length === 0 ? (
          <Card
            sx={{
              borderRadius: '0.75rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              py: 6,
            }}
          >
            <CardContent>
              <RecyclingIcon
                sx={{
                  fontSize: '4rem',
                  color: 'text.secondary',
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum dado disponível
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'produtor' 
                  ? 'Seus resíduos coletados ou entregues aparecerão aqui.'
                  : 'Os resíduos recebidos em suas entregas aparecerão aqui.'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabela de Dados */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                mb: 4,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }}
                    >
                      Categoria
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }}
                    >
                      Tipo de Medida
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }}
                    >
                      Quantidade
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow
                      key={`${item.categoria}-${item.tipo_medida}-${index}`}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RecyclingIcon color="success" fontSize="small" />
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {item.categoria}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getTipoMedidaIcon(item.tipo_medida)}
                          label={item.tipo_medida}
                          color={getTipoMedidaColor(item.tipo_medida)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'lowercase',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="primary.main"
                          sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                        >
                          {item.quantidade.toLocaleString('pt-BR', {
                            minimumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
                            maximumFractionDigits: item.tipo_medida === 'kg' ? 2 : 0,
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mensagem de Incentivo */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'success.light',
                borderRadius: '0.75rem',
                textAlign: 'center',
              }}
            >
              <RecyclingIcon
                sx={{
                  fontSize: '3rem',
                  color: 'success.dark',
                  mb: 2,
                }}
              />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'success.dark' }}>
                Parabéns pela sua contribuição! 🌱
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}>
                Cada resíduo reciclado faz a diferença para um planeta mais sustentável. 
                Continue contribuindo para a preservação do meio ambiente!
              </Typography>
            </Box>
          </>
        )}
      </Container>
    </>
  );
}
