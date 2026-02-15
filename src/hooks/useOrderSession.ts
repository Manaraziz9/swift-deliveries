const SESSION_KEY = 'ya_order_session';

export interface CompletedStepItem {
  description: string;
  quantity: number;
  price?: number;
  specification?: string;
  notes?: string;
  type: 'catalog' | 'custom';
}

export interface CompletedOrderStep {
  id: string;
  merchantId?: string;
  merchantName: string;
  branchId?: string;
  items: CompletedStepItem[];
  deliveryType: string;
  isUrgent: boolean;
  estimatedPrice: { low: number; high: number };
}

export function useOrderSession() {
  const getSteps = (): CompletedOrderStep[] => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const addStep = (step: CompletedOrderStep) => {
    const steps = getSteps();
    steps.push(step);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(steps));
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  return { getSteps, addStep, clearSession };
}
