import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Stack,
  Alert,
  Paper
} from '@mui/material';
// CheckCircleOutline removed - not used
// categoriaColor agora é usado dentro do componente CategoriaCheckboxList
import { EnderecoFormReceptor } from './EnderecoFormReceptor';
import type { Endereco } from '../../../types/endereco';
import type { ReceptorData } from '../types';
import { BaseUserForm } from './BaseUserForm';
import { categoriaService } from '../../../services/categoria.service';
import type { Categoria } from '../../../types/categoria';
import { CategoriaCheckboxList } from './CategoriaCheckboxList';

interface ReceptorFormProps {
  onSubmit: (data: ReceptorData) => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

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
  const [endereco, setEndereco] = useState<Endereco>({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    latitude: '',
    longitude: '',
    complemento: '',
  });
  const [enderecoError, setEnderecoError] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos base
    const hasBaseErrors = Object.values(fieldErrors).some(err => err !== '');
    if (hasBaseErrors) {
      return;
    }

    // Validar endereço
    if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.latitude || !endereco.longitude) {
      setEnderecoError('Por favor, complete o endereço do ponto de coleta');
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
      addresses: [endereco],
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
          <CategoriaCheckboxList
            categorias={categorias}
            selected={accepted_material}
            onChange={setAcceptedMaterial}
            loading={loadingCategorias}
            required
            label="Materiais Aceitos *"
            helperText="Selecione os tipos de materiais recicláveis que você aceita"
          />
        </Paper>

        {/* Endereço do Ponto de Coleta */}
        <Paper sx={{ p: 3 }}>
          <EnderecoFormReceptor
            endereco={endereco}
            onChange={(novoEndereco) => {
              setEndereco(novoEndereco);
              setEnderecoError('');
            }}
            error={enderecoError}
          />
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
