/**
 * Utilitários para gestão de convites familiares e integração com WhatsApp
 */

export interface DecodedInvite {
  isValid: boolean;
  isExpired: boolean;
  accId?: string;
  accName?: string;
  ownerId?: string;
  ownerName?: string;
  phone?: string;
  invitedName?: string;
  expiresAt?: Date;
}

/**
 * Gera um token de convite autônomo (stateless/self-contained),
 * permitindo que qualquer dispositivo decodifique a conta familiar e o remetente sem depender do storage local do dispositivo emissor.
 */
export function generateInviteToken(payload: {
  accId: string;
  accName: string;
  ownerId: string;
  ownerName: string;
  phone?: string;
  invitedName?: string;
  expiresInDays?: number;
}): string {
  const expiresAt = Date.now() + (payload.expiresInDays || 14) * 24 * 60 * 60 * 1000;
  const data = {
    aid: payload.accId,
    anm: payload.accName,
    oid: payload.ownerId,
    onm: payload.ownerName,
    ph: payload.phone || '',
    inm: payload.invitedName || '',
    iat: Date.now(),
    exp: expiresAt
  };
  const json = JSON.stringify(data);
  const b64 = typeof window !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json).toString('base64');
  const safeToken = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `inv_${safeToken}`;
}

/**
 * Decodifica e valida o token de convite recebido via link WhatsApp
 */
export function decodeInviteToken(token: string): DecodedInvite {
  try {
    if (!token || !token.startsWith('inv_')) {
      return { isValid: false, isExpired: false };
    }
    const raw = token.slice(4);
    let b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(escape(atob(b64)))
      : Buffer.from(b64, 'base64').toString('utf-8');
    const data = JSON.parse(json);

    if (!data.aid || !data.anm || !data.exp) {
      return { isValid: false, isExpired: false };
    }

    const isExpired = Date.now() > Number(data.exp);

    return {
      isValid: true,
      isExpired,
      accId: data.aid,
      accName: data.anm,
      ownerId: data.oid,
      ownerName: data.onm,
      phone: data.ph,
      invitedName: data.inm,
      expiresAt: new Date(data.exp)
    };
  } catch {
    return { isValid: false, isExpired: false };
  }
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
