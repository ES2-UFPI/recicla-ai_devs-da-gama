import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import SaveIcon from '@mui/icons-material/Save';
import type { Endereco } from '../types/endereco';
import { MapSelector } from './MapSelector';

interface EnderecoSelectorProps {
  enderecosSalvos?: Endereco[];
  onEnderecoSelect: (endereco: Endereco) => void;
  enderecoSelecionado?: Endereco | null;
}

export function EnderecoSelector({
  enderecosSalvos = [],
  onEnderecoSelect,
  enderecoSelecionado,
}: EnderecoSelectorProps) {
  const [modo, setModo] = useState<'salvos' | 'mapa'>('salvos');
  const [enderecoSalvoId, setEnderecoSalvoId] = useState<string>('');
  const [salvarEndereco, setSalvarEndereco] = useState(false);
  const [apelidoEndereco, setApelidoEndereco] = useState('');

  const handleEnderecoSalvoChange = (apelido: string) => {
    setEnderecoSalvoId(apelido);
    const endereco = enderecosSalvos.find((e) => e.apelido === apelido);
    if (endereco) {
      onEnderecoSelect(endereco);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    const enderecoBase: Endereco = {
      apelido: salvarEndereco ? apelidoEndereco : '',
      cep: '',
      logradouro: address || `Localização: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      numero: '',
      latitude: lat.toString(),
      longitude: lng.toString(),
      complemento: '',
    };
    
    onEnderecoSelect(enderecoBase);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Endereço para Coleta
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Escolha um endereço salvo ou busque no mapa
      </Typography>

      {/* Toggle entre Salvos e Mapa */}
      <ToggleButtonGroup
        value={modo}
        exclusive
        onChange={(_, value) => value && setModo(value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="salvos">
          <HomeIcon sx={{ mr: 1 }} fontSize="small" />
          Endereços Salvos
        </ToggleButton>
        <ToggleButton value="mapa">
          <MapIcon sx={{ mr: 1 }} fontSize="small" />
          Buscar no Mapa
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Modo: Endereços Salvos */}
      {modo === 'salvos' && (
        <FormControl fullWidth size="small">
          <InputLabel>Escolha um endereço</InputLabel>
          <Select
            value={enderecoSalvoId}
            onChange={(e) => handleEnderecoSalvoChange(e.target.value)}
            label="Escolha um endereço"
          >
            {enderecosSalvos.length === 0 ? (
              <MenuItem disabled value="">
                Nenhum endereço salvo disponível
              </MenuItem>
            ) : (
              enderecosSalvos.map((endereco, idx) => (
                <MenuItem key={idx} value={endereco.apelido}>
                  {endereco.apelido} - {endereco.logradouro}, {endereco.numero}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}

      {/* Modo: Buscar no Mapa */}
      {modo === 'mapa' && (
        <Stack spacing={2}>
          <MapSelector
            onLocationSelect={handleLocationSelect}
          />

          {/* Opção de salvar endereço */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={salvarEndereco}
                  onChange={(e) => setSalvarEndereco(e.target.checked)}
                />
              }
              label="Salvar este endereço para uso futuro"
            />
            
            {salvarEndereco && (
              <TextField
                fullWidth
                size="small"
                label="Apelido do endereço"
                placeholder="Ex: Casa, Trabalho, Depósito..."
                value={apelidoEndereco}
                onChange={(e) => setApelidoEndereco(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <SaveIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            )}
          </Paper>
        </Stack>
      )}

      {/* Exibir endereço selecionado */}
      {enderecoSelecionado && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'success.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.main',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="success.dark" gutterBottom>
            ✓ Endereço Selecionado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {enderecoSelecionado.apelido && (
              <strong>{enderecoSelecionado.apelido}:</strong>
            )}{' '}
            {enderecoSelecionado.logradouro}
            {enderecoSelecionado.numero && `, ${enderecoSelecionado.numero}`}
            {enderecoSelecionado.complemento && ` - ${enderecoSelecionado.complemento}`}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
