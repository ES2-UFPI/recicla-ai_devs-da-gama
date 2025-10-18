export interface Residue {
  id: string;
  produtorId: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: 'kg' | 'unidade';
  foto?: string;
  valorEstimado: number;
  status: 'DISPONIVEL' | 'AGENDADO' | 'COLETADO' | 'ENTREGUE' | 'CANCELADO';
  dataCadastro: string;
}

export interface ResidueCreate {
  quantidade: number;
  tipo_medida: 'kg' | 'unidade';
  foto?: string;
  categoriaId: string;
}

export interface ResidueUpdate {
  quantidade?: number;
  tipo_medida?: 'kg' | 'unidade';
  foto?: string;
  categoriaId?: string;
}
