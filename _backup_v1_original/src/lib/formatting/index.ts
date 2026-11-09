// ============================================================================
// THE DRK WEDDINGS — INDIAN RUPEE (INR), DD/MM/YYYY (Asia/Kolkata) & HELPERS
// ============================================================================

import type { EventRecord, SchedulingConflict, TeamMemberRecord } from '../../types/crm';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

/**
 * Formats numbers in Indian Rupees (e.g., ₹1,50,000)
 */
export function formatINR(amount: number | undefined | null): string {
  const safe = Number(amount || 0);
  return inrFormatter.format(safe);
}

/**
 * Formats large Indian Rupee figures cleanly for chart axes or compact badges
 */
export function formatINRCompact(amount: number | undefined | null): string {
  const safe = Number(amount || 0);
  if (Math.abs(safe) >= 10000000) {
    return `₹${inrCompactFormatter.format(safe / 10000000)} Cr`;
  }
  if (Math.abs(safe) >= 100000) {
    return `₹${inrCompactFormatter.format(safe / 100000)} L`;
  }
  return inrFormatter.format(safe);
}

/**
 * Returns today's date string in YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getTodayKolkataISO(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
    const m = parts.find((p) => p.type === 'month')?.value ?? '11';
    const d = parts.find((p) => p.type === 'day')?.value ?? '03';
    return `${y}-${m}-${d}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Formats any ISO date or YYYY-MM-DD string strictly as DD/MM/YYYY in Asia/Kolkata timezone
 */
export function formatDateDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
  } catch {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}

/**
 * Formats timestamp as DD/MM/YYYY, HH:mm IST
 */
export function formatDateTimeIST(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return formatDateDDMMYYYY(dateStr);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(parsed);
  } catch {
    return formatDateDDMMYYYY(dateStr);
  }
}

/**
 * Checks if a YYYY-MM-DD date is before today (overdue)
 */
export function isDateOverdue(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const clean = dateStr.split('T')[0];
  const today = getTodayKolkataISO();
  return clean < today;
}

/**
 * Returns number of days from today to target YYYY-MM-DD (negative if past)
 */
export function daysUntilDate(dateStr: string | undefined | null): number {
  if (!dateStr) return 999;
  const clean = dateStr.split('T')[0];
  const today = getTodayKolkataISO();
  const d1 = new Date(`${today}T00:00:00`);
  const d2 = new Date(`${clean}T00:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Normalizes Indian phone numbers for WhatsApp wa.me links (e.g., 919934504101)
 */
export function normalizeWhatsAppPhone(phone: string | undefined | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '919934504101';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Builds a pre-filled WhatsApp click-to-chat URL
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Interpolates {{variables}} in WhatsApp message templates
 */
export function interpolateTemplate(
  templateText: string,
  variables: Record<string, string | number | undefined>
): string {
  return templateText.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variables[key];
    return val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : `[${key}]`;
  });
}

/**
 * Detects time overlap between two HH:mm time ranges on the same date
 */
function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
    return h * 60 + m;
  };
  let sA = toMinutes(startA);
  let eA = toMinutes(endA);
  let sB = toMinutes(startB);
  let eB = toMinutes(endB);
  // Handle late-night wedding ceremonies crossing midnight (e.g., 19:00 to 02:00)
  if (eA <= sA) eA += 24 * 60;
  if (eB <= sB) eB += 24 * 60;
  return sA < eB && sB < eA;
}

/**
 * Detects double-booking conflicts for photographers & cinematographers on a given event date/time
 */
export function detectEventConflicts(
  candidate: {
    id?: string;
    event_date: string;
    start_time: string;
    end_time: string;
    assigned_photographers: string[];
    assigned_cinematographers: string[];
  },
  existingEvents: EventRecord[],
  teamMembers: TeamMemberRecord[]
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];
  const candidateStaffIds = Array.from(
    new Set([...(candidate.assigned_photographers || []), ...(candidate.assigned_cinematographers || [])])
  );

  if (!candidate.event_date || candidateStaffIds.length === 0) {
    return conflicts;
  }

  for (const ev of existingEvents) {
    if (candidate.id && ev.id === candidate.id) continue;
    if (ev.completion_status === 'Cancelled') continue;
    if (ev.event_date !== candidate.event_date) continue;

    if (!timesOverlap(candidate.start_time, candidate.end_time, ev.start_time, ev.end_time)) {
      continue;
    }

    const evStaff = new Set([...(ev.assigned_photographers || []), ...(ev.assigned_cinematographers || [])]);
    for (const memberId of candidateStaffIds) {
      if (evStaff.has(memberId)) {
        const member = teamMembers.find((m) => m.id === memberId);
        conflicts.push({
          team_member_id: memberId,
          team_member_name: member?.full_name ?? 'Team Member',
          role: member?.role ?? 'Photographer',
          conflicting_event_id: ev.id,
          conflicting_event_name: ev.event_name,
          conflicting_client_name: ev.client_name,
          event_date: ev.event_date,
          start_time: ev.start_time,
          end_time: ev.end_time,
        });
      }
    }
  }

  return conflicts;
}
