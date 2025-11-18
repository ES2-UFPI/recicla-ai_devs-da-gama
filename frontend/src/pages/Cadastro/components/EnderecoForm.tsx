import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { Endereco } from '../../../types/endereco';

interface EnderecoFormProps {
  endereco: Endereco;
  onChange: (endereco: Endereco) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  errors?: Partial<Record<keyof Endereco, string>>;
}

export function EnderecoForm({ 
  endereco, 
  onChange, 
  onRemove, 
  showRemove = false,
  errors = {}
}: EnderecoFormProps) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleChange = (field: keyof Endereco, value: string) => {
    onChange({ ...endereco, [field]: value });
  };

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        setLoadingCep(false);
        return;
      }

      // Buscar coordenadas usando o endereço completo
      const address = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const geoData = await geoResponse.json();

      const latitude = geoData[0]?.lat || '';
      const longitude = geoData[0]?.lon || '';

      onChange({
        ...endereco,
        cep: `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
        logradouro: data.logradouro || '',
        latitude,
        longitude,
      });
    } catch {
      setCepError('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  useEffect(() => {
    const cleanCep = endereco.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchCep(endereco.cep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCepChange = (value: string) => {
    // Aplicar máscara: 12345-678
    const cleaned = value.replace(/\D/g, '');
    let masked = cleaned;
    if (cleaned.length > 5) {
      masked = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
    }
    
    handleChange('cep', masked);

    // Buscar quando completar 8 dígitos
    if (cleaned.length === 8) {
      fetchCep(masked);
    }
  };

  return (
    <Box 
      sx={{ 
        p: 3, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        position: 'relative',
        backgroundColor: 'background.paper'
      }}
    >
      {showRemove && onRemove && (
        <IconButton
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'error.main',
          }}
          aria-label="Remover endereço"
        >
          <DeleteIcon />
        </IconButton>
      )}

      <Stack spacing={2}>
        <TextField
          label="Apelido (opcional)"
          placeholder="Ex: Casa, Trabalho, Empresa"
          value={endereco.apelido || ''}
          onChange={(e) => handleChange('apelido', e.target.value)}
          fullWidth
          error={!!errors.apelido}
          helperText={errors.apelido}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="CEP"
            placeholder="00000-000"
            value={endereco.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            fullWidth
            required
            error={!!errors.cep || !!cepError}
            helperText={errors.cep || cepError}
            InputProps={{
              endAdornment: loadingCep && <CircularProgress size={20} />,
            }}
          />

          <TextField
            label="Número"
            placeholder="123"
            value={endereco.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            fullWidth
            required
            error={!!errors.numero}
            helperText={errors.numero}
          />
        </Box>

        <TextField
          label="Logradouro"
          placeholder="Rua, Avenida, etc."
          value={endereco.logradouro}
          onChange={(e) => handleChange('logradouro', e.target.value)}
          fullWidth
          required
          error={!!errors.logradouro}
          helperText={errors.logradouro}
          disabled={loadingCep}
        />

        <TextField
          label="Complemento (opcional)"
          placeholder="Ex: Apto 101, Bloco B"
          value={endereco.complemento || ''}
          onChange={(e) => handleChange('complemento', e.target.value)}
          fullWidth
        />

        {/* Campos ocultos para latitude e longitude */}
        {(endereco.latitude || endereco.longitude) && (
          <Alert severity="success">
            Localização obtida: {endereco.latitude}, {endereco.longitude}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
