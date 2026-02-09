// Intent-Based Order System - Rules Engine
// Business logic for automatic order type conversion

export type Intent = 'TASK' | 'BUY' | 'COORDINATE' | 'DISCOVER' | 'RATE' | 'TRY';
export type OrderType = 'DIRECT' | 'PURCHASE_DELIVER' | 'CHAIN';
export type RecipientType = 'SELF' | 'THIRD_PARTY';

export interface OrderState {
  intent: Intent;
  hasPurchase: boolean;
  recipientType: RecipientType;
  stagesCount: number;
  hasHandover: boolean;
  recurring?: boolean;
  experimentFlag?: boolean;
}

export interface PromptResult {
  show: boolean;
  suggestedIntent?: Intent;
  reason?: 'third_party' | 'has_purchase' | 'complex_chain' | 'auto_convert';
  autoConvert?: boolean;
}

export interface TryConstraints {
  stagesMax: number;
  recurring: boolean;
  requirePriceCap: boolean;
  experimentFlag: boolean;
}

// 1.2 Default Mapping Rules
export function determineOrderType(
  intent: Intent,
  hasPurchase: boolean,
  recipientType: RecipientType,
  stagesCount: number
): OrderType {
  // COORDINATE always yields CHAIN
  if (intent === 'COORDINATE') return 'CHAIN';

  // BUY with third party -> CHAIN
  if (intent === 'BUY' && recipientType === 'THIRD_PARTY') return 'CHAIN';

  // BUY for self -> PURCHASE_DELIVER
  if (intent === 'BUY' && recipientType === 'SELF') return 'PURCHASE_DELIVER';

  // TASK without purchase for self -> DIRECT
  if (intent === 'TASK' && !hasPurchase && recipientType === 'SELF') return 'DIRECT';

  // TASK with purchase -> PURCHASE_DELIVER
  if (intent === 'TASK' && hasPurchase) return 'PURCHASE_DELIVER';

  // TRY uses appropriate type based on context
  if (intent === 'TRY') {
    if (hasPurchase) return 'PURCHASE_DELIVER';
    return 'DIRECT';
  }

  // Default fallback
  if (stagesCount >= 3) return 'CHAIN';

  return 'DIRECT';
}

// 1.3 Auto-Convert Triggers & Prompts
export function shouldShowPrompt(state: OrderState): PromptResult {
  // R1: TASK with purchase suggests BUY
  if (state.intent === 'TASK' && state.hasPurchase && state.recipientType === 'SELF') {
    return {
      show: true,
      suggestedIntent: 'BUY',
      reason: 'has_purchase',
    };
  }

  // R2: TASK with third party suggests COORDINATE
  if (state.intent === 'TASK' && state.recipientType === 'THIRD_PARTY') {
    return {
      show: true,
      suggestedIntent: 'COORDINATE',
      reason: 'third_party',
    };
  }

  // R3: BUY with third party auto-converts to COORDINATE
  if (state.intent === 'BUY' && state.recipientType === 'THIRD_PARTY') {
    return {
      show: true,
      suggestedIntent: 'COORDINATE',
      reason: 'auto_convert',
      autoConvert: true,
    };
  }

  // R4: Too many stages suggests COORDINATE
  if (
    (state.intent === 'TASK' || state.intent === 'BUY') &&
    (state.stagesCount >= 3 || state.hasHandover)
  ) {
    return {
      show: true,
      suggestedIntent: 'COORDINATE',
      reason: 'complex_chain',
    };
  }

  return { show: false };
}

// Apply conversion to state
export function applyConversion(state: OrderState, suggestedIntent: Intent): OrderState {
  const newState = { ...state, intent: suggestedIntent };

  // Update order type based on new intent
  const orderType = determineOrderType(
    suggestedIntent,
    state.hasPurchase,
    state.recipientType,
    state.stagesCount
  );

  // Apply TRY constraints
  if (suggestedIntent === 'TRY') {
    return {
      ...newState,
      stagesCount: Math.min(state.stagesCount, 2),
      recurring: false,
      experimentFlag: true,
    };
  }

  return newState;
}

// 1.4 TRY Mode Constraints
export function getTryConstraints(): TryConstraints {
  return {
    stagesMax: 2,
    recurring: false,
    requirePriceCap: true,
    experimentFlag: true,
  };
}

// Intent metadata for UI
export interface IntentMetadata {
  code: Intent;
  icon: string;
  emoji: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  tooltipAr: string;
  tooltipEn: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  isActionable: boolean; // Creates an order
}

