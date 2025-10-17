import api from './api';
import type { Categoria } from '../types/categoria';

export const categoriaService = {
  // Listar categorias ativas (público)
  async listActive(): Promise<Categoria[]> {
    const response = await api.get('/categorias/ativas');
    return response.data;
  },

  // Obter categoria por ID
  async getById(id: string): Promise<Categoria> {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  // Listar todas as categorias (admin)
  async listAll(): Promise<Categoria[]> {
    const response = await api.get('/categorias/');
    return response.data;
  }
};
