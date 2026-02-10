import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { MapPin, Store, Plus, Trash2, GripVertical, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData, ChainTask } from '../OrderWizard';
import { useMerchants, useBranches } from '@/hooks/useMerchants';
import { useGeolocation } from '@/hooks/useGeolocation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StepChainTasksProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

// Sortable Task Item Component
interface SortableTaskProps {
  task: ChainTask;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  getMerchantName: (task: ChainTask) => string;
  lang: string;
  children?: React.ReactNode;
}

function SortableTaskItem({ task, index, isEditing, onEdit, onRemove, getMerchantName, lang, children }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border transition-all overflow-hidden",
        isDragging ? "shadow-xl scale-[1.02]" : "",
        isEditing 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
      )}
    >
      {/* Task Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          className="touch-none text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div 
          className="flex-1 flex items-center gap-3 cursor-pointer"
          onClick={onEdit}
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {lang === 'ar' ? `مهمة ${index + 1}` : `Task ${index + 1}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getMerchantName(task) || (lang === 'ar' ? 'اختر الموقع' : 'Select location')}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Task Editor Content (passed as children) */}
      {isEditing && children}
    </div>
  );
}

export default function StepChainTasks({ formData, updateFormData }: StepChainTasksProps) {
  const { lang } = useLang();
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(
    formData.chainTasks.length === 0 ? 0 : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [taskSourceType, setTaskSourceType] = useState<'merchant' | 'custom'>('merchant');

  const { data: merchants } = useMerchants();
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const { data: branches } = useBranches(selectedMerchantId || undefined);
  const { latitude, longitude, loading: geoLoading, requestLocation } = useGeolocation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredMerchants = (merchants || []).filter(m =>
    m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.business_name_ar && m.business_name_ar.includes(searchQuery))
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.chainTasks.findIndex(t => t.id === active.id);
      const newIndex = formData.chainTasks.findIndex(t => t.id === over.id);
      
      const reordered = arrayMove(formData.chainTasks, oldIndex, newIndex).map((task, i) => ({
        ...task,
        sequence: i + 1,
      }));
      
      updateFormData({ chainTasks: reordered });
      
      // Update editing index if needed
      if (editingTaskIndex === oldIndex) {
        setEditingTaskIndex(newIndex);
      } else if (editingTaskIndex !== null) {
        if (oldIndex < editingTaskIndex && newIndex >= editingTaskIndex) {
          setEditingTaskIndex(editingTaskIndex - 1);
        } else if (oldIndex > editingTaskIndex && newIndex <= editingTaskIndex) {
          setEditingTaskIndex(editingTaskIndex + 1);
        }
      }
    }
  };

  const addTask = () => {
    const newTask: ChainTask = {
      id: `task-${Date.now()}`,
      sequence: formData.chainTasks.length + 1,
      type: 'purchase',
      merchantId: null,
      branchId: null,
      address: '',
      lat: null,
      lng: null,
      description: '',
    };
    updateFormData({ chainTasks: [...formData.chainTasks, newTask] });
    setEditingTaskIndex(formData.chainTasks.length);
    setSearchQuery('');
    setSelectedMerchantId(null);
    setTaskSourceType('merchant');
  };

  const removeTask = (index: number) => {
    const updated = formData.chainTasks
      .filter((_, i) => i !== index)
      .map((task, i) => ({ ...task, sequence: i + 1 }));
    updateFormData({ chainTasks: updated });
    if (editingTaskIndex === index) {
      setEditingTaskIndex(null);
    } else if (editingTaskIndex !== null && editingTaskIndex > index) {
      setEditingTaskIndex(editingTaskIndex - 1);
    }
  };

  const updateTask = (index: number, data: Partial<ChainTask>) => {
    const updated = formData.chainTasks.map((task, i) =>
      i === index ? { ...task, ...data } : task
    );
    updateFormData({ chainTasks: updated });
  };

  const handleSelectMerchant = (merchantId: string) => {
    if (editingTaskIndex === null) return;
    setSelectedMerchantId(merchantId);
    const merchant = merchants?.find(m => m.id === merchantId);
    updateTask(editingTaskIndex, {
      merchantId,
      branchId: null,
      description: lang === 'ar' && merchant?.business_name_ar 
        ? merchant.business_name_ar 
        : merchant?.business_name || '',
    });
  };

  const handleSelectBranch = (branchId: string) => {
    if (editingTaskIndex === null) return;
    const branch = branches?.find(b => b.id === branchId);
    if (branch) {
      updateTask(editingTaskIndex, {
        branchId,
        address: lang === 'ar' ? branch.address_text_ar || branch.address_text || '' : branch.address_text || '',
        lat: branch.lat,
        lng: branch.lng,
      });
      setEditingTaskIndex(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (editingTaskIndex === null) return;
    requestLocation();
    if (latitude && longitude) {
      updateTask(editingTaskIndex, {
        address: lang === 'ar' ? 'موقع مخصص' : 'Custom Location',
        lat: latitude,
        lng: longitude,
        merchantId: null,
        branchId: null,
      });
      setEditingTaskIndex(null);
    }
  };

  const handleCustomAddress = (address: string) => {
    if (editingTaskIndex === null) return;
    updateTask(editingTaskIndex, {
      address,
      merchantId: null,
      branchId: null,
    });
  };

  const getMerchantName = (task: ChainTask) => {
    if (!task.merchantId) return task.address || (lang === 'ar' ? 'موقع مخصص' : 'Custom Location');
    const merchant = merchants?.find(m => m.id === task.merchantId);
    return lang === 'ar' && merchant?.business_name_ar 
      ? merchant.business_name_ar 
      : merchant?.business_name || '';
  };

  const renderTaskEditor = (task: ChainTask, index: number) => (
    <div className="px-4 pb-4 space-y-4 border-t pt-4">
      {/* Source Type Toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          onClick={() => setTaskSourceType('merchant')}
          className={cn(
            "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
            taskSourceType === 'merchant'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Store className="h-3 w-3" />
          {lang === 'ar' ? 'من محل' : 'Store'}
        </button>
        <button
          onClick={() => setTaskSourceType('custom')}
          className={cn(
            "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
            taskSourceType === 'custom'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <MapPin className="h-3 w-3" />
          {lang === 'ar' ? 'موقع' : 'Location'}
        </button>
      </div>

      {taskSourceType === 'merchant' ? (
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن محل...' : 'Search stores...'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filteredMerchants.slice(0, 6).map(merchant => (
              <button
                key={merchant.id}
                onClick={() => handleSelectMerchant(merchant.id)}
                className={cn(
                  "w-full p-2 rounded-lg border text-start text-sm transition-all",
                  task.merchantId === merchant.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted"
                )}
              >
                {lang === 'ar' && merchant.business_name_ar
                  ? merchant.business_name_ar
                  : merchant.business_name}
              </button>
            ))}
          </div>
          {task.merchantId && branches && branches.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">{lang === 'ar' ? 'اختر الفرع' : 'Select Branch'}</p>
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch.id)}
                  className={cn(
                    "w-full p-2 rounded-lg border text-start text-sm transition-all",
                    task.branchId === branch.id
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <p className="font-medium">{branch.branch_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar' ? branch.address_text_ar : branch.address_text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="w-full p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-2 hover:bg-primary/10 transition-colors text-sm"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Navigation className="h-4 w-4 text-primary" />
            )}
            {lang === 'ar' ? 'موقعي الحالي' : 'My Location'}
          </button>
          <textarea
            value={task.address}
            onChange={e => handleCustomAddress(e.target.value)}
            placeholder={lang === 'ar' ? 'أدخل العنوان...' : 'Enter address...'}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-none"
          />
          <button
            onClick={() => setEditingTaskIndex(null)}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            {lang === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      )}

      {/* Task Description */}
      <div>
        <label className="text-xs font-medium mb-1 block">
          {lang === 'ar' ? 'وصف المهمة (اختياري)' : 'Task Description (optional)'}
        </label>
        <input
          type="text"
          value={task.description}
          onChange={e => updateTask(index, { description: e.target.value })}
          placeholder={lang === 'ar' ? 'مثال: اشتري القماش الأزرق' : 'e.g., Buy blue fabric'}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          {lang === 'ar' ? 'خلّنا نرتّبها لك' : 'Let us coordinate for you'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {formData.chainTasks.length} {lang === 'ar' ? 'مهام' : 'tasks'}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {lang === 'ar' 
          ? 'أضف المهام بالترتيب. اسحب وأفلت لإعادة الترتيب.'
          : 'Add tasks in order. Drag and drop to reorder.'}
      </p>

      {/* Sortable Tasks List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={formData.chainTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {formData.chainTasks.map((task, index) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                index={index}
                isEditing={editingTaskIndex === index}
                onEdit={() => setEditingTaskIndex(editingTaskIndex === index ? null : index)}
                onRemove={() => removeTask(index)}
                getMerchantName={getMerchantName}
                lang={lang}
              >
                {editingTaskIndex === index && renderTaskEditor(task, index)}
              </SortableTaskItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Task Button */}
      <button
        onClick={addTask}
        className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-5 w-5" />
        {lang === 'ar' 
          ? `إضافة مهمة ${formData.chainTasks.length + 1}` 
          : `Add Task ${formData.chainTasks.length + 1}`}
      </button>

      {formData.chainTasks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {lang === 'ar' 
            ? 'لم تضف أي مهام بعد. اضغط على الزر أعلاه لإضافة أول مهمة.'
            : 'No tasks added yet. Click the button above to add your first task.'}
        </p>
      )}
    </div>
  );
}