export const INTENT_METADATA: IntentMetadata[] = [
  {
    code: 'TASK',
    icon: 'Truck',
    emoji: '🛻',
    titleAr: 'خلّص لي مهمة',
    titleEn: 'Complete a Task',
    descAr: 'مهمة واحدة لك أنت—مشوار أو توصيل سريع',
    descEn: 'A single task for you—errand or quick delivery',
    tooltipAr: 'مهمة واحدة لك أنت—توصيل أو مشوار سريع',
    tooltipEn: 'A single task for you—delivery or quick errand',
    gradient: 'from-primary/20 via-primary/10 to-transparent',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    isActionable: true,
  },
  {
    code: 'BUY',
    icon: 'ShoppingBag',
    emoji: '🛍️',
    titleAr: 'اشترِ لي',
    titleEn: 'Buy for Me',
    descAr: 'شراء من محل وتسليم لك',
    descEn: 'Purchase from a store and deliver to you',
    tooltipAr: 'شراء من محل وتسليم لك',
    tooltipEn: 'Purchase from a store and deliver to you',
    gradient: 'from-emerald/20 via-emerald/10 to-transparent',
    iconBg: 'bg-emerald/15',
    iconColor: 'text-emerald',
    isActionable: true,
  },
  {
    code: 'COORDINATE',
    icon: 'RefreshCw',
    emoji: '🔁',
    titleAr: 'نسّقها لي',
    titleEn: 'Coordinate for Me',
    descAr: 'شراء/استلام وتسليم لجهة ثانية',
    descEn: 'Purchase/pickup and deliver to a third party',
    tooltipAr: 'تسليم لجهة ثانية مع إثباتات وتنظيم',
    tooltipEn: 'Delivery to a third party with proofs and coordination',
    gradient: 'from-accent/20 via-accent/10 to-transparent',
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    isActionable: true,
  },
  {
    code: 'DISCOVER',
    icon: 'Search',
    emoji: '🔍',
    titleAr: 'اكتشف السوق',
    titleEn: 'Discover Market',
    descAr: 'شوف الخيارات وقارن قبل ما تقرر',
    descEn: 'Browse options and compare before deciding',
    tooltipAr: 'استعراض الخيارات بدون طلب',
    tooltipEn: 'Browse options without placing an order',
    gradient: 'from-secondary/20 via-secondary/10 to-transparent',
    iconBg: 'bg-secondary/15',
    iconColor: 'text-secondary',
    isActionable: false,
  },
  {
    code: 'RATE',
    icon: 'Star',
    emoji: '⭐',
    titleAr: 'قيّم قبل ما تختار',
    titleEn: 'Rate Before Choosing',
    descAr: 'ترتيب حسب الجودة وتجارب حقيقية',
    descEn: 'Rank by quality and real experiences',
    tooltipAr: 'جودة من تجارب داخلية + مصادر خارجية',
    tooltipEn: 'Quality from internal reviews + external sources',
    gradient: 'from-rating-star/20 via-rating-star/10 to-transparent',
    iconBg: 'bg-rating-star/15',
    iconColor: 'text-rating-star',
    isActionable: false,
  },
  {
    code: 'TRY',
    icon: 'FlaskConical',
    emoji: '🧪',
    titleAr: 'جرّب بدون مخاطرة',
    titleEn: 'Try Risk-Free',
    descAr: 'تجربة مرة وحدة بدون التزام',
    descEn: 'One-time trial with no commitment',
    tooltipAr: 'تجربة مرة واحدة بنطاق محدود',
    tooltipEn: 'One-time trial with limited scope',
    gradient: 'from-destructive/20 via-destructive/10 to-transparent',
    iconBg: 'bg-destructive/15',
    iconColor: 'text-destructive',
    isActionable: true,
  },
];

export function getIntentMetadata(intent: Intent): IntentMetadata | undefined {
  return INTENT_METADATA.find(m => m.code === intent);
}

// Map intent to initial order type
export function intentToOrderType(intent: Intent): OrderType {
  switch (intent) {
    case 'TASK':
      return 'DIRECT';
    case 'BUY':
      return 'PURCHASE_DELIVER';
    case 'COORDINATE':
      return 'CHAIN';
    case 'TRY':
      return 'DIRECT'; // Will be refined based on user choices
    default:
      return 'DIRECT';
  }
}
