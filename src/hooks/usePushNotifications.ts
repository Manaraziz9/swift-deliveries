import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current permission state
  useEffect(() => {
    if (isPushSupported()) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isPushSupported() || !user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSubscription();
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    if (!isPushSupported()) throw new Error('Push not supported');

    setIsLoading(true);
    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted') {
          throw new Error('Permission denied');
        }
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from edge function
      const { data: vapidKey, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidKey?.publicKey) {
        throw new Error('Could not get VAPID key');
      }

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.publicKey,
      });

      // Save subscription to database
      const subscriptionJSON = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionJSON.endpoint!,
        keys: subscriptionJSON.keys,
      });

      if (error) throw error;
      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isPushSupported: isPushSupported(),
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
