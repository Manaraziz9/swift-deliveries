// Order Drafts Hook - Save and restore order drafts
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrderFormData } from '@/components/order/OrderWizard';

const DRAFTS_STORAGE_KEY = 'order_drafts';

export interface OrderDraft {
  id: string;
  formData: OrderFormData;
  step: number;
  createdAt: string;
  updatedAt: string;
  title: string;
}

export function useOrderDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);

  // Load drafts from localStorage
  useEffect(() => {
    loadDrafts();
  }, [user?.id]);

  const loadDrafts = useCallback(() => {
    try {
      const key = user?.id ? `${DRAFTS_STORAGE_KEY}_${user.id}` : DRAFTS_STORAGE_KEY;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as OrderDraft[];
        // Sort by updatedAt descending
        parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDrafts(parsed);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
      setDrafts([]);
    }
  }, [user?.id]);

  const saveDraft = useCallback((formData: OrderFormData, step: number, draftId?: string): string => {
    try {
      const key = user?.id ? `${DRAFTS_STORAGE_KEY}_${user.id}` : DRAFTS_STORAGE_KEY;
      const stored = localStorage.getItem(key);
      let existingDrafts: OrderDraft[] = stored ? JSON.parse(stored) : [];

      const now = new Date().toISOString();
      const id = draftId || `draft_${Date.now()}`;
      
      // Generate a title based on intent and items
      let title = 'طلب محفوظ';
      if (formData.intent) {
        const intentTitles: Record<string, string> = {
          TASK: 'مهمة',
          BUY: 'شراء',
          COORDINATE: 'تنسيق',
          TRY: 'تجربة',
          DISCOVER: 'اكتشاف',
          RATE: 'تقييم',
        };
        title = intentTitles[formData.intent] || title;
      }
      if (formData.items.length > 0) {
        title += ` - ${formData.items[0].description.substring(0, 20)}`;
        if (formData.items[0].description.length > 20) title += '...';
      }

      const draft: OrderDraft = {
        id,
        formData,
        step,
        createdAt: draftId ? existingDrafts.find(d => d.id === draftId)?.createdAt || now : now,
        updatedAt: now,
        title,
      };

      // Update existing or add new
      const existingIndex = existingDrafts.findIndex(d => d.id === id);
      if (existingIndex >= 0) {
        existingDrafts[existingIndex] = draft;
      } else {
        existingDrafts.unshift(draft);
      }

      // Keep only last 10 drafts
      if (existingDrafts.length > 10) {
        existingDrafts = existingDrafts.slice(0, 10);
      }

      localStorage.setItem(key, JSON.stringify(existingDrafts));
      setDrafts(existingDrafts);

      return id;
    } catch (error) {
      console.error('Error saving draft:', error);
      return '';
    }
  }, [user?.id]);

  const getDraft = useCallback((draftId: string): OrderDraft | null => {
    return drafts.find(d => d.id === draftId) || null;
  }, [drafts]);

  const deleteDraft = useCallback((draftId: string) => {
    try {
      const key = user?.id ? `${DRAFTS_STORAGE_KEY}_${user.id}` : DRAFTS_STORAGE_KEY;
      const newDrafts = drafts.filter(d => d.id !== draftId);
      localStorage.setItem(key, JSON.stringify(newDrafts));
      setDrafts(newDrafts);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [user?.id, drafts]);

  const clearAllDrafts = useCallback(() => {
    try {
      const key = user?.id ? `${DRAFTS_STORAGE_KEY}_${user.id}` : DRAFTS_STORAGE_KEY;
      localStorage.removeItem(key);
      setDrafts([]);
    } catch (error) {
      console.error('Error clearing drafts:', error);
    }
  }, [user?.id]);

  return {
    drafts,
    saveDraft,
    getDraft,
    deleteDraft,
    clearAllDrafts,
    loadDrafts,
  };
}
