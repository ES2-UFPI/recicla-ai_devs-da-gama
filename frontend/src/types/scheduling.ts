export interface DisponibilidadeSlot {
  data: string; // Formato: dd/mm/aaaa
  hora_inicio: string; // Formato: hh:mm
  hora_fim: string; // Formato: hh:mm
}

export interface LocalEndereco {
  address_id: number;
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  latitude?: string;
  longitude?: string;
}

export interface Scheduling {
  id: string;
  produtorId: string;
  residuosId: string[];
  disponibilidade: DisponibilidadeSlot[];
  local: LocalEndereco;
  status: 'pendente' | 'aceito' | 'cancelado' | 'coletado';
  observacoes?: string;
}

export interface SchedulingCreate {
  residuosId: string[];
  disponibilidade: DisponibilidadeSlot[];
  address_id: number;
  observacoes?: string;
}

export interface SchedulingUpdate {
  residuosId?: string[];
  disponibilidade?: DisponibilidadeSlot[];
  address_id?: number;
  observacoes?: string;
}
