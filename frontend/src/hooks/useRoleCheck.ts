import { useAuth } from './useAuth';

/**
 * Hook para verificar roles/permissões do usuário autenticado.
 * 
 * Fornece métodos utilitários para controle de acesso baseado em roles.
 * 
 * @example
 * ```tsx
 * const { isProdutor, isColetor, hasRole } = useRoleCheck();
 * 
 * // Renderização condicional
 * {isProdutor && <CadastrarResiduoButton />}
 * {isColetor && <AceitarColetaButton />}
 * 
 * // Verificação múltipla
 * {hasRole(['produtor', 'receptor']) && <RelatoriosButton />}
 * ```
 */
export function useRoleCheck() {
  const { user } = useAuth();
  
  /**
   * Verifica se o usuário tem um ou mais roles permitidos.
   * 
   * @param allowedRoles - Role único ou array de roles permitidos
   * @returns true se o usuário possui um dos roles permitidos
   * 
   * @example
   * hasRole('produtor') // true se for produtor
   * hasRole(['produtor', 'coletor']) // true se for produtor OU coletor
   */
  const hasRole = (allowedRoles: string | string[]): boolean => {
    if (!user?.role) return false;
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  };
  
  // Atalhos para roles específicos (melhor performance e legibilidade)
  const isProdutor = user?.role === 'produtor';
  const isColetor = user?.role === 'coletor';
  const isReceptor = user?.role === 'receptor';
  
  // Role atual do usuário (pode ser usado para debug ou mensagens)
  const currentRole = user?.role;
  
  return {
    hasRole,
    isProdutor,
    isColetor,
    isReceptor,
    currentRole,
  };
}
