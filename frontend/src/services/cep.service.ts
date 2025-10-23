export interface ViaCepResponse {
  cep: string; // 00000-000
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

const normalizeCep = (cep: string) => cep.replace(/\D/g, '');

export const cepService = {
  async lookup(rawCep: string): Promise<ViaCepResponse | null> {
    const digits = normalizeCep(rawCep);
    if (digits.length !== 8) return null;
    const url = `https://viacep.com.br/ws/${digits}/json/`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
  const data: ViaCepResponse = await resp.json();
  if (data.erro) return null;
    return data;
  },
  format(cep: string): string {
    const d = normalizeCep(cep);
    if (d.length !== 8) return cep;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  },
};
