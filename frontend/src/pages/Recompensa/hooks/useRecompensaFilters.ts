import { useState, useEffect, useRef } from 'react';
import type { Recompensa } from '../../../services/recompensaService';
import type { TipoRecompensa, OrdenacaoPontos } from '../types';

interface UseRecompensaFiltersReturn {
  recompensasFiltradas: Recompensa[];
  tipoFiltro: TipoRecompensa;
  setTipoFiltro: (tipo: TipoRecompensa) => void;
  ordenacao: OrdenacaoPontos;
  setOrdenacao: (ordenacao: OrdenacaoPontos) => void;
  shouldResetPage: boolean;
}

export function useRecompensaFilters(
  recompensas: Recompensa[]
): UseRecompensaFiltersReturn {
  const [recompensasFiltradas, setRecompensasFiltradas] = useState<Recompensa[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<TipoRecompensa>('todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPontos>('menor');
  const [shouldResetPage, setShouldResetPage] = useState(false);
  const prevFiltersRef = useRef({ tipoFiltro, ordenacao });

  useEffect(() => {
    let filtered = [...recompensas];

    // Filtrar por tipo
    if (tipoFiltro !== 'todos') {
      filtered = filtered.filter((r) => r.tipo === tipoFiltro);
    }

    // Ordenar por pontos
    filtered.sort((a, b) => {
      if (ordenacao === 'menor') {
        return a.pontos_necessarios - b.pontos_necessarios;
      }
      return b.pontos_necessarios - a.pontos_necessarios;
    });

    setRecompensasFiltradas(filtered);

    // Verificar se os filtros mudaram (não incluir recompensas)
    if (
      prevFiltersRef.current.tipoFiltro !== tipoFiltro ||
      prevFiltersRef.current.ordenacao !== ordenacao
    ) {
      setShouldResetPage(true);
      prevFiltersRef.current = { tipoFiltro, ordenacao };
    } else {
      setShouldResetPage(false);
    }
  }, [recompensas, tipoFiltro, ordenacao]);

  return {
    recompensasFiltradas,
    tipoFiltro,
    setTipoFiltro,
    ordenacao,
    setOrdenacao,
    shouldResetPage,
  };
}
