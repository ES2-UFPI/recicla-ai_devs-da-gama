import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Link as MuiLink, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { Receptora } from '../../../types/entrega';
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
  const { getCategoriaByTipo } = useCategorias();
  
  // Usa adapter para configurações do mapa
  const center: LatLngExpression = userLocation 
    ? mapAdapter.arrayToLibraryPosition(userLocation)
    : mapAdapter.toLibraryPosition(mapAdapter.getDefaultPosition());
  
  const zoom = userLocation ? mapAdapter.getDefaultZoom() : mapAdapter.getFallbackZoom();

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
          const enderecoPrincipal = receptora.addresses && receptora.addresses.length > 0 
            ? receptora.addresses[0] 
            : null;
          
          if (!enderecoPrincipal?.latitude || !enderecoPrincipal?.longitude) return null;
          
          const lat = parseFloat(enderecoPrincipal.latitude);
          const lng = parseFloat(enderecoPrincipal.longitude);
          
          if (lat === 0 || lng === 0) return null;

          const isHighlighted = receptora.id === highlightedId;

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
                  {/* Nome e email */}
                  <Typography variant="subtitle2" fontWeight={700} color="success.main" mb={0.5}>
                    {receptora.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {receptora.email}
                  </Typography>

                  <Divider sx={{ my: 1 }} />
                  
                  {/* Endereço */}
                  {enderecoPrincipal && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {enderecoPrincipal.logradouro}, {enderecoPrincipal.numero}
                        </Typography>
                        {enderecoPrincipal.complemento && (
                          <Typography variant="caption" color="text.secondary">
                            {enderecoPrincipal.complemento}
                          </Typography>
                        )}
                        {enderecoPrincipal.bairro && enderecoPrincipal.cep && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {enderecoPrincipal.bairro} - CEP: {enderecoPrincipal.cep}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Distância */}
                  <Typography variant="body2" mb={1}>
                    📏 <strong>Distância:</strong> {receptora.distancia_km.toFixed(2)} km
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  {/* Materiais aceitos */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Materiais aceitos:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                    {receptora.accepted_material.map((materialNome: string) => {
                      // Buscar categoria pelo nome (tipo) ao invés do ID
                      const categoria = getCategoriaByTipo(materialNome);
                      return (
                        <Chip
                          key={materialNome}
                          label={categoria?.tipo || materialNome}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>

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
