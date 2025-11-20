import { useState, useEffect } from 'react';
import recompensaService, { type ResgateResponse, type Recompensa } from '../../../services/recompensaService';

export function useResgates(page: number, rowsPerPage: number) {
  const [resgates, setResgates] = useState<ResgateResponse[]>([]);
  const [recompensasMap, setRecompensasMap] = useState<Map<string, Recompensa>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResgates = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await recompensaService.getMeusResgates({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        });
        setResgates(data);

        // Buscar dados das recompensas
        const recompensasIds = [...new Set(data.map(r => r.recompensa_id))];
        const recompensasData = await Promise.allSettled(
          recompensasIds.map(id => recompensaService.getRecompensa(id))
        );

        const newMap = new Map<string, Recompensa>();
        recompensasData.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            newMap.set(recompensasIds[index], result.value);
          }
        });
        setRecompensasMap(newMap);
      } catch (err) {
        console.error('Erro ao carregar histórico de resgates:', err);
        setError('Erro ao carregar histórico de resgates. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchResgates();
  }, [page, rowsPerPage]);

  return {
    resgates,
    recompensasMap,
    loading,
    error,
    setError,
  };
}
