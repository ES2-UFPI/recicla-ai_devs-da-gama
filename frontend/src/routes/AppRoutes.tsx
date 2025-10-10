

import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Home from '../pages/Home';
import Perfil from '../pages/Perfil';
import Residuo from '../pages/Residuo';

import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota de Login */}
      <Route path="/login" element={<Login />} />
      {/* Rota de Cadastro */}
      <Route path="/cadastro" element={<Cadastro />} />
      {/* Rota Home */}
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/residuos" element={
        <ProtectedRoute>
          <Residuo />
        </ProtectedRoute>
      } />
      {/* Rota Perfil */}
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />
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
