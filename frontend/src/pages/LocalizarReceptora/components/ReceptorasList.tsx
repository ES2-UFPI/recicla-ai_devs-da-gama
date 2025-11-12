import { Box, Card, CardContent, Typography, Chip, Divider, IconButton, Tooltip, Badge } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsIcon from '@mui/icons-material/Directions';
import RecyclingIcon from '@mui/icons-material/Recycling';
import type { Receptora } from '../hooks/useReceptoras';
import { useCategorias } from '../../LocalizarColeta/hooks/useCategorias';

interface ReceptorasListProps {
  receptoras: Receptora[];
  highlightedId: string | null;
  onItemClick: (id: string) => void;
}

export function ReceptorasList({ receptoras, highlightedId, onItemClick }: ReceptorasListProps) {
  const { getCategoriaById } = useCategorias();

  if (receptoras.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <RecyclingIcon sx={{ fontSize: 80, color: 'action.disabled', opacity: 0.3 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          Nenhuma receptora encontrada
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
          Tente aumentar o raio de busca ou ajustar os filtros para encontrar pontos de coleta próximos.
        </Typography>
      </Box>
    );
  }

  const getHorarioHoje = (receptora: Receptora): { texto: string; aberto: boolean } => {
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const hoje = new Date().getDay();
    const diaHoje = diasSemana[hoje];
    
    const horario = receptora.horario_funcionamento.find((h: { dia_semana: string; aberto: boolean }) => h.dia_semana === diaHoje);
    
    if (!horario || !horario.aberto) {
      return { texto: 'Fechado hoje', aberto: false };
    }
    
    return { texto: `${horario.hora_inicio} - ${horario.hora_fim}`, aberto: true };
  };

  const isReceptoraAberta = (horario: { texto: string; aberto: boolean }): boolean => {
    if (!horario.aberto) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [inicio, fim] = horario.texto.split(' - ');
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFim, minFim] = fim.split(':').map(Number);
    
    const inicioMin = horaInicio * 60 + minInicio;
    const fimMin = horaFim * 60 + minFim;
    
    return currentTime >= inicioMin && currentTime <= fimMin;
  };

  return (
    <Box>
      {receptoras.map((receptora) => {
        const isHighlighted = receptora.id === highlightedId;
        const horarioHoje = getHorarioHoje(receptora);
        const aberta = isReceptoraAberta(horarioHoje);

        return (
          <Card
            key={receptora.id}
            id={`receptora-${receptora.id}`}
            onClick={() => onItemClick(receptora.id)}
            sx={{
              mb: 2,
              cursor: 'pointer',
              border: 2,
              borderColor: isHighlighted ? 'success.main' : 'transparent',
              boxShadow: isHighlighted ? 4 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
              '&:hover': {
                boxShadow: 3,
                borderColor: 'success.light',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent>
              {/* Cabeçalho com Badge de Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {receptora.nome}
                    </Typography>
                    {horarioHoje.aberto && (
                      <Badge
                        badgeContent={aberta ? 'Aberto' : 'Fechado'}
                        color={aberta ? 'success' : 'error'}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            height: 18,
                            minWidth: 18,
                            padding: '0 6px',
                          },
                        }}
                      />
                    )}
                  </Box>
                  {receptora.descricao && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {receptora.descricao}
                    </Typography>
                  )}
                </Box>
                {receptora.distancia_km !== undefined && (
                  <Chip
                    label={`${receptora.distancia_km.toFixed(1)} km`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Endereço */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2">
                    {receptora.endereco.logradouro}, {receptora.endereco.numero}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {receptora.endereco.bairro} - CEP: {receptora.endereco.cep}
                  </Typography>
                </Box>
              </Box>

              {/* Horário hoje */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography 
                  variant="body2" 
                  color={!horarioHoje.aberto ? 'error' : aberta ? 'success.main' : 'text.secondary'}
                  fontWeight={aberta ? 600 : 400}
                >
                  <strong>Hoje:</strong> {horarioHoje.texto}
                  {aberta && ' 🟢'}
                </Typography>
              </Box>

              {/* Telefone e Ações Rápidas */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                {receptora.telefone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {receptora.telefone}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {receptora.telefone && (
                    <Tooltip title="Ligar">
                      <IconButton
                        size="small"
                        color="success"
                        href={`tel:${receptora.telefone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Ver rotas no Google Maps">
                    <IconButton
                      size="small"
                      color="primary"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${receptora.latitude},${receptora.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DirectionsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Materiais aceitos */}
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Materiais aceitos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {receptora.materiais_aceitos.map((categoriaId: string) => {
                  const categoria = getCategoriaById(categoriaId);
                  return (
                    <Chip
                      key={categoriaId}
                      label={categoria?.tipo || 'Desconhecido'}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  );
                })}
              </Box>

              {/* Observações */}
              {receptora.observacoes && (
                <Box sx={{ mt: 1.5, p: 1, bgcolor: 'info.50', borderRadius: 1, borderLeft: 3, borderColor: 'info.main' }}>
                  <Typography variant="caption" color="text.secondary">
                    ℹ️ {receptora.observacoes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
