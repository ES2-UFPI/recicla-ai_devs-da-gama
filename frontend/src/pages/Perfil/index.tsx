import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  MenuItem,
  Alert,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../hooks/useAuth';
import { MainLayout } from '../../layouts/MainLayout';

interface Estado {
  sigla: string;
  nome: string;
}

interface PerfilForm {
  telefone: string;
  cidade: string;
  estado: string;
}

export default function Perfil() {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PerfilForm>({
    telefone: '',
    cidade: '',
    estado: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [isLoadingEstados, setIsLoadingEstados] = useState(false);
  const [isLoadingCidades, setIsLoadingCidades] = useState(false);

  // Inicializa formulário com dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        telefone: user.telefone,
        cidade: user.cidade,
        estado: user.estado,
      });
    }
  }, [user]);

  // Carrega estados do IBGE
  useEffect(() => {
    async function fetchEstados() {
      setIsLoadingEstados(true);
      try {
        const response = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
        );
        const data = await response.json();
        setEstados(data);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      } finally {
        setIsLoadingEstados(false);
      }
    }

    fetchEstados();
  }, []);

  // Carrega cidades quando estado muda
  useEffect(() => {
    if (!formData.estado) {
      setCidades([]);
      return;
    }

    async function fetchCidades() {
      setIsLoadingCidades(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`
        );
        const data = await response.json();
        setCidades(data.map((cidade: { nome: string }) => cidade.nome));
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
      } finally {
        setIsLoadingCidades(false);
      }
    }

    fetchCidades();
  }, [formData.estado]);

  function handleInputChange(field: keyof PerfilForm, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleStartEdit() {
    setIsEditing(true);
    setSuccessMessage('');
  }

  function handleCancelEdit() {
    if (user) {
      setFormData({
        telefone: user.telefone,
        cidade: user.cidade,
        estado: user.estado,
      });
    }
    setIsEditing(false);
    setSuccessMessage('');
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    
    // TODO: Integrar com API real quando backend estiver pronto
    // await api.put('/user/profile', formData);
    
    setIsEditing(false);
    setSuccessMessage('Dados atualizados com sucesso!');
    
    // Auto-esconde mensagem após 5 segundos
    setTimeout(() => setSuccessMessage(''), 5000);
  }

  if (!user) {
    return (
      <MainLayout>
        <Box sx={{ mt: '2rem' }}>
          <Alert severity="warning">
            Usuário não autenticado. Faça login para acessar seu perfil.
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: { xs: '1.5rem', sm: '2.5rem' },
          mt: '2rem',
          mb: '2rem',
        }}
      >
        {/* Cabeçalho */}
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Meu Perfil
        </Typography>
        <Divider sx={{ mb: '1.5rem' }} />

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: '1.5rem' }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setSuccessMessage('')}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {successMessage}
          </Alert>
        )}

        {/* Dados Fixos (Não Editáveis) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', mb: '2rem' }}>
          <TextField
            label="Nome"
            value={user.name}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
          <TextField
            label="E-mail"
            value={user.email}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
          <TextField
            label="Tipo de Usuário"
            value={
              user.role === 'produtor'
                ? 'Produtor'
                : user.role === 'coletor'
                ? 'Coletor'
                : user.role === 'receptor'
                ? 'Receptor'
                : 'Usuário'
            }
            slotProps={{ input: { readOnly: true } }}
            fullWidth
          />
        </Box>

        <Divider sx={{ mb: '1.5rem' }} />

        {/* Modo Visualização */}
        {!isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField
              label="Telefone"
              value={user.telefone}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
            <TextField
              label="Estado"
              value={user.estado}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
            <TextField
              label="Cidade"
              value={user.cidade}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="large"
              onClick={handleStartEdit}
              sx={{ mt: '1rem' }}
            >
              Editar Informações
            </Button>
          </Box>
        ) : (
          /* Modo Edição */
          <Box
            component="form"
            onSubmit={handleSaveEdit}
            sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <TextField
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(86) 99999-9999"
              required
              fullWidth
            />

            <TextField
              select
              label="Estado"
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              required
              fullWidth
              disabled={isLoadingEstados}
              helperText={isLoadingEstados ? 'Carregando estados...' : ''}
            >
              {estados.map((uf) => (
                <MenuItem key={uf.sigla} value={uf.sigla}>
                  {uf.nome} ({uf.sigla})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Cidade"
              value={formData.cidade}
              onChange={(e) => handleInputChange('cidade', e.target.value)}
              required
              fullWidth
              disabled={!formData.estado || isLoadingCidades}
              helperText={
                isLoadingCidades
                  ? 'Carregando cidades...'
                  : !formData.estado
                  ? 'Selecione um estado primeiro'
                  : ''
              }
            >
              {cidades.map((cidade) => (
                <MenuItem key={cidade} value={cidade}>
                  {cidade}
                </MenuItem>
              ))}
            </TextField>

            {/* Botões de Ação */}
            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                mt: '1rem',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                size="large"
                fullWidth
              >
                Salvar Alterações
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CloseIcon />}
                onClick={handleCancelEdit}
                size="large"
                fullWidth
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </MainLayout>
  );
}