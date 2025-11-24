import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import {
  Box,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Snackbar,
  Fab,
  Tooltip,
  Zoom,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { InteractiveMap } from './components/InteractiveMap';
import { ReceptorasList } from './components/ReceptorasList';
import { SearchFilters } from './components/SearchFilters';
import { ReceptorasSkeleton } from './components/ReceptorasSkeleton';
import { useReceptoras } from './hooks/useReceptoras';

export default function LocalizarReceptora() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [raio, setRaio] = useState<number>(5);
  const [categoriasSelected, setCategoriasSelected] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const { receptoras, loading, error, buscarReceptorasProximas } = useReceptoras();

  // Obter localização do usuário
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(null);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationError('Não foi possível obter sua localização. Usando localização padrão (Teresina-PI).');
          setUserLocation([-5.0892, -42.8019]); // Teresina como fallback
        }
      );
    } else {
      setLocationError('Geolocalização não suportada pelo navegador.');
      setUserLocation([-5.0892, -42.8019]); // Teresina como fallback
    }
  }, []);

  // Buscar receptoras próximas
  const handleSearch = useCallback(async () => {
    if (!userLocation) {
      setSnackbar({ open: true, message: 'Aguardando localização...' });
      return;
    }

    const resultado = await buscarReceptorasProximas({
      latitude: userLocation[0],
      longitude: userLocation[1],
      raio,
      categorias_ids: categoriasSelected.length > 0 ? categoriasSelected : undefined,
    });

    if (resultado.length === 0) {
      setSnackbar({ 
        open: true, 
        message: categoriasSelected.length > 0 
          ? 'Nenhuma receptora encontrada com os filtros selecionados.' 
          : 'Nenhuma receptora encontrada no raio especificado.' 
      });
    } else {
      setSnackbar({ 
        open: true, 
        message: `${resultado.length} receptora(s) encontrada(s)!` 
      });
    }
  }, [userLocation, raio, categoriasSelected, buscarReceptorasProximas]);

  // Busca inicial quando tiver localização
  useEffect(() => {
    if (userLocation) {
      handleSearch();
    }
  }, [userLocation, handleSearch]);

  const handleMarkerClick = (id: string) => {
    setHighlightedId(id);
    // Scroll para o item na lista (mobile)
    const element = document.getElementById(`receptora-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleItemClick = (id: string) => {
    setHighlightedId(id);
  };

  const handleRecenterMap = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setSnackbar({ open: true, message: '📍 Localização atualizada!' });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setSnackbar({ open: true, message: '❌ Não foi possível obter sua localização' });
        }
      );
    }
  };

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
        {/* Cabeçalho */}
        <Box 
          sx={{ 
            mb: 4,
            p: 3,
            bgcolor: 'success.50',
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'success.200',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgcolor: 'success.main',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box 
              sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: 2, 
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              ♻️
            </Box>
            <Box>
              <Typography variant="h4" color="success.dark" fontWeight={700} gutterBottom>
                Localizar Receptoras
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Encontre pontos de entrega de resíduos recicláveis próximos a você
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Alerta de erro de localização */}
        {locationError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLocationError(null)}>
            {locationError}
          </Alert>
        )}

        {/* Alerta de erro da API */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading inicial */}
        {!userLocation && !locationError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress color="success" />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Obtendo sua localização...
            </Typography>
          </Box>
        )}

        {/* Conteúdo principal */}
        {userLocation && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Coluna da esquerda: Filtros e Lista */}
            <Box sx={{ flex: { md: '0 0 33%', lg: '0 0 28%' } }}>
              <SearchFilters
                raio={raio}
                onRaioChange={setRaio}
                categoriasSelected={categoriasSelected}
                onCategoriasChange={setCategoriasSelected}
                onSearch={handleSearch}
                loading={loading}
              />

              {/* Lista de receptoras */}
              <Box 
                sx={{ 
                  maxHeight: { md: '600px' }, 
                  overflowY: 'auto', 
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'success.main',
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'success.dark',
                    },
                  },
                }}
              >
                {loading ? (
                  <ReceptorasSkeleton count={3} />
                ) : (
                  <ReceptorasList
                    receptoras={receptoras}
                    highlightedId={highlightedId}
                    onItemClick={handleItemClick}
                  />
                )}
              </Box>
            </Box>

            {/* Coluna da direita: Mapa */}
            <Box sx={{ flex: 1 }}>
              <InteractiveMap
                receptoras={receptoras}
                userLocation={userLocation}
                highlightedId={highlightedId}
                onMarkerClick={handleMarkerClick}
              />

              {/* Informações adicionais */}
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex', 
                  gap: 3, 
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {receptoras.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receptoras
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight={700}>
                    {raio}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Raio (km)
                  </Typography>
                </Box>
                {categoriasSelected.length > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {categoriasSelected.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Filtros
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Dica de uso */}
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2.5, 
                  bgcolor: 'success.50', 
                  borderRadius: 2, 
                  border: '2px solid',
                  borderColor: 'success.200',
                }}
              >
                <Typography variant="subtitle2" color="success.dark" fontWeight={700} mb={1.5}>
                  💡 Como usar esta página
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  <Typography component="li" variant="body2" color="text.secondary" mb={0.5}>
                    Clique nos <strong>marcadores verdes</strong> no mapa para ver detalhes
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" mb={0.5}>
                    Use os <strong>filtros</strong> para encontrar receptoras por tipo de material
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" mb={0.5}>
                    Ajuste o <strong>raio de busca</strong> para ampliar ou reduzir a área
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Clique em <strong>"Ver rotas"</strong> para abrir no Google Maps
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Floating Action Button - Minha Localização */}
        {userLocation && (
          <Zoom in={true}>
            <Tooltip title="Recentralizar no meu local" placement="left">
              <Fab
                color="success"
                aria-label="minha localização"
                onClick={handleRecenterMap}
                sx={{
                  position: 'fixed',
                  bottom: { xs: 16, md: 32 },
                  right: { xs: 16, md: 32 },
                  zIndex: 1000,
                  boxShadow: 4,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <MyLocationIcon />
              </Fab>
            </Tooltip>
          </Zoom>
        )}

        {/* Snackbar de notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        />
      </Container>
    </>
  );
}
