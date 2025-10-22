import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import type { Agendamento } from '../hooks/useAgendamentos';
import { useCategorias } from '../hooks/useCategorias';

interface ResiduosSelectionModalProps {
  open: boolean;
  onClose: () => void;
  agendamento: Agendamento;
}

export function ResiduosSelectionModal({
  open,
  onClose,
  agendamento,
}: ResiduosSelectionModalProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { getCategoriaById } = useCategorias();
  
  const [selectedResiduos, setSelectedResiduos] = useState<Set<string>>(new Set());

  const handleToggleResiduo = (residuoId: string) => {
    setSelectedResiduos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(residuoId)) {
        newSet.delete(residuoId);
      } else {
        newSet.add(residuoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedResiduos.size === agendamento.residuos.length) {
      setSelectedResiduos(new Set());
    } else {
      setSelectedResiduos(new Set(agendamento.residuos.map((r) => r.id)));
    }
  };

  const handleReservar = () => {
    // TODO: Implementar lógica real de reserva
    // Por enquanto, redireciona para /coletas
    navigate('/coletas');
  };

  const handleClose = () => {
    setSelectedResiduos(new Set());
    onClose();
  };

  const calcularValorTotal = () => {
    return agendamento.residuos
      .filter((residuo) => selectedResiduos.has(residuo.id))
      .reduce((total, residuo) => {
        const categoria = getCategoriaById(residuo.categoriaId);
        if (categoria) {
          return total + residuo.quantidade * categoria.preco_por_kg;
        }
        return total;
      }, 0);
  };

  const allSelected = selectedResiduos.size === agendamento.residuos.length;
  const someSelected = selectedResiduos.size > 0;
  const valorTotal = calcularValorTotal();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RecyclingIcon />
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700}>
            Selecionar Resíduos
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: 'white' }}
          aria-label="fechar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* Info do Local */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            📍 {agendamento.local.apelido || 'Ponto de Coleta'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {agendamento.local.logradouro}, {agendamento.local.numero}
          </Typography>
          <Typography variant="caption" color="primary" fontWeight={600}>
            📏 {agendamento.distancia_km.toFixed(2)} km de distância
          </Typography>
        </Box>

        {/* Botão Selecionar Todos */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {agendamento.residuos.length} resíduo(s) disponível(is)
          </Typography>
          <Button
            size="small"
            variant={allSelected ? 'outlined' : 'contained'}
            onClick={handleSelectAll}
            startIcon={allSelected ? <RadioButtonUncheckedIcon /> : <CheckCircleIcon />}
          >
            {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de Resíduos */}
        <FormGroup>
          {agendamento.residuos.map((residuo) => {
            const categoria = getCategoriaById(residuo.categoriaId);
            const isSelected = selectedResiduos.has(residuo.id);
            const valorEstimado = categoria
              ? (residuo.quantidade * categoria.preco_por_kg).toFixed(2)
              : null;

            return (
              <Box
                key={residuo.id}
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  border: 2,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.100' : 'action.hover',
                    transform: 'translateX(4px)',
                  },
                }}
                onClick={() => handleToggleResiduo(residuo.id)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleResiduo(residuo.id)}
                      color="primary"
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <RecyclingIcon fontSize="small" color="success" />
                        <Typography variant="body1" fontWeight={600}>
                          {categoria?.tipo || 'Categoria desconhecida'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                        <Chip
                          label={`${residuo.quantidade} ${residuo.tipo_medida}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {valorEstimado && (
                          <Chip
                            label={`R$ ${valorEstimado}`}
                            size="small"
                            color="success"
                            variant="filled"
                          />
                        )}
                      </Box>

                      {categoria?.descricao && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {categoria.descricao}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                />
              </Box>
            );
          })}
        </FormGroup>

        {/* Alert de informação */}
        {someSelected && (
          <Alert severity="info" sx={{ mt: 2 }} icon={<LocalShippingIcon />}>
            {selectedResiduos.size} resíduo(s) selecionado(s) • Valor total estimado: R$ {valorTotal.toFixed(2)}
          </Alert>
        )}

        {!someSelected && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Selecione pelo menos um resíduo para continuar
          </Alert>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: isMobile ? 2 : 3,
          py: 2,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          flexDirection: isTablet ? 'column' : 'row',
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          fullWidth={isTablet}
          sx={{ order: isTablet ? 2 : 1 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleReservar}
          variant="contained"
          disabled={!someSelected}
          fullWidth={isTablet}
          startIcon={<LocalShippingIcon />}
          sx={{
            order: isTablet ? 1 : 2,
            py: 1.5,
            fontWeight: 600,
          }}
        >
          {isMobile ? 'Reservar' : 'Reservar Resíduos para Coletar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
