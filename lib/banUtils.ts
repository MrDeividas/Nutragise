import { supabase } from './supabase';

export type BanStatus = {
  banned: boolean;
  forever: boolean;
  expiresAt: Date | null;
  reason: string | null;
  message: string;
};

function isInfinityTimestamp(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes('infinity') || value.startsWith('9999');
}

export function formatBanStatus(banExpiresAt?: string | null, banReason?: string | null): BanStatus {
  if (!banExpiresAt) {
    return {
      banned: false,
      forever: false,
      expiresAt: null,
      reason: null,
      message: '',
    };
  }

  if (isInfinityTimestamp(banExpiresAt)) {
    return {
      banned: true,
      forever: true,
      expiresAt: null,
      reason: banReason || null,
      message: banReason
        ? `Your account has been permanently banned. Reason: ${banReason}`
        : 'Your account has been permanently banned.',
    };
  }

  const expiresAt = new Date(banExpiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return {
      banned: false,
      forever: false,
      expiresAt: null,
      reason: null,
      message: '',
    };
  }

  const when = expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    banned: true,
    forever: false,
    expiresAt,
    reason: banReason || null,
    message: banReason
      ? `Your account is banned until ${when}. Reason: ${banReason}`
      : `Your account is banned until ${when}.`,
  };
}

export async function getUserBanStatus(userId: string): Promise<BanStatus> {
  const { data, error } = await supabase
    .from('profiles')
    .select('ban_expires_at, ban_reason')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return formatBanStatus(null, null);
  }

  return formatBanStatus(data.ban_expires_at, data.ban_reason);
}
