import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Link as MuiLink } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { Agendamento } from '../hooks/useAgendamentos';
import { useCategorias } from '../hooks/useCategorias';

// Fix para ícones do Leaflet no Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = new Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HighlightedIcon = new Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  shadowSize: [57, 57],
  className: 'highlighted-marker'
});

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
  agendamentos: Agendamento[];
  userLocation: [number, number] | null;
  highlightedId: string | null;
  onMarkerClick: (id: string) => void;
}

export function InteractiveMap({
  agendamentos,
  userLocation,
  highlightedId,
  onMarkerClick,
}: InteractiveMapProps) {
  const { getCategoriaById } = useCategorias();
  const center: LatLngExpression = userLocation || [-5.0892, -42.8019]; // Teresina como padrão
  const zoom = userLocation ? 13 : 12;

  const getGoogleMapsLink = (lat: string, lng: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcador da localização do usuário */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={new Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzIxOTZGMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <Typography variant="body2" fontWeight={600}>
                Sua localização
              </Typography>
            </Popup>
          </Marker>
        )}

        {/* Marcadores dos agendamentos */}
        {agendamentos.map((agendamento) => {
          const lat = parseFloat(agendamento.local.latitude || '0');
          const lng = parseFloat(agendamento.local.longitude || '0');
          
          if (lat === 0 || lng === 0) return null;

          const isHighlighted = agendamento.id === highlightedId;

          return (
            <Marker
              key={agendamento.id}
              position={[lat, lng]}
              icon={isHighlighted ? HighlightedIcon : DefaultIcon}
              eventHandlers={{
                click: () => onMarkerClick(agendamento.id),
              }}
            >
              <Popup maxWidth={300}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>
                    {agendamento.local.apelido || 'Ponto de Coleta'}
                  </Typography>
                  
                  <Typography variant="body2" mb={0.5}>
                    📍 {agendamento.local.logradouro}, {agendamento.local.numero}
                  </Typography>
                  
                  {agendamento.local.complemento && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {agendamento.local.complemento}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" mb={1}>
                    📏 {agendamento.distancia_km.toFixed(2)} km
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Resíduos disponíveis:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {agendamento.residuos.map((residuo, idx) => {
                      const categoria = getCategoriaById(residuo.categoriaId);
                      return (
                        <Chip
                          key={idx}
                          label={`${categoria?.tipo || 'Resíduo'}: ${residuo.quantidade} ${residuo.tipo_medida}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>

                  <MuiLink
                    href={getGoogleMapsLink(agendamento.local.latitude!, agendamento.local.longitude!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
                  >
                    <LocationOnIcon fontSize="small" />
                    Abrir no Google Maps
                  </MuiLink>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        .highlighted-marker {
          z-index: 1000 !important;
          filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.8));
        }
      `}</style>
    </Box>
  );
}
