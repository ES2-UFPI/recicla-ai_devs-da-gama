/**
 * Utilitários para lidar com fusos horários (Timezone)
 * 
 * REGRA DE OURO:
 * - Backend: Sempre em UTC
 * - Cliente: Fuso local (America/Sao_Paulo para Brasil)
 * - Conversão: Cliente → UTC antes de enviar | UTC → Cliente ao receber
 */

const TIMEZONE_BRASIL = 'America/Sao_Paulo';

/**
 * Converte uma data/hora local do Brasil para UTC (formato ISO string)
 * Usado antes de enviar dados para o backend
 * 
 * @param localDate - Data local no formato Date object
 * @returns String ISO em UTC (ex: "2025-10-22T13:00:00.000Z")
 */
export function localToUTC(localDate: Date): string {
  return localDate.toISOString();
}

/**
 * Converte data (YYYY-MM-DD) e hora (HH:mm) locais para UTC ISO string
 * Usado ao enviar agendamentos para o backend
 * 
 * @param dateStr - Data no formato YYYY-MM-DD
 * @param timeStr - Hora no formato HH:mm
 * @returns String ISO em UTC
 * 
 * @example
 * // Usuario escolhe 22/10/2025 às 10:00 (horário de Brasília)
 * dateTimeToUTC('2025-10-22', '10:00') 
 * // Retorna: "2025-10-22T13:00:00.000Z" (UTC)
 */
export function dateTimeToUTC(dateStr: string, timeStr: string): string {
  // Criar data local com timezone de Brasília
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  // Criar Date em horário local do navegador
  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  
  return localDate.toISOString();
}

/**
 * Converte string UTC (do backend) para Date local
 * Usado ao receber dados do backend para exibição
 * 
 * @param utcString - String ISO em UTC (ex: "2025-10-22T13:00:00Z")
 * @returns Date object em horário local do navegador
 */
export function utcToLocal(utcString: string): Date {
  return new Date(utcString);
}

/**
 * Formata data UTC para string legível no horário do Brasil
 * 
 * @param utcString - String ISO em UTC
 * @param options - Opções de formatação (DateTimeFormat)
 * @returns String formatada no horário local (ex: "22/10/2025 10:00")
 */
export function formatUTCToLocalString(
  utcString: string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE_BRASIL,
  }
): string {
  const date = new Date(utcString);
  return date.toLocaleString('pt-BR', options);
}

/**
 * Formata Date local para string no formato YYYY-MM-DD
 * Útil para inputs de data
 * 
 * @param date - Date object
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata Date local para string no formato DD/MM/YYYY
 * 
 * @param date - Date object
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * Formata Date local para string de hora no formato HH:mm
 * 
 * @param date - Date object
 * @returns String no formato HH:mm
 */
export function formatTimeToHHMM(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * Converte DD/MM/YYYY para YYYY-MM-DD
 * 
 * @param ddmmyyyy - String no formato DD/MM/YYYY
 * @returns String no formato YYYY-MM-DD
 */
export function ddmmyyyyToYYYYMMDD(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Converte YYYY-MM-DD para DD/MM/YYYY
 * 
 * @param yyyymmdd - String no formato YYYY-MM-DD
 * @returns String no formato DD/MM/YYYY
 */
export function yyyymmddToDDMMYYYY(yyyymmdd: string): string {
  const [year, month, day] = yyyymmdd.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Obtém a data/hora atual no timezone do Brasil
 * 
 * @returns Date object
 */
export function getNowInBrazil(): Date {
  // Date() já retorna no timezone local do navegador
  return new Date();
}

/**
 * Obtém a data mínima válida (hoje) no timezone do Brasil
 * Útil para validações de data no frontend
 * 
 * @returns Date object representando 00:00:00 de hoje
 */
export function getTodayInBrazil(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
