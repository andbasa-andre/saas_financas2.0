/**
 * Utilitários para gestão de convites familiares e integração com WhatsApp
 */

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'inv_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function cleanPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function createWhatsAppShareUrl(
  phone: string,
  inviteUrl: string,
  accountName: string,
  invitedName?: string
): string {
  const rawDigits = cleanPhoneDigits(phone);
  // Garante o código de país (55 para Brasil se 10 ou 11 dígitos)
  const fullPhone = rawDigits.length <= 11 ? `55${rawDigits}` : rawDigits;

  const greeting = invitedName ? `Olá, ${invitedName}!` : 'Olá!';
  const message = `${greeting}\n\nEstou te convidando para participar da nossa conta financeira familiar ("${accountName}").\n\nClique no link abaixo para aceitar o convite e acessar os dados compartilhados da nossa conta:\n\n${inviteUrl}`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export function formatPhoneBR(phone: string): string {
  const digits = cleanPhoneDigits(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
