import { useState } from 'react';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { Navbar } from '../../components/Navbar';
import recompensaService, { type Recompensa } from '../../services/recompensaService';
import { useResgates, useImageFallback } from './hooks';
import {
  HistoricoHeader,
  EmptyState,
  ResgatesTable,
  RecompensaDetailModal,
} from './components';

export default function HistoricoResgateRecompensa() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<Recompensa | null>(null);

  // Custom hooks
  const { resgates, recompensasMap, loading, error, setError } = useResgates(page, rowsPerPage);
  const { handleImageError, getImageUrl } = useImageFallback();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAbrirDetalhes = async (recompensaId: string) => {
    const recompensa = recompensasMap.get(recompensaId);
    if (recompensa) {
      setRecompensaSelecionada(recompensa);
    } else {
      // Se não estiver no map, buscar na API
      try {
        const data = await recompensaService.getRecompensa(recompensaId);
        setRecompensaSelecionada(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes da recompensa:', err);
        setError('Erro ao carregar detalhes da recompensa.');
      }
    }
  };

  const handleFecharDetalhes = () => {
    setRecompensaSelecionada(null);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <HistoricoHeader />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : resgates.length === 0 ? (
          <EmptyState />
        ) : (
          <ResgatesTable
            resgates={resgates}
            recompensasMap={recompensasMap}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onVerDetalhes={handleAbrirDetalhes}
          />
        )}

        <RecompensaDetailModal
          recompensa={recompensaSelecionada}
          open={!!recompensaSelecionada}
          onClose={handleFecharDetalhes}
          getImageUrl={getImageUrl}
          onImageError={handleImageError}
        />
      </Container>
    </>
  );
}
