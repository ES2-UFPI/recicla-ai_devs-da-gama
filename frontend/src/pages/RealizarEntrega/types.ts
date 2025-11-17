/**
 * Tipos específicos para a tela de Realizar Entrega
 */

export interface ResiduoInventory {
  id: string;
  produtorId: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: 'kg' | 'unidade';
  foto?: string;
  valorEstimado: number;
  status: string;
  dataCadastro: string;
}

export interface ReceptoraInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id?: string;
  accepted_material: string[];
  addresses?: Array<{
    id: number;
    apelido: string;
    cep: string;
    logradouro: string;
    numero: string;
    latitude?: string;
    longitude?: string;
    complemento?: string;
  }>;
  distancia_km?: number;
}export interface CategoriaAgrupada {
  categoriaId: string;
  categoriaNome: string;
  residuos: ResiduoInventory[];
  totalKg: number;
  totalUnidades: number;
  quantidadeResiduos: number;
}

export interface EntregaFormData {
  receptora_id: string;
  residuos_id: string[];
  observacoes?: string;
}
