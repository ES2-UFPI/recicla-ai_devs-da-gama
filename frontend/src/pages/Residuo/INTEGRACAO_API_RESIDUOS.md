# Integração da API na página de Resíduos

Este guia mostra como trocar o mock local pela API real, mantendo a UX e o código simples. Já deixamos a tela `Residuo` preparada com um pequeno Adapter que alterna entre Mock e HTTP automaticamente.

## Visão geral

- Quando `VITE_API_BASE_URL` não estiver definida, a página usa dados de mock (arquivo `src/pages/Residuo/mock/residuos.json`).
- Quando `VITE_API_BASE_URL` estiver definida, a página usa a API real através do cliente HTTP `src/services/api.ts` (Axios).
- O retorno esperado da API no cadastro é o objeto do novo resíduo criado. O frontend insere esse item no topo da lista sem refazer o fetch completo.

## Onde está o Adapter

Na própria página `src/pages/Residuo/index.tsx` foram criados:

- Interface (Porta): `ResiduosPort` com métodos `list()` e `create()`
- Adapter HTTP: `HttpResiduosAdapter` (usa `api`/Axios)
- Adapter Mock: `MockResiduosAdapter` (usa o JSON local)

A escolha do Adapter é automática:

```ts
const useHttp = Boolean(import.meta.env.VITE_API_BASE_URL);
const adapter: ResiduosPort = useMemo(
  () => (useHttp ? new HttpResiduosAdapter() : new MockResiduosAdapter()),
  [useHttp]
);
```

## Endpoints esperados

Ajuste os caminhos conforme seu backend:

- GET `/categorias` → retorna `Categoria[]`
- GET `/residuos` → retorna `Residuo[]`
- POST `/residuos` (multipart/form-data) → retorna `Residuo` recém-criado

Contrato mínimo de `Residuo` usado no front:

```ts
export type Residuo = {
  id: string;
  quantidade: number;
  unidade: 'unidade' | 'kg' | 'g' | 'L' | 'mL';
  dataCadastro: string; // ISO
  foto: string; // URL pública acessível
  categoriaId: string;
  produtorId: string;
  status: 'CRIADO' | 'AGENDADO' | 'COLETADO' | 'ENTREGUE';
  historico?: Array<{ etapa: Residuo['status']; dataHora: string; descricao: string }>;
};
```

O POST espera `multipart/form-data` com os campos:

- `quantidade` (string/number)
- `unidade` (string)
- `categoriaId` (string)
- `foto` (File)

## Como ligar a API

1. Configurar a URL base
   - Crie um arquivo `.env` na pasta `frontend` (ou use `.env.local`) com:

```env
VITE_API_BASE_URL=http://localhost:8000
```

2. Startar seu backend nessa URL

3. Rodar o frontend normalmente (Vite)

> Quando `VITE_API_BASE_URL` existir, o Adapter HTTP será usado automaticamente.

## Como ajustar os endpoints/contratos

- Edite `src/services/api.ts` se precisar mudar cabeçalhos ou baseURL.
- Ajuste os caminhos do `HttpResiduosAdapter` dentro de `src/pages/Residuo/index.tsx`:
  - `api.get<Categoria[]>('/categorias')`
  - `api.get<ResiduoDTO[]>('/residuos')`
  - `api.post<ResiduoDTO>('/residuos', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`

## Como remover o mock (opcional)

Se quiser remover totalmente o mock quando a API estiver pronta:

- Remover `src/pages/Residuo/mock/residuos.json`
- Remover a classe `MockResiduosAdapter` e o fallback no `useMemo`
- Fixar o adapter para `new HttpResiduosAdapter()`

Mas para desenvolvimento local/offline, manter o mock como fallback é útil.

## Erros comuns e dicas

- CORS: habilite CORS no backend para a origem do Vite.
- Upload de arquivo: certifique-se que o backend aceita `multipart/form-data` e devolve `foto` como URL pública.
- Página vazia: verifique se `/categorias` e `/residuos` retornam arrays. Em caso de erro de rede, o front atualmente silencia o erro; você pode exibir um `Snackbar`.

## Perguntas frequentes

- Preciso que o POST retorne a lista inteira? Não. Melhor retornar só o item criado; o front já faz `setResiduos((prev) => [novo, ...prev])`.
- E paginação? O front hoje pagina localmente. Se precisar paginação server-side, adapte `HttpResiduosAdapter.list()` para aceitar query params e faça o estado de paginação consultar o servidor.
- Posso mover o Adapter para um arquivo separado? Sim. Em um projeto maior, crie `src/adapters/residuos.ts` e importe na página. Neste projeto acadêmico, manter na própria página simplifica.
