import { Box, Card, CardContent, Typography, Button, Link as MuiLink } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Fix para ícones do Leaflet
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

interface MapaDeslocamentoProps {
  latitude: number;
  longitude: number;
  endereco: string;
}

export default function MapaDeslocamento({ latitude, longitude, endereco }: MapaDeslocamentoProps) {
  const position: LatLngExpression = [latitude, longitude];
  
  const getGoogleMapsLink = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            🗺️ Localização
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            component={MuiLink}
            href={getGoogleMapsLink()}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LocationOnIcon />}
            sx={{ textTransform: 'none' }}
          >
            Abrir no Google Maps
          </Button>
        </Box>

        <Box sx={{ 
          height: { xs: '300px', sm: '400px', md: '450px' }, 
          width: '100%', 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'divider'
        }}>
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            dragging={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={DefaultIcon}>
              <Popup>
                <Typography variant="body2" fontWeight={600}>
                  Local de Coleta
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {endereco}
                </Typography>
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
