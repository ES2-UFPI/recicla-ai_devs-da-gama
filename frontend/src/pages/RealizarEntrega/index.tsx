/**
 * Página de Realizar Entrega
 * 
 * Permite que coletores selecionem categorias de resíduos do seu inventory
 * para entregar em uma receptora específica.
 * 
 * Funcionalidades:
 * - Exibir informações da receptora
 * - Agrupar resíduos por categoria
 * - Selecionar categorias inteiras (não resíduos individuais)
 * - Exibir totais por categoria e seleção
 * - Submeter entrega para a API
 */

import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRealizarEntrega } from './hooks/useRealizarEntrega';
import { ReceptoraCard } from './components/ReceptoraCard';
import { CategoriaCard } from './components/CategoriaCard';
import { TotalSelecionadoCard } from './components/TotalSelecionadoCard';

export default function RealizarEntrega() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { id: receptoraId } = useParams<{ id: string }>();

  const {
    receptora,
    categoriasAgrupadas,
    categoriasSelecionadas,
    observacoes,
    loading,
    submitting,
    error,
    success,
    toggleCategoria,
    setObservacoes,
    handleSubmit,
    clearError,
    totalSelecionado,
    getCategoriaById,
  } = useRealizarEntrega({ receptoraId: receptoraId || '' });

  // Tela de sucesso
  if (success) {
    return (
      <>
        <GlobalStyles />
        <Navbar />
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main' }} />
            <Typography variant="h4" color="success.main" fontWeight={700}>
              Entrega Realizada com Sucesso!
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Sua entrega foi registrada e os resíduos foram removidos do seu inventário.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate('/dashboard-coletor')}
              size="large"
              sx={{ minWidth: 200 }}
            >
              Voltar ao Dashboard
            </Button>
          </Box>
        </Container>
      </>
    );
  }

  // Tela principal
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Voltar
          </Button>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            Realizar Entrega
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Selecione as categorias de resíduos do seu inventário para entregar nesta receptora.
          </Typography>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Carregando informações...
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Conteúdo */}
        {!loading && receptora && (
          <>
            {/* Card da Receptora */}
            <ReceptoraCard
              receptora={receptora}
              materiaisNomes={receptora.accepted_material || []}
            />

            {/* Aviso informativo */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <strong>Importante:</strong> Você pode selecionar categorias inteiras. 
              Todos os resíduos da categoria selecionada serão entregues.
            </Alert>

            {/* Seleção de Categorias */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CategoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Selecione as Categorias para Entrega
                  </Typography>
                </Box>

                {categoriasAgrupadas.length === 0 ? (
                  <Alert severity="warning">
                    Você não possui resíduos compatíveis no inventário para entregar nesta receptora.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {categoriasAgrupadas.map((categoria) => {
                      const categoriaObj = getCategoriaById(categoria.categoriaId);
                      const categoriaNome = categoriaObj?.tipo || 'Categoria Desconhecida';
                      const selecionada = categoriasSelecionadas.has(categoria.categoriaId);

                      return (
                        <CategoriaCard
                          key={categoria.categoriaId}
                          categoria={categoria}
                          categoriaNome={categoriaNome}
                          selecionada={selecionada}
                          onToggle={() => toggleCategoria(categoria.categoriaId)}
                        />
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Total Selecionado */}
            {totalSelecionado.categorias > 0 && (
              <Box sx={{ mb: 3 }}>
                <TotalSelecionadoCard total={totalSelecionado} />
              </Box>
            )}

            {/* Observações */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Observações (opcional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Adicione observações sobre a entrega..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  variant="outlined"
                  disabled={submitting}
                />
              </CardContent>
            </Card>

            {/* Botão de Confirmação */}
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              startIcon={submitting ? null : <LocalShippingIcon />}
              onClick={handleSubmit}
              disabled={submitting || totalSelecionado.categorias === 0}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1.1rem',
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Processando...
                </>
              ) : (
                `Confirmar Entrega (${totalSelecionado.categorias} ${totalSelecionado.categorias === 1 ? 'categoria' : 'categorias'})`
              )}
            </Button>
          </>
        )}
      </Container>
    </>
  );
}
