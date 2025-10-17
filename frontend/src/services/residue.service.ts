import api from './api';
import type { Residue, ResidueCreate, ResidueUpdate } from '../types/residue';

export const residueService = {
  // Listar resíduos do produtor autenticado
  async listMyResidues(skip = 0, limit = 100): Promise<Residue[]> {
    const response = await api.get('/residuos/meus-residuos', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Listar apenas resíduos pendentes (disponíveis para agendamento)
  async listPendingResidues(): Promise<Residue[]> {
    const response = await api.get('/residuos/meus-residuos', {
      params: { skip: 0, limit: 500 }
    });
    // Filtrar apenas os resíduos com status DISPONIVEL
    return response.data.filter((residue: Residue) => residue.status === 'DISPONIVEL');
  },

  // Obter resíduo por ID
  async getById(id: string): Promise<Residue> {
    const response = await api.get(`/residuos/${id}`);
    return response.data;
  },

  // Criar resíduo
  async create(data: ResidueCreate): Promise<Residue> {
    const response = await api.post('/residuos/', data);
    return response.data;
  },

  // Atualizar resíduo
  async update(id: string, data: ResidueUpdate): Promise<Residue> {
    const response = await api.put(`/residuos/${id}`, data);
    return response.data;
  },

  // Deletar resíduo
  async delete(id: string): Promise<void> {
    await api.delete(`/residuos/${id}`);
  },

  // Buscar resíduos por categoria
  async listByCategory(categoryId: string): Promise<Residue[]> {
    const response = await api.get('/residuos/', {
      params: { categoriaId: categoryId }
    });
    return response.data;
  }
};
