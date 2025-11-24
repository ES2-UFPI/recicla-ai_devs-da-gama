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
import Inventario from '../pages/Inventario';
import Entregas from '../pages/Entregas';
import LocalizarReceptora from '../pages/LocalizarReceptora';
import RealizarEntrega from '../pages/RealizarEntrega';
import Ranking from '../pages/Ranking';
import Recompensas from '../pages/Recompensa';
import HistoricoResgateRecompensa from '../pages/HistoricoResgateRecompensa';
import Relatorio from '../pages/Relatorio';
import NotFound from '../pages/NotFound';

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
      {/* Rota Ranking */}
      <Route path="/ranking" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor']}>
            <Ranking />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Recompensas */}
      <Route path="/recompensas" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor']}>
            <Recompensas />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Histórico de Resgates */}
      <Route path="/recompensas/historico" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor']}>
            <HistoricoResgateRecompensa />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Relatório */}
      <Route path="/relatorio" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['produtor', 'receptor']}>
            <Relatorio />
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
      {/* Rota Inventário */}
      <Route path="/inventario" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <Inventario />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Entregas */}
      <Route path="/entregas" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <Entregas />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Localizar Receptora */}
      <Route path="/localizar-receptora" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <LocalizarReceptora />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      {/* Rota Realizar Entrega */}
      <Route path="/entrega/realizar/:id" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['coletor']}>
            <RealizarEntrega />
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

      {/* Rota 404 - Página não encontrada */}
      <Route path="*" element={<NotFound />} />

      {/* Redireciona rota raiz para login (ajuste conforme necessário) */}
      {/*<Route path="/" element={<Navigate to="/login" replace />} />*/}
    </Routes>
  );
}
