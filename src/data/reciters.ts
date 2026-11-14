export interface ReciterInfo {
  id: string;
  name: string;
  style: string;
  country: string;
  folder: string;
  offlineLocal?: boolean;
}

export const DEFAULT_RECITER_ID = 'alafasy';
const RECITER_STORAGE_KEY = 'selected_reciter_v1';

export const RECITERS: ReciterInfo[] = [
  {
    id: 'alafasy',
    name: 'مشاري راشد العفاسي',
    style: 'مرتل · مدمج بدون إنترنت',
    country: 'الكويت',
    folder: 'Alafasy_128kbps',
    offlineLocal: true,
  },
  {
    id: 'abdulbasit_murattal',
    name: 'عبد الباسط عبد الصمد (مرتل)',
    style: 'مرتل',
    country: 'مصر',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'abdulbasit_mujawwad',
    name: 'عبد الباسط عبد الصمد (مجود)',
    style: 'مجود',
    country: 'مصر',
    folder: 'Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 'minshawi_murattal',
    name: 'محمد صديق المنشاوي (مرتل)',
    style: 'مرتل',
    country: 'مصر',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'minshawi_mujawwad',
    name: 'محمد صديق المنشاوي (مجود)',
    style: 'مجود',
    country: 'مصر',
    folder: 'Minshawy_Mujawwad_192kbps',
  },
  {
    id: 'husary',
    name: 'محمود خليل الحصري',
    style: 'مرتل متقن',
    country: 'مصر',
    folder: 'Husary_128kbps',
  },
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    style: 'تلاوة الحرم المكي',
    country: 'السعودية',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'shuraim',
    name: 'سعود الشريم',
    style: 'تلاوة الحرم المكي',
    country: 'السعودية',
    folder: 'Saood_ash-Shuraym_128kbps',
  },
  {
    id: 'maher',
    name: 'ماهر المعيقلي',
    style: 'تلاوة الحرم المكي',
    country: 'السعودية',
    folder: 'MaherAlMuaiqly128kbps',
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    style: 'تلاوة خاشعة',
    country: 'السعودية',
    folder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'qatami',
    name: 'ناصر القطامي',
    style: 'تلاوة خاشعة',
    country: 'السعودية',
    folder: 'Nasser_Alqatami_128kbps',
  },
  {
    id: 'ajmy',
    name: 'أحمد بن علي العجمي',
    style: 'مرتل',
    country: 'السعودية',
    folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net',
  },
  {
    id: 'ghamadi',
    name: 'سعد الغامدي',
    style: 'مرتل',
    country: 'السعودية',
    folder: 'Ghamadi_40kbps',
  },
  {
    id: 'hudhaify',
    name: 'علي عبد الرحمن الحذيفي',
    style: 'تلاوة المسجد النبوي',
    country: 'السعودية',
    folder: 'Hudhaify_128kbps',
  },
  {
    id: 'tablawy',
    name: 'محمد محمود الطبلاوي',
    style: 'مرتل',
    country: 'مصر',
    folder: 'Mohammad_al_Tablaway_128kbps',
  },
  {
    id: 'banna',
    name: 'محمود علي البنا',
    style: 'مرتل',
    country: 'مصر',
    folder: 'mahmoud_ali_al_banna_32kbps',
  },
  {
    id: 'jibreel',
    name: 'محمد جبريل',
    style: 'مرتل',
    country: 'مصر',
    folder: 'Muhammad_Jibreel_128kbps',
  },
  {
    id: 'ayyoub',
    name: 'محمد أيوب',
    style: 'تلاوة الحرم النبوي',
    country: 'السعودية',
    folder: 'Muhammad_Ayyoub_128kbps',
  },
  {
    id: 'basfar',
    name: 'عبد الله بصفر',
    style: 'مرتل',
    country: 'السعودية',
    folder: 'Abdullah_Basfar_192kbps',
  },
  {
    id: 'rifai',
    name: 'هاني الرفاعي',
    style: 'تلاوة خاشعة',
    country: 'السعودية',
    folder: 'Hani_Rifai_192kbps',
  },
  {
    id: 'shatri',
    name: 'أبو بكر الشاطري',
    style: 'مرتل',
    country: 'السعودية',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 'juhaynee',
    name: 'عبد الله عواد الجهني',
    style: 'تلاوة الحرم المكي',
    country: 'السعودية',
    folder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps',
  },
  {
    id: 'budair',
    name: 'صلاح البدير',
    style: 'تلاوة المسجد النبوي',
    country: 'السعودية',
    folder: 'Salah_Al_Budair_128kbps',
  },
  {
    id: 'akhdar',
    name: 'إبراهيم الأخضر',
    style: 'تلاوة المسجد النبوي',
    country: 'السعودية',
    folder: 'Ibrahim_Akhdar_32kbps',
  },
  {
    id: 'matroud',
    name: 'عبد الله المطرود',
    style: 'مرتل',
    country: 'السعودية',
    folder: 'Abdullah_Matroud_128kbps',
  },
];

export function getReciterById(id: string): ReciterInfo {
  return RECITERS.find((r) => r.id === id) || RECITERS[0];
}

export function getAyahAudioUrl(reciterId: string, surahNum: number, ayahNum: number): string {
  const reciter = getReciterById(reciterId);
  if (reciter.offlineLocal) {
    return `/assets/audio/${surahNum}/${ayahNum}.mp3`;
  }
  const padSurah = String(surahNum).padStart(3, '0');
  const padAyah = String(ayahNum).padStart(3, '0');
  return `https://everyayah.com/data/${reciter.folder}/${padSurah}${padAyah}.mp3`;
}

export function loadSelectedReciterId(): string {
  try {
    const saved = localStorage.getItem(RECITER_STORAGE_KEY);
    if (saved && RECITERS.some((r) => r.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_RECITER_ID;
}

export function saveSelectedReciterId(reciterId: string): void {
  try {
    localStorage.setItem(RECITER_STORAGE_KEY, reciterId);
  } catch {
    // Ignore storage errors
  }
}
