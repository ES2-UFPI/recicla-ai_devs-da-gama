import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Checkbox,
  FormControlLabel,
  TextField,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import { Navbar } from '../../components/Navbar';
import { GlobalStyles } from '../../styles/GlobalStyles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useCategorias } from '../LocalizarColeta/hooks/useCategorias';
import api from '../../services/api';

interface ResiduoInventario {
  id: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: 'kg' | 'unidade';
  valorEstimado?: number;
  status: string;
}

interface Receptora {
  id: string;
  nome: string;
  descricao?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro?: string;
    cep: string;
  };
  telefone?: string;
  materiais_aceitos: string[];
  horario_funcionamento: Array<{
    dia_semana: string;
    hora_inicio: string;
    hora_fim: string;
    aberto: boolean;
  }>;
}

export default function RealizarEntrega() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { id: receptoraId } = useParams<{ id: string }>();
  const { getCategoriaById } = useCategorias();

  const [receptora, setReceptora] = useState<Receptora | null>(null);
  const [inventory, setInventory] = useState<ResiduoInventario[]>([]);
  const [residuosSelecionados, setResiduosSelecionados] = useState<Set<string>>(new Set());
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const buscarDados = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar receptora
        const responseReceptora = await api.get<Receptora>(`/receptoras/${receptoraId}`);
        setReceptora(responseReceptora.data);

        // Buscar inventory do coletor
        const responseInventory = await api.get<ResiduoInventario[]>('/coletas/inventory/me');
        
        // Filtrar apenas resíduos que a receptora aceita
        const residuosFiltrados = responseInventory.data.filter((residuo) =>
          responseReceptora.data.materiais_aceitos.includes(residuo.categoriaId)
        );
        
        setInventory(residuosFiltrados);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar informações. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [receptoraId]);

  const toggleResiduoSelecionado = (id: string) => {
    setResiduosSelecionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleRealizarEntrega = async () => {
    if (residuosSelecionados.size === 0) {
      setError('Selecione pelo menos um resíduo para entregar.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/entregas/realizar', {
        receptora_id: receptoraId,
        residuos_ids: Array.from(residuosSelecionados),
        observacoes: observacoes.trim() || undefined,
      });

      setSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/entregas');
      }, 2000);
    } catch (err) {
      console.error('Erro ao realizar entrega:', err);
      setError('Erro ao realizar entrega. Verifique os dados e tente novamente.');
      setSubmitting(false);
    }
  };

  const getHorarioHoje = (): { texto: string; aberto: boolean } => {
    if (!receptora) return { texto: 'Indisponível', aberto: false };
    
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const hoje = new Date().getDay();
    const diaHoje = diasSemana[hoje];
    
    const horario = receptora.horario_funcionamento.find((h) => h.dia_semana === diaHoje);
    
    if (!horario || !horario.aberto) {
      return { texto: 'Fechado hoje', aberto: false };
    }
    
    return { texto: `${horario.hora_inicio} - ${horario.hora_fim}`, aberto: true };
  };

  const calcularTotalSelecionado = () => {
    const residuos = inventory.filter((r) => residuosSelecionados.has(r.id));
    const kg = residuos.filter((r) => r.tipo_medida === 'kg').reduce((acc, r) => acc + r.quantidade, 0);
    const unidades = residuos.filter((r) => r.tipo_medida === 'unidade').reduce((acc, r) => acc + r.quantidade, 0);
    return { kg, unidades };
  };

  if (success) {
    return (
      <>
        <GlobalStyles />
        <Navbar />
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 100, color: 'success.main' }} />
            <Typography variant="h4" color="success.main" fontWeight={700}>
              Entrega Realizada com Sucesso!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sua entrega foi registrada e os resíduos foram removidos do seu inventário.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate('/entregas')}
              size="large"
            >
              Ver Minhas Entregas
            </Button>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/localizar-receptora')}
            sx={{ mb: 2 }}
          >
            Voltar
          </Button>
          <Typography variant={isMobile ? 'h5' : 'h4'} color="primary" fontWeight={700} gutterBottom>
            Realizar Entrega
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Selecione os resíduos do seu inventário para entregar nesta receptora.
          </Typography>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Carregando informações...
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Conteúdo */}
        {!loading && receptora && (
          <>
            {/* Informações da Receptora */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="success.main" gutterBottom>
                  {receptora.nome}
                </Typography>
                {receptora.descricao && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {receptora.descricao}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">
                      {receptora.endereco.logradouro}, {receptora.endereco.numero}
                    </Typography>
                    {receptora.endereco.complemento && (
                      <Typography variant="body2" color="text.secondary">
                        {receptora.endereco.complemento}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      CEP: {receptora.endereco.cep}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Hoje:</strong> {getHorarioHoje().texto}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Materiais aceitos:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {receptora.materiais_aceitos
                    .map((categoriaId) => getCategoriaById(categoriaId))
                    .filter((categoria) => categoria !== undefined)
                    .map((categoria) => (
                      <Chip
                        key={categoria!.id}
                        label={categoria!.tipo}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ))}
                </Box>
              </CardContent>
            </Card>

            {/* Seleção de Resíduos */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Selecione os Resíduos para Entrega
                  </Typography>
                </Box>

                {inventory.length === 0 ? (
                  <Alert severity="info">
                    Você não possui resíduos compatíveis no inventário para entregar nesta receptora.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {inventory.map((residuo) => {
                      const categoria = getCategoriaById(residuo.categoriaId);
                      const isSelecionado = residuosSelecionados.has(residuo.id);

                      return (
                        <Card
                          key={residuo.id}
                          variant="outlined"
                          sx={{
                            border: 2,
                            borderColor: isSelecionado ? 'success.main' : 'divider',
                            bgcolor: isSelecionado ? 'success.50' : 'background.paper',
                            transition: 'all 0.2s',
                          }}
                        >
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelecionado}
                                  onChange={() => toggleResiduoSelecionado(residuo.id)}
                                  color="success"
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Typography variant="body1" fontWeight={isSelecionado ? 600 : 400}>
                                    {categoria?.tipo || 'Categoria'}
                                  </Typography>
                                  <Chip
                                    label={`${residuo.quantidade} ${residuo.tipo_medida === 'kg' ? 'kg' : 'unidade(s)'}`}
                                    color={isSelecionado ? 'success' : 'default'}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </Box>
                              }
                              sx={{ width: '100%', m: 0 }}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}

                {residuosSelecionados.size > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Total selecionado: {residuosSelecionados.size} item(ns)
                    </Typography>
                    <Typography variant="body2">
                      {calcularTotalSelecionado().kg > 0 && `${calcularTotalSelecionado().kg} kg`}
                      {calcularTotalSelecionado().kg > 0 && calcularTotalSelecionado().unidades > 0 && ' + '}
                      {calcularTotalSelecionado().unidades > 0 && `${calcularTotalSelecionado().unidades} unidade(s)`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Observações (opcional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Adicione observações sobre a entrega..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  variant="outlined"
                />
              </CardContent>
            </Card>

            {/* Botão de Ação */}
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              startIcon={<LocalShippingIcon />}
              onClick={handleRealizarEntrega}
              disabled={submitting || residuosSelecionados.size === 0}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Confirmar Entrega'}
            </Button>
          </>
        )}
      </Container>
    </>
  );
}
