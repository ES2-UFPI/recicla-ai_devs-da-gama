import type { Categoria, Residuo, UnidadeMedida } from '../../types/residuo';

export type ResiduoDTO = Residuo;

export type ResiduoCreateInput = {
  quantidade: number;
  unidade: UnidadeMedida;
  categoriaId: string;
  foto: File;
};

export interface ResiduosPort {
  list(): Promise<{ residuos: ResiduoDTO[]; categorias: Categoria[] }>;
  create(input: ResiduoCreateInput): Promise<ResiduoDTO>;
}
