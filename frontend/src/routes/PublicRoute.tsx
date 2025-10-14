import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para rotas públicas (Login/Cadastro)
 * Redireciona para home se o usuário já estiver autenticado
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Redireciona para home se já estiver autenticado
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Renderiza a página pública (login/cadastro)
  return <>{children}</>;
}
