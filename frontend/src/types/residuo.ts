// Tipos compatíveis com o backend FastAPI
export type ResiduoStatus = 'DISPONIVEL' | 'AGENDADO' | 'COLETADO' | 'ENTREGUE' | 'CANCELADO' | 'REJEITADO' | 'RESERVADO';

// Backend só aceita 'kg' ou 'unidade'
export type UnidadeMedida = 'kg' | 'unidade';

export interface HistoricoEvento {
  etapa: ResiduoStatus;
  dataHora: string; // ISO string
  descricao: string;
}

export interface Residuo {
  id: string;
  quantidade: number;
  unidade: UnidadeMedida;
  dataCadastro: string; // ISO string
  foto: string; // URL ou caminho
  categoriaId: string;
  produtorId: string;
  status: ResiduoStatus;
  valorEstimado: number; // Valor calculado pelo backend
  historico?: HistoricoEvento[];
}

export interface Categoria {
  id: string;
  nome: string; // Mapeado de 'tipo' do backend
  tipo?: string; // Campo original do backend (opcional para manter compatibilidade)
  preco_por_kg?: number;
  preco_por_unidade?: number;
}

// Tipo usado no cliente para criar um resíduo (antes do upload real para API)
// Nota: 'foto' aqui é um File. Após salvar na API, o backend deve retornar
// a URL pública, que será atribuída ao campo 'foto' (string) do tipo Residuo.
export interface ResiduoCreate {
  quantidade: number;
  unidade: UnidadeMedida;
  categoriaId: string;
  foto: File; // arquivo local selecionado pelo usuário
}
