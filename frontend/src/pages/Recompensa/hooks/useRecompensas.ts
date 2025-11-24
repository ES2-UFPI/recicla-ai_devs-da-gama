import { useState, useEffect } from 'react';
import recompensaService, { type Recompensa } from '../../../services/recompensaService';

export function useRecompensas() {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecompensas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await recompensaService.getRecompensasAtivas({ com_estoque: true });
      setRecompensas(data);
    } catch (err) {
      console.error('Erro ao carregar recompensas:', err);
      setError('Erro ao carregar recompensas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecompensas();
  }, []);

  return {
    recompensas,
    loading,
    error,
    setError,
    refetch: fetchRecompensas,
  };
}
