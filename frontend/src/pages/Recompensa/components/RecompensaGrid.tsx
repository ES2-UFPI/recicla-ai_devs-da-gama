import { Box, Grid, CircularProgress, Alert, Pagination, useMediaQuery, useTheme } from '@mui/material';
import { RecompensaCard } from './RecompensaCard';
import type { Recompensa } from '../../../services/recompensaService';

interface RecompensaGridProps {
  recompensas: Recompensa[];
  loading: boolean;
  userPoints: number;
  getImageUrl: (recompensa: Recompensa) => string;
  onImageError: (id: string) => void;
  onVerDetalhes: (recompensa: Recompensa) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (_: React.ChangeEvent<unknown>, page: number) => void;
}

export function RecompensaGrid({
  recompensas,
  loading,
  userPoints,
  getImageUrl,
  onImageError,
  onVerDetalhes,
  currentPage,
  totalPages,
  onPageChange,
}: RecompensaGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (recompensas.length === 0) {
    return (
      <Alert severity="info">
        Nenhuma recompensa disponível no momento.
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {recompensas.map((recompensa) => {
          const podResgatar = userPoints >= recompensa.pontos_necessarios;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recompensa.id}>
              <RecompensaCard
                recompensa={recompensa}
                imageUrl={getImageUrl(recompensa)}
                onImageError={onImageError}
                podResgatar={podResgatar}
                onVerDetalhes={() => onVerDetalhes(recompensa)}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={onPageChange}
            color="primary"
            size={isMobile ? 'small' : 'large'}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
}
