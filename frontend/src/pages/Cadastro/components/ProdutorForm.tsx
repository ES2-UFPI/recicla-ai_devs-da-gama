import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  Stack,
  Alert,
  Paper,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import type { ProdutorData } from '../types';
import { BaseUserForm } from './BaseUserForm';
import { validateCNPJ } from '../validation';

interface ProdutorFormProps {
  onSubmit: (data: ProdutorData) => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

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
  
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [cnpj, setCnpj] = useState('');
  const [cnpjError, setCnpjError] = useState('');

  const handleBaseDataChange = (data: Partial<typeof baseData>) => {
    setBaseData(prev => ({ ...prev, ...data }));
  };

  const handleFieldError = (field: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
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

    // Validar CNPJ se for pessoa jurídica
    const is_business = tipoPessoa === 'juridica';
    if (is_business && cnpjError) {
      return;
    }

    if (is_business && !cnpj) {
      setCnpjError('CNPJ é obrigatório para pessoa jurídica');
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
      addresses: [], // Endereços serão adicionados posteriormente
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
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Tipo de Pessoa
          </FormLabel>
          
          <RadioGroup
            value={tipoPessoa}
            onChange={(e) => {
              const novoTipo = e.target.value as 'fisica' | 'juridica';
              setTipoPessoa(novoTipo);
              if (novoTipo === 'fisica') {
                setCnpj('');
                setCnpjError('');
              }
            }}
          >
            <FormControlLabel 
              value="fisica" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Sou pessoa física</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Para indivíduos
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="juridica" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Sou pessoa jurídica (CNPJ)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Para empresas
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          {tipoPessoa === 'juridica' && (
            <Box sx={{ mt: 3 }}>
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

        {/* Informação sobre endereços */}
        <Alert severity="info">
          <Typography variant="body2" fontWeight={600} gutterBottom>
            📍 Sobre Endereços
          </Typography>
          <Typography variant="body2">
            Você poderá adicionar seus endereços após o cadastro, na área de perfil.
            Os endereços serão usados para solicitar coletas.
          </Typography>
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
          <a href="/login" style={{ color: '#2e7d32', textDecoration: 'underline', fontWeight: 600 }}>
            Entrar
          </a>
        </Typography>
      </Stack>
    </Box>
  );
}
