export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type CategoryWithCount = Category & { fatwa_count: number };

export type Fatwa = {
  id: number;
  number: number;
  slug: string;
  title: string;
  question: string;
  answer: string;
  category_id: number | null;
  audio_url: string;
  audio_label: string;
  audio_duration: string;
  source: string;
  tags: string;
  published: number;
  views: number;
  created_at: string;
  updated_at: string;
};

export type FatwaWithCategory = Fatwa & {
  category_name: string | null;
  category_slug: string | null;
};

export type Book = {
  id: number;
  title: string;
  description: string;
  year: string;
  publisher: string;
  volumes: string;
  link_url: string;
  sort_order: number;
  created_at: string;
};

export type SearchHit = {
  fatwa: FatwaWithCategory;
  /** سبب اختيار هذه الفتوى — يملؤه الذكاء الاصطناعي عند توفره. */
  reason?: string;
  score: number;
};

export type SearchResponse = {
  query: string;
  /** ملخص إجابة يولده الذكاء الاصطناعي اعتمادًا على الفتاوى المسترجَعة. */
  summary: string | null;
  hits: SearchHit[];
  /** ai = أعاد Claude ترتيب النتائج، text = بحث نصي فقط. */
  mode: "ai" | "text";
  notice?: string;
};
