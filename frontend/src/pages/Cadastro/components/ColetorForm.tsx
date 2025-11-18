import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Stack,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import { Add as AddIcon, InfoOutlined } from '@mui/icons-material';
import { EnderecoForm } from './EnderecoForm';
import type { Endereco } from '../../../types/endereco';
import type { ColetorData } from '../types';
import { BaseUserForm } from './BaseUserForm';

interface ColetorFormProps {
  onSubmit: (data: ColetorData) => void;
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

export function ColetorForm({ onSubmit, loading, error, onBack }: ColetorFormProps) {
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
  const [addresses, setAddresses] = useState<Endereco[]>([]);

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

    const coletorData: ColetorData = {
      name: baseData.name,
      email: baseData.email,
      phone: baseData.phone,
      password: baseData.password,
      role_id: 'coletor',
      cidade_id: baseData.cidade_id,
      estado_id: baseData.estado_id,
      inventory: [],
      ...(addresses.length > 0 && { addresses }),
    };

    onSubmit(coletorData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Cadastro de Coletor 🚛
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Você coleta e transporta resíduos recicláveis
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

        {/* Endereços (opcional) */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Endereços (Opcional)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <InfoOutlined sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Você pode adicionar endereços como base de operações ou pontos de referência
                </Typography>
              </Box>
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

          {addresses.length === 0 ? (
            <Alert severity="info" icon={<InfoOutlined />}>
              Nenhum endereço cadastrado. Como coletor, você pode operar sem endereços fixos.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {addresses.map((endereco, index) => (
                <Box key={index}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  <EnderecoForm
                    endereco={endereco}
                    onChange={(newEndereco) => handleEnderecoChange(index, newEndereco)}
                    onRemove={() => handleRemoveEndereco(index)}
                    showRemove={true}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Informações adicionais */}
        <Alert severity="success" icon={false}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            ✅ Como coletor, você terá acesso a:
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>
              <Typography variant="body2">
                Visualizar solicitações de coleta na sua região
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Aceitar e gerenciar coletas ativas
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Acompanhar seu histórico e desempenho
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
          <a href="/login" style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 600 }}>
            Entrar
          </a>
        </Typography>
      </Stack>
    </Box>
  );
}
