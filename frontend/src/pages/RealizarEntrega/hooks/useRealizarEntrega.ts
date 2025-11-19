/**
 * Hook customizado para gerenciar a lógica de realizar entrega
 * 
 * Responsabilidades:
 * - Buscar dados da receptora
 * - Buscar inventory do coletor
 * - Filtrar e agrupar resíduos por categoria
 * - Gerenciar seleção de categorias
 * - Submeter entrega
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { entregaService } from '../../../services/entrega.service';
import type { ResiduoInventory, ReceptoraInfo, CategoriaAgrupada, EntregaFormData } from '../types';
import type { Categoria } from '../../../types/categoria';

interface UseRealizarEntregaParams {
  receptoraId: string;
}

interface UseRealizarEntregaReturn {
  // Dados
  receptora: ReceptoraInfo | null;
  categoriasAgrupadas: CategoriaAgrupada[];
  categoriasSelecionadas: Set<string>;
  observacoes: string;
  
  // Estados
  loading: boolean;
  submitting: boolean;
  error: string | null;
  success: boolean;
  
  // Ações
  toggleCategoria: (categoriaId: string) => void;
  setObservacoes: (value: string) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
  getCategoriaById: (id: string) => Categoria | undefined;
  
  // Computados
  totalSelecionado: {
    categorias: number;
    residuos: number;
    kg: number;
    unidades: number;
  };
}

export const useRealizarEntrega = ({ receptoraId }: UseRealizarEntregaParams): UseRealizarEntregaReturn => {
  const navigate = useNavigate();
  
  // Estados principais
  const [receptora, setReceptora] = useState<ReceptoraInfo | null>(null);
  const [inventory, setInventory] = useState<ResiduoInventory[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Set<string>>(new Set());
  const [observacoes, setObservacoes] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Buscar dados iniciais (receptora e inventory)
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar categorias primeiro
        const responseCategorias = await api.get<Categoria[]>('/categorias/ativas');
        setCategorias(responseCategorias.data);

        // Buscar receptora via nova rota dedicada de entregas
        const responseReceptora = await api.get<ReceptoraInfo>(`/entregas/receptora-info/${receptoraId}`);
        setReceptora(responseReceptora.data);

        // Buscar inventory do coletor
        const responseInventory = await api.get<ResiduoInventory[]>('/coletas/inventory/me');
        
        // Converter nomes de materiais aceitos para IDs de categorias
        const materiaisAceitosNomes = responseReceptora.data.accepted_material || [];
        const materiaisAceitosIds = responseCategorias.data
          .filter(cat => materiaisAceitosNomes.includes(cat.tipo))
          .map(cat => cat.id);
        
        // Filtrar apenas resíduos que a receptora aceita
        const residuosFiltrados = responseInventory.data.filter((residuo) =>
          materiaisAceitosIds.includes(residuo.categoriaId)
        );
        
        setInventory(residuosFiltrados);
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar informações. Tente novamente.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (receptoraId) {
      fetchData();
    }
  }, [receptoraId]);

  /**
   * Agrupar resíduos por categoria
   */
  const categoriasAgrupadas = useMemo((): CategoriaAgrupada[] => {
    const grupos = new Map<string, CategoriaAgrupada>();

    inventory.forEach((residuo) => {
      if (!grupos.has(residuo.categoriaId)) {
        grupos.set(residuo.categoriaId, {
          categoriaId: residuo.categoriaId,
          categoriaNome: '', // Será preenchido pelo componente com getCategoriaById
          residuos: [],
          totalKg: 0,
          totalUnidades: 0,
          quantidadeResiduos: 0,
        });
      }

      const grupo = grupos.get(residuo.categoriaId)!;
      grupo.residuos.push(residuo);
      grupo.quantidadeResiduos++;

      if (residuo.tipo_medida === 'kg') {
        grupo.totalKg += residuo.quantidade;
      } else {
        grupo.totalUnidades += residuo.quantidade;
      }
    });

    return Array.from(grupos.values());
  }, [inventory]);

  /**
   * Toggle seleção de categoria (seleciona/desseleciona todos os resíduos da categoria)
   */
  const toggleCategoria = useCallback((categoriaId: string) => {
    setCategoriasSelecionadas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoriaId)) {
        newSet.delete(categoriaId);
      } else {
        newSet.add(categoriaId);
      }
      return newSet;
    });
  }, []);

  /**
   * Calcular totais selecionados
   */
  const totalSelecionado = useMemo(() => {
    const categoriasSel = categoriasAgrupadas.filter((cat) => 
      categoriasSelecionadas.has(cat.categoriaId)
    );

    return {
      categorias: categoriasSel.length,
      residuos: categoriasSel.reduce((acc, cat) => acc + cat.quantidadeResiduos, 0),
      kg: categoriasSel.reduce((acc, cat) => acc + cat.totalKg, 0),
      unidades: categoriasSel.reduce((acc, cat) => acc + cat.totalUnidades, 0),
    };
  }, [categoriasAgrupadas, categoriasSelecionadas]);

  /**
   * Obter todos os IDs de resíduos das categorias selecionadas
   */
  const getResiduosIdsSelecionados = useCallback((): string[] => {
    const residuosIds: string[] = [];
    
    categoriasAgrupadas.forEach((categoria) => {
      if (categoriasSelecionadas.has(categoria.categoriaId)) {
        categoria.residuos.forEach((residuo) => {
          residuosIds.push(residuo.id);
        });
      }
    });

    return residuosIds;
  }, [categoriasAgrupadas, categoriasSelecionadas]);

  /**
   * Submeter entrega
   */
  const handleSubmit = useCallback(async () => {
    if (categoriasSelecionadas.size === 0) {
      setError('Selecione pelo menos uma categoria de resíduo para entregar.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const residuosIds = getResiduosIdsSelecionados();
      
      const entregaData: EntregaFormData = {
        receptora_id: receptoraId,
        residuos_id: residuosIds,
        observacoes: observacoes.trim() || undefined,
      };

      await entregaService.criarEntrega(entregaData);
      setSuccess(true);
      
      // Redirecionar após 2.5 segundos
      setTimeout(() => {
        navigate('/dashboard-coletor');
      }, 2500);
    } catch (err: any) {
      console.error('Erro ao realizar entrega:', err);
      const errorMessage = err?.response?.data?.detail || 'Erro ao realizar entrega. Verifique os dados e tente novamente.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [categoriasSelecionadas, observacoes, receptoraId, getResiduosIdsSelecionados, navigate]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Buscar categoria por ID
   */
  const getCategoriaById = useCallback((id: string): Categoria | undefined => {
    return categorias.find(cat => cat.id === id);
  }, [categorias]);

  return {
    // Dados
    receptora,
    categoriasAgrupadas,
    categoriasSelecionadas,
    observacoes,
    
    // Estados
    loading,
    submitting,
    error,
    success,
    
    // Ações
    toggleCategoria,
    setObservacoes,
    handleSubmit,
    clearError,
    getCategoriaById,
    
    // Computados
    totalSelecionado,
  };
};
