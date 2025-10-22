import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Categoria {
  id: string;
  tipo: string;
  descricao: string;
  preco_por_kg: number;
  preco_por_unidade?: number;
  ativo: boolean;
}

export const useCategorias = () => {
  const [categorias, setCategorias] = useState<Map<string, Categoria>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Categoria[]>('/categorias/ativas');
        const categoriasMap = new Map<string, Categoria>();
        response.data.forEach((cat) => {
          categoriasMap.set(cat.id, cat);
        });
        setCategorias(categoriasMap);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar categorias';
        setError(errorMsg);
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  const getCategoriaById = (id: string): Categoria | undefined => {
    return categorias.get(id);
  };

  return {
    categorias,
    loading,
    error,
    getCategoriaById,
  };
};
