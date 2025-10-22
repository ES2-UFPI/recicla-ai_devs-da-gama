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
} from '@mui/material';
import { InteractiveMap } from './components/InteractiveMap';
import { AgendamentosList } from './components/AgendamentosList';
import { SearchFilters } from './components/SearchFilters';
import { useAgendamentos } from './hooks/useAgendamentos';

export default function LocalizarColeta() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [raio, setRaio] = useState<number>(5);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const { agendamentos, loading, error, buscarAgendamentosDisponiveis } = useAgendamentos();

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
          setLocationError('Não foi possível obter sua localização. Usando localização padrão.');
          setUserLocation([-5.0892, -42.8019]); // Teresina como fallback
        }
      );
    } else {
      setLocationError('Geolocalização não suportada pelo navegador.');
      setUserLocation([-5.0892, -42.8019]); // Teresina como fallback
    }
  }, []);

  // Buscar agendamentos automaticamente quando tiver localização
  const handleSearch = useCallback(async () => {
    if (!userLocation) {
      setSnackbar({ open: true, message: 'Aguardando localização...' });
      return;
    }

    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const horaAtual = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const resultado = await buscarAgendamentosDisponiveis({
      latitude: userLocation[0],
      longitude: userLocation[1],
      raio,
      data_busca: dataAtual,
      hora_busca: horaAtual,
    });

    if (resultado.length === 0) {
      setSnackbar({ open: true, message: 'Nenhum agendamento encontrado no raio especificado.' });
    }
  }, [userLocation, raio, buscarAgendamentosDisponiveis]);

  // Busca inicial quando tiver localização
  useEffect(() => {
    if (userLocation) {
      handleSearch();
    }
  }, [userLocation, handleSearch]);

  const handleMarkerClick = (id: string) => {
    setHighlightedId(id);
    // Scroll para o item na lista (mobile)
    const element = document.getElementById(`agendamento-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleItemClick = (id: string) => {
    setHighlightedId(id);
  };

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
            Localizar Coleta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Encontre resíduos disponíveis para coleta próximos a você
          </Typography>
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
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Obtendo sua localização...
            </Typography>
          </Box>
        )}

        {/* Conteúdo principal */}
        {userLocation && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Coluna da esquerda: Filtros e Lista */}
            <Box sx={{ flex: { md: '0 0 33%', lg: '0 0 25%' } }}>
              <SearchFilters
                raio={raio}
                onRaioChange={setRaio}
                onSearch={handleSearch}
                loading={loading}
              />

              {/* Lista de agendamentos */}
              <Box sx={{ maxHeight: { md: '600px' }, overflowY: 'auto', pr: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <AgendamentosList
                    agendamentos={agendamentos}
                    highlightedId={highlightedId}
                    onItemClick={handleItemClick}
                  />
                )}
              </Box>
            </Box>

            {/* Coluna da direita: Mapa */}
            <Box sx={{ flex: 1 }}>
              <InteractiveMap
                agendamentos={agendamentos}
                userLocation={userLocation}
                highlightedId={highlightedId}
                onMarkerClick={handleMarkerClick}
              />

              {/* Informações adicionais */}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  📍 {agendamentos.length} agendamento(s) encontrado(s)
                </Typography>
                {agendamentos.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    📏 Raio de busca: {raio} km
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Snackbar de notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </>
  );
}

