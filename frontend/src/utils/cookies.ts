// Funções utilitárias para gerenciar cookies

const TOKEN_KEY = 'reciclaai_token';

// Detecta se está em ambiente de produção com HTTPS
const isProduction = import.meta.env.PROD;

export const cookies = {
  // Salvar token no cookie
  setToken(token: string) {
    try {
      // Expira em 7 dias
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      
      const cookieOptions = [
        `${TOKEN_KEY}=${encodeURIComponent(token)}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'SameSite=Strict',
      ];
      
      // Adiciona 'Secure' apenas em produção com HTTPS
      if (isProduction) {
        cookieOptions.push('Secure');
      }
      
      document.cookie = cookieOptions.join('; ');
    } catch (error) {
      console.error('Erro ao salvar token no cookie:', error);
    }
  },

  // Obter token do cookie
  getToken(): string | null {
    try {
      const cookiesArr = document.cookie.split('; ');
      const tokenCookie = cookiesArr.find(cookie => cookie.startsWith(`${TOKEN_KEY}=`));
      
      if (tokenCookie) {
        const tokenValue = tokenCookie.substring(tokenCookie.indexOf('=') + 1);
        return decodeURIComponent(tokenValue);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter token do cookie:', error);
      return null;
    }
  },

  // Remover token do cookie
  removeToken() {
    try {
      const cookieOptions = [
        `${TOKEN_KEY}=`,
        'expires=Thu, 01 Jan 1970 00:00:00 UTC',
        'path=/',
        'SameSite=Strict',
      ];
      
      if (isProduction) {
        cookieOptions.push('Secure');
      }
      
      document.cookie = cookieOptions.join('; ');
    } catch (error) {
      console.error('Erro ao remover token do cookie:', error);
    }
  },

  // Verificar se existe token
  hasToken(): boolean {
    return this.getToken() !== null;
  },
};