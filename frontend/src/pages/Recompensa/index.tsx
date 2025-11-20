import { useState, useEffect } from 'react';
import { Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import recompensaService, { type Recompensa } from '../../services/recompensaService';
import { ITEMS_PER_PAGE } from './constants';
import { useRecompensas, useImageFallback, useRecompensaFilters } from './hooks';
import {
  RecompensaHeader,
  RecompensaFilters,
  RecompensaGrid,
  RecompensaDetailModal,
  SuccessModal,
} from './components';
import type { ResgateInfo } from './types';

export default function Recompensas() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Estados locais
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<Recompensa | null>(null);
  const [resgatando, setResgatando] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [resgateInfo, setResgateInfo] = useState<ResgateInfo | null>(null);

  // Custom hooks
  const { recompensas, loading, error, setError, refetch } = useRecompensas();
  const { handleImageError, getImageUrl } = useImageFallback();
  const {
    recompensasFiltradas,
    tipoFiltro,
    setTipoFiltro,
    ordenacao,
    setOrdenacao,
    shouldResetPage,
  } = useRecompensaFilters(recompensas);

  const userPoints = user?.points || 0;

  // Resetar página quando filtros mudarem
  useEffect(() => {
    if (shouldResetPage) {
      setPaginaAtual(1);
    }
  }, [shouldResetPage]);

  // Paginação
  const totalPaginas = Math.ceil(recompensasFiltradas.length / ITEMS_PER_PAGE);
  const recompensasPaginadas = recompensasFiltradas.slice(
    (paginaAtual - 1) * ITEMS_PER_PAGE,
    paginaAtual * ITEMS_PER_PAGE
  );

  const handleChangePagina = (_: React.ChangeEvent<unknown>, value: number) => {
    setPaginaAtual(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbrirModal = (recompensa: Recompensa) => {
    setRecompensaSelecionada(recompensa);
  };

  const handleFecharModal = () => {
    setRecompensaSelecionada(null);
  };

  const handleResgatar = async () => {
    if (!recompensaSelecionada) return;

    setResgatando(true);
    setError(null);

    try {
      await recompensaService.resgatarRecompensa(recompensaSelecionada.id);
      
      setResgateInfo({
        nome: recompensaSelecionada.nome,
        pontos: recompensaSelecionada.pontos_necessarios
      });
      
      await refreshUser();
      await refetch();
      
      handleFecharModal();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Erro ao resgatar recompensa:', err);
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail 
        || 'Erro ao resgatar recompensa. Tente novamente.';
      setError(errorMessage);
    } finally {
      setResgatando(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <RecompensaHeader userPoints={userPoints} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <RecompensaFilters
          tipoFiltro={tipoFiltro}
          onTipoChange={setTipoFiltro}
          ordenacao={ordenacao}
          onOrdenacaoChange={setOrdenacao}
          totalResultados={recompensasFiltradas.length}
        />

        <RecompensaGrid
          recompensas={recompensasPaginadas}
          loading={loading}
          userPoints={userPoints}
          getImageUrl={getImageUrl}
          onImageError={handleImageError}
          onVerDetalhes={handleAbrirModal}
          currentPage={paginaAtual}
          totalPages={totalPaginas}
          onPageChange={handleChangePagina}
        />

        <RecompensaDetailModal
          recompensa={recompensaSelecionada}
          open={!!recompensaSelecionada}
          onClose={handleFecharModal}
          onResgatar={handleResgatar}
          onNavigateToResiduos={() => {
            handleFecharModal();
            navigate('/residuos');
          }}
          resgatando={resgatando}
          userPoints={userPoints}
          getImageUrl={getImageUrl}
          onImageError={handleImageError}
        />

        <SuccessModal
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          resgateInfo={resgateInfo}
          userPoints={userPoints}
        />
      </Container>
    </>
  );
}
