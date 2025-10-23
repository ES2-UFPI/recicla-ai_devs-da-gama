import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Snackbar,
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { userService } from '../services/user.service';
import { cepService } from '../services/cep.service';
import { geoService } from '../services/geo.service';
import type { Endereco } from '../types/user';
import type { ReverseResult } from '../services/geo.service';

// Fix ícones Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

interface EnderecoForm {
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  latitude: string;
  longitude: string;
}

interface PosicaoMapa {
  lat: number;
  lng: number;
}

// ============================================================================
// COMPONENTES INTERNOS DO MAPA
// ============================================================================

// Componente para capturar cliques e atualizar marcador
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

// Componente para recentrar o mapa quando a posição muda
function MapRecenter({ center }: { center: PosicaoMapa }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 16);
  }, [center.lat, center.lng, map]);
  return null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface EnderecoSelectorProps {
  onEnderecoIdSelect: (addressId: number) => void;
  enderecoIdSelecionado?: number | null;
}

export function EnderecoSelector({
  onEnderecoIdSelect,
  enderecoIdSelecionado,
}: EnderecoSelectorProps) {
  // ========== ESTADOS PRINCIPAIS ==========
  const [modo, setModo] = useState<'salvos' | 'novo'>('salvos');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(
    enderecoIdSelecionado || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== ESTADOS DO DIÁLOGO ==========
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fluxoEscolhido, setFluxoEscolhido] = useState<FluxoTipo | null>(null);
  const [etapaAtual, setEtapaAtual] = useState(0);

  // ========== ESTADOS DO FORMULÁRIO ==========
  const [form, setForm] = useState<EnderecoForm>({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    latitude: '',
    longitude: '',
  });

  // ========== ESTADOS DO MAPA ==========
  const [posicaoMapa, setPosicaoMapa] = useState<PosicaoMapa | null>(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [fazendoReverseGeo, setFazendoReverseGeo] = useState(false);

  // ========== ESTADOS DE SALVAMENTO ==========
  const [salvando, setSalvando] = useState(false);

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

  // ========== CARREGAR ENDEREÇOS SALVOS ==========
  useEffect(() => {
    fetchEnderecos();
  }, []);

  const fetchEnderecos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getMyAddresses();
      setEnderecos(data);
    } catch (err) {
      console.error('Erro ao carregar endereços:', err);
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setError('Erro ao carregar endereços salvos');
      }
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLERS DE MODO ==========
  const handleModoChange = (newModo: 'salvos' | 'novo') => {
    setModo(newModo);
    if (newModo === 'novo') {
      setEnderecoSelecionado(null);
      onEnderecoIdSelect(0);
    }
  };

  const handleEnderecoSelect = (addressId: number) => {
    setEnderecoSelecionado(addressId);
    onEnderecoIdSelect(addressId);
  };

  // ========== HANDLERS DO DIÁLOGO ==========
  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFluxoEscolhido(null);
    setEtapaAtual(0);
    setForm({
      apelido: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      latitude: '',
      longitude: '',
    });
    setPosicaoMapa(null);
  };

  // ========== FLUXO A: TEXTO PRIMEIRO ==========
  const handleEscolherTexto = () => {
    setFluxoEscolhido('texto-primeiro');
    setEtapaAtual(1);
  };

  const handleBuscarPorCep = async () => {
    if (!form.cep || !form.numero) {
      showSnackbar('Preencha CEP e Número para continuar', 'warning');
      return;
    }

    const cepDigits = form.cep.replace(/\D/g, '');
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
      const logradouroFinal = form.logradouro.trim() || viaCepData.logradouro;
      setForm((prev) => ({
        ...prev,
        logradouro: logradouroFinal,
        cep: cepService.format(cepDigits),
      }));

      // 3. Montar query de geocoding: "Logradouro, Número, Cidade-UF, Brasil"
      const query = `${logradouroFinal}, ${form.numero}, ${viaCepData.localidade} - ${viaCepData.uf}, Brasil`;

      // 4. Geocoding
      const resultados = await geoService.search(query);
      if (!resultados || resultados.length === 0) {
        // Fallback: tentar apenas CEP
        const resultadosCep = await geoService.search(cepDigits);
        if (!resultadosCep || resultadosCep.length === 0) {
          showSnackbar('Não foi possível localizar o endereço no mapa. Ajuste manualmente.', 'warning');
          // Posição padrão: Teresina, PI
          setPosicaoMapa({ lat: -5.0892, lng: -42.8034 });
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
    setForm((prev) => ({ ...prev, cep }));

    const digits = cep.replace(/\D/g, '');
    if (digits.length === 8) {
      try {
        const via = await cepService.lookup(digits);
        if (via?.logradouro) {
          setForm((prev) => ({
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
    setForm((prev) => ({
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
    setForm((prev) => ({
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

        setForm((prev) => ({
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

  // ========== VALIDAÇÃO E SALVAMENTO ==========
  const validarFormulario = (): string | null => {
    if (!form.cep.trim()) return 'CEP é obrigatório';
    if (!form.logradouro.trim()) return 'Logradouro é obrigatório';
    if (!form.numero.trim()) return 'Número é obrigatório';
    if (!form.latitude || !form.longitude) return 'Coordenadas são obrigatórias. Confirme a posição no mapa.';

    const cepDigits = form.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return 'CEP inválido';

    return null;
  };

  const handleSalvar = async () => {
    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      showSnackbar(erroValidacao, 'warning');
      return;
    }

    setSalvando(true);
    try {
      const result = await userService.addAddress(form);
      await fetchEnderecos();
      handleEnderecoSelect(result.id);
      setModo('salvos');
      handleCloseDialog();
      showSnackbar('Endereço cadastrado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      
      // Tratamento específico para erro de autenticação
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 401) {
        showSnackbar('Sessão expirada. Por favor, faça login novamente.', 'error');
        // Opcional: redirecionar para login
        // window.location.href = '/login';
      } else {
        const mensagem = error?.response?.data?.detail || 'Erro ao salvar endereço. Tente novamente.';
        showSnackbar(mensagem, 'error');
      }
    } finally {
      setSalvando(false);
    }
  };

  // ========== RENDERIZAÇÃO: SELETOR DE ENDEREÇOS SALVOS ==========
  const enderecoSelecionadoObj = enderecos.find((e) => e.id === enderecoSelecionado);

  return (
    <Box>
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
          Endereço de Coleta
        </FormLabel>
        <RadioGroup
          row
          value={modo}
          onChange={(e) => handleModoChange(e.target.value as 'salvos' | 'novo')}
        >
          <FormControlLabel value="salvos" control={<Radio />} label="Endereços Salvos" />
          <FormControlLabel value="novo" control={<Radio />} label="Novo Endereço" />
        </RadioGroup>
      </FormControl>

      {modo === 'salvos' && (
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : enderecos.length === 0 ? (
            <Alert severity="info">
              Nenhum endereço salvo. Cadastre um novo endereço para continuar.
            </Alert>
          ) : (
            <>
              <FormControl fullWidth size="small">
                <Select
                  value={enderecoSelecionado || ''}
                  onChange={(e) => handleEnderecoSelect(Number(e.target.value))}
                  displayEmpty
                  startAdornment={<LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="" disabled>
                    Selecione um endereço
                  </MenuItem>
                  {enderecos.map((endereco) => (
                    <MenuItem key={endereco.id} value={endereco.id}>
                      {endereco.apelido
                        ? `${endereco.apelido} - ${endereco.logradouro}, ${endereco.numero}`
                        : `${endereco.logradouro}, ${endereco.numero}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {enderecoSelecionadoObj && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'success.light',
                    border: '1px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="success.dark" gutterBottom>
                    ✓ Endereço Selecionado
                  </Typography>
                  {enderecoSelecionadoObj.apelido && (
                    <Chip
                      label={enderecoSelecionadoObj.apelido}
                      size="small"
                      color="success"
                      sx={{ mb: 1 }}
                    />
                  )}
                  <Typography variant="body2" color="success.dark">
                    <strong>Endereço:</strong> {enderecoSelecionadoObj.logradouro}, {enderecoSelecionadoObj.numero}
                  </Typography>
                  {enderecoSelecionadoObj.complemento && (
                    <Typography variant="body2" color="success.dark">
                      <strong>Complemento:</strong> {enderecoSelecionadoObj.complemento}
                    </Typography>
                  )}
                  <Typography variant="body2" color="success.dark">
                    <strong>CEP:</strong> {enderecoSelecionadoObj.cep}
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      )}

      {modo === 'novo' && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddLocationIcon />}
            onClick={handleOpenDialog}
            fullWidth
          >
            Cadastrar Novo Endereço
          </Button>
        </Box>
      )}

      {/* ========== DIÁLOGO PRINCIPAL ========== */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddLocationIcon color="primary" />
            Cadastrar Novo Endereço
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* ===== ETAPA 0: ESCOLHA DO FLUXO ===== */}
            {etapaAtual === 0 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>Escolha como deseja cadastrar seu endereço:</strong>
                  <br />
                  Você pode começar digitando o CEP ou usar sua localização atual.
                </Alert>

                <Stack spacing={2}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={handleEscolherTexto}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EditLocationIcon color="primary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          📝 Digitar CEP e Endereço
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Digite CEP e número → Sistema localiza no mapa → Você ajusta se necessário
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={handleEscolherLocalizacao}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {buscandoLocalizacao ? (
                        <CircularProgress size={40} />
                      ) : (
                        <MyLocationIcon color="secondary" sx={{ fontSize: 40 }} />
                      )}
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          📍 Usar Minha Localização
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {buscandoLocalizacao
                            ? 'Obtendo sua localização...'
                            : 'GPS localiza você → Ajusta no mapa → Preenche os dados'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* ===== FLUXO A - ETAPA 1: DIGITAÇÃO CEP/NÚMERO ===== */}
            {fluxoEscolhido === 'texto-primeiro' && etapaAtual === 1 && (
              <Box>
                <Alert severity="success" icon={<EditLocationIcon />} sx={{ mb: 3 }}>
                  <strong>Passo 1:</strong> Digite o CEP e o número da residência
                </Alert>

                <Stepper activeStep={0} sx={{ mb: 3 }}>
                  <Step>
                    <StepLabel>Digitar CEP</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Ajustar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Confirmar Dados</StepLabel>
                  </Step>
                </Stepper>

                <Stack spacing={2}>
                  <TextField
                    label="CEP"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ maxLength: 9 }}
                    helperText="Auto-preenche o logradouro"
                  />

                  <TextField
                    label="Logradouro"
                    placeholder="Ex: Rua das Flores"
                    value={form.logradouro}
                    onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Número"
                    placeholder="123"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    fullWidth
                    required
                  />

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleBuscarPorCep}
                    disabled={buscandoCep || !form.cep || !form.numero}
                    startIcon={buscandoCep ? <CircularProgress size={20} /> : <LocationOnIcon />}
                    fullWidth
                  >
                    {buscandoCep ? 'Localizando...' : 'Localizar no Mapa'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* ===== FLUXO A - ETAPA 2: MAPA (AJUSTE) ===== */}
            {fluxoEscolhido === 'texto-primeiro' && etapaAtual === 2 && posicaoMapa && (
              <Box>
                <Alert severity="info" icon={<LocationOnIcon />} sx={{ mb: 2 }}>
                  <strong>Passo 2:</strong> Ajuste o marcador clicando no local exato da coleta
                </Alert>

                <Stepper activeStep={1} sx={{ mb: 3 }}>
                  <Step completed>
                    <StepLabel>Digitar CEP</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Ajustar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Confirmar Dados</StepLabel>
                  </Step>
                </Stepper>

                <Paper elevation={3} sx={{ height: 400, overflow: 'hidden', borderRadius: 2, mb: 2 }}>
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

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setEtapaAtual(1)}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleConfirmarPosicao}
                    fullWidth
                  >
                    Confirmar Posição
                  </Button>
                </Stack>
              </Box>
            )}

            {/* ===== FLUXO B - ETAPA 1: MAPA (AJUSTE) ===== */}
            {fluxoEscolhido === 'localizacao-primeiro' && etapaAtual === 1 && posicaoMapa && (
              <Box>
                <Alert severity="info" icon={<MyLocationIcon />} sx={{ mb: 2 }}>
                  <strong>Passo 1:</strong> Sua localização foi detectada. Ajuste o marcador se necessário.
                </Alert>

                <Stepper activeStep={0} sx={{ mb: 3 }}>
                  <Step>
                    <StepLabel>Ajustar no Mapa</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Preencher Dados</StepLabel>
                  </Step>
                </Stepper>

                <Paper elevation={3} sx={{ height: 400, overflow: 'hidden', borderRadius: 2, mb: 2 }}>
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

                <Button
                  variant="contained"
                  size="large"
                  startIcon={fazendoReverseGeo ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  onClick={handleConfirmarPosicao}
                  disabled={fazendoReverseGeo}
                  fullWidth
                >
                  {fazendoReverseGeo ? 'Buscando endereço...' : 'Confirmar e Preencher Dados'}
                </Button>
              </Box>
            )}

            {/* ===== FORMULÁRIO FINAL (AMBOS OS FLUXOS) ===== */}
            {((fluxoEscolhido === 'texto-primeiro' && etapaAtual === 3) ||
              (fluxoEscolhido === 'localizacao-primeiro' && etapaAtual === 2)) && (
              <Box>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
                  <strong>Última etapa:</strong> Revise e complete os dados do endereço
                </Alert>

                {fluxoEscolhido === 'texto-primeiro' ? (
                  <Stepper activeStep={2} sx={{ mb: 3 }}>
                    <Step completed>
                      <StepLabel>Digitar CEP</StepLabel>
                    </Step>
                    <Step completed>
                      <StepLabel>Ajustar no Mapa</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Confirmar Dados</StepLabel>
                    </Step>
                  </Stepper>
                ) : (
                  <Stepper activeStep={1} sx={{ mb: 3 }}>
                    <Step completed>
                      <StepLabel>Ajustar no Mapa</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Preencher Dados</StepLabel>
                    </Step>
                  </Stepper>
                )}

                <Stack spacing={2}>
                  <TextField
                    label="Apelido (opcional)"
                    placeholder="Ex: Casa, Trabalho, Escritório"
                    value={form.apelido}
                    onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                    fullWidth
                  />

                  <Divider />

                  <TextField
                    label="CEP"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    fullWidth
                    required
                    inputProps={{ maxLength: 9 }}
                  />

                  <TextField
                    label="Logradouro"
                    placeholder="Ex: Rua das Flores"
                    value={form.logradouro}
                    onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Número"
                    placeholder="123"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Complemento"
                    placeholder="Ex: Apto 101, Bloco B"
                    value={form.complemento}
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />

                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleVoltarAoMapa}
                    fullWidth
                  >
                    Ajustar Posição no Mapa
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={salvando}>
            Cancelar
          </Button>
          {((fluxoEscolhido === 'texto-primeiro' && etapaAtual === 3) ||
            (fluxoEscolhido === 'localizacao-primeiro' && etapaAtual === 2)) && (
            <Button
              onClick={handleSalvar}
              variant="contained"
              disabled={salvando}
              startIcon={salvando ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {salvando ? 'Salvando...' : 'Salvar Endereço'}
            </Button>
          )}
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
