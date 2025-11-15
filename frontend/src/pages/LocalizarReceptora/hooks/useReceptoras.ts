/**
 * Hook useReceptoras
 * 
 * Gerencia o estado e operações relacionadas às receptoras.
 * Conectado com a API real através do entregaService.
 */

import { useState, useCallback } from 'react';
import { entregaService } from '../../../services/entrega.service';
import type { Receptora, BuscarReceptorasParams } from '../../../types/entrega';

// Hook exportado

export const useReceptoras = () => {
  const [receptoras, setReceptoras] = useState<Receptora[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarReceptorasProximas = useCallback(async (params: BuscarReceptorasParams) => {
    setLoading(true);
    setError(null);

    try {
      // Chamar a API real
      const resultado = await entregaService.buscarReceptorasProximas({
        latitude: params.latitude,
        longitude: params.longitude,
        raio: params.raio,
        materiais_aceitos: params.categorias_ids,
      });

      setReceptoras(resultado);
      return resultado;
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMsg = error?.response?.data?.detail || 
                       error?.message || 
                       'Erro ao buscar receptoras próximas';
      setError(errorMsg);
      console.error('Erro ao buscar receptoras:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarReceptoraPorId = useCallback(async (id: string): Promise<Receptora | null> => {
    setLoading(true);
    setError(null);

    try {
      // Por enquanto, busca todas e filtra por ID
      // Se houver um endpoint específico para buscar por ID, usar ele
      const todasReceptoras = receptoras.length > 0 
        ? receptoras 
        : await entregaService.buscarReceptorasProximas({
            latitude: -5.0892, // Localização default (Teresina)
            longitude: -42.8019,
            raio: 50, // Raio amplo para garantir que encontre
          });
      
      const receptora = todasReceptoras.find(r => r.id === id);
      return receptora || null;
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMsg = error?.response?.data?.detail || 
                       error?.message || 
                       'Erro ao buscar receptora';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [receptoras]);

  return {
    receptoras,
    loading,
    error,
    buscarReceptorasProximas,
    buscarReceptoraPorId,
  };
};
