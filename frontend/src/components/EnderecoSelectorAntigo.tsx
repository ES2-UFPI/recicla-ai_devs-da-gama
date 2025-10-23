import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { userService } from '../services/user.service';
import type { Endereco } from '../types/user';
import { MapSelector } from './MapSelector';
import { geoService } from '../services/geo.service';
import type { ReverseResult } from '../services/geo.service';
import { cepService } from '../services/cep.service';

interface EnderecoSelectorProps {
  onEnderecoIdSelect: (addressId: number) => void;
  enderecoIdSelecionado?: number | null;
}

export function EnderecoSelector({
  onEnderecoIdSelect,
  enderecoIdSelecionado,
}: EnderecoSelectorProps) {
  const [modo, setModo] = useState<'salvos' | 'novo'>('salvos');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(
    enderecoIdSelecionado || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [novaOpcao, setNovaOpcao] = useState<'minha-localizacao' | 'cep-primeiro'>('minha-localizacao');
  const [cepEntrada, setCepEntrada] = useState('');
  const [numeroEntrada, setNumeroEntrada] = useState('');
  const [logradouroEntrada, setLogradouroEntrada] = useState('');
  const [posInicialMapa, setPosInicialMapa] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [novoEndereco, setNovoEndereco] = useState<Omit<Endereco, 'id'>>({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    latitude: '',
    longitude: '',
  });

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
      setError('Erro ao carregar endereços salvos');
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenDialog = () => {
    setDialogOpen(true);
  setNovaOpcao('minha-localizacao');
  setCepEntrada('');
  setNumeroEntrada('');
    setLogradouroEntrada('');
  setPosInicialMapa(undefined);
    setNovoEndereco({
      apelido: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      latitude: '',
      longitude: '',
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setNovoEndereco((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
    try {
      const data: ReverseResult = await geoService.reverse(lat, lng);
      const addr = data.address ?? {};
      preencherEndereco({
        lat,
        lon: lng,
        road: addr.road || addr.pedestrian || addr.footway,
        house_number: addr.house_number,
        postcode: addr.postcode,
        suburb: addr.suburb || addr.neighbourhood,
        city: addr.city || addr.town || addr.village,
        display_name: data.display_name,
      });
  // UI simplificada: não exibimos mais o display_name completo
    } catch (e) {
      console.error('Erro no reverse geocoding:', e);
    }
  };

  // Preenche campos a partir de objeto do Nominatim
  const preencherEndereco = (data: {
    lat: number;
    lon: number;
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    display_name?: string;
  }) => {
    const logradouro = data.road || data.pedestrian || data.footway || '';
    const numero = data.house_number || '';
    const cep = data.postcode || '';
    setNovoEndereco((prev) => ({
      ...prev,
      logradouro,
      numero,
      cep,
      latitude: String(data.lat),
      longitude: String(data.lon),
    }));
  };

  // Busca e geolocalização: usar controles do próprio MapSelector para evitar duplicidade

  const handleSaveNovoEndereco = async () => {
    if (!novoEndereco.cep.trim()) {
      alert('CEP é obrigatório');
      return;
    }
    if (!novoEndereco.logradouro.trim()) {
      alert('Logradouro é obrigatório');
      return;
    }
    if (!novoEndereco.numero.trim()) {
      alert('Número é obrigatório');
      return;
    }
    if (!novoEndereco.latitude || !novoEndereco.longitude) {
      alert('Selecione a localização no mapa');
      return;
    }

    setSalvandoEndereco(true);
    try {
      const result = await userService.addAddress(novoEndereco);
      await fetchEnderecos();
      handleEnderecoSelect(result.id);
      setModo('salvos');
      handleCloseDialog();
      alert('Endereço cadastrado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      alert('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSalvandoEndereco(false);
    }
  };

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
                    <strong>Logradouro:</strong> {enderecoSelecionadoObj.logradouro}, {enderecoSelecionadoObj.numero}
                  </Typography>
                  {enderecoSelecionadoObj.complemento && (
                    <Typography variant="body2" color="success.dark">
                      <strong>Complemento:</strong> {enderecoSelecionadoObj.complemento}
                    </Typography>
                  )}
                  <Typography variant="body2" color="success.dark">
                    <strong>CEP:</strong> {enderecoSelecionadoObj.cep}
                  </Typography>
                  <Typography variant="caption" color="success.dark" display="block" sx={{ mt: 1 }}>
                    📍 {enderecoSelecionadoObj.latitude}, {enderecoSelecionadoObj.longitude}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Novo Endereço</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Você pode escolher uma das opções abaixo para cadastrar seu endereço.
            </Alert>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Como deseja cadastrar?</FormLabel>
              <RadioGroup
                row
                value={novaOpcao}
                onChange={(e) => setNovaOpcao(e.target.value as 'minha-localizacao' | 'cep-primeiro')}
              >
                <FormControlLabel value="minha-localizacao" control={<Radio />} label="Usar minha localização" />
                <FormControlLabel value="cep-primeiro" control={<Radio />} label="Digitar CEP e Número" />
              </RadioGroup>
            </FormControl>

            {novaOpcao === 'minha-localizacao' && (
              <MapSelector
                onLocationSelect={handleLocationSelect}
                initialPosition={posInicialMapa}
                hideSearchInput={false}
                hideUseMyLocationButton={false}
              />
            )}

            {novaOpcao === 'cep-primeiro' && (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, mt: 1 }}>
                  <TextField
                    label="CEP *"
                    placeholder="00000-000"
                    value={cepEntrada}
                    onChange={async (e) => {
                      const v = e.target.value;
                      setCepEntrada(v);
                      const digits = v.replace(/\D/g, '');
                      if (digits.length === 8) {
                        try {
                          const via = await cepService.lookup(digits);
                          if (via?.logradouro) {
                            setLogradouroEntrada((prev) => prev || via.logradouro);
                          }
                        } catch (err) {
                          console.warn('CEP lookup falhou:', err);
                        }
                      }
                    }}
                    fullWidth
                    size="small"
                    required
                    inputProps={{ maxLength: 9 }}
                  />
                  <TextField
                    label="Logradouro *"
                    placeholder="Ex: Rua das Flores"
                    value={logradouroEntrada}
                    onChange={(e) => setLogradouroEntrada(e.target.value)}
                    fullWidth
                    size="small"
                    required
                  />
                  <TextField
                    label="Número *"
                    placeholder="123"
                    value={numeroEntrada}
                    onChange={(e) => setNumeroEntrada(e.target.value)}
                    size="small"
                    required
                    sx={{ width: { xs: '100%', sm: 200 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={async () => {
                      const cepNormalized = cepEntrada.replace(/\D/g, '');
                      if (cepNormalized.length !== 8 || !numeroEntrada.trim()) {
                        alert('Informe um CEP válido (8 dígitos) e o Número.');
                        return;
                      }
                      try {
                        // 1) Buscar CEP no ViaCEP para obter logradouro/cidade/UF
                        const via = await cepService.lookup(cepNormalized);
                        const logradouroBase = logradouroEntrada.trim() || via?.logradouro || '';
                        if (!logradouroBase) {
                          alert('Informe o Logradouro para localizar no mapa.');
                          return;
                        }
                        // 2) Atualizar formulário com dados confirmados
                        setNovoEndereco((prev) => ({
                          ...prev,
                          cep: cepService.format(cepNormalized),
                          logradouro: logradouroBase,
                          numero: numeroEntrada,
                        }));
                        // 3) Query precisa: "logradouro, numero, cidade - UF, Brasil" para desambiguar
                        const cidadeUf = via ? `${via.localidade} - ${via.uf}` : 'Teresina - PI';
                        const preciseCep = cepService.format(cepNormalized);
                        const query = `${logradouroBase}, ${numeroEntrada}, ${cidadeUf}, Brasil`;
                        const resultados = await geoService.search(query);
                        if (!resultados || resultados.length === 0) {
                          // Fallback: apenas CEP
                          const fb = await geoService.search(preciseCep);
                          if (!fb || fb.length === 0) {
                            alert('Não foi possível localizar no mapa. Ajuste os dados e tente novamente.');
                            return;
                          }
                          const f = fb[0];
                          const flat = parseFloat(f.lat);
                          const flon = parseFloat(f.lon);
                          setPosInicialMapa({ lat: flat, lng: flon });
                          await handleLocationSelect(flat, flon);
                          return;
                        }
                        const top = resultados[0];
                        const lat = parseFloat(top.lat);
                        const lon = parseFloat(top.lon);
                        setPosInicialMapa({ lat, lng: lon });
                        await handleLocationSelect(lat, lon);
                      } catch (e) {
                        console.error('Erro ao localizar por CEP/Logradouro/Numero:', e);
                        alert('Erro ao localizar no mapa.');
                      }
                    }}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Localizar no mapa
                  </Button>
                </Stack>

                <MapSelector
                  onLocationSelect={handleLocationSelect}
                  initialPosition={posInicialMapa}
                  hideSearchInput
                  hideUseMyLocationButton
                />
              </>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Dados do Endereço
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Apelido (opcional)"
                  placeholder="Ex: Casa, Trabalho, Matriz"
                  value={novoEndereco.apelido}
                  onChange={(e) =>
                    setNovoEndereco({ ...novoEndereco, apelido: e.target.value })
                  }
                  fullWidth
                  size="small"
                  helperText="Um nome para identificar este endereço"
                />

                <TextField
                  label="CEP *"
                  placeholder="00000-000"
                  value={novoEndereco.cep}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, cep: e.target.value })}
                  onBlur={async (e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    if (digits.length === 8) {
                      try {
                        const via = await cepService.lookup(digits);
                        setNovoEndereco((prev) => ({
                          ...prev,
                          cep: cepService.format(digits),
                          logradouro: prev.logradouro || via?.logradouro || prev.logradouro,
                        }));
                      } catch (err) {
                        console.warn('CEP lookup falhou:', err);
                      }
                    }
                  }}
                  fullWidth
                  size="small"
                  required
                  inputProps={{ maxLength: 9 }}
                />

                <TextField
                  label="Logradouro *"
                  placeholder="Ex: Rua das Flores"
                  value={novoEndereco.logradouro}
                  onChange={(e) =>
                    setNovoEndereco({ ...novoEndereco, logradouro: e.target.value })
                  }
                  fullWidth
                  size="small"
                  required
                  helperText="Nome da rua/avenida obtido do mapa"
                />

                <TextField
                  label="Número *"
                  placeholder="123"
                  value={novoEndereco.numero}
                  onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })}
                  fullWidth
                  size="small"
                  required
                />

                <TextField
                  label="Complemento"
                  placeholder="Ex: Apto 101, Bloco B, Portão Verde"
                  value={novoEndereco.complemento}
                  onChange={(e) =>
                    setNovoEndereco({ ...novoEndereco, complemento: e.target.value })
                  }
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                />

                {/* Coordenadas ocultadas para simplificar a UX */}
              </Stack>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={salvandoEndereco}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNovoEndereco}
            variant="contained"
            disabled={
              salvandoEndereco ||
              !novoEndereco.cep ||
              !novoEndereco.logradouro ||
              !novoEndereco.numero ||
              !novoEndereco.latitude ||
              !novoEndereco.longitude
            }
          >
            {salvandoEndereco ? 'Salvando...' : 'Salvar Endereço'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
