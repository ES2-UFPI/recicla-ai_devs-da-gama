import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Link as MuiLink, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import type { Receptora } from '../hooks/useReceptoras';
import { useCategorias } from '../../LocalizarColeta/hooks/useCategorias';
import { mapAdapter } from '../adapters/map.adapter';

interface MapViewProps {
  center: LatLngExpression;
  zoom: number;
}

function MapView({ center, zoom }: MapViewProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

interface InteractiveMapProps {
  receptoras: Receptora[];
  userLocation: [number, number] | null;
  highlightedId: string | null;
  onMarkerClick: (id: string) => void;
}

export function InteractiveMap({
  receptoras,
  userLocation,
  highlightedId,
  onMarkerClick,
}: InteractiveMapProps) {
  const { getCategoriaById } = useCategorias();
  
  // Usa adapter para configurações do mapa
  const center: LatLngExpression = userLocation 
    ? mapAdapter.arrayToLibraryPosition(userLocation)
    : mapAdapter.toLibraryPosition(mapAdapter.getDefaultPosition());
  
  const zoom = userLocation ? mapAdapter.getDefaultZoom() : mapAdapter.getFallbackZoom();

  const getHorarioHoje = (receptora: Receptora): string => {
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const hoje = new Date().getDay();
    const diaHoje = diasSemana[hoje];
    
    const horario = receptora.horario_funcionamento.find((h: { dia_semana: string; aberto: boolean }) => h.dia_semana === diaHoje);
    
    if (!horario || !horario.aberto) {
      return 'Fechado hoje';
    }
    
    return `${horario.hora_inicio} - ${horario.hora_fim}`;
  };

  return (
    <Box sx={{ height: { xs: '400px', md: '500px', lg: '600px' }, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapView center={center} zoom={zoom} />
        <TileLayer
          attribution={mapAdapter.getAttribution()}
          url={mapAdapter.getTileLayerUrl()}
        />

        {/* Marcador da localização do usuário */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={mapAdapter.createUserLocationIcon()}
          >
            <Popup>
              <Typography variant="body2" fontWeight={600}>
                Sua localização
              </Typography>
            </Popup>
          </Marker>
        )}

        {/* Marcadores das receptoras */}
        {receptoras.map((receptora) => {
          const lat = parseFloat(receptora.endereco.latitude || '0');
          const lng = parseFloat(receptora.endereco.longitude || '0');
          
          if (lat === 0 || lng === 0) return null;

          const isHighlighted = receptora.id === highlightedId;
          const horarioHoje = getHorarioHoje(receptora);

          return (
            <Marker
              key={receptora.id}
              position={[lat, lng]}
              icon={mapAdapter.createReceptoraIcon(isHighlighted)}
              eventHandlers={{
                click: () => receptora.id && onMarkerClick(receptora.id),
              }}
            >
              <Popup maxWidth={350}>
                <Box>
                  {/* Nome e descrição */}
                  <Typography variant="subtitle2" fontWeight={700} color="success.main" mb={0.5}>
                    {receptora.nome}
                  </Typography>
                  {receptora.descricao && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {receptora.descricao}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />
                  
                  {/* Endereço */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2">
                        {receptora.endereco.logradouro}, {receptora.endereco.numero}
                      </Typography>
                      {receptora.endereco.complemento && (
                        <Typography variant="caption" color="text.secondary">
                          {receptora.endereco.complemento}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {receptora.endereco.bairro} - CEP: {receptora.endereco.cep}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Distância */}
                  {receptora.distancia_km !== undefined && (
                    <Typography variant="body2" mb={1}>
                      📏 <strong>Distância:</strong> {receptora.distancia_km.toFixed(2)} km
                    </Typography>
                  )}

                  {/* Horário hoje */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography 
                      variant="body2" 
                      color={horarioHoje === 'Fechado hoje' ? 'error' : 'text.primary'}
                    >
                      <strong>Hoje:</strong> {horarioHoje}
                    </Typography>
                  </Box>

                  {/* Telefone */}
                  {receptora.telefone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {receptora.telefone}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  {/* Materiais aceitos */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Materiais aceitos:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
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
                    <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        ℹ️ {receptora.observacoes}
                      </Typography>
                    </Box>
                  )}

                  {/* Link para Google Maps */}
                  <MuiLink
                    href={mapAdapter.getGoogleMapsLink({
                      latitude: lat,
                      longitude: lng,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
                  >
                    <LocationOnIcon fontSize="small" />
                    Abrir no Google Maps
                  </MuiLink>

                  {userLocation && (
                    <MuiLink
                      href={mapAdapter.getGoogleMapsDirectionsLink(
                        { latitude: userLocation[0], longitude: userLocation[1] },
                        { latitude: lat, longitude: lng }
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', mt: 0.5 }}
                    >
                      <LocationOnIcon fontSize="small" />
                      Ver rota no Google Maps
                    </MuiLink>
                  )}
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CSS para marcadores destacados */}
      <style>{`
        .highlighted-receptora-marker {
          z-index: 1000 !important;
          filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.8));
          animation: pulse 2s infinite;
        }
        
        .receptora-marker {
          transition: all 0.2s;
        }
        
        @keyframes pulse {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(76, 175, 80, 1));
          }
        }
      `}</style>
    </Box>
  );
}
