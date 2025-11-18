import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Map as MapIcon,
  EditLocation as EditLocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { cepService } from '../../../services/cep.service';
import { geoService } from '../../../services/geo.service';
import type { ReverseResult } from '../../../services/geo.service';
import type { Endereco } from '../../../types/endereco';

// Fix ícones Leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// ============================================================================
// TIPOS
// ============================================================================

type FluxoTipo = 'texto-primeiro' | 'localizacao-primeiro';

interface PosicaoMapa {
  lat: number;
  lng: number;
}

// ============================================================================
// COMPONENTES INTERNOS DO MAPA
// ============================================================================

function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (pos: PosicaoMapa) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
}

function MapRecenter({ center }: { center: PosicaoMapa }) {
  const map = useMap();
  map.setView([center.lat, center.lng], 16);
  return null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface EnderecoFormReceptorProps {
  endereco: Endereco;
  onChange: (endereco: Endereco) => void;
  error?: string;
}

export function EnderecoFormReceptor({ endereco, onChange, error }: EnderecoFormReceptorProps) {
  // ========== ESTADOS DO DIÁLOGO ==========
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fluxoEscolhido, setFluxoEscolhido] = useState<FluxoTipo | null>(null);
  const [etapaAtual, setEtapaAtual] = useState(0);

  // ========== ESTADOS DO FORMULÁRIO ==========
  const [formTemp, setFormTemp] = useState<Endereco>(endereco);

  // ========== ESTADOS DO MAPA ==========
  const [posicaoMapa, setPosicaoMapa] = useState<PosicaoMapa | null>(
    endereco.latitude && endereco.longitude
      ? { lat: parseFloat(endereco.latitude), lng: parseFloat(endereco.longitude) }
      : null
  );
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [fazendoReverseGeo, setFazendoReverseGeo] = useState(false);

  // ========== ESTADOS DE SNACKBAR ==========
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ========== HANDLERS DO DIÁLOGO ==========
  const handleOpenDialog = () => {
    setFormTemp(endereco);
    if (endereco.latitude && endereco.longitude) {
      setPosicaoMapa({ lat: parseFloat(endereco.latitude), lng: parseFloat(endereco.longitude) });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFluxoEscolhido(null);
    setEtapaAtual(0);
    setFormTemp(endereco);
    if (endereco.latitude && endereco.longitude) {
      setPosicaoMapa({ lat: parseFloat(endereco.latitude), lng: parseFloat(endereco.longitude) });
    } else {
      setPosicaoMapa(null);
    }
  };

  // ========== FLUXO A: TEXTO PRIMEIRO ==========
  const handleEscolherTexto = () => {
    setFluxoEscolhido('texto-primeiro');
    setEtapaAtual(1);
  };

  const handleBuscarPorCep = async () => {
    if (!formTemp.cep || !formTemp.numero) {
      showSnackbar('Preencha CEP e Número para continuar', 'warning');
      return;
    }

    const cepDigits = formTemp.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) {
      showSnackbar('CEP deve ter 8 dígitos', 'warning');
      return;
    }

    setBuscandoCep(true);
    try {
      // 1. Buscar dados do CEP no ViaCEP
      const viaCepData = await cepService.lookup(cepDigits);
      if (!viaCepData) {
        showSnackbar('CEP não encontrado. Verifique o CEP digitado.', 'error');
        setBuscandoCep(false);
        return;
      }

      // 2. Atualizar logradouro se não preenchido
      const logradouroFinal = formTemp.logradouro.trim() || viaCepData.logradouro;
      setFormTemp((prev) => ({
        ...prev,
        logradouro: logradouroFinal,
        cep: cepService.format(cepDigits),
      }));

      // 3. Montar query de geocoding
      const query = `${logradouroFinal}, ${formTemp.numero}, ${viaCepData.localidade} - ${viaCepData.uf}, Brasil`;

      // 4. Geocoding
      const resultados = await geoService.search(query);
      if (!resultados || resultados.length === 0) {
        // Fallback: tentar apenas CEP
        const resultadosCep = await geoService.search(cepDigits);
        if (!resultadosCep || resultadosCep.length === 0) {
          showSnackbar('Não foi possível localizar o endereço no mapa. Ajuste manualmente.', 'warning');
          setPosicaoMapa({ lat: -5.0892, lng: -42.8034 }); // Teresina, PI
          setEtapaAtual(2);
          setBuscandoCep(false);
          return;
        }
        const primeiro = resultadosCep[0];
        setPosicaoMapa({
          lat: parseFloat(primeiro.lat),
          lng: parseFloat(primeiro.lon),
        });
      } else {
        const primeiro = resultados[0];
        setPosicaoMapa({
          lat: parseFloat(primeiro.lat),
          lng: parseFloat(primeiro.lon),
        });
      }

      // 5. Avançar para etapa do mapa
      setEtapaAtual(2);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      showSnackbar('Erro ao buscar endereço. Verifique sua conexão.', 'error');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = async (cep: string) => {
    setFormTemp((prev) => ({ ...prev, cep }));

    const digits = cep.replace(/\D/g, '');
    if (digits.length === 8) {
      try {
        const via = await cepService.lookup(digits);
        if (via?.logradouro) {
          setFormTemp((prev) => ({
            ...prev,
            logradouro: via.logradouro,
            cep: cepService.format(digits),
          }));
        }
      } catch (err) {
        console.warn('Auto-preenchimento CEP falhou:', err);
      }
    }
  };

  // ========== FLUXO B: LOCALIZAÇÃO PRIMEIRO ==========
  const handleEscolherLocalizacao = () => {
    setFluxoEscolhido('localizacao-primeiro');
    obterLocalizacaoAtual();
  };

  const obterLocalizacaoAtual = () => {
    if (!navigator.geolocation) {
      showSnackbar('Geolocalização não suportada pelo navegador', 'error');
      setFluxoEscolhido(null);
      return;
    }

    setBuscandoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPosicaoMapa(pos);
        setEtapaAtual(1);
        setBuscandoLocalizacao(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        showSnackbar('Não foi possível obter sua localização. Verifique as permissões do navegador.', 'error');
        setBuscandoLocalizacao(false);
        setFluxoEscolhido(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ========== HANDLERS DO MAPA ==========
  const handleMapClick = (pos: PosicaoMapa) => {
    setPosicaoMapa(pos);
    setFormTemp((prev) => ({
      ...prev,
      latitude: String(pos.lat),
      longitude: String(pos.lng),
    }));
  };

  const handleConfirmarPosicao = async () => {
    if (!posicaoMapa) {
      showSnackbar('Selecione uma posição no mapa', 'warning');
      return;
    }

    // Salvar coordenadas
    setFormTemp((prev) => ({
      ...prev,
      latitude: String(posicaoMapa.lat),
      longitude: String(posicaoMapa.lng),
    }));

    // Se fluxo B, fazer reverse geocoding
    if (fluxoEscolhido === 'localizacao-primeiro') {
      setFazendoReverseGeo(true);
      try {
        const data: ReverseResult = await geoService.reverse(posicaoMapa.lat, posicaoMapa.lng);
        const addr = data.address ?? {};

        setFormTemp((prev) => ({
          ...prev,
          logradouro: addr.road || addr.pedestrian || addr.footway || prev.logradouro,
          numero: addr.house_number || prev.numero,
          cep: addr.postcode || prev.cep,
          latitude: String(posicaoMapa.lat),
          longitude: String(posicaoMapa.lng),
        }));
      } catch (err) {
        console.warn('Reverse geocoding falhou:', err);
      } finally {
        setFazendoReverseGeo(false);
      }
    }

    // Avançar para formulário final
    setEtapaAtual(fluxoEscolhido === 'texto-primeiro' ? 3 : 2);
  };

  const handleVoltarAoMapa = () => {
    setEtapaAtual(fluxoEscolhido === 'texto-primeiro' ? 2 : 1);
  };

  // ========== VALIDAÇÃO E CONFIRMAÇÃO ==========
  const validarFormulario = (): string | null => {
    if (!formTemp.cep.trim()) return 'CEP é obrigatório';
    if (!formTemp.logradouro.trim()) return 'Logradouro é obrigatório';
    if (!formTemp.numero.trim()) return 'Número é obrigatório';
    if (!formTemp.latitude || !formTemp.longitude) return 'Coordenadas são obrigatórias. Confirme a posição no mapa.';

    const cepDigits = formTemp.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return 'CEP inválido';

    return null;
  };

  const handleConfirmar = () => {
    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      showSnackbar(erroValidacao, 'warning');
      return;
    }

    onChange(formTemp);
    handleCloseDialog();
    showSnackbar('Endereço confirmado!', 'success');
  };

  // ========== VERIFICAR SE ENDEREÇO ESTÁ COMPLETO ==========
  const enderecoCompleto = endereco.cep && endereco.logradouro && endereco.numero && endereco.latitude && endereco.longitude;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Endereço do Ponto de Coleta *
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {enderecoCompleto ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'success.light',
            border: '1px solid',
            borderColor: 'success.main',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="success.dark" gutterBottom>
                ✓ Endereço Confirmado
              </Typography>
              <Typography variant="body2" color="success.dark">
                {endereco.logradouro}, {endereco.numero}
              </Typography>
              {endereco.complemento && (
                <Typography variant="body2" color="success.dark">
                  Complemento: {endereco.complemento}
                </Typography>
              )}
              <Typography variant="body2" color="success.dark">
                CEP: {endereco.cep}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<EditLocationIcon />}
              onClick={handleOpenDialog}
              sx={{ color: 'success.dark' }}
            >
              Editar
            </Button>
          </Box>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          startIcon={<LocationOnIcon />}
          onClick={handleOpenDialog}
          fullWidth
          size="large"
          sx={{ mb: 2 }}
        >
          Informar Endereço
        </Button>
      )}

      {/* ========== DIÁLOGO PRINCIPAL ========== */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon color="primary" />
            Endereço do Ponto de Coleta
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Escolha do fluxo */}
            {etapaAtual === 0 && (
              <Box>
                <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                  Como você prefere informar o endereço?
                </Typography>

                <Stack spacing={2}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                      },
                    }}
                    onClick={handleEscolherTexto}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <EditLocationIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Digitar Endereço
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Digite CEP e número. Vamos localizar no mapa para você confirmar.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 3,
                      },
                    }}
                    onClick={handleEscolherLocalizacao}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <MapIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Usar Mapa
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Localizar sua posição atual e marcar no mapa.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Stack>

                {buscandoLocalizacao && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">
                      Obtendo sua localização...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Fluxo A - Etapa 1: Formulário de texto */}
            {fluxoEscolhido === 'texto-primeiro' && etapaAtual === 1 && (
              <Box>
                <Stepper activeStep={0} sx={{ mb: 3 }}>
                  <Step>
                    <StepLabel>Dados do Endereço</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Localizar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Confirmar</StepLabel>
                  </Step>
                </Stepper>

                <Stack spacing={2}>
                  <TextField
                    label="CEP"
                    placeholder="00000-000"
                    value={formTemp.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Logradouro"
                    placeholder="Rua, Avenida, etc."
                    value={formTemp.logradouro}
                    onChange={(e) => setFormTemp({ ...formTemp, logradouro: e.target.value })}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Número"
                    placeholder="123"
                    value={formTemp.numero}
                    onChange={(e) => setFormTemp({ ...formTemp, numero: e.target.value })}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Complemento (opcional)"
                    placeholder="Sala, Andar, etc."
                    value={formTemp.complemento || ''}
                    onChange={(e) => setFormTemp({ ...formTemp, complemento: e.target.value })}
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    onClick={handleBuscarPorCep}
                    disabled={buscandoCep}
                    fullWidth
                    size="large"
                  >
                    {buscandoCep ? 'Buscando...' : 'Localizar no Mapa'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Fluxo A - Etapa 2: Mapa */}
            {fluxoEscolhido === 'texto-primeiro' && etapaAtual === 2 && posicaoMapa && (
              <Box>
                <Stepper activeStep={1} sx={{ mb: 3 }}>
                  <Step completed>
                    <StepLabel>Dados do Endereço</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Localizar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Confirmar</StepLabel>
                  </Step>
                </Stepper>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Clique no mapa para ajustar a posição exata do endereço
                </Alert>

                <Paper elevation={2} sx={{ height: 400, overflow: 'hidden' }}>
                  <MapContainer
                    center={[posicaoMapa.lat, posicaoMapa.lng]}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[posicaoMapa.lat, posicaoMapa.lng]} />
                    <MapClickHandler onPositionChange={handleMapClick} />
                    <MapRecenter center={posicaoMapa} />
                  </MapContainer>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button onClick={() => setEtapaAtual(1)} fullWidth>
                    Voltar
                  </Button>
                  <Button variant="contained" onClick={handleConfirmarPosicao} fullWidth>
                    Confirmar Posição
                  </Button>
                </Box>
              </Box>
            )}

            {/* Fluxo B - Etapa 1: Mapa */}
            {fluxoEscolhido === 'localizacao-primeiro' && etapaAtual === 1 && posicaoMapa && (
              <Box>
                <Stepper activeStep={0} sx={{ mb: 3 }}>
                  <Step>
                    <StepLabel>Marcar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Confirmar Dados</StepLabel>
                  </Step>
                </Stepper>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Clique no mapa para marcar a posição do endereço
                </Alert>

                <Paper elevation={2} sx={{ height: 400, overflow: 'hidden' }}>
                  <MapContainer
                    center={[posicaoMapa.lat, posicaoMapa.lng]}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[posicaoMapa.lat, posicaoMapa.lng]} />
                    <MapClickHandler onPositionChange={handleMapClick} />
                    <MapRecenter center={posicaoMapa} />
                  </MapContainer>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button onClick={() => setEtapaAtual(0)} fullWidth>
                    Voltar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirmarPosicao}
                    disabled={fazendoReverseGeo}
                    fullWidth
                  >
                    {fazendoReverseGeo ? 'Buscando endereço...' : 'Continuar'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Formulário final */}
            {((fluxoEscolhido === 'texto-primeiro' && etapaAtual === 3) ||
              (fluxoEscolhido === 'localizacao-primeiro' && etapaAtual === 2)) && (
              <Box>
                <Stepper
                  activeStep={fluxoEscolhido === 'texto-primeiro' ? 2 : 1}
                  sx={{ mb: 3 }}
                >
                  {fluxoEscolhido === 'texto-primeiro' ? (
                    <>
                      <Step completed>
                        <StepLabel>Dados do Endereço</StepLabel>
                      </Step>
                      <Step completed>
                        <StepLabel>Localizar no Mapa</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Confirmar</StepLabel>
                      </Step>
                    </>
                  ) : (
                    <>
                      <Step completed>
                        <StepLabel>Marcar no Mapa</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Confirmar Dados</StepLabel>
                      </Step>
                    </>
                  )}
                </Stepper>

                <Alert severity="success" sx={{ mb: 2 }}>
                  Revise os dados do endereço e confirme
                </Alert>

                <Stack spacing={2}>
                  <TextField
                    label="CEP"
                    value={formTemp.cep}
                    onChange={(e) => setFormTemp({ ...formTemp, cep: e.target.value })}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Logradouro"
                    value={formTemp.logradouro}
                    onChange={(e) => setFormTemp({ ...formTemp, logradouro: e.target.value })}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Número"
                    value={formTemp.numero}
                    onChange={(e) => setFormTemp({ ...formTemp, numero: e.target.value })}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Complemento (opcional)"
                    value={formTemp.complemento || ''}
                    onChange={(e) => setFormTemp({ ...formTemp, complemento: e.target.value })}
                    fullWidth
                  />

                  <TextField
                    label="Apelido (opcional)"
                    placeholder="Ex: Matriz, Filial Centro, etc."
                    value={formTemp.apelido || ''}
                    onChange={(e) => setFormTemp({ ...formTemp, apelido: e.target.value })}
                    fullWidth
                    helperText="Um nome para identificar este endereço"
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button onClick={handleVoltarAoMapa} fullWidth>
                      Voltar ao Mapa
                    </Button>
                    <Button variant="contained" onClick={handleConfirmar} fullWidth>
                      Confirmar Endereço
                    </Button>
                  </Box>
                </Stack>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* ========== SNACKBAR PARA NOTIFICAÇÕES ========== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
