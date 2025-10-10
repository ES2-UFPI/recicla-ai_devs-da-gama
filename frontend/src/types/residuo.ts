export type ResiduoStatus = 'CRIADO' | 'AGENDADO' | 'COLETADO' | 'ENTREGUE';

export type UnidadeMedida = 'unidade' | 'kg' | 'g' | 'L' | 'mL';

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
  historico?: HistoricoEvento[];
}

export interface Categoria {
  id: string;
  nome: string;
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
