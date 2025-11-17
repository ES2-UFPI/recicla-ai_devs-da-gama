/**
 * Tipos relacionados a entregas de resíduos
 */

/**
 * Endereço da receptora (formato do backend)
 */
export interface EnderecoReceptora {
  id?: number;
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: string;
  longitude?: string;
}

/**
 * Interface que representa uma receptora (ecoponto)
 * Baseada no schema ReceptoraComDistancia do backend
 */
export interface Receptora {
  id: string;
  name: string;
  email: string;
  phone: string;
  accepted_material: string[]; // Array de IDs de categorias
  addresses?: EnderecoReceptora[];
  distancia_km: number; // Calculado quando busca por proximidade
}

/**
 * Parâmetros para buscar receptoras próximas
 */
export interface BuscarReceptorasParams {
  latitude: number;
  longitude: number;
  raio: number;
  categorias_ids?: string[];
}

/**
 * Request para buscar receptoras próximas
 */
export interface BuscarReceptorasRequest {
  latitude: number;
  longitude: number;
  raio: number;
  materiais_aceitos?: string[];
}

/**
 * Receptora com distância calculada
 */
export interface ReceptoraComDistancia extends Receptora {
  distancia_km: number;
}

/**
 * Dados para criar uma entrega
 */
export interface EntregaCreate {
  receptora_id: string;
  residuos_id: string[];
  observacoes?: string;
}

/**
 * Resposta de uma entrega do backendkend
 * Match com EntregaResponse do backend (entrega_schema.py)
 */
export interface EntregaResponse {
  id: string; // alias para _id
  data_hora: string; // ISO datetime
  receptora_id: string;
  coletor_id: string;
  residuos_id: string[]; // Array de IDs dos resíduos
  categorias_residuos_entregues: string[]; // Array de IDs de categorias
  observacoes?: string;
}

/**
 * Sumário de entregas por categoria
 */
export interface EntregaSumario {
  categoriaId: string;
  tipo_medida: string;
  quantidade_total: number;
}
