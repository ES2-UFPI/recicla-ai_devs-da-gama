import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export interface FaixaDisponibilidade {
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
}

interface DisponibilidadeSelectorProps {
  onDisponibilidadeChange: (disponibilidade: string[]) => void;
  disponibilidadeInicial?: FaixaDisponibilidade[];
}

export function DisponibilidadeSelector({
  onDisponibilidadeChange,
  disponibilidadeInicial = [],
}: DisponibilidadeSelectorProps) {
  const [faixas, setFaixas] = useState<FaixaDisponibilidade[]>(
    disponibilidadeInicial.length > 0
      ? disponibilidadeInicial
      : [{ data: '', horarioInicio: '', horarioFim: '' }]
  );

  const handleAddFaixa = () => {
    setFaixas([...faixas, { data: '', horarioInicio: '', horarioFim: '' }]);
  };

  const handleRemoveFaixa = (index: number) => {
    if (faixas.length === 1) {
      return; // Manter pelo menos uma faixa
    }
    const updated = faixas.filter((_, i) => i !== index);
    setFaixas(updated);
    atualizarDisponibilidade(updated);
  };

  const handleFaixaChange = (
    index: number,
    field: keyof FaixaDisponibilidade,
    value: string
  ) => {
    const updated = faixas.map((faixa, i) =>
      i === index ? { ...faixa, [field]: value } : faixa
    );
    setFaixas(updated);
    atualizarDisponibilidade(updated);
  };

  const atualizarDisponibilidade = (faixasAtualizadas: FaixaDisponibilidade[]) => {
    // Converter para o formato do backend: [horarioInicio1, horarioFim1, horarioInicio2, horarioFim2, ...]
    const disponibilidadeArray: string[] = [];
    faixasAtualizadas.forEach((faixa) => {
      if (faixa.data && faixa.horarioInicio && faixa.horarioFim) {
        // Formato ISO: YYYY-MM-DDTHH:mm
        disponibilidadeArray.push(`${faixa.data}T${faixa.horarioInicio}`);
        disponibilidadeArray.push(`${faixa.data}T${faixa.horarioFim}`);
      }
    });
    onDisponibilidadeChange(disponibilidadeArray);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AccessTimeIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          Horários de Disponibilidade para Coleta
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Informe os dias e horários em que você estará disponível para a coleta dos resíduos.
      </Typography>

      <Stack spacing={2}>
        {faixas.map((faixa, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Horário {index + 1}
              </Typography>
              {faixas.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveFaixa(index)}
                  aria-label="remover horário"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Data"
                type="date"
                value={faixa.data}
                onChange={(e) => handleFaixaChange(index, 'data', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0], // Data mínima = hoje
                }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Horário Início"
                  type="time"
                  value={faixa.horarioInicio}
                  onChange={(e) =>
                    handleFaixaChange(index, 'horarioInicio', e.target.value)
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Horário Fim"
                  type="time"
                  value={faixa.horarioFim}
                  onChange={(e) =>
                    handleFaixaChange(index, 'horarioFim', e.target.value)
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddFaixa}
        fullWidth
        size="small"
      >
        Adicionar Outro Horário
      </Button>
    </Box>
  );
}
