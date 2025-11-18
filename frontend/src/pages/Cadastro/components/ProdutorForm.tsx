import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Switch, 
  FormControlLabel,
  TextField,
  Stack,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { EnderecoForm } from './EnderecoForm';
import type { Endereco } from '../../../types/endereco';
import type { ProdutorData } from '../types';
import { BaseUserForm } from './BaseUserForm';
import { validateCNPJ } from '../validation';

interface ProdutorFormProps {
  onSubmit: (data: ProdutorData) => void;
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

export function ProdutorForm({ onSubmit, loading, error, onBack }: ProdutorFormProps) {
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
  
  const [is_business, setIsBusiness] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [addresses, setAddresses] = useState<Endereco[]>([{ ...emptyEndereco }]);

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

  const handleCnpjChange = (value: string) => {
    // Aplicar máscara: 12.345.678/0001-90
    const cleaned = value.replace(/\D/g, '');
    let masked = cleaned;
    
    if (cleaned.length <= 14) {
      if (cleaned.length > 12) {
        masked = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
      } else if (cleaned.length > 8) {
        masked = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
      } else if (cleaned.length > 5) {
        masked = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
      } else if (cleaned.length > 2) {
        masked = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      }
    }

    setCnpj(masked);
    
    // Validar quando tiver 14 dígitos
    if (cleaned.length === 14) {
      setCnpjError(validateCNPJ(masked));
    } else if (cleaned.length > 0) {
      setCnpjError('CNPJ incompleto');
    } else {
      setCnpjError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos base
    const hasBaseErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasBaseErrors) {
      return;
    }

    // Validar endereços
    if (addresses.length === 0) {
      return;
    }

    const hasInvalidAddress = addresses.some(addr => 
      !addr.cep || !addr.logradouro || !addr.numero || !addr.latitude || !addr.longitude
    );

    if (hasInvalidAddress) {
      return;
    }

    // Validar CNPJ se for empresa
    if (is_business && cnpjError) {
      return;
    }

    if (is_business && !cnpj) {
      setCnpjError('CNPJ é obrigatório para empresas');
      return;
    }

    const produtorData: ProdutorData = {
      name: baseData.name,
      email: baseData.email,
      phone: baseData.phone,
      password: baseData.password,
      role_id: 'produtor',
      cidade_id: baseData.cidade_id,
      estado_id: baseData.estado_id,
      addresses,
      is_business,
      ...(is_business && { cnpj }),
      points: 0,
      ranking: 0,
    };

    onSubmit(produtorData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Cadastro de Produtor ♻️
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Você gera resíduos e quer destiná-los de forma sustentável
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
            Dados Pessoais
          </Typography>
          <BaseUserForm
            formData={baseData}
            onChange={handleBaseDataChange}
            fieldErrors={fieldErrors}
            onFieldError={handleFieldError}
          />
        </Paper>

        {/* Tipo de produtor */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Tipo de Produtor
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={is_business}
                onChange={(e) => {
                  setIsBusiness(e.target.checked);
                  if (!e.target.checked) {
                    setCnpj('');
                    setCnpjError('');
                  }
                }}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">
                  {is_business ? 'Sou uma Empresa' : 'Sou Pessoa Física'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {is_business 
                    ? 'Empresas precisam informar CNPJ' 
                    : 'Pessoas físicas não precisam de documento empresarial'
                  }
                </Typography>
              </Box>
            }
          />

          {is_business && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                required
                fullWidth
                error={!!cnpjError}
                helperText={cnpjError || 'Formato: 00.000.000/0000-00'}
              />
            </Box>
          )}
        </Paper>

        {/* Endereços */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Endereços
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Informe onde você gera resíduos (mínimo 1 endereço)
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
          <a href="/login" style={{ color: '#2e7d32', textDecoration: 'underline', fontWeight: 600 }}>
            Entrar
          </a>
        </Typography>
      </Stack>
    </Box>
  );
}
