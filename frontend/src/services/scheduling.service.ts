import api from './api';
import type { Scheduling, SchedulingCreate, SchedulingUpdate } from '../types/scheduling';

export const schedulingService = {
  // Listar agendamentos do produtor autenticado
  async listMySchedulings(
    status?: string,
    skip = 0,
    limit = 100
  ): Promise<Scheduling[]> {
    const response = await api.get('/schedules/', {
      params: { status, skip, limit }
    });
    return response.data;
  },

  // Obter agendamento por ID
  async getById(id: string): Promise<Scheduling> {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  // Criar agendamento
  async create(data: SchedulingCreate): Promise<Scheduling> {
    const response = await api.post('/schedules/', data);
    return response.data;
  },

  // Atualizar agendamento
  async update(id: string, data: SchedulingUpdate): Promise<Scheduling> {
    const response = await api.patch(`/schedules/${id}`, data);
    return response.data;
  },

  // Atualizar status do agendamento
  async updateStatus(id: string, newStatus: string): Promise<Scheduling> {
    const response = await api.patch(`/schedules/${id}/status`, {
      status: newStatus
    });
    return response.data;
  },

  // Deletar agendamento
  async delete(id: string): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },

  // Listar agendamentos por resíduo
  async listByResidue(residueId: string): Promise<Scheduling[]> {
    const response = await api.get('/schedules/', {
      params: { residuoId: residueId }
    });
    return response.data;
  }
};
