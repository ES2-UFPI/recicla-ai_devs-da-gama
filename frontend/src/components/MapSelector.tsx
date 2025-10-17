import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Box, Typography, Button, Paper, TextField, Stack, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
}

// Componente interno para capturar cliques no mapa
function LocationMarker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

export function MapSelector({ onLocationSelect, initialPosition }: MapSelectorProps) {
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
  
  const [endereco, setEndereco] = useState<{
    logradouro: string;
    bairro: string;
    numero: string;
    complemento: string;
  }>({
    logradouro: '',
    bairro: '',
    numero: '',
    complemento: '',
  });
  const [enderecoCarregado, setEnderecoCarregado] = useState(false);

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

  // Helper: constrói URL de reverse geocoding (Nominatim)
  const buildNominatimReverseUrl = (lat: number, lon: number) => {
    const u = new URL('https://nominatim.openstreetmap.org/reverse');
    u.searchParams.set('format', 'json');
    u.searchParams.set('lat', String(lat));
    u.searchParams.set('lon', String(lon));
    u.searchParams.set('addressdetails', '1');
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
  const API_BASE = (typeof import.meta !== 'undefined' && 'env' in import.meta && (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_API_BASE_URL)
    ? (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_API_BASE_URL!
    : 'http://localhost:8000';

  // Função para buscar endereço
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) {
      alert('Digite um endereço para buscar');
      return;
    }

    setSearching(true);
    try {
      // 1) Tenta backend local (mais rápido e estável)
      const backendUrl = `${API_BASE}/geo/search?q=${encodeURIComponent(searchQuery)}`;
      let response = await fetch(backendUrl, { credentials: 'include' });
      
      // 2) Se backend indisponível, usa Nominatim com fallback de proxies no mobile
      if (!response.ok) {
        const nominatimUrl = buildNominatimSearchUrl(searchQuery);
        response = await fetchWithProxy(nominatimUrl);
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }

  const data = await response.json();

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

  const handleConfirm = async () => {
    if (!position) {
      alert('Selecione um local no mapa');
      return;
    }

    // Se já carregou o endereço, confirmar com os dados editados
    if (enderecoCarregado) {
      const enderecoCompleto = `${endereco.logradouro}${
        endereco.numero ? `, ${endereco.numero}` : ', s/n'
      }${endereco.bairro ? ` - ${endereco.bairro}` : ''}${
        endereco.complemento ? ` - ${endereco.complemento}` : ''
      }`;
      onLocationSelect(position.lat, position.lng, enderecoCompleto);
      return;
    }

    // Buscar endereço via reverse geocoding (prioriza backend local)
    try {
      console.log('🔍 Buscando endereço para:', { lat: position.lat, lng: position.lng });
      console.log('📱 Dispositivo:', isMobile ? 'Mobile (com proxies)' : 'Desktop');

      // 1) Tenta backend local
      let response = await fetch(
        `${API_BASE}/geo/reverse?lat=${encodeURIComponent(position.lat)}&lon=${encodeURIComponent(position.lng)}`,
        { credentials: 'include' }
      );
      
      // 2) Se falhar, usa Nominatim com proxies
      if (!response.ok) {
        const nominatimUrl = buildNominatimReverseUrl(position.lat, position.lng);
        response = await fetchWithProxy(nominatimUrl);
      }
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📦 Dados do Nominatim:', data);
      console.log('🏠 Address object:', data.address);
      
      if (data.address) {
        const logradouro = 
          data.address.road || 
          data.address.street || 
          data.address.highway || 
          data.address.footway ||
          data.address.pedestrian ||
          '';
        
        const bairro = 
          data.address.suburb || 
          data.address.neighbourhood || 
          data.address.city_district || 
          data.address.district || 
          data.address.quarter ||
          '';
        
        console.log('✅ Endereço extraído:', { logradouro, bairro });
        
        setEndereco({
          logradouro: logradouro,
          bairro: bairro,
          numero: data.address.house_number || '',
          complemento: '',
        });
        setEnderecoCarregado(true);
      } else {
        console.warn('⚠️ Nenhum address encontrado');
        setEndereco({
          logradouro: '',
          bairro: '',
          numero: '',
          complemento: '',
        });
        setEnderecoCarregado(true);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar endereço:', error);
      setEndereco({
        logradouro: '',
        bairro: '',
        numero: '',
        complemento: '',
      });
      setEnderecoCarregado(true);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Clique no mapa para selecionar o local da coleta ou use sua localização atual.
      </Typography>

      {/* Campo de busca de endereço */}
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
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </Paper>

      {/* Botões de ação */}
      {!enderecoCarregado && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={handleUseMyLocation}
            disabled={loadingLocation}
            fullWidth
          >
            {loadingLocation ? 'Obtendo localização...' : 'Usar Minha Localização'}
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!position}
            fullWidth
          >
            Buscar Endereço
          </Button>
        </Stack>
      )}

      {/* Formulário de edição do endereço */}
      {enderecoCarregado && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Complete os dados do endereço
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Verifique e complete as informações obtidas do mapa.
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Logradouro (Rua/Avenida)"
              value={endereco.logradouro}
              onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              fullWidth
              size="small"
              placeholder="Ex: Rua das Flores"
              helperText="Nome da rua obtido do mapa"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Número *"
                value={endereco.numero}
                onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                size="small"
                placeholder="123"
                sx={{ width: '30%' }}
                helperText="Obrigatório"
              />
              <TextField
                label="Bairro"
                value={endereco.bairro}
                onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                size="small"
                placeholder="Centro"
                sx={{ flex: 1 }}
                helperText="Obtido do mapa"
              />
            </Box>

            <TextField
              label="Complemento"
              value={endereco.complemento}
              onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
              fullWidth
              size="small"
              placeholder="Ex: Apto 101, Bloco B, Portão Verde"
              helperText="Informações adicionais sobre o local"
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setEnderecoCarregado(false);
                  setEndereco({
                    logradouro: '',
                    bairro: '',
                    numero: '',
                    complemento: '',
                  });
                }}
                size="small"
              >
                Voltar ao Mapa
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                disabled={!endereco.numero}
                size="small"
                sx={{ ml: 'auto' }}
              >
                Confirmar Endereço
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Coordenadas selecionadas */}
      {position && !enderecoCarregado && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'info.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.main',
          }}
        >
          <Typography variant="caption" color="info.dark" fontWeight={600}>
            📍 Coordenadas selecionadas:
          </Typography>
          <Typography variant="caption" color="info.dark" display="block">
            Latitude: {position.lat.toFixed(6)}, Longitude: {position.lng.toFixed(6)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
