// src/utils/biometrics.js
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';

// Claves para SecureStore
const REFRESH_TOKEN_KEY = 'sb_refresh_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'; // ✅ NUEVA

export async function deviceSupportsBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

export async function authenticateBiometric(promptMessage = 'Autenticación biométrica') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: true,
    cancelLabel: 'Cancelar',
  });
  return result.success;
}

// ✅ Guardar si biometría está activada
export async function saveBiometricEnabled(enabled) {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
}

// ✅ Leer si biometría está activada
export async function loadBiometricEnabled() {
  const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return val === "true";
}

export async function saveRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getSavedRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearSavedRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Inicia sesión con biometría 🚀
 */
export async function signInWithBiometrics() {
  const enabled = await loadBiometricEnabled();
  if (!enabled) {
    return { ok: false, error: 'Biometría no habilitada por el usuario.' };
  }

  const canUse = await deviceSupportsBiometrics();
  if (!canUse) {
    return { ok: false, error: 'El dispositivo no tiene biometría configurada.' };
  }

  const authed = await authenticateBiometric('Inicia sesión con tu huella');
  if (!authed) {
    return { ok: false, error: 'Autenticación cancelada o fallida.' };
  }

  const storedRefresh = await getSavedRefreshToken();
  if (!storedRefresh) {
    return { ok: false, error: 'No hay token biométrico guardado.' };
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: storedRefresh });
  if (error) {
    return { ok: false, error: error.message };
  }

  if (data?.session?.refresh_token && data.session.refresh_token !== storedRefresh) {
    await saveRefreshToken(data.session.refresh_token);
  }

  return { ok: true, session: data?.session };
}
