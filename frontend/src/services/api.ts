import axios, { type AxiosRequestConfig } from 'axios';

// Fallback para dev se VITE_API_BASE_URL não estiver definido
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: BASE_URL,
    // Backend emite cookie httpOnly de sessão. Precisamos enviar/receber cookies nas requisições.
    withCredentials: true,
});

// Interceptor de resposta para tentar refresh automático em 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error?.config ?? {};
    const status = error?.response?.status;
    const url = originalRequest.url ?? '';

    // Não tenta refresh se:
    // 1. Não é erro 401
    // 2. Já tentou fazer refresh
    // 3. A requisição original já é para endpoints de auth (login/register/refresh/logout)
    // 4. É POST /users (cadastro público de usuário)
    // Nota: /auth/me DEVE tentar refresh quando falhar com 401
  const isAuthEndpoint = url.includes('/auth/login') || 
              url.includes('/auth/register') || 
              url.includes('/auth/refresh') || 
              url.includes('/auth/logout');
  
  // POST /users (sem /me) é cadastro público, não precisa refresh
  const isPublicUserRegistration = url === '/users' && originalRequest.method?.toLowerCase() === 'post';

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint && !isPublicUserRegistration) {
      originalRequest._retry = true;
      try {
        // Tenta renovar o access token usando o refresh_token do cookie
        await api.post('/auth/refresh');
        // Re-tenta a requisição original agora com novo access token
        return api(originalRequest);
      } catch (refreshError) {
        // Falha no refresh (ex: sem refresh_token ou expirado)
        // Propaga o erro para que a app possa deslogar/redirecionar
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;