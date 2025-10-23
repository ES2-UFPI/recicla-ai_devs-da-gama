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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { DisponibilidadeSlot } from '../types/scheduling';
import { dateTimeToUTC, getTodayInBrazil } from '../utils/timezone';

export interface FaixaDisponibilidade {
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
}

interface DisponibilidadeSelectorProps {
  onDisponibilidadeChange: (disponibilidade: DisponibilidadeSlot[]) => void;
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

  const handleDateChange = (index: number, date: Date | null) => {
    if (date) {
      // Converter Date local para formato YYYY-MM-DD (mantém horário local)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      handleFaixaChange(index, 'data', dateString);
    } else {
      handleFaixaChange(index, 'data', '');
    }
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    // Criar Date em horário local (não UTC) para evitar problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Meio-dia para evitar problemas de DST
  };

  const atualizarDisponibilidade = (faixasAtualizadas: FaixaDisponibilidade[]) => {
    // Converter para o formato do backend: lista de DisponibilidadeSlot
    const disponibilidadeArray: DisponibilidadeSlot[] = [];
    faixasAtualizadas.forEach((faixa) => {
      if (faixa.data && faixa.horarioInicio && faixa.horarioFim) {
        // Converter horário local (Brasília) para UTC antes de enviar
        const dataHoraInicioUTC = dateTimeToUTC(faixa.data, faixa.horarioInicio);
        const dataHoraFimUTC = dateTimeToUTC(faixa.data, faixa.horarioFim);
        
        // Extrair data e hora do resultado UTC
        const inicioDate = new Date(dataHoraInicioUTC);
        const fimDate = new Date(dataHoraFimUTC);
        
        // Formatar para o backend (ainda em UTC, mas no formato esperado)
        const diaUTC = String(inicioDate.getUTCDate()).padStart(2, '0');
        const mesUTC = String(inicioDate.getUTCMonth() + 1).padStart(2, '0');
        const anoUTC = inicioDate.getUTCFullYear();
        const dataFormatadaUTC = `${diaUTC}/${mesUTC}/${anoUTC}`;
        
        const horaInicioUTC = `${String(inicioDate.getUTCHours()).padStart(2, '0')}:${String(inicioDate.getUTCMinutes()).padStart(2, '0')}`;
        const horaFimUTC = `${String(fimDate.getUTCHours()).padStart(2, '0')}:${String(fimDate.getUTCMinutes()).padStart(2, '0')}`;
        
        disponibilidadeArray.push({
          data: dataFormatadaUTC,
          hora_inicio: horaInicioUTC,
          hora_fim: horaFimUTC,
        });
      }
    });
    onDisponibilidadeChange(disponibilidadeArray);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
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
                <DatePicker
                  label="Data"
                  value={parseDate(faixa.data)}
                  onChange={(date) => handleDateChange(index, date)}
                  minDate={getTodayInBrazil()}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
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
    </LocalizationProvider>
  );
}