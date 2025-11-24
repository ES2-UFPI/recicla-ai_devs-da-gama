import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Box, Button, Paper, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';

// Fix para os ícones padrão do Leaflet não aparecerem
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialPosition?: { lat: number; lng: number };
  hideSearchInput?: boolean;
  hideUseMyLocationButton?: boolean;
}

// Componente interno para capturar cliques no mapa
function LocationMarker({
  position,
  setPosition,
  onSelect,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const newPos = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      setPosition(newPos);
      onSelect(newPos.lat, newPos.lng);
    },
  });

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

export function MapSelector({ onLocationSelect, initialPosition, hideSearchInput = false, hideUseMyLocationButton = false }: MapSelectorProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  
  // Centro padrão: Teresina, PI
  const defaultCenter: [number, number] = [-5.0892, -42.8034];
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : defaultCenter
  );
  const [mapKey, setMapKey] = useState(0); // Para forçar re-render do mapa

  // Detectar se é mobile para usar proxy CORS
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Helper: constrói URL de busca (Nominatim) com parâmetros corretos
  const buildNominatimSearchUrl = (q: string) => {
    const u = new URL('https://nominatim.openstreetmap.org/search');
    u.searchParams.set('format', 'json');
    u.searchParams.set('q', q);
    u.searchParams.set('limit', '1');
    u.searchParams.set('countrycodes', 'br');
    return u.toString();
  };

  // Helper: tenta múltiplos proxies CORS no mobile
  const fetchWithProxy = async (targetUrl: string, options?: RequestInit): Promise<Response> => {
    // Desktop: tenta direto primeiro
    if (!isMobile) {
      try {
        return await fetch(targetUrl, options);
      } catch (e) {
        console.warn('Falha no fetch direto, tentando proxies…', e);
      }
    }

    // Ordem de proxies para tentar no mobile
    const candidates: string[] = [
      // corsproxy.io aceita a URL codificada como query única
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      // AllOrigins
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      // isomorphic-git (não codificar a URL inteira)
      `https://cors.isomorphic-git.org/${targetUrl}`,
      // thingproxy (não codificar a URL inteira)
      `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
    ];

  let lastError: unknown = null;
    for (const proxyUrl of candidates) {
      try {
        const res = await fetch(proxyUrl, { ...options, headers: undefined });
        if (res.ok) {
          console.log('✅ Proxy OK:', proxyUrl);
          return res;
        } else {
          console.warn('⚠️ Proxy respondeu com status', res.status, '->', proxyUrl);
          lastError = new Error(`Proxy status ${res.status}`);
        }
      } catch (e) {
        console.warn('⚠️ Proxy falhou:', proxyUrl, e);
        lastError = e;
      }
    }
    throw lastError ?? new Error('Todos os proxies falharam');
  };

  const center: [number, number] = mapCenter;

  // Função para buscar endereço
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) {
      alert('Digite um endereço para buscar');
      return;
    }

    setSearching(true);
    try {
      // Buscar via API base
      const response = await api.get(`/geo/search?q=${encodeURIComponent(searchQuery)}`);
      const data = response.data;

      if (data.length === 0) {
        alert('Endereço não encontrado. Tente ser mais específico (ex: Rua, número, cidade).');
        setSearching(false);
        return;
      }

      // Atualizar posição e centro do mapa
      const result = data[0];
      const newPosition = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };

      setPosition(newPosition);
      setMapCenter([newPosition.lat, newPosition.lng]);
      setMapKey((prev) => prev + 1); // Forçar re-render do mapa
      setSearching(false);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      alert('Erro ao buscar endereço. Verifique sua conexão.');
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  useEffect(() => {
    // Obter localização atual do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          if (!initialPosition) {
            setPosition(userLocation);
            setMapCenter([userLocation.lat, userLocation.lng]);
          }
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
        }
      );
    }
  }, [initialPosition]);

  // Reagir a mudanças do initialPosition vindas do pai (ex: localizar no mapa após CEP)
  useEffect(() => {
    if (initialPosition) {
      setPosition({ lat: initialPosition.lat, lng: initialPosition.lng });
      setMapCenter([initialPosition.lat, initialPosition.lng]);
      setMapKey((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition?.lat, initialPosition?.lng]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(location);
        setMapCenter([location.lat, location.lng]);
        setMapKey((prev) => prev + 1); // Forçar re-render do mapa
        setLoadingLocation(false);
      },
      (error) => {
        alert('Não foi possível obter sua localização');
        console.error(error);
        setLoadingLocation(false);
      }
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Campo de busca de endereço */}
      {!hideSearchInput && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar endereço (ex: Rua das Flores, 123, Teresina)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchAddress();
              }
            }}
            disabled={searching}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searching ? (
                    <CircularProgress size={20} />
                  ) : searchQuery ? (
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <Paper
        elevation={2}
        sx={{
          height: 400,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 1,
          mb: 2,
        }}
      >
        <MapContainer
          key={mapKey}
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
        </MapContainer>
      </Paper>

      {/* Botões de ação */}
      {!hideUseMyLocationButton && (
        <Button
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleUseMyLocation}
          disabled={loadingLocation}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loadingLocation ? 'Obtendo localização...' : 'Usar Minha Localização'}
        </Button>
      )}


    </Box>
  );
}
