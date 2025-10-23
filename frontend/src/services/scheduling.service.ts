import api from './api';
import type { Scheduling, SchedulingCreate, SchedulingUpdate } from '../types/scheduling';

// Normaliza objetos vindos da API:
// - Garante que "id" exista (mapeando de "_id" quando necessário)
// - Converte status para minúsculas para alinhar com o tipo do frontend
function normalizeScheduling(obj: unknown): Scheduling {
  const o = obj as Record<string, unknown>;
  const id = (o?.id as string) ?? (o?._id as string);
  const status = String(o?.status ?? '').toLowerCase();
  return {
    ...(o as object),
    id,
    status,
  } as Scheduling;
}

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
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeScheduling);
  },

  // Obter agendamento por ID
  async getById(id: string): Promise<Scheduling> {
    const response = await api.get(`/schedules/${id}`);
    return normalizeScheduling(response.data);
  },

  // Criar agendamento
  async create(data: SchedulingCreate): Promise<Scheduling> {
    const response = await api.post('/schedules/', data);
    return normalizeScheduling(response.data);
  },

  // Atualizar agendamento
  async update(id: string, data: SchedulingUpdate): Promise<Scheduling> {
    const response = await api.patch(`/schedules/${id}`, data);
    return normalizeScheduling(response.data);
  },

  // Atualizar status do agendamento
  async updateStatus(id: string, newStatus: string): Promise<Scheduling> {
    const response = await api.patch(`/schedules/${id}/status`, {
      status: newStatus
    });
    return normalizeScheduling(response.data);
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
