import { useState } from 'react';
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
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';

export interface ResiduoParaAgendamento {
  id: string;
  quantidade: number;
  unidade: string;
  categoria: string;
}

interface ResiduoSelectorProps {
  residuosDisponiveis: ResiduoParaAgendamento[];
  onResiduosSelect: (residuosIds: string[]) => void;
  residuosSelecionados?: string[];
}

export function ResiduoSelector({
  residuosDisponiveis,
  onResiduosSelect,
  residuosSelecionados = [],
}: ResiduoSelectorProps) {
  const navigate = useNavigate();
  const [selecionados, setSelecionados] = useState<string[]>(residuosSelecionados);

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
        Selecione os resíduos que você deseja agendar para coleta.
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

      {residuosDisponiveis.length === 0 ? (
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
      ) : (
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
                        {residuo.categoria}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {residuo.quantidade} {residuo.unidade}
                      </Typography>
                    </Box>
                    <Chip
                      label={residuo.categoria}
                      size="small"
                      color="primary"
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
      )}
    </Box>
  );
}
