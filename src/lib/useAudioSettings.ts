import { useState, useEffect, useCallback } from 'react';
import type { AudioSettings } from './types';
import { DEFAULT_AUDIO_SETTINGS } from './types';

const STORAGE_KEY = 'descent-audio-settings';

function loadSettings(): AudioSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // 로컬 스토리지 접근 실패 시 기본값 사용
  }
  return DEFAULT_AUDIO_SETTINGS;
}

function saveSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패 무시
  }
}

export function useAudioSettings() {
  const [settings, setSettingsState] = useState<AudioSettings>(loadSettings);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((update: Partial<AudioSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...update }));
  }, []);

  const toggleMute = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettingsState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleCountdown = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, countdownEnabled: !prev.countdownEnabled }));
  }, []);

  const togglePhase = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, phaseEnabled: !prev.phaseEnabled }));
  }, []);

  const toggleComplete = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, completeEnabled: !prev.completeEnabled }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettingsState(DEFAULT_AUDIO_SETTINGS);
  }, []);

  return {
    settings,
    setSettings,
    toggleMute,
    setVolume,
    toggleCountdown,
    togglePhase,
    toggleComplete,
    resetToDefaults,
  };
}
