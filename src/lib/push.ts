import { supabase } from './supabase';
import type { PushSubscriptionRecord } from './types';

// VAPID Public Key for Web Push (URL-Safe Base64)
export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BBkngqcybuSDlcdT_UuCZIsHJYq9Vbm1toZKy3Srgn2SkPfv48vNts_CRf8AZYmSBwFZjwQX9C-YiMQdNctW3H0';

// Convert a base64 string to a Uint8Array for PushManager
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Detect if Push Notifications & Service Worker are supported in current browser/OS
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Get the current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Prompt the user for notification permissions
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    console.log('[PUSH] permission request result:', permission);
    return permission;
  } catch (err) {
    console.error('[PUSH] Failed to request permission:', err);
    return Notification.permission;
  }
}

// Detect client device / browser details for user identification in settings
export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  return `${os} (${browser}${isStandalone ? ' PWA' : ''})`;
}

// Save or update subscription in Supabase push_subscriptions table
export async function saveSubscriptionToSupabase(
  subscription: PushSubscription,
  userId: string
): Promise<PushSubscriptionRecord | null> {
  try {
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      console.warn('[PUSH] Subscription missing keys, cannot store:', subJson);
      return null;
    }

    const payload = {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      device_info: getDeviceInfo(),
      updated_at: new Date().toISOString(),
    };

    console.log('[PUSH] Saving subscription to Supabase for user:', userId);

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[PUSH] Supabase push_subscriptions upsert error:', error);
      throw error;
    }

    console.log('[PUSH] subscribed successfully in DB');
    return data as PushSubscriptionRecord;
  } catch (err) {
    console.error('[PUSH] Failed saving subscription to Supabase:', err);
    throw err;
  }
}

// Subscribe the current user to Web Push
export async function subscribeUser(userId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked. Please allow them in your browser settings.'
        : 'Notification permission was not granted.'
    );
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    console.log('[PUSH] Creating new PushSubscription with VAPID key...');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  console.log('[PUSH] Active push subscription endpoint:', subscription.endpoint);
  await saveSubscriptionToSupabase(subscription, userId);
  return subscription;
}

// Unsubscribe the current device
export async function unsubscribeUser(userId: string): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      // Unsubscribe from browser PushManager
      const unsubscribed = await subscription.unsubscribe();
      console.log('[PUSH] Unsubscribed from browser:', unsubscribed);
      return unsubscribed;
    }
    return true;
  } catch (err) {
    console.error('[PUSH] Unsubscribe error:', err);
    throw err;
  }
}

// Trigger a real test notification that shows in 2 seconds
export async function sendTestNotification(delayMs: number = 2000): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications are not supported in this browser.');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission is not granted.');
  }

  const registration = await navigator.serviceWorker.ready;

  setTimeout(async () => {
    try {
      await registration.showNotification('HealthDesk Test Reminder 🩺', {
        body: 'Your push notifications and alerts are working perfectly!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'healthdesk-test-notification',
        requireInteraction: true,
        data: {
          url: '/planner',
          type: 'test',
        },
        actions: [
          { action: 'done', title: 'Got It' },
          { action: 'snooze', title: 'Snooze' },
        ],
      });
      console.log('[PUSH] sent test notification successfully');
    } catch (err) {
      console.error('[PUSH] Error showing test notification:', err);
      // Fallback to standard Notification API
      try {
        new Notification('HealthDesk Test Reminder 🩺', {
          body: 'Your push notifications are active!',
          icon: '/icon-192.png',
        });
      } catch (e) {
        console.error('[PUSH] Fallback notification also failed:', e);
      }
    }
  }, delayMs);
}

// Preferences storage helpers
export function getNotificationSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem('healthdesk_sound_enabled');
  return val === null ? true : val === 'true';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('healthdesk_sound_enabled', enabled ? 'true' : 'false');
  }
}

export function getNotificationVibrationEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem('healthdesk_vibration_enabled');
  return val === null ? true : val === 'true';
}

export function setNotificationVibrationEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('healthdesk_vibration_enabled', enabled ? 'true' : 'false');
  }
}
