import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Stack,
  Alert,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, CheckCircleOutline } from '@mui/icons-material';
import { EnderecoForm } from './EnderecoForm';
import type { Endereco } from '../../../types/endereco';
import type { ReceptorData } from '../types';
import { BaseUserForm } from './BaseUserForm';
import { categoriaService } from '../../../services/categoria.service';
import type { Categoria } from '../../../types/categoria';

interface ReceptorFormProps {
  onSubmit: (data: ReceptorData) => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

const emptyEndereco: Endereco = {
  apelido: '',
  cep: '',
  logradouro: '',
  numero: '',
  latitude: '',
  longitude: '',
  complemento: '',
};

export function ReceptorForm({ onSubmit, loading, error, onBack }: ReceptorFormProps) {
  const [baseData, setBaseData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmacaoSenha: '',
    cidade_id: '',
    estado_id: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<Endereco[]>([{ ...emptyEndereco }]);
  const [accepted_material, setAcceptedMaterial] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  useEffect(() => {
    categoriaService.listActive()
      .then(data => {
        setCategorias(data);
        setLoadingCategorias(false);
      })
      .catch(() => {
        setLoadingCategorias(false);
      });
  }, []);

  const handleBaseDataChange = (data: Partial<typeof baseData>) => {
    setBaseData(prev => ({ ...prev, ...data }));
  };

  const handleFieldError = (field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleAddEndereco = () => {
    setAddresses([...addresses, { ...emptyEndereco }]);
  };

  const handleRemoveEndereco = (index: number) => {
    if (addresses.length === 1) return; // Manter pelo menos 1 endereço
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleEnderecoChange = (index: number, endereco: Endereco) => {
    const newAddresses = [...addresses];
    newAddresses[index] = endereco;
    setAddresses(newAddresses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos base
    const hasBaseErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasBaseErrors) {
      return;
    }

    // Validar endereços (obrigatório pelo menos 1)
    if (addresses.length === 0) {
      return;
    }

    const hasInvalidAddress = addresses.some(addr => 
      !addr.cep || !addr.logradouro || !addr.numero || !addr.latitude || !addr.longitude
    );

    if (hasInvalidAddress) {
      return;
    }

    // Validar materiais aceitos (obrigatório pelo menos 1)
    if (accepted_material.length === 0) {
      return;
    }

    const receptorData: ReceptorData = {
      name: baseData.name,
      email: baseData.email,
      phone: baseData.phone,
      password: baseData.password,
      role_id: 'receptor',
      cidade_id: baseData.cidade_id,
      estado_id: baseData.estado_id,
      addresses,
      accepted_material,
    };

    onSubmit(receptorData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Cadastro de Ponto de Coleta 🏢
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Você recebe e processa materiais recicláveis
          </Typography>
        </Box>
        <Button onClick={onBack} variant="outlined" size="small">
          Voltar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Dados básicos */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Dados do Ponto de Coleta
          </Typography>
          <BaseUserForm
            formData={baseData}
            onChange={handleBaseDataChange}
            fieldErrors={fieldErrors}
            onFieldError={handleFieldError}
          />
        </Paper>

        {/* Materiais Aceitos */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Materiais Aceitos *
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione os tipos de materiais recicláveis que você aceita
          </Typography>

          {loadingCategorias ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Carregando categorias...</Typography>
            </Box>
          ) : (
            <FormControl fullWidth required error={accepted_material.length === 0}>
              <InputLabel>Selecione os materiais</InputLabel>
              <Select
                multiple
                value={accepted_material}
                onChange={(e) => setAcceptedMaterial(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Selecione os materiais" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const categoria = categorias.find(c => c.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={categoria?.tipo || value}
                          size="small"
                          icon={<CheckCircleOutline />}
                          sx={{ 
                            backgroundColor: '#4caf50',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id}>
                    <Chip
                      label={categoria.tipo}
                      size="small"
                      sx={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        mr: 1
                      }}
                    />
                    {categoria.tipo}
                  </MenuItem>
                ))}
              </Select>
              {accepted_material.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  Selecione pelo menos um tipo de material
                </Typography>
              )}
            </FormControl>
          )}
        </Paper>

        {/* Endereços */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Endereços *
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Informe o(s) endereço(s) do seu ponto de coleta (mínimo 1)
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddEndereco}
              variant="outlined"
              size="small"
            >
              Adicionar
            </Button>
          </Box>

          <Stack spacing={2}>
            {addresses.map((endereco, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <EnderecoForm
                  endereco={endereco}
                  onChange={(newEndereco) => handleEnderecoChange(index, newEndereco)}
                  onRemove={() => handleRemoveEndereco(index)}
                  showRemove={addresses.length > 1}
                />
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Informações adicionais */}
        <Alert severity="success" icon={false}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            ✅ Como ponto de coleta, você terá acesso a:
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>
              <Typography variant="body2">
                Receber entregas diretas de produtores
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Aparecer no mapa de pontos de coleta da região
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Gerenciar materiais recebidos e processados
              </Typography>
            </li>
          </ul>
        </Alert>

        {/* Botão de submit */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {loading ? 'Cadastrando...' : 'Criar Conta'}
        </Button>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Já tem uma conta?{' '}
          <a href="/login" style={{ color: '#7b1fa2', textDecoration: 'underline', fontWeight: 600 }}>
            Entrar
          </a>
        </Typography>
      </Stack>
    </Box>
  );
}
