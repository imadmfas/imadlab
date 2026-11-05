// فهرس تجارب مختبر الأحياء
// status: 'free' (مجانية متاحة) | 'free-soon' (مجانية قيد البناء) | 'pro' (للمشتركين)
export const SITE = {
  name: 'مختبر عماد الافتراضي',
  nameEn: 'ImadLab',
  author: 'إعداد البروفيسور عماد محمد فرحان',
  // ضع رقم واتساب بالصيغة الدولية دون + أو أصفار في البداية، مثل 9647XXXXXXXXX
  whatsapp: '',
};

export const LEVELS = { school: 'الإعدادية', uni: 'الجامعة' };

export const CATEGORIES = [
  { id: 'micro', icon: '🔬', ar: 'المجهر والخلية', en: 'Microscopy & Cells', desc: 'استعمال المجهر الضوئي وتحضير الشرائح ومشاهدة الخلايا وانقسامها.' },
  { id: 'biochem', icon: '🧪', ar: 'الكيمياء الحيوية', en: 'Biochemistry', desc: 'الكشف عن المركّبات الحيوية، ونشاط الإنزيمات، وحركة الماء والمواد عبر الأغشية.' },
  { id: 'plant', icon: '🌿', ar: 'فسلجة النبات', en: 'Plant Physiology', desc: 'البناء الضوئي والأصباغ والثغور والنتح.' },
  { id: 'microbio', icon: '🦠', ar: 'الأحياء المجهرية', en: 'Microbiology', desc: 'التعقيم، وزرع البكتيريا، وصبغة غرام، واختبار المضادات الحيوية.' },
  { id: 'anatomy', icon: '🫀', ar: 'التشريح وفسلجة الحيوان', en: 'Anatomy & Animal Physiology', desc: 'تشريح الأعضاء والحيوانات، وفحوص الدم، وقياس العلامات الحيوية.' },
  { id: 'genetics', icon: '🧬', ar: 'الوراثة', en: 'Genetics', desc: 'تجارب التهجين، واحتمالات مندل، والنمط النووي.' },
  { id: 'ecology', icon: '🌍', ar: 'علم البيئة', en: 'Ecology', desc: 'أخذ العينات من البيئة وفحص نوعية المياه.' },
  { id: 'molecular', icon: '⚗️', ar: 'التقنيات الجزيئية', en: 'Molecular Techniques', desc: 'أدوات المختبر الجامعي وتقنيات البيولوجيا الجزيئية.' },
];

