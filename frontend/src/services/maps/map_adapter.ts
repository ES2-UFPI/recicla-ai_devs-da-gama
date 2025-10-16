export interface GeoArea {
  lat: number;
  long: number;
}

// Ponto de coleta no mapa
export interface ColetaPoint {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  endereco?: string; //nome do endereço (caso seja retornado pela API)
  tipoResiduo?: string[];
  icone?: string;
}

// Interface do Adapter (contrato) — métodos síncronos conforme solicitado
export interface MapAdapter {
  obterPontosColeta(bounds: GeoArea): ColetaPoint[];
  exibirPonto(ponto: ColetaPoint): boolean;
  removerPonto(pontoId: string): boolean;
}