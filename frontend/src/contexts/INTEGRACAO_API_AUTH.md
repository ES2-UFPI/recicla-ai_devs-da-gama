# Integração de Autenticação (Auth) no Frontend

Este guia explica como substituir o mock atual do `AuthContext` por chamadas reais à API quando o backend estiver pronto. O projeto foi configurado para usar sessão baseada em cookie httpOnly (mais segura) em vez de `Authorization: Bearer` gerenciado no frontend.

## Visão geral

- Toda a autenticação do app passa por `src/contexts/AuthContext.tsx` e pelo hook `src/hooks/useAuth.ts`.
- O cliente HTTP é `src/services/api.ts` (Axios) com `withCredentials: true` para enviar/receber cookies httpOnly.
- Ao integrar a API, você NÃO precisa mudar as páginas (`Login`, `Cadastro`, `Perfil`, `Home`): ajuste apenas o `AuthContext` e, se necessário, o `api.ts`.

## Pré-requisitos

- Defina a URL base da API no `.env` do frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

- Garanta que seu backend permita CORS para a origem do Vite e, se usar cookies httpOnly, habilite `withCredentials` nos dois lados.

## Endpoints esperados (ajuste aos seus)

- POST `/auth/login` → define cookie de sessão via `Set-Cookie`
- POST `/auth/register` → (opcionalmente) define cookie de sessão
- GET `/auth/me` → `user` (valida sessão via cookie)
- POST `/auth/logout` → apaga cookie de sessão

Tipos usados no front (resumo):

```ts
export interface LoginCredentials { email: string; password: string }
export interface RegisterData {
  name: string; email: string; senha: string; telefone: string; role: string; cidade: string; estado: string;
}
export interface User {
  id: string; name: string; email: string; telefone: string; role: 'produtor'|'coletor'|'receptor'; estado: string; cidade: string;
}
```

## Cliente HTTP (httpOnly)

Em `src/services/api.ts` já foi configurado:

- `withCredentials: true` para que o navegador envie/receba cookies de sessão httpOnly nas requisições.

## Passos para integrar no `AuthContext`

Edite `src/contexts/AuthContext.tsx` substituindo o mock por chamadas reais:

1) Validação inicial de sessão (`useEffect`):

```ts
useEffect(() => {
  (async () => {
    try {
      const { data: user } = await api.get<User>('/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  })();
}, []);
```

2) Login (cookie httpOnly):

```ts
async function login(credentials: LoginCredentials) {
  setIsLoading(true);
  try {
    await api.post('/auth/login', credentials);
    const { data: me } = await api.get<User>('/auth/me');
    setUser(me);
  } catch {
    throw new Error('Credenciais inválidas');
  } finally {
    setIsLoading(false);
  }
}
```

3) Registro (cookie httpOnly):

```ts
async function register(data: RegisterData) {
  setIsLoading(true);
  try {
    await api.post('/auth/register', data);
    try {
      const { data: me } = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      setUser(null); // se não autenticar automaticamente após registro
    }
  } finally {
    setIsLoading(false);
  }
}
```

4) Logout:

```ts
async function logout() {
  try { await api.post('/auth/logout'); } finally { setUser(null); }
}
```

## Boas práticas e melhorias

- Erros de rede: exiba mensagens nas telas de Login/Cadastro (Snackbar/Alert) quando `login` ou `register` lançarem erro.
- Carregamento: use `isLoading` para desabilitar botões e mostrar feedback.
- Expiração de sessão: se `/auth/me` falhar com 401, considere redirecionar para login via guarda de rota (sem precisar interceptor de resposta neste projeto).
- Segurança: cookies httpOnly no backend (sem token no front) + `withCredentials` no Axios.
- CORS: separe ambientes (ex.: http://localhost:5173 para Vite e http://localhost:8000 para API) e configure `Access-Control-Allow-Credentials: true` com origem específica.

## FAQ

- Preciso mudar as páginas (Login/Cadastro/Perfil/Home)? Não. O contrato do `AuthContext` permanece o mesmo; apenas seu backend será chamado.
- Posso criar um `AuthService` separado? Sim, se preferir, crie `src/services/auth.ts` encapsulando login/register/me/logout e use no `AuthContext`. Em projetos pequenos, chamar `api` direto no contexto é suficiente.
