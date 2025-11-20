export type TipoRecompensa = 'produto' | 'desconto' | 'voucher' | 'cupom' | 'todos';
export type OrdenacaoPontos = 'menor' | 'maior';

export interface ResgateInfo {
  nome: string;
  pontos: number;
}
