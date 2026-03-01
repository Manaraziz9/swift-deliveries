import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Camera, Check, ChevronRight, ChevronLeft,
  Ruler, Sparkles, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ServiceTemplate,
  type TemplateField,
  generateOrderSummary,
} from '@/lib/serviceTemplates';

interface Props {
  template: ServiceTemplate;
  onSubmit: (values: Record<string, any>, summary: string) => void;
  onBack: () => void;
}

export default function DynamicServiceForm({ template, onSubmit, onBack }: Props) {
  const { lang, dir } = useLang();
  const [values, setValues] = useState<Record<string, any>>({});
  const [photoPreview, setPhotoPreview] = useState<Record<string, string>>({});
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const ForwardArrow = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const setValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const toggleMultiSelect = (fieldId: string, optionValue: string) => {
    const current: string[] = values[fieldId] || [];
    const updated = current.includes(optionValue)
      ? current.filter(v => v !== optionValue)
      : [...current, optionValue];
    setValue(fieldId, updated);
  };

  const handlePhotoChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(prev => ({ ...prev, [fieldId]: url }));
      setValue(fieldId, file.name); // In real app, upload to storage
    }
  };

  const isFieldVisible = (field: TemplateField): boolean => {
    if (!field.showWhen) return true;
    const depValue = values[field.showWhen.field];
    if (Array.isArray(field.showWhen.value)) {
      return field.showWhen.value.includes(depValue);
    }
    return depValue === field.showWhen.value;
  };

  const visibleFields = template.fields.filter(isFieldVisible);

  const isValid = visibleFields
    .filter(f => f.required)
    .every(f => {
      const v = values[f.id];
      return v !== undefined && v !== '' && v !== null;
    });

  const handleSubmit = () => {
    const summary = generateOrderSummary(template, values, lang as 'ar' | 'en');
    onSubmit(values, summary);
  };

  const renderField = (field: TemplateField) => {
    const label = lang === 'ar' ? field.label_ar : field.label_en;

    switch (field.type) {
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              {label}
              {field.required && <span className="text-destructive">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map(opt => {
                const selected = values[field.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setValue(field.id, opt.value)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 flex items-center gap-1.5",
                      selected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    {opt.icon && <span>{opt.icon}</span>}
                    {lang === 'ar' ? opt.label_ar : opt.label_en}
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'multi_select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold">{label}</label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map(opt => {
                const selected = (values[field.id] as string[] || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMultiSelect(field.id, opt.value)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 flex items-center gap-1.5",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    {lang === 'ar' ? opt.label_ar : opt.label_en}
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              {label}
              {field.required && <span className="text-destructive">*</span>}
            </label>
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={values[field.id] || ''}
              onChange={e => setValue(field.id, e.target.value ? parseInt(e.target.value) : '')}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        );

      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              {label}
              {field.required && <span className="text-destructive">*</span>}
            </label>
            <input
              type="text"
              value={values[field.id] || ''}
              onChange={e => setValue(field.id, e.target.value)}
              placeholder={lang === 'ar' ? field.placeholder_ar : field.placeholder_en}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              {label}
              {field.required && <span className="text-destructive">*</span>}
            </label>
            <textarea
              value={values[field.id] || ''}
              onChange={e => setValue(field.id, e.target.value)}
              placeholder={lang === 'ar' ? field.placeholder_ar : field.placeholder_en}
              rows={3}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
        );

      case 'toggle':
        return (
          <div key={field.id} className="flex items-center justify-between p-4 rounded-2xl border-2 bg-card">
            <span className="text-sm font-bold">{label}</span>
            <button
              onClick={() => setValue(field.id, !values[field.id])}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                values[field.id] ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all",
                values[field.id] ? "end-1" : "start-1"
              )} />
            </button>
          </div>
        );

      case 'measurement_group':
        return (
          <div key={field.id} className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              {label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {field.subFields?.map(sub => (
                <div key={sub.id} className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    {lang === 'ar' ? sub.label_ar : sub.label_en}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={values[`${field.id}_${sub.id}`] || ''}
                      onChange={e => setValue(`${field.id}_${sub.id}`, e.target.value)}
                      className="w-full rounded-xl border-2 bg-card px-3 py-2.5 text-sm pe-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {lang === 'ar' ? sub.unit_ar : sub.unit_en}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'photo':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-bold">{label}</label>
            {photoPreview[field.id] ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={photoPreview[field.id]} alt="" className="w-full h-40 object-cover" />
                <button
                  onClick={() => {
                    setPhotoPreview(prev => { const n = {...prev}; delete n[field.id]; return n; });
                    setValue(field.id, undefined);
                  }}
                  className="absolute top-2 end-2 bg-destructive/90 text-white rounded-full p-1.5 text-xs"
                >✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                <Camera className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm text-primary font-medium">
                  {lang === 'ar' ? 'اضغط لإضافة صورة' : 'Tap to add photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handlePhotoChange(field.id, e)}
                />
              </label>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const filledCount = visibleFields.filter(f => {
    const v = values[f.id];
    return v !== undefined && v !== '' && v !== null && (!Array.isArray(v) || v.length > 0);
  }).length;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
              <BackArrow className="h-5 w-5" />
            </button>
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg", template.color)}>
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold truncate">
                {lang === 'ar' ? template.title_ar : template.title_en}
              </h1>
              <p className="text-xs text-muted-foreground">
                {filledCount}/{visibleFields.length} {lang === 'ar' ? 'مكتمل' : 'filled'}
              </p>
            </div>
            <span className="text-lg font-bold font-en text-primary">YA</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(filledCount / visibleFields.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120 }}
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="container py-5 space-y-5">
        <AnimatePresence mode="popLayout">
          {visibleFields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ delay: index * 0.03 }}
            >
              {renderField(field)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Submit Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="container py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {generateOrderSummary(template, values, lang as 'ar' | 'en')}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              isValid
                ? "bg-primary text-primary-foreground shadow-lg hover:brightness-95 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            {lang === 'ar' ? 'أكمل الطلب' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
