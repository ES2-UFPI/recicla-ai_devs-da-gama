import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Link as MuiLink,
  Stack,
  Collapse,
  IconButton,
  Button,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RecyclingIcon from '@mui/icons-material/Recycling';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { Agendamento } from '../hooks/useAgendamentos';
import { useCategorias } from '../hooks/useCategorias';
import { ResiduosSelectionModal } from './ResiduosSelectionModal';
import { useState } from 'react';

interface AgendamentosListProps {
  agendamentos: Agendamento[];
  highlightedId: string | null;
  onItemClick: (id: string) => void;
}

export function AgendamentosList({
  agendamentos,
  highlightedId,
  onItemClick,
}: AgendamentosListProps) {
  const { getCategoriaById } = useCategorias();
  const [expandedResiduos, setExpandedResiduos] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  const toggleResiduoExpand = (residuoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedResiduos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(residuoId)) {
        newSet.delete(residuoId);
      } else {
        newSet.add(residuoId);
      }
      return newSet;
    });
  };

  const handleOpenModal = (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAgendamento(agendamento);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAgendamento(null);
  };

  const getGoogleMapsLink = (lat: string, lng: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  if (agendamentos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <RecyclingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Nenhum agendamento encontrado
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Tente aumentar o raio de busca ou alterar os filtros
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {agendamentos.map((agendamento) => {
        const isHighlighted = agendamento.id === highlightedId;
        
        return (
          <Card
            key={agendamento.id}
            id={`agendamento-${agendamento.id}`}
            onClick={() => agendamento.id && onItemClick(agendamento.id)}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: isHighlighted ? 2 : 1,
              borderColor: isHighlighted ? 'primary.main' : 'divider',
              boxShadow: isHighlighted ? 4 : 1,
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              {/* Cabeçalho com distância */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" color="primary" fontWeight={700}>
                  {agendamento.local.apelido || 'Ponto de Coleta'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={agendamento.coleta_integral ? 'Coleta Integral' : 'Coleta Parcial'}
                    color={agendamento.coleta_integral ? 'warning' : 'success'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<MyLocationIcon />}
                    label={`${agendamento.distancia_km.toFixed(2)} km`}
                    color="primary"
                    size="small"
                  />
                </Stack>
              </Box>

              {/* Endereço */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2">
                    {agendamento.local.logradouro}, {agendamento.local.numero}
                  </Typography>
                  {agendamento.local.complemento && (
                    <Typography variant="body2" color="text.secondary">
                      {agendamento.local.complemento}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    CEP: {agendamento.local.cep}
                  </Typography>
                </Box>
              </Box>

              {/* Disponibilidade */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {agendamento.disponibilidade.slice(0, 2).map((slot, idx) => {
                    // Exibir diretamente como horário local (sem conversão de UTC)
                    return (
                      <Chip
                        key={idx}
                        label={`${slot.data} ${slot.hora_inicio}-${slot.hora_fim}`}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                  {agendamento.disponibilidade.length > 2 && (
                    <Chip
                      label={`+${agendamento.disponibilidade.length - 2}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              {/* Resíduos */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Resíduos disponíveis ({agendamento.residuos.length}):
                </Typography>
                <Stack spacing={1}>
                  {agendamento.residuos.map((residuo) => {
                    const categoria = getCategoriaById(residuo.categoriaId);
                    const isExpanded = expandedResiduos.has(residuo.id);
                    const valorEstimado = categoria 
                      ? (residuo.quantidade * categoria.preco_por_kg).toFixed(2)
                      : null;
                    const temDescricao = categoria?.descricao && categoria.descricao.trim().length > 0;

                    return (
                      <Box key={residuo.id}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <RecyclingIcon fontSize="small" color="success" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {categoria?.tipo || 'Categoria desconhecida'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {residuo.quantidade} {residuo.tipo_medida}
                            </Typography>
                            {valorEstimado && (
                              <Typography 
                                variant="caption" 
                                color="success.main" 
                                fontWeight={600}
                                sx={{ mt: 0.5, display: 'block' }}
                              >
                                💰 Valor estimado: R$ {valorEstimado}
                              </Typography>
                            )}
                          </Box>
                          {temDescricao && (
                            <IconButton
                              size="small"
                              onClick={(e) => toggleResiduoExpand(residuo.id, e)}
                              sx={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                              }}
                            >
                              <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        {temDescricao && (
                          <Collapse in={isExpanded}>
                            <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                Descrição:
                              </Typography>
                              <Typography variant="body2">
                                {categoria.descricao}
                              </Typography>
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Observações */}
              {agendamento.observacoes && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                  💡 {agendamento.observacoes}
                </Typography>
              )}

              {/* Botão de Seleção de Resíduos */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={(e) => handleOpenModal(agendamento, e)}
                startIcon={<LocalShippingIcon />}
                sx={{
                  mb: 1.5,
                  py: 1.2,
                  fontWeight: 600,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                {agendamento.coleta_integral ? 'Coleta Integral: Coletar Todos' : 'Selecionar Resíduos para Coletar'}
              </Button>

              {/* Link Google Maps */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <MuiLink
                  href={getGoogleMapsLink(agendamento.local.latitude!, agendamento.local.longitude!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
                >
                  <LocationOnIcon fontSize="small" />
                  Abrir no Google Maps
                </MuiLink>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      {/* Modal de Seleção de Resíduos */}
      {selectedAgendamento && (
        <ResiduosSelectionModal
          open={modalOpen}
          onClose={handleCloseModal}
          agendamento={selectedAgendamento}
        />
      )}
    </Stack>
  );
}
