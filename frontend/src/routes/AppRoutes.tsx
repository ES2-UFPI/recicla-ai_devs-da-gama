import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Home from '../pages/Home';
import Perfil from '../pages/Perfil';
import Residuo from '../pages/Residuo';
import { Agendamento } from '../pages/Agendamento';
import LocalizarColeta from '../pages/LocalizarColeta';
import Coleta from '../pages/Coleta';
//import ColetaAtiva from '../pages/ColetaAtiva';
import ColetaDetalhes from '../pages/ColetaDetalhes';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas - Redireciona para home se já autenticado */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/cadastro" element={
        <PublicRoute>
          <Cadastro />
        </PublicRoute>
      } />
      {/* Rota Home */}
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />

      <Route path="/residuos" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor']}>
            <Residuo />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/agendamentos" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor']}>
            <Agendamento />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Perfil */}
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />
      {/* Rota Localizar Coleta */}
      <Route path="/localizar-coleta" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <LocalizarColeta />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/coletas" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <Coleta />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Coleta Detalhes (substitui ColetaAtiva) */}
      <Route path="/coleta/:id" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <ColetaDetalhes />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Coleta Ativa (mantida temporariamente para compatibilidade) 
      <Route path="/coleta-ativa" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <ColetaAtiva />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />*/}
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
