import api from './api';
import type { User, UserUpdate, Endereco } from '../types/user';

export const userService = {
  // Obter perfil do usuário autenticado
  async getMyProfile(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Atualizar perfil do usuário autenticado
  async updateMyProfile(data: UserUpdate): Promise<User> {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  // Listar endereços do usuário
  async getMyAddresses(): Promise<Endereco[]> {
    const response = await api.get('/users/me/addresses');
    return response.data;
  },

  // Adicionar endereço
  async addAddress(address: Omit<Endereco, 'id'>): Promise<{ message: string; id: number }> {
    const response = await api.post('/users/me/addresses', address);
    return response.data;
  },

  // Atualizar endereço
  async updateAddress(
    addressId: number,
    updates: Partial<Omit<Endereco, 'id'>>
  ): Promise<{ message: string }> {
    const response = await api.put(`/users/me/addresses/${addressId}`, updates);
    return response.data;
  },

  // Remover endereço
  async removeAddress(addressId: number): Promise<{ message: string }> {
    const response = await api.delete(`/users/me/addresses/${addressId}`);
    return response.data;
  },

  // Obter usuário por ID
  async getById(userId: string): Promise<User> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Obter usuário por email
  async getByEmail(email: string): Promise<User> {
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  }
};