const S = ['school', 'uni'];
export const EXPERIMENTS = [
  // المجهر والخلية
  { id: 'microscope-onion', cat: 'micro', ar: 'المجهر الضوئي وخلايا بشرة البصل', en: 'Light Microscope & Onion Epidermis', levels: S, min: 25, status: 'free' },
  { id: 'cheek-cells', cat: 'micro', ar: 'خلايا بطانة الخد وصبغة المثيلين الزرقاء', en: 'Cheek Cells & Methylene Blue', levels: S, min: 20, status: 'pro' },
  { id: 'mitosis-root', cat: 'micro', ar: 'الانقسام الخيطي في قمة جذر البصل', en: 'Mitosis in Onion Root Tip', levels: S, min: 35, status: 'pro' },
  { id: 'meiosis', cat: 'micro', ar: 'مراحل الانقسام الاختزالي', en: 'Stages of Meiosis', levels: S, min: 30, status: 'pro' },
  { id: 'plant-animal-cell', cat: 'micro', ar: 'مقارنة الخلية النباتية بالحيوانية', en: 'Plant vs Animal Cells', levels: ['school'], min: 20, status: 'pro' },

  // الكيمياء الحيوية
  { id: 'food-tests', cat: 'biochem', ar: 'الكشف عن السكريات والنشا والبروتين والدهون', en: 'Food Tests', levels: S, min: 30, status: 'free-soon' },
  { id: 'enzyme-temperature', cat: 'biochem', ar: 'أثر درجة الحرارة في نشاط الإنزيم', en: 'Effect of Temperature on Enzyme Activity', levels: S, min: 30, status: 'free-soon' },
  { id: 'osmosis-potato', cat: 'biochem', ar: 'الأسموزية في أنسجة البطاطا', en: 'Osmosis in Potato Tissue', levels: S, min: 25, status: 'free-soon' },
  { id: 'enzyme-ph', cat: 'biochem', ar: 'أثر الأس الهيدروجيني في نشاط الإنزيم', en: 'Effect of pH on Enzyme Activity', levels: S, min: 25, status: 'pro' },
  { id: 'diffusion', cat: 'biochem', ar: 'الانتشار في الآكار ونسبة السطح إلى الحجم', en: 'Diffusion & Surface Area to Volume', levels: S, min: 20, status: 'pro' },
  { id: 'dna-extraction', cat: 'biochem', ar: 'استخلاص الحمض النووي من الفراولة', en: 'DNA Extraction from Strawberry', levels: S, min: 25, status: 'pro' },

  // فسلجة النبات
  { id: 'photosynthesis-elodea', cat: 'plant', ar: 'البناء الضوئي وشدة الضوء في نبات الإيلوديا', en: 'Photosynthesis in Elodea', levels: S, min: 30, status: 'pro' },
  { id: 'chromatography', cat: 'plant', ar: 'فصل أصباغ البلاستيدات بالكروماتوغرافيا', en: 'Chromatography of Plant Pigments', levels: S, min: 25, status: 'pro' },
  { id: 'stomata', cat: 'plant', ar: 'الثغور في بشرة الورقة', en: 'Leaf Stomata', levels: S, min: 20, status: 'pro' },
  { id: 'transpiration', cat: 'plant', ar: 'قياس النتح بجهاز البوتوميتر', en: 'Transpiration with a Potometer', levels: S, min: 30, status: 'pro' },

  // الأحياء المجهرية
  { id: 'aseptic', cat: 'microbio', ar: 'التقنية المعقّمة ونقل المزارع', en: 'Aseptic Technique', levels: S, min: 25, status: 'pro' },
  { id: 'gram-stain', cat: 'microbio', ar: 'صبغة غرام وتصنيف البكتيريا', en: 'Gram Staining', levels: S, min: 35, status: 'pro' },
  { id: 'agar-culture', cat: 'microbio', ar: 'زرع البكتيريا على وسط الآكار', en: 'Culturing Bacteria on Agar', levels: S, min: 30, status: 'pro' },
  { id: 'antibiotic', cat: 'microbio', ar: 'حساسية البكتيريا للمضادات الحيوية', en: 'Antibiotic Sensitivity', levels: ['uni'], min: 35, status: 'pro' },

  // التشريح وفسلجة الحيوان
  { id: 'heart-dissection', cat: 'anatomy', ar: 'تشريح قلب الخروف', en: 'Sheep Heart Dissection', levels: S, min: 35, status: 'free-soon' },
  { id: 'frog-dissection', cat: 'anatomy', ar: 'تشريح الضفدع', en: 'Frog Dissection', levels: S, min: 40, status: 'pro' },
  { id: 'eye-dissection', cat: 'anatomy', ar: 'تشريح العين', en: 'Eye Dissection', levels: S, min: 30, status: 'pro' },
  { id: 'kidney-dissection', cat: 'anatomy', ar: 'تشريح الكلية', en: 'Kidney Dissection', levels: S, min: 30, status: 'pro' },
  { id: 'fish-dissection', cat: 'anatomy', ar: 'تشريح السمكة', en: 'Fish Dissection', levels: ['school'], min: 30, status: 'pro' },
  { id: 'blood-smear', cat: 'anatomy', ar: 'تحضير مسحة دم وعدّ الخلايا', en: 'Blood Smear', levels: S, min: 30, status: 'pro' },
  { id: 'blood-typing', cat: 'anatomy', ar: 'تحديد فصائل الدم', en: 'Blood Typing', levels: S, min: 20, status: 'pro' },
  { id: 'pulse', cat: 'anatomy', ar: 'قياس النبض والتنفس قبل الجهد وبعده', en: 'Pulse & Breathing Rate', levels: ['school'], min: 20, status: 'pro' },

  // الوراثة
  { id: 'drosophila', cat: 'genetics', ar: 'تهجين ذبابة الفاكهة', en: 'Drosophila Crosses', levels: S, min: 35, status: 'pro' },
  { id: 'mendel', cat: 'genetics', ar: 'احتمالات مندل ومربع بانيت', en: 'Mendelian Probability', levels: ['school'], min: 20, status: 'pro' },
  { id: 'karyotype', cat: 'genetics', ar: 'ترتيب النمط النووي', en: 'Karyotyping', levels: S, min: 25, status: 'pro' },

  // علم البيئة
  { id: 'quadrat', cat: 'ecology', ar: 'أخذ العينات بطريقة المربعات', en: 'Quadrat Sampling', levels: S, min: 25, status: 'pro' },
  { id: 'water-quality', cat: 'ecology', ar: 'فحص نوعية مياه النهر', en: 'River Water Quality', levels: S, min: 30, status: 'pro' },

  // التقنيات الجزيئية (جامعي)
  { id: 'micropipette', cat: 'molecular', ar: 'استعمال الماصّة الدقيقة', en: 'Using a Micropipette', levels: ['uni'], min: 20, status: 'pro' },
  { id: 'serial-dilution', cat: 'molecular', ar: 'التخفيف المتسلسل', en: 'Serial Dilution', levels: ['uni'], min: 25, status: 'pro' },
  { id: 'centrifuge', cat: 'molecular', ar: 'جهاز الطرد المركزي وموازنته', en: 'Centrifugation', levels: ['uni'], min: 20, status: 'pro' },
  { id: 'spectrophotometry', cat: 'molecular', ar: 'المطياف الضوئي ومنحنى المعايرة', en: 'Spectrophotometry', levels: ['uni'], min: 30, status: 'pro' },
  { id: 'pcr', cat: 'molecular', ar: 'تفاعل البوليميراز المتسلسل', en: 'PCR', levels: ['uni'], min: 35, status: 'pro' },
  { id: 'gel-electrophoresis', cat: 'molecular', ar: 'الترحيل الكهربائي في هلام الأغاروز', en: 'Agarose Gel Electrophoresis', levels: ['uni'], min: 35, status: 'pro' },
];
