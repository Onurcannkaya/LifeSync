/**
 * LifeSync - OneSignal Integration
 * Real REST API push notifications
 */

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
const REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY || '';

export const onesignal = {
  initialized: false,

  init() {
    if (this.initialized) return;
    if (!APP_ID) {
      console.warn('OneSignal App ID not configured.');
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal) => {
      OneSignal.init({
        appId: APP_ID,
        notifyButton: { enable: true }
      });

      // Link Supabase user to OneSignal external ID
      const userId = window.AppState?.currentUser?.id;
      if (userId) {
        OneSignal.login(userId);
      }
    });

    this.initialized = true;
    console.log('OneSignal initialized');
  },

  /**
   * Remove the link between the device and the Supabase user upon logout.
   */
  logout() {
    if (!this.initialized) return;
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal) => {
      OneSignal.logout();
      console.log('OneSignal external ID unlinked.');
    });
  },

  /**
   * Send a real push notification via OneSignal REST API.
   * @param {string} title      Notification heading
   * @param {string} message    Notification body
   * @param {boolean} isPublic  If true, send to all subscribers
   * @param {Array} assignees   Array of external_ids (Supabase user UUIDs)
   */
  async sendNotification(title, message, isPublic = false, assignees = []) {
    if (!APP_ID || !REST_API_KEY) {
      console.log(`[OneSignal] Keys missing — mock: "${title}" - ${message}`);
      return true;
    }

    const body = {
      app_id: APP_ID,
      headings: { en: title, tr: title },
      contents: { en: message, tr: message }
    };

    if (isPublic) {
      // Send to all subscribed users
      body.included_segments = ['All'];
    } else if (assignees && assignees.length > 0) {
      // Send to specific users by their Supabase UUID (external_id)
      body.include_external_user_ids = assignees;
      body.target_channel = 'push';
    } else {
      console.log('[OneSignal] No recipients specified, skipping.');
      return false;
    }

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${REST_API_KEY}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.errors) {
        console.error('[OneSignal] API error:', result.errors);
        return false;
      }

      console.log(`[OneSignal] Notification sent! ID: ${result.id}, Recipients: ${result.recipients}`);
      return true;
    } catch (err) {
      console.error('[OneSignal] Fetch error:', err);
      return false;
    }
  }
};

export default onesignal;
