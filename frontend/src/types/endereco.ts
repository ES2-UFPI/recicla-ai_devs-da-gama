/**
 * Interface de Endereço baseada no modelo do backend
 * Corresponde ao modelo Endereco do backend (user.py e user_schema.py)
 */
export interface Endereco {
  apelido: string; // Ex: 'Casa', 'Trabalho'
  cep: string; // Ex: '12345-678'
  logradouro: string; // Ex: 'Rua A'
  numero: string; // Ex: '123'
  latitude: string; // Ex: '-23.5505'
  longitude: string; // Ex: '-46.6333'
  complemento?: string; // Ex: 'Apto 101'
}
