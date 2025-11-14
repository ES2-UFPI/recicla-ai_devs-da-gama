import { Box, Card, CardContent, Typography, Chip, Divider, IconButton, Tooltip, Button } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import RecyclingIcon from '@mui/icons-material/Recycling';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import type { Receptora } from '../../../types/entrega';
import { useCategorias } from '../../LocalizarColeta/hooks/useCategorias';

interface ReceptorasListProps {
  receptoras: Receptora[];
  highlightedId: string | null;
  onItemClick: (id: string) => void;
}

export function ReceptorasList({ receptoras, highlightedId, onItemClick }: ReceptorasListProps) {
  const { getCategoriaById, categorias } = useCategorias();
  const navigate = useNavigate();

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

  return (
    <Box>
      {receptoras.map((receptora) => {
        const isHighlighted = receptora.id === highlightedId;
        const enderecoPrincipal = receptora.addresses && receptora.addresses.length > 0 
          ? receptora.addresses[0] 
          : null;

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
              {/* Cabeçalho com Badge de Distância */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {receptora.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {receptora.email}
                  </Typography>
                </Box>
                <Chip
                  label={`${receptora.distancia_km.toFixed(1)} km`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Endereço */}
              {enderecoPrincipal && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">
                      {enderecoPrincipal.logradouro}, {enderecoPrincipal.numero}
                    </Typography>
                    {enderecoPrincipal.complemento && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {enderecoPrincipal.complemento}
                      </Typography>
                    )}
                    {enderecoPrincipal.bairro && enderecoPrincipal.cep && (
                      <Typography variant="caption" color="text.secondary">
                        {enderecoPrincipal.bairro} - CEP: {enderecoPrincipal.cep}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Ações Rápidas */}
              {enderecoPrincipal?.latitude && enderecoPrincipal?.longitude && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 1.5 }}>
                  <Tooltip title="Ver rotas no Google Maps">
                    <IconButton
                      size="small"
                      color="primary"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${enderecoPrincipal.latitude},${enderecoPrincipal.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DirectionsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {/* Botão Realizar Entrega */}
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<LocalShippingIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/entrega/realizar/${receptora.id}`);
                }}
                sx={{ mb: 2, py: 1.2, fontWeight: 600 }}
              >
                Realizar Entrega
              </Button>

              {/* Materiais aceitos */}
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Materiais aceitos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 32 }}>
                {categorias.size === 0 ? (
                  <Chip
                    label="Carregando..."
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                ) : receptora.accepted_material.length === 0 ? (
                  <Chip
                    label="Nenhum material especificado"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                ) : (
                  receptora.accepted_material
                    .filter((categoriaId: string) => getCategoriaById(categoriaId) !== undefined)
                    .map((categoriaId: string) => {
                      const categoria = getCategoriaById(categoriaId);
                      return (
                        <Chip
                          key={categoriaId}
                          label={categoria!.tipo}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      );
                    })
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
