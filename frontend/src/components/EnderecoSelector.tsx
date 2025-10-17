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

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setNovoEndereco((prev) => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
      ...(address ? parseAddress(address) : {}),
    }));
  };

  const parseAddress = (address: string) => {
    const parts = address.split(' - ');
    const ruaNumero = parts[0]?.split(', ') || [];
    return {
      logradouro: ruaNumero[0] || '',
      numero: ruaNumero[1] || '',
    };
  };

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
                    <strong>Logradouro:</strong> {enderecoSelecionadoObj.logradouro},{' '}
                    {enderecoSelecionadoObj.numero}
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
              <strong>Passo 1:</strong> Clique no mapa para selecionar a localização
              <br />
              <strong>Passo 2:</strong> Complete os dados do endereço
            </Alert>

            <MapSelector
              onLocationSelect={handleLocationSelect}
              initialPosition={
                novoEndereco.latitude && novoEndereco.longitude
                  ? {
                      lat: parseFloat(novoEndereco.latitude),
                      lng: parseFloat(novoEndereco.longitude),
                    }
                  : undefined
              }
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Dados do Endereço
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Apelido (Opcional)"
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

                {novoEndereco.latitude && novoEndereco.longitude && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: 'info.light',
                      border: '1px solid',
                      borderColor: 'info.main',
                    }}
                  >
                    <Typography variant="caption" color="info.dark" fontWeight={600}>
                      📍 Coordenadas selecionadas:
                    </Typography>
                    <Typography variant="caption" color="info.dark" display="block">
                      Latitude: {novoEndereco.latitude}, Longitude: {novoEndereco.longitude}
                    </Typography>
                  </Paper>
                )}
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
