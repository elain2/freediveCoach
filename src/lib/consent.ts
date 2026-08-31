const CONSENT_KEY = 'descent:thirdPartyConsent';

export interface ConsentData {
  agreedAt: number;
  version: string;
}

const CURRENT_VERSION = '1.0';

export function hasConsented(): boolean {
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return false;
  try {
    const data: ConsentData = JSON.parse(raw);
    return data.version === CURRENT_VERSION;
  } catch {
    return false;
  }
}

export function saveConsent(): void {
  const data: ConsentData = {
    agreedAt: Date.now(),
    version: CURRENT_VERSION,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}

export function revokeConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
}
