import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoleCheck } from '../hooks/useRoleCheck';
import { CircularProgress, Box } from '@mui/material';

type AllowedRole = 'produtor' | 'coletor' | 'receptor';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
  fallbackPath?: string; // Para onde redirecionar se não tiver permissão
}

/**
 * Componente de rota protegida baseada em roles.
 * 
 * Garante que apenas usuários autenticados com roles específicos
 * possam acessar a rota. Redireciona para login se não autenticado,
 * ou para fallbackPath se não tiver permissão.
 * 
 * @example
 * ```tsx
 * <Route path="/residuos" element={
 *   <RoleBasedRoute allowedRoles={['produtor']}>
 *     <Residuo />
 *   </RoleBasedRoute>
 * } />
 * ```
 */
export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/' 
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth();
  const { hasRole } = useRoleCheck();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usa o hook useRoleCheck para verificar permissão
  if (!hasRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}