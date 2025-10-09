

import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Home from '../pages/Home';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota de Login */}
      <Route path="/login" element={<Login />} />
      {/* Rota de Cadastro */}
      <Route path="/cadastro" element={<Cadastro />} />
      {/* Rota Home */}
      <Route path="/" element={<Home />} />
      {/* Exemplo de rota protegida futura:
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      */}

      {/* Redireciona rota raiz para login (ajuste conforme necessário) */}
      {/*<Route path="/" element={<Navigate to="/login" replace />} />*/}
    </Routes>
  );
}
