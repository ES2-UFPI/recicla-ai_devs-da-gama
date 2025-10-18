import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Chip,
  Stack,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';
import { residueService } from '../services/residue.service';
import { categoriaService } from '../services/categoria.service';
import type { Residue } from '../types/residue';
import type { Categoria } from '../types/categoria';

export interface ResiduoParaAgendamento {
  id: string;
  quantidade: number;
  unidade: string;
  categoria: string;
}

interface ResiduoSelectorProps {
  onResiduosSelect: (residuosIds: string[]) => void;
  residuosSelecionados?: string[];
}

export function ResiduoSelector({
  onResiduosSelect,
  residuosSelecionados = [],
}: ResiduoSelectorProps) {
  const navigate = useNavigate();
  const [selecionados, setSelecionados] = useState<string[]>(residuosSelecionados);
  const [residuosDisponiveis, setResiduosDisponiveis] = useState<Residue[]>([]);
  const [categoriasMap, setCategoriasMap] = useState<Map<string, Categoria>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar resíduos disponíveis e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar resíduos e categorias em paralelo
        const [residues, categorias] = await Promise.all([
          residueService.listPendingResidues(),
          categoriaService.listActive(),
        ]);
        
        setResiduosDisponiveis(residues);
        
        // Criar mapa de categorias para lookup rápido
        const map = new Map<string, Categoria>();
        categorias.forEach((cat) => map.set(cat.id, cat));
        setCategoriasMap(map);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Erro ao carregar resíduos disponíveis');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = (residuoId: string) => {
    const currentIndex = selecionados.indexOf(residuoId);
    const newSelecionados = [...selecionados];

    if (currentIndex === -1) {
      newSelecionados.push(residuoId);
    } else {
      newSelecionados.splice(currentIndex, 1);
    }

    setSelecionados(newSelecionados);
    onResiduosSelect(newSelecionados);
  };

  const handleSelectAll = () => {
    if (selecionados.length === residuosDisponiveis.length) {
      setSelecionados([]);
      onResiduosSelect([]);
    } else {
      const allIds = residuosDisponiveis.map((r) => r.id);
      setSelecionados(allIds);
      onResiduosSelect(allIds);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <RecyclingIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          Resíduos para Coleta
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecione os resíduos que você deseja agendar para coleta. Apenas resíduos com status "Disponível" podem ser agendados.
      </Typography>

      {/* Botão para adicionar novo resíduo */}
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => navigate('/residuos')}
        fullWidth
        sx={{ mb: 2 }}
      >
        Adicionar novo resíduo
      </Button>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && residuosDisponiveis.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: 'action.hover',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <RecyclingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhum resíduo disponível para agendar coleta.
            <br />
            Cadastre seus resíduos primeiro na página de Resíduos.
          </Typography>
        </Paper>
      ) : !loading && !error ? (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  selecionados.length === residuosDisponiveis.length &&
                  residuosDisponiveis.length > 0
                }
                indeterminate={
                  selecionados.length > 0 &&
                  selecionados.length < residuosDisponiveis.length
                }
                onChange={handleSelectAll}
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Selecionar todos ({residuosDisponiveis.length})
              </Typography>
            }
            sx={{ mb: 1 }}
          />

          <Divider sx={{ my: 1 }} />

          <FormGroup>
            <Stack spacing={1}>
              {residuosDisponiveis.map((residuo) => (
                <Paper
                  key={residuo.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: selecionados.includes(residuo.id)
                      ? 'primary.main'
                      : 'divider',
                    bgcolor: selecionados.includes(residuo.id)
                      ? 'primary.light'
                      : 'background.paper',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleToggle(residuo.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={selecionados.includes(residuo.id)}
                      onChange={() => handleToggle(residuo.id)}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {categoriasMap.get(residuo.categoriaId)?.tipo || 'Categoria Desconhecida'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {residuo.quantidade} {residuo.tipo_medida}
                      </Typography>
                    </Box>
                    <Chip
                      label="Disponível"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Paper>
              ))}
            </Stack>
          </FormGroup>

          {selecionados.length > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'success.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.main',
              }}
            >
              <Typography variant="body2" fontWeight={600} color="success.dark">
                ✓ {selecionados.length} resíduo(s) selecionado(s)
              </Typography>
            </Box>
          )}
        </>
      ) : null}
    </Box>
  );
}
