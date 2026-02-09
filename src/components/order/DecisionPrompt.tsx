import { useLang } from '@/contexts/LangContext';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Intent, getIntentMetadata } from '@/lib/orderIntentRules';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface DecisionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  suggestedIntent: Intent;
  reason: 'third_party' | 'has_purchase' | 'complex_chain' | 'auto_convert';
  variant?: 'convert_to_coordinate' | 'convert_to_buy' | 'warning';
}

export default function DecisionPrompt({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  suggestedIntent,
  reason,
  variant = 'convert_to_coordinate',
}: DecisionPromptProps) {
  const { lang } = useLang();

  const getContent = () => {
    // Smart conversion prompt
    if (reason === 'third_party' || reason === 'complex_chain') {
      return {
        title: lang === 'ar' ? 'تحب نرتّبها لك بشكل أذكى؟' : 'Want us to arrange it smarter?',
        body: lang === 'ar' 
          ? 'واضح إن طلبك فيه أكثر من جهة. خيار «نسّقها لي» يساعدنا نرتّبها بين الأطراف بدون تدخل منك.'
          : 'It seems your order involves multiple parties. The "Coordinate for Me" option helps us arrange things between parties without your intervention.',
        primaryLabel: lang === 'ar' ? 'حوّلها إلى «نسّقها لي»' : 'Convert to "Coordinate for Me"',
        secondaryLabel: lang === 'ar' ? 'كمّل كذا' : 'Continue as is',
        note: lang === 'ar' ? 'تقدر تكمل بالطريقة اللي تفضلها' : 'You can continue the way you prefer',
      };
    }

    if (reason === 'has_purchase') {
      return {
        title: lang === 'ar' ? 'هل تريد الشراء؟' : 'Do you want to purchase?',
        body: lang === 'ar'
          ? 'لاحظنا إن طلبك يتضمن شراء. خيار «اشترِ لي» يوفر لك سياسات استبدال وسقف سعري.'
          : 'We noticed your order includes a purchase. The "Buy for Me" option provides substitution policies and price caps.',
        primaryLabel: lang === 'ar' ? 'حوّل إلى «اشترِ لي»' : 'Convert to "Buy for Me"',
        secondaryLabel: lang === 'ar' ? 'كمّل كمهمة' : 'Continue as task',
        note: lang === 'ar' ? 'الشراء يوفر حماية أكثر' : 'Purchase offers more protection',
      };
    }

    if (reason === 'auto_convert') {
      return {
        title: lang === 'ar' ? 'تم التحويل تلقائياً' : 'Auto-converted',
        body: lang === 'ar'
          ? 'بما إن التسليم لطرف ثالث، حوّلنا طلبك تلقائياً لـ «نسّقها لي» لإضافة إثباتات التسليم.'
          : 'Since delivery is to a third party, we automatically converted your order to "Coordinate for Me" to add delivery proofs.',
        primaryLabel: lang === 'ar' ? 'تمام، فهمت' : 'OK, got it',
        secondaryLabel: lang === 'ar' ? 'تراجع' : 'Undo',
        note: lang === 'ar' ? 'هذا يضمن تسليم منظم وموثق' : 'This ensures organized and documented delivery',
      };
    }

    return {
      title: lang === 'ar' ? 'اقتراح' : 'Suggestion',
      body: '',
      primaryLabel: lang === 'ar' ? 'موافق' : 'Accept',
      secondaryLabel: lang === 'ar' ? 'لا' : 'No',
      note: '',
    };
  };

  const content = getContent();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-ya-lg border-t-2 border-ya-highlight">
        <SheetHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-ya-highlight/15 flex items-center justify-center mb-3">
            <RefreshCw className="h-6 w-6 text-ya-highlight" />
          </div>
          <SheetTitle className="text-xl font-semibold">{content.title}</SheetTitle>
          <SheetDescription className="text-base leading-relaxed text-muted-foreground">
            {content.body}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pt-4">
          {/* Primary Button */}
          <button
            onClick={onAccept}
            className="btn-ya w-full py-4 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            {content.primaryLabel}
          </button>

          {/* Secondary Button */}
          <button
            onClick={onDecline}
            className="w-full py-3 rounded-ya-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
          >
            {content.secondaryLabel}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>

          {/* Note */}
          {content.note && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              {content.note}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
