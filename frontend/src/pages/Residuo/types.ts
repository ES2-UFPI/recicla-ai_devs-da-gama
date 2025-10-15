import type { Categoria, Residuo, UnidadeMedida } from '../../types/residuo';

// DTO que o backend retorna (com tipo_medida)
export interface ResiduoBackendDTO {
  id: string;
  produtorId: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: 'kg' | 'unidade'; // Backend usa 'tipo_medida'
  foto: string | null;
  valorEstimado: number;
  status: string;
  dataCadastro: string;
}

// DTO que o backend espera na categoria
export interface CategoriaBackendDTO {
  id: string;
  tipo: string; // Backend usa 'tipo' não 'nome'
  preco_por_kg: number;
  preco_por_unidade?: number;
}

export type ResiduoDTO = Residuo;

export type ResiduoCreateInput = {
  quantidade: number;
  unidade: UnidadeMedida; // Frontend usa 'unidade'
  categoriaId: string;
  foto: File;
};

export interface ResiduosPort {
  list(): Promise<{ residuos: ResiduoDTO[]; categorias: Categoria[] }>;
  create(input: ResiduoCreateInput): Promise<ResiduoDTO>;
}
