export interface Categoria {
  id: string;
  tipo: string;
  descricao: string;
  preco_por_kg: number;
  preco_por_unidade?: number;
  ativo: boolean;
}

export interface CategoriaCreate {
  tipo: string;
  descricao: string;
  preco_por_kg: number;
  preco_por_unidade?: number;
  ativo?: boolean;
}
