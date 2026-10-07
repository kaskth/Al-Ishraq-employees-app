import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { ref } from 'vue';
import { Notify } from 'quasar';
import { SERVER_STATIC_ROOT } from '../utils/media';

export interface UpdateManifest {
  version: string;
  buildNumber?: number;
  bundleUrl: string;
  checksum?: string;
  mandatory?: boolean;
  notes?: string;
  minAppVersion?: string;
}

export const isCheckingUpdate = ref(false);
export const updateAvailable = ref(false);
export const updateReadyToApply = ref(false);
export const latestVersionInfo = ref<UpdateManifest | null>(null);

/**
 * Service to manage Over-The-Air (OTA) background updates.
 * Downloads web bundles directly from the private Al-Ishraq server without exposing tokens.
 */
class UpdaterService {
  private initialized = false;
  private currentVersion = '1.0.0';

  /**
   * Initializes the updater service, notifies Capgo that the app is healthy,
   * and sets up background resume listeners.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!Capacitor.isNativePlatform()) {
      console.log('[OTA Updater] Web/Dev environment detected - Native OTA updater idle.');
      return;
    }

    try {
      // Notify Capgo native container that app launched successfully (prevents auto-rollback)
      await CapacitorUpdater.notifyAppReady();
      console.log('[OTA Updater] App ready signal sent.');

      const currentBundle = await CapacitorUpdater.getLatest();
      if (currentBundle && currentBundle.version) {
        this.currentVersion = currentBundle.version;
      }

      // Check on resume from background
      App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          this.checkForUpdates(true).catch((err) => {
            console.warn('[OTA Updater] Background resume check failed:', err);
          });
        }
      });

      // Initial silent check
      setTimeout(() => {
        this.checkForUpdates(true).catch((err) => {
          console.warn('[OTA Updater] Initial check failed:', err);
        });
      }, 3000);
    } catch (err) {
      console.warn('[OTA Updater] Error during initialization:', err);
    }
  }

  /**
   * Checks for available OTA updates from the server.
   * @param silent If true, runs invisibly in background without toast notifications.
   */
  async checkForUpdates(silent = true): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      if (!silent) {
        Notify.create({
          type: 'info',
          message: 'نظام التحديث الهوائي مخصص لتطبيق الهاتف فقط.',
        });
      }
      return false;
    }

    try {
      isCheckingUpdate.value = true;

      // 1. Check network connectivity
      const status = await Network.getStatus();
      if (!status.connected) {
        if (!silent) {
          Notify.create({
            type: 'warning',
            message: 'لا يوجد اتصال بالإنترنت للتحقق من التحديثات.',
          });
        }
        return false;
      }

      // 2. Fetch update manifest from server
      const manifest = await this.fetchManifest();
      if (!manifest || !manifest.bundleUrl || !manifest.version) {
        if (!silent) {
          Notify.create({
            type: 'positive',
            message: 'أنت تستخدم أحدث إصدار متاح حالياً.',
          });
        }
        return false;
      }

      latestVersionInfo.value = manifest;

      // 3. Compare with current running version
      if (this.isNewerVersion(manifest.version, this.currentVersion)) {
        updateAvailable.value = true;
        console.log(`[OTA Updater] New version available: ${manifest.version} (current: ${this.currentVersion})`);

        if (!silent) {
          Notify.create({
            type: 'info',
            message: `جاري تنزيل التحديث الهوائي v${manifest.version} في الخلفية...`,
          });
        }

        // 4. Download and stage the update
        const bundle = await CapacitorUpdater.download({
          url: manifest.bundleUrl,
          version: manifest.version,
        });

        // 5. Set active bundle (will be loaded on next restart or background resume)
        await CapacitorUpdater.set({ id: bundle.id });
        updateReadyToApply.value = true;
        console.log('[OTA Updater] Bundle staged successfully for next reload.');

        Notify.create({
          type: 'positive',
          message: `تم تنزيل التحديث v${manifest.version} بنجاح. سيتم تطبيقه تلقائياً.`,
          timeout: 4000,
        });

        return true;
      } else {
        if (!silent) {
          Notify.create({
            type: 'positive',
            message: `التطبيق محدث إلى آخر إصدار (v${this.currentVersion}).`,
          });
        }
        return false;
      }
    } catch (err: any) {
      console.warn('[OTA Updater] Update check/download failed:', err);
      if (!silent) {
        Notify.create({
          type: 'negative',
          message: 'فشل التحقق من التحديثات: ' + (err.message || 'خطأ في الاتصال'),
        });
      }
      return false;
    } finally {
      isCheckingUpdate.value = false;
    }
  }

  /**
   * Applies the staged update immediately by reloading the webview.
   */
  async reloadApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await CapacitorUpdater.reload();
      } catch (err) {
        console.error('[OTA Updater] Failed to reload webview:', err);
      }
    }
  }

  /**
   * Fetches the version manifest from the Al-Ishraq server.
   * Fallback chain:
   * 1. /api/v1/mobile-employees/app-update/check
   * 2. /uploads/updates/version.json
   */
  private async fetchManifest(): Promise<UpdateManifest | null> {
    const endpoints = [
      `${SERVER_STATIC_ROOT}/api/v1/mobile-employees/app-update/check`,
      `${SERVER_STATIC_ROOT}/uploads/updates/version.json`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-cache',
        });
        if (res.ok) {
          const data = await res.json();
          // Normalize response
          return {
            version: data.version || data.latestVersion,
            buildNumber: data.buildNumber || data.build,
            bundleUrl: data.bundleUrl || data.url,
            mandatory: data.mandatory ?? false,
            notes: data.notes || data.releaseNotes || '',
          };
        }
      } catch {
        // try next endpoint
      }
    }
    return null;
  }

  /**
   * Simple semantic version comparator
   */
  private isNewerVersion(remote: string, current: string): boolean {
    const rParts = remote.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const cParts = current.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  }
}

export const updaterService = new UpdaterService();
