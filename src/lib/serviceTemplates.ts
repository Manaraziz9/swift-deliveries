// Service Templates Engine — dynamic forms per category
export interface FieldOption {
  value: string;
  label_ar: string;
  label_en: string;
  icon?: string;
}

export interface TemplateField {
  id: string;
  type: 'select' | 'multi_select' | 'number' | 'text' | 'textarea' | 'toggle' | 'measurement_group' | 'photo' | 'color_picker';
  label_ar: string;
  label_en: string;
  placeholder_ar?: string;
  placeholder_en?: string;
  required?: boolean;
  options?: FieldOption[];
  unit_ar?: string;
  unit_en?: string;
  min?: number;
  max?: number;
  /** Show only when another field has a specific value */
  showWhen?: { field: string; value: string | string[] };
  /** Sub-fields for measurement_group */
  subFields?: { id: string; label_ar: string; label_en: string; unit_ar: string; unit_en: string }[];
}

export interface ServiceTemplate {
  id: string;
  category: string;
  icon: string;
  color: string;       // tailwind gradient class
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  illustration?: string; // emoji for now
  fields: TemplateField[];
  /** Auto-generated order summary template */
  summaryTemplate_ar: string;
  summaryTemplate_en: string;
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // ━━━ 1. FASHION & TAILORING ━━━
  {
    id: 'tailoring',
    category: 'fashion',
    icon: '✂️',
    color: 'from-purple-500 to-pink-500',
    title_ar: 'تفصيل وخياطة',
    title_en: 'Tailoring',
    subtitle_ar: 'عباية، ثوب، فستان وأكثر',
    subtitle_en: 'Abaya, thobe, dress & more',
    illustration: '👗',
    summaryTemplate_ar: 'طلب تفصيل {garment_type} — {fabric_type}',
    summaryTemplate_en: '{garment_type} tailoring order — {fabric_type}',
    fields: [
      {
        id: 'garment_type',
        type: 'select',
        label_ar: 'نوع القطعة',
        label_en: 'Garment Type',
        required: true,
        options: [
          { value: 'abaya', label_ar: 'عباية', label_en: 'Abaya', icon: '🧕' },
          { value: 'thobe', label_ar: 'ثوب رجالي', label_en: 'Thobe', icon: '👔' },
          { value: 'dress', label_ar: 'فستان', label_en: 'Dress', icon: '👗' },
          { value: 'suit', label_ar: 'بدلة', label_en: 'Suit', icon: '🤵' },
          { value: 'jalabiya', label_ar: 'جلابية', label_en: 'Jalabiya', icon: '👘' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'style',
        type: 'multi_select',
        label_ar: 'الستايل',
        label_en: 'Style',
        options: [
          { value: 'casual', label_ar: 'كاجوال', label_en: 'Casual' },
          { value: 'formal', label_ar: 'رسمي', label_en: 'Formal' },
          { value: 'light', label_ar: 'خفيف', label_en: 'Light' },
          { value: 'embroidered', label_ar: 'مطرّز', label_en: 'Embroidered' },
          { value: 'modern', label_ar: 'عصري', label_en: 'Modern' },
          { value: 'traditional', label_ar: 'تراثي', label_en: 'Traditional' },
        ],
      },
      {
        id: 'fabric_type',
        type: 'select',
        label_ar: 'نوع القماش',
        label_en: 'Fabric Type',
        options: [
          { value: 'silk', label_ar: 'حرير', label_en: 'Silk' },
          { value: 'cotton', label_ar: 'قطن', label_en: 'Cotton' },
          { value: 'linen', label_ar: 'كتان', label_en: 'Linen' },
          { value: 'chiffon', label_ar: 'شيفون', label_en: 'Chiffon' },
          { value: 'crepe', label_ar: 'كريب', label_en: 'Crepe' },
          { value: 'custom', label_ar: 'حدد بنفسك', label_en: 'Custom' },
        ],
      },
      {
        id: 'color_preference',
        type: 'text',
        label_ar: 'اللون المفضّل',
        label_en: 'Preferred Color',
        placeholder_ar: 'مثال: أسود، كحلي، بيج...',
        placeholder_en: 'e.g. Black, navy, beige...',
      },
      {
        id: 'measurements',
        type: 'measurement_group',
        label_ar: 'المقاسات',
        label_en: 'Measurements',
        subFields: [
          { id: 'chest', label_ar: 'الصدر', label_en: 'Chest', unit_ar: 'سم', unit_en: 'cm' },
          { id: 'waist', label_ar: 'الخصر', label_en: 'Waist', unit_ar: 'سم', unit_en: 'cm' },
          { id: 'length', label_ar: 'الطول', label_en: 'Length', unit_ar: 'سم', unit_en: 'cm' },
          { id: 'shoulder', label_ar: 'الكتف', label_en: 'Shoulder', unit_ar: 'سم', unit_en: 'cm' },
          { id: 'sleeve', label_ar: 'الكم', label_en: 'Sleeve', unit_ar: 'سم', unit_en: 'cm' },
        ],
      },
      {
        id: 'design_photo',
        type: 'photo',
        label_ar: 'صورة التصميم المطلوب',
        label_en: 'Design Reference Photo',
      },
      {
        id: 'buy_fabric',
        type: 'toggle',
        label_ar: 'أبي المندوب يشتري القماش',
        label_en: 'I want the runner to buy the fabric',
      },
      {
        id: 'extra_notes',
        type: 'textarea',
        label_ar: 'ملاحظات إضافية',
        label_en: 'Additional Notes',
        placeholder_ar: 'أي تفاصيل إضافية تبي توضحها...',
        placeholder_en: 'Any extra details you want to specify...',
      },
    ],
  },

  // ━━━ 2. CAR REPAIR & MAINTENANCE ━━━
  {
    id: 'car_repair',
    category: 'automotive',
    icon: '🔧',
    color: 'from-blue-600 to-cyan-500',
    title_ar: 'صيانة وتصليح سيارات',
    title_en: 'Car Repair & Service',
    subtitle_ar: 'صيانة، غسيل، بنشر وأكثر',
    subtitle_en: 'Maintenance, wash, tire & more',
    illustration: '🚗',
    summaryTemplate_ar: 'طلب {service_type} — {car_brand} {car_model}',
    summaryTemplate_en: '{service_type} request — {car_brand} {car_model}',
    fields: [
      {
        id: 'service_type',
        type: 'select',
        label_ar: 'نوع الخدمة',
        label_en: 'Service Type',
        required: true,
        options: [
          { value: 'oil_change', label_ar: 'تغيير زيت', label_en: 'Oil Change', icon: '🛢️' },
          { value: 'tire', label_ar: 'إطارات / بنشر', label_en: 'Tire / Flat Fix', icon: '🔘' },
          { value: 'battery', label_ar: 'بطارية', label_en: 'Battery', icon: '🔋' },
          { value: 'wash', label_ar: 'غسيل سيارة', label_en: 'Car Wash', icon: '🧼' },
          { value: 'ac', label_ar: 'مكيف', label_en: 'AC Service', icon: '❄️' },
          { value: 'brakes', label_ar: 'فرامل', label_en: 'Brakes', icon: '🛑' },
          { value: 'electrical', label_ar: 'كهرباء', label_en: 'Electrical', icon: '⚡' },
          { value: 'body_work', label_ar: 'سمكرة ودهان', label_en: 'Body Work', icon: '🎨' },
          { value: 'inspection', label_ar: 'فحص شامل', label_en: 'Full Inspection', icon: '🔍' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'car_brand',
        type: 'text',
        label_ar: 'ماركة السيارة',
        label_en: 'Car Brand',
        placeholder_ar: 'مثال: تويوتا، هيونداي...',
        placeholder_en: 'e.g. Toyota, Hyundai...',
        required: true,
      },
      {
        id: 'car_model',
        type: 'text',
        label_ar: 'الموديل والسنة',
        label_en: 'Model & Year',
        placeholder_ar: 'مثال: كامري 2022',
        placeholder_en: 'e.g. Camry 2022',
      },
      {
        id: 'problem_photo',
        type: 'photo',
        label_ar: 'صورة المشكلة',
        label_en: 'Problem Photo',
      },
      {
        id: 'problem_description',
        type: 'textarea',
        label_ar: 'وصف المشكلة',
        label_en: 'Problem Description',
        placeholder_ar: 'اوصف المشكلة بالتفصيل...',
        placeholder_en: 'Describe the issue in detail...',
      },
      {
        id: 'mobile_service',
        type: 'toggle',
        label_ar: 'أبي الخدمة عندي (متنقل)',
        label_en: 'I want mobile service (at my location)',
      },
      {
        id: 'urgency',
        type: 'select',
        label_ar: 'مستوى الاستعجال',
        label_en: 'Urgency Level',
        options: [
          { value: 'normal', label_ar: 'عادي', label_en: 'Normal', icon: '🟢' },
          { value: 'soon', label_ar: 'أقرب وقت', label_en: 'ASAP', icon: '🟡' },
          { value: 'emergency', label_ar: 'طوارئ', label_en: 'Emergency', icon: '🔴' },
        ],
      },
    ],
  },

  // ━━━ 3. FOOD & COOKING ━━━
  {
    id: 'food_order',
    category: 'food',
    icon: '🍽️',
    color: 'from-orange-500 to-red-500',
    title_ar: 'أكل وطبخ',
    title_en: 'Food & Cooking',
    subtitle_ar: 'طبخ منزلي، حلويات، مناسبات',
    subtitle_en: 'Home cooking, sweets, events',
    illustration: '🧑‍🍳',
    summaryTemplate_ar: 'طلب {meal_type} لـ {guest_count} شخص',
    summaryTemplate_en: '{meal_type} order for {guest_count} people',
    fields: [
      {
        id: 'meal_type',
        type: 'select',
        label_ar: 'نوع الوجبة',
        label_en: 'Meal Type',
        required: true,
        options: [
          { value: 'lunch', label_ar: 'غداء', label_en: 'Lunch', icon: '🍛' },
          { value: 'dinner', label_ar: 'عشاء', label_en: 'Dinner', icon: '🥘' },
          { value: 'breakfast', label_ar: 'فطور', label_en: 'Breakfast', icon: '🥞' },
          { value: 'sweets', label_ar: 'حلويات', label_en: 'Sweets/Desserts', icon: '🍰' },
          { value: 'pastries', label_ar: 'معجنات', label_en: 'Pastries', icon: '🥐' },
          { value: 'event_catering', label_ar: 'تموين مناسبة', label_en: 'Event Catering', icon: '🎉' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'cuisine',
        type: 'multi_select',
        label_ar: 'نوع المطبخ',
        label_en: 'Cuisine',
        options: [
          { value: 'saudi', label_ar: 'سعودي', label_en: 'Saudi' },
          { value: 'yemeni', label_ar: 'يمني', label_en: 'Yemeni' },
          { value: 'lebanese', label_ar: 'لبناني', label_en: 'Lebanese' },
          { value: 'indian', label_ar: 'هندي', label_en: 'Indian' },
          { value: 'western', label_ar: 'غربي', label_en: 'Western' },
          { value: 'asian', label_ar: 'آسيوي', label_en: 'Asian' },
        ],
      },
      {
        id: 'guest_count',
        type: 'number',
        label_ar: 'عدد الأشخاص',
        label_en: 'Number of People',
        min: 1,
        max: 500,
        required: true,
      },
      {
        id: 'allergies',
        type: 'multi_select',
        label_ar: 'حساسيات أو قيود',
        label_en: 'Allergies & Restrictions',
        options: [
          { value: 'gluten_free', label_ar: 'بدون قلوتين', label_en: 'Gluten-Free' },
          { value: 'dairy_free', label_ar: 'بدون ألبان', label_en: 'Dairy-Free' },
          { value: 'nut_free', label_ar: 'بدون مكسرات', label_en: 'Nut-Free' },
          { value: 'spicy', label_ar: 'بدون حار', label_en: 'No Spicy' },
          { value: 'vegetarian', label_ar: 'نباتي', label_en: 'Vegetarian' },
        ],
      },
      {
        id: 'dish_details',
        type: 'textarea',
        label_ar: 'تفاصيل الأطباق',
        label_en: 'Dish Details',
        placeholder_ar: 'مثال: كبسة لحم + سلطة + مشروبات...',
        placeholder_en: 'e.g. Lamb kabsa + salad + drinks...',
      },
      {
        id: 'delivery_time_preference',
        type: 'select',
        label_ar: 'وقت التوصيل',
        label_en: 'Delivery Time',
        options: [
          { value: 'asap', label_ar: 'أسرع وقت', label_en: 'ASAP', icon: '⚡' },
          { value: 'lunch_time', label_ar: 'وقت الغداء (12-2)', label_en: 'Lunch (12-2pm)', icon: '☀️' },
          { value: 'dinner_time', label_ar: 'وقت العشاء (7-9)', label_en: 'Dinner (7-9pm)', icon: '🌙' },
          { value: 'custom', label_ar: 'وقت محدد', label_en: 'Custom Time', icon: '🕐' },
        ],
      },
    ],
  },

  // ━━━ 4. HOME REPAIR & MAINTENANCE ━━━
  {
    id: 'home_repair',
    category: 'repair',
    icon: '🏠',
    color: 'from-emerald-500 to-teal-500',
    title_ar: 'صيانة منزلية',
    title_en: 'Home Repair',
    subtitle_ar: 'سباكة، كهرباء، تكييف، نجارة',
    subtitle_en: 'Plumbing, electrical, AC, carpentry',
    illustration: '🔨',
    summaryTemplate_ar: 'طلب {repair_type}',
    summaryTemplate_en: '{repair_type} request',
    fields: [
      {
        id: 'repair_type',
        type: 'select',
        label_ar: 'نوع الصيانة',
        label_en: 'Repair Type',
        required: true,
        options: [
          { value: 'plumbing', label_ar: 'سباكة', label_en: 'Plumbing', icon: '🚿' },
          { value: 'electrical', label_ar: 'كهرباء', label_en: 'Electrical', icon: '💡' },
          { value: 'ac', label_ar: 'تكييف', label_en: 'AC/HVAC', icon: '❄️' },
          { value: 'painting', label_ar: 'دهان', label_en: 'Painting', icon: '🎨' },
          { value: 'carpentry', label_ar: 'نجارة', label_en: 'Carpentry', icon: '🪚' },
          { value: 'cleaning', label_ar: 'تنظيف عميق', label_en: 'Deep Cleaning', icon: '🧹' },
          { value: 'pest_control', label_ar: 'مكافحة حشرات', label_en: 'Pest Control', icon: '🐛' },
          { value: 'glass', label_ar: 'زجاج ونوافذ', label_en: 'Glass/Windows', icon: '🪟' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'problem_photo',
        type: 'photo',
        label_ar: 'صورة المشكلة',
        label_en: 'Problem Photo',
      },
      {
        id: 'problem_description',
        type: 'textarea',
        label_ar: 'وصف المشكلة',
        label_en: 'Problem Description',
        placeholder_ar: 'مثال: تسريب ماء في المطبخ تحت المغسلة...',
        placeholder_en: 'e.g. Water leak under the kitchen sink...',
        required: true,
      },
      {
        id: 'property_type',
        type: 'select',
        label_ar: 'نوع العقار',
        label_en: 'Property Type',
        options: [
          { value: 'apartment', label_ar: 'شقة', label_en: 'Apartment' },
          { value: 'villa', label_ar: 'فيلا', label_en: 'Villa' },
          { value: 'office', label_ar: 'مكتب', label_en: 'Office' },
          { value: 'shop', label_ar: 'محل', label_en: 'Shop' },
        ],
      },
      {
        id: 'urgency',
        type: 'select',
        label_ar: 'الاستعجال',
        label_en: 'Urgency',
        options: [
          { value: 'normal', label_ar: 'عادي', label_en: 'Normal', icon: '🟢' },
          { value: 'soon', label_ar: 'أقرب وقت', label_en: 'ASAP', icon: '🟡' },
          { value: 'emergency', label_ar: 'طوارئ (الآن)', label_en: 'Emergency (Now)', icon: '🔴' },
        ],
      },
    ],
  },

  // ━━━ 5. SHOPPING & ERRANDS ━━━
  {
    id: 'shopping',
    category: 'errands',
    icon: '🛒',
    color: 'from-amber-500 to-yellow-500',
    title_ar: 'تسوّق ومشاوير',
    title_en: 'Shopping & Errands',
    subtitle_ar: 'اشتري لي من السوق أو المول',
    subtitle_en: 'Buy from market or mall for me',
    illustration: '🛍️',
    summaryTemplate_ar: 'طلب شراء من {store_name}',
    summaryTemplate_en: 'Shopping request from {store_name}',
    fields: [
      {
        id: 'store_name',
        type: 'text',
        label_ar: 'اسم المحل أو المكان',
        label_en: 'Store / Place Name',
        placeholder_ar: 'مثال: إكسترا، ساكو، سوق العويس...',
        placeholder_en: 'e.g. Extra, SACO, local market...',
      },
      {
        id: 'shopping_list',
        type: 'textarea',
        label_ar: 'قائمة المشتريات',
        label_en: 'Shopping List',
        placeholder_ar: 'اكتب اللي تبيه بالتفصيل...',
        placeholder_en: 'Write what you need in detail...',
        required: true,
      },
      {
        id: 'budget',
        type: 'number',
        label_ar: 'الميزانية التقريبية (ر.س)',
        label_en: 'Approximate Budget (SAR)',
        min: 0,
        max: 50000,
      },
      {
        id: 'substitution',
        type: 'select',
        label_ar: 'إذا ما لقى المطلوب؟',
        label_en: 'If item not available?',
        options: [
          { value: 'call_me', label_ar: 'اتصل علي', label_en: 'Call me', icon: '📞' },
          { value: 'similar', label_ar: 'اشتري بديل مشابه', label_en: 'Get similar', icon: '🔄' },
          { value: 'skip', label_ar: 'لا تشتري', label_en: 'Skip it', icon: '⏭️' },
        ],
      },
      {
        id: 'list_photo',
        type: 'photo',
        label_ar: 'صورة القائمة أو المنتج',
        label_en: 'List / Product Photo',
      },
    ],
  },

  // ━━━ 6. DELIVERY & MOVING ━━━
  {
    id: 'delivery',
    category: 'logistics',
    icon: '📦',
    color: 'from-indigo-500 to-violet-500',
    title_ar: 'توصيل ونقل',
    title_en: 'Delivery & Moving',
    subtitle_ar: 'وصّل طرد، نقل أغراض',
    subtitle_en: 'Deliver a package, move items',
    illustration: '🚚',
    summaryTemplate_ar: 'طلب توصيل {package_type}',
    summaryTemplate_en: '{package_type} delivery request',
    fields: [
      {
        id: 'package_type',
        type: 'select',
        label_ar: 'نوع الشحنة',
        label_en: 'Package Type',
        required: true,
        options: [
          { value: 'small', label_ar: 'طرد صغير', label_en: 'Small Package', icon: '📦' },
          { value: 'documents', label_ar: 'مستندات', label_en: 'Documents', icon: '📄' },
          { value: 'food', label_ar: 'أكل', label_en: 'Food', icon: '🍱' },
          { value: 'furniture', label_ar: 'أثاث', label_en: 'Furniture', icon: '🛋️' },
          { value: 'electronics', label_ar: 'أجهزة إلكترونية', label_en: 'Electronics', icon: '📱' },
          { value: 'large', label_ar: 'شحنة كبيرة', label_en: 'Large Shipment', icon: '🏗️' },
        ],
      },
      {
        id: 'fragile',
        type: 'toggle',
        label_ar: 'قابل للكسر',
        label_en: 'Fragile item',
      },
      {
        id: 'package_description',
        type: 'textarea',
        label_ar: 'وصف الشحنة',
        label_en: 'Package Description',
        placeholder_ar: 'وصف ما تبي توصل...',
        placeholder_en: 'Describe what you want delivered...',
      },
      {
        id: 'package_photo',
        type: 'photo',
        label_ar: 'صورة الشحنة',
        label_en: 'Package Photo',
      },
    ],
  },

  // ━━━ 7. TECH & ELECTRONICS ━━━
  {
    id: 'tech_repair',
    category: 'tech',
    icon: '💻',
    color: 'from-slate-600 to-zinc-500',
    title_ar: 'أجهزة وتقنية',
    title_en: 'Tech & Electronics',
    subtitle_ar: 'تصليح جوال، لابتوب، تركيب',
    subtitle_en: 'Phone, laptop repair, setup',
    illustration: '📱',
    summaryTemplate_ar: 'طلب {tech_service} — {device_type}',
    summaryTemplate_en: '{tech_service} request — {device_type}',
    fields: [
      {
        id: 'tech_service',
        type: 'select',
        label_ar: 'نوع الخدمة',
        label_en: 'Service Type',
        required: true,
        options: [
          { value: 'screen_repair', label_ar: 'تغيير شاشة', label_en: 'Screen Repair', icon: '📱' },
          { value: 'battery', label_ar: 'تغيير بطارية', label_en: 'Battery Replace', icon: '🔋' },
          { value: 'software', label_ar: 'برمجيات', label_en: 'Software', icon: '💿' },
          { value: 'data_recovery', label_ar: 'استعادة بيانات', label_en: 'Data Recovery', icon: '💾' },
          { value: 'setup', label_ar: 'تركيب وإعداد', label_en: 'Setup/Install', icon: '⚙️' },
          { value: 'network', label_ar: 'شبكات وانترنت', label_en: 'Network/Internet', icon: '📡' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'device_type',
        type: 'text',
        label_ar: 'نوع الجهاز',
        label_en: 'Device Type',
        placeholder_ar: 'مثال: ايفون 15، لابتوب HP...',
        placeholder_en: 'e.g. iPhone 15, HP Laptop...',
        required: true,
      },
      {
        id: 'problem_photo',
        type: 'photo',
        label_ar: 'صورة المشكلة',
        label_en: 'Problem Photo',
      },
      {
        id: 'problem_description',
        type: 'textarea',
        label_ar: 'وصف المشكلة',
        label_en: 'Describe the Issue',
        placeholder_ar: 'اشرح المشكلة بالتفصيل...',
        placeholder_en: 'Explain the issue in detail...',
      },
    ],
  },

  // ━━━ 8. PERSONAL SERVICES ━━━
  {
    id: 'personal',
    category: 'personal',
    icon: '💈',
    color: 'from-rose-500 to-pink-500',
    title_ar: 'خدمات شخصية',
    title_en: 'Personal Services',
    subtitle_ar: 'حلاقة، تجميل، تنظيف',
    subtitle_en: 'Barber, beauty, cleaning',
    illustration: '💇',
    summaryTemplate_ar: 'طلب {personal_service}',
    summaryTemplate_en: '{personal_service} request',
    fields: [
      {
        id: 'personal_service',
        type: 'select',
        label_ar: 'نوع الخدمة',
        label_en: 'Service Type',
        required: true,
        options: [
          { value: 'barber', label_ar: 'حلاقة رجالية', label_en: 'Men\'s Barber', icon: '💈' },
          { value: 'beauty', label_ar: 'تجميل وميكاب', label_en: 'Beauty/Makeup', icon: '💄' },
          { value: 'nails', label_ar: 'أظافر', label_en: 'Nails', icon: '💅' },
          { value: 'massage', label_ar: 'مساج', label_en: 'Massage', icon: '💆' },
          { value: 'laundry', label_ar: 'غسيل وكوي', label_en: 'Laundry/Iron', icon: '👔' },
          { value: 'other', label_ar: 'أخرى', label_en: 'Other', icon: '✏️' },
        ],
      },
      {
        id: 'at_home',
        type: 'toggle',
        label_ar: 'الخدمة في البيت',
        label_en: 'Service at home',
      },
      {
        id: 'service_details',
        type: 'textarea',
        label_ar: 'تفاصيل الخدمة',
        label_en: 'Service Details',
        placeholder_ar: 'اشرح اللي تبيه بالضبط...',
        placeholder_en: 'Describe exactly what you need...',
      },
      {
        id: 'reference_photo',
        type: 'photo',
        label_ar: 'صورة مرجعية',
        label_en: 'Reference Photo',
      },
    ],
  },
];

export function getTemplateById(id: string): ServiceTemplate | undefined {
  return SERVICE_TEMPLATES.find(t => t.id === id);
}

export function generateOrderSummary(
  template: ServiceTemplate,
  values: Record<string, any>,
  lang: 'ar' | 'en'
): string {
  let summary = lang === 'ar' ? template.summaryTemplate_ar : template.summaryTemplate_en;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      // Try to find label from options
      const field = template.fields.find(f => f.id === key);
      const option = field?.options?.find(o => o.value === value);
      const displayVal = option 
        ? (lang === 'ar' ? option.label_ar : option.label_en) 
        : value;
      summary = summary.replace(`{${key}}`, displayVal);
    }
  }
  // Clean up unreplaced placeholders
  summary = summary.replace(/\{[^}]+\}/g, '...');
  return summary;
}
