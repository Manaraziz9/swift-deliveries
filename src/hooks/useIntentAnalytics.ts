// Intent Analytics Hook - Track which intents users choose most
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Intent } from '@/lib/orderIntentRules';

interface AnalyticsEvent {
  event_type: 'intent_selected' | 'intent_completed' | 'intent_abandoned' | 'prompt_shown' | 'prompt_accepted' | 'prompt_declined';
  intent: Intent;
  metadata?: Record<string, any>;
}

export function useIntentAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      // Log to console for debugging
      console.log('[Intent Analytics]', event);

      // Store in localStorage for aggregation
      const storageKey = 'intent_analytics';
      const stored = localStorage.getItem(storageKey);
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      events.push({
        ...event,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          user_id: user?.id || 'anonymous',
        },
      });
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      localStorage.setItem(storageKey, JSON.stringify(events));

      // If user is authenticated, also track in database (via edge function if needed)
      // This could be expanded to use a dedicated analytics table
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user?.id]);

  const trackIntentSelected = useCallback((intent: Intent) => {
    trackEvent({
      event_type: 'intent_selected',
      intent,
    });
  }, [trackEvent]);

  const trackIntentCompleted = useCallback((intent: Intent, orderType: string) => {
    trackEvent({
      event_type: 'intent_completed',
      intent,
      metadata: { order_type: orderType },
    });
  }, [trackEvent]);

  const trackIntentAbandoned = useCallback((intent: Intent, step: number) => {
    trackEvent({
      event_type: 'intent_abandoned',
      intent,
      metadata: { abandoned_at_step: step },
    });
  }, [trackEvent]);

  const trackPromptShown = useCallback((intent: Intent, suggestedIntent: Intent, reason: string) => {
    trackEvent({
      event_type: 'prompt_shown',
      intent,
      metadata: { suggested_intent: suggestedIntent, reason },
    });
  }, [trackEvent]);

  const trackPromptAccepted = useCallback((intent: Intent, suggestedIntent: Intent) => {
    trackEvent({
      event_type: 'prompt_accepted',
      intent,
      metadata: { converted_to: suggestedIntent },
    });
  }, [trackEvent]);

  const trackPromptDeclined = useCallback((intent: Intent, suggestedIntent: Intent) => {
    trackEvent({
      event_type: 'prompt_declined',
      intent,
      metadata: { declined_suggestion: suggestedIntent },
    });
  }, [trackEvent]);

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    try {
      const storageKey = 'intent_analytics';
      const stored = localStorage.getItem(storageKey);
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

      const summary = {
        totalSelections: 0,
        totalCompletions: 0,
        totalAbandons: 0,
        intentCounts: {} as Record<Intent, number>,
        conversionRate: 0,
      };

      events.forEach(event => {
        if (event.event_type === 'intent_selected') {
          summary.totalSelections++;
          summary.intentCounts[event.intent] = (summary.intentCounts[event.intent] || 0) + 1;
        }
        if (event.event_type === 'intent_completed') {
          summary.totalCompletions++;
        }
        if (event.event_type === 'intent_abandoned') {
          summary.totalAbandons++;
        }
      });

      if (summary.totalSelections > 0) {
        summary.conversionRate = (summary.totalCompletions / summary.totalSelections) * 100;
      }

      return summary;
    } catch {
      return null;
    }
  }, []);

  return {
    trackIntentSelected,
    trackIntentCompleted,
    trackIntentAbandoned,
    trackPromptShown,
    trackPromptAccepted,
    trackPromptDeclined,
    getAnalyticsSummary,
  };
}
