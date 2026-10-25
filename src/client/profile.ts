import type { PublicProgress } from '../shared/progression';

export interface BallCrateReward { id: string; name: string; color: string; ability: string; }

const STORAGE_KEY = 'orbita-profile-token-v1';
let memoryToken: string | null = null;
let profile: PublicProgress | null = null;
let online = false;
let message = 'Ładowanie profilu…';

export function getProfileToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^[a-f0-9]{48}$/.test(stored)) { memoryToken = stored; return stored; }
    if (memoryToken) return memoryToken;
    if (!globalThis.crypto?.getRandomValues) return null;
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    memoryToken = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY, memoryToken);
    return memoryToken;
  } catch {
    if (memoryToken) return memoryToken;
    if (!globalThis.crypto?.getRandomValues) return null;
    memoryToken = [...crypto.getRandomValues(new Uint8Array(24))].map(value => value.toString(16).padStart(2, '0')).join('');
    return memoryToken;
  }
}

export function getCachedProgress() { return profile; }
export function isProfileOnline() { return online; }
export function getProfileMessage() { return message; }

function emit() { window.dispatchEvent(new CustomEvent('orbita-profile-updated')); }

async function request(type: 'load' | 'purchase' | 'equip' | 'open-crate', itemId?: string) {
  const token = getProfileToken();
  if (!token) throw new Error('Ta przeglądarka nie obsługuje bezpiecznego profilu.');
  const response = await fetch('/api/profile', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ type, token, ...(type === 'purchase' || type === 'equip' ? { cosmeticId: itemId } : {}) }),
  });
  const data = await response.json().catch(() => ({})) as { profile?: PublicProgress; error?: string; ball?: BallCrateReward };
  if (!response.ok || !data.profile) throw new Error(data.error || 'Zapis online jest niedostępny.');
  profile = data.profile; online = true; message = 'Profil zapisuje się online.'; emit();
  return { profile, ball: data.ball };
}

export async function refreshProfile() {
  try { return (await request('load')).profile; }
  catch (error) {
    online = false;
    message = error instanceof Error ? error.message : 'Zapis online jest niedostępny.';
    emit();
    throw error;
  }
}

export async function buyCosmetic(cosmeticId: string) { return (await request('purchase', cosmeticId)).profile; }
export async function equipCosmetic(cosmeticId: string) { return (await request('equip', cosmeticId)).profile; }
export async function openBallCrate() {
  const result = await request('open-crate');
  if (!result.ball) throw new Error('Skrzynka nie zwróciła kulki.');
  return { profile: result.profile, ball: result.ball };
}
