/**
 * Map Adapter - Abstração da biblioteca de mapas
 * 
 * Este adapter segue o padrão Adapter Design Pattern para abstrair a implementação
 * específica da biblioteca de mapas (Leaflet). Isso permite trocar facilmente
 * a biblioteca de mapas no futuro sem afetar os componentes que a utilizam.
 * 
 * BENEFÍCIOS:
 * - Desacoplamento: Componentes não dependem diretamente do Leaflet
 * - Flexibilidade: Trocar para Google Maps, Mapbox, etc. é simples
 * - Testabilidade: Fácil mockar para testes unitários
 * - Manutenibilidade: Mudanças na lib de mapas ficam isoladas aqui
 * 
 * COMO TROCAR DE BIBLIOTECA:
 * 1. Implementar novos métodos com a nova biblioteca
 * 2. Manter a mesma interface pública
 * 3. Atualizar apenas este arquivo
 * 4. Componentes continuam funcionando sem alterações
 */

import { Icon, type LatLngExpression } from 'leaflet';

// Importações específicas do Leaflet (isoladas aqui)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

/**
 * Interface pública do adapter
 * Define o contrato que os componentes devem usar
 */
export interface MapMarkerIcon {
  iconUrl?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
  shadowUrl?: string;
  shadowSize?: [number, number];
  className?: string;
}

export interface MapPosition {
  latitude: number;
  longitude: number;
}

/**
 * Adapter de Mapas
 * 
 * Encapsula toda a lógica específica da biblioteca de mapas
 */
export class MapAdapter {
  /**
   * Configuração padrão do mapa
   */
  private static readonly DEFAULT_CONFIG = {
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    defaultZoom: 13,
    fallbackZoom: 12,
  };

  /**
   * Converte posição customizada para formato da biblioteca
   */
  static toLibraryPosition(position: MapPosition): LatLngExpression {
    return [position.latitude, position.longitude];
  }

  /**
   * Converte array [lat, lng] para formato da biblioteca
   */
  static arrayToLibraryPosition(position: [number, number]): LatLngExpression {
    return position;
  }

  /**
   * Cria ícone padrão de marcador
   */
  static createDefaultIcon(): Icon {
    return new Icon({
      iconUrl: icon,
      iconRetinaUrl: iconRetina,
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }

  /**
   * Cria ícone destacado (para marcador selecionado)
   */
  static createHighlightedIcon(): Icon {
    return new Icon({
      iconUrl: icon,
      iconRetinaUrl: iconRetina,
      shadowUrl: iconShadow,
      iconSize: [35, 57],
      iconAnchor: [17, 57],
      popupAnchor: [1, -48],
      shadowSize: [57, 57],
      className: 'highlighted-marker',
    });
  }

  /**
   * Cria ícone customizado para localização do usuário
   */
  static createUserLocationIcon(): Icon {
    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#2196F3" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `;
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  /**
   * Cria ícone customizado para receptoras
   * Com cor verde para diferenciar de agendamentos
   */
  static createReceptoraIcon(isHighlighted: boolean = false): Icon {
    const size = isHighlighted ? 35 : 28;
    const anchor = isHighlighted ? 17 : 14;
    
    const svgIcon = `
      <svg width="${size}" height="${size * 1.5}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.97-4.03-9-9-9z" 
              fill="#4CAF50" 
              stroke="white" 
              stroke-width="2"/>
        <circle cx="12" cy="9" r="4" fill="white"/>
        <path d="M12 6v6M9 9h6" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [size, size * 1.5],
      iconAnchor: [anchor, size * 1.5],
      popupAnchor: [0, -size * 1.5],
      className: isHighlighted ? 'highlighted-receptora-marker' : 'receptora-marker',
    });
  }

  /**
   * Cria ícone customizado a partir de configuração
   */
  static createCustomIcon(config: MapMarkerIcon): Icon {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Icon(config as any);
  }

  /**
   * Retorna URL da camada de tiles do mapa
   */
  static getTileLayerUrl(): string {
    return this.DEFAULT_CONFIG.tileLayerUrl;
  }

  /**
   * Retorna atribuição do mapa
   */
  static getAttribution(): string {
    return this.DEFAULT_CONFIG.attribution;
  }

  /**
   * Retorna zoom padrão quando há localização do usuário
   */
  static getDefaultZoom(): number {
    return this.DEFAULT_CONFIG.defaultZoom;
  }

  /**
   * Retorna zoom fallback quando não há localização
   */
  static getFallbackZoom(): number {
    return this.DEFAULT_CONFIG.fallbackZoom;
  }

  /**
   * Gera link para Google Maps com coordenadas
   */
  static getGoogleMapsLink(position: MapPosition): string {
    return `https://www.google.com/maps/search/?api=1&query=${position.latitude},${position.longitude}`;
  }

  /**
   * Gera link para rotas no Google Maps
   */
  static getGoogleMapsDirectionsLink(
    origin: MapPosition,
    destination: MapPosition
  ): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`;
  }

  /**
   * Calcula distância aproximada entre dois pontos (fórmula de Haversine)
   * Retorna distância em quilômetros
   */
  static calculateDistance(pos1: MapPosition, pos2: MapPosition): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(pos2.latitude - pos1.latitude);
    const dLon = this.toRad(pos2.longitude - pos1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(pos1.latitude)) *
        Math.cos(this.toRad(pos2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Converte graus para radianos
   */
  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Valida se coordenadas são válidas
   */
  static isValidPosition(position: MapPosition): boolean {
    return (
      position.latitude >= -90 &&
      position.latitude <= 90 &&
      position.longitude >= -180 &&
      position.longitude <= 180
    );
  }

  /**
   * Retorna posição padrão (Teresina - PI) como fallback
   */
  static getDefaultPosition(): MapPosition {
    return {
      latitude: -5.0892,
      longitude: -42.8019,
    };
  }
}

/**
 * Exporta instância singleton para uso direto
 */
export const mapAdapter = MapAdapter;

/**
 * EXEMPLO DE MIGRAÇÃO PARA GOOGLE MAPS:
 * 
 * Para migrar para Google Maps:
 * 1. Instalar: npm install @react-google-maps/api
 * 2. Substituir métodos acima usando API do Google Maps
 * 3. Exemplo:
 * 
 * static createDefaultIcon(): google.maps.Icon {
 *   return {
 *     url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
 *     scaledSize: new google.maps.Size(25, 41),
 *   };
 * }
 * 
 * 4. Componentes não precisam de alteração!
 */
