export interface Endereco {
  id?: number;
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  latitude: string;
  longitude: string;
  complemento?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  addresses?: Endereco[];
  cidade_id: string;
  estado_id: string;
}

export interface UserCreate {
  name: string;
  email: string;
  phone: string;
  password: string;
  role_id: string;
  addresses?: Endereco[];
  cidade_id: string;
  estado_id: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role_id?: string;
  addresses?: Endereco[];
  cidade_id?: string;
  estado_id?: string;
}
