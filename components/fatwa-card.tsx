import Link from "next/link";
import { truncate } from "@/lib/arabic";
import type { FatwaWithCategory } from "@/lib/types";

type Props = {
  fatwa: FatwaWithCategory;
  reason?: string;
};

export default function FatwaCard({ fatwa, reason }: Props) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 transition hover:border-primary">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary-soft px-3 py-1 font-bold text-primary">
          فتوى رقم {fatwa.number}
        </span>
        {fatwa.category_name ? (
          <Link
            href={`/categories/${fatwa.category_slug}`}
            className="rounded-full border border-line px-3 py-1 text-muted transition hover:text-primary"
          >
            {fatwa.category_name}
          </Link>
        ) : null}
        {fatwa.audio_url ? (
          <span className="rounded-full border border-line px-3 py-1 text-muted">🎧 تسجيل صوتي</span>
        ) : null}
      </div>

      <h3 className="text-lg font-bold leading-snug">
        <Link href={`/fatwas/${fatwa.number}`} className="hover:text-primary">
          {fatwa.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-7 text-muted">{truncate(fatwa.question, 180)}</p>

      {reason ? (
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-primary">سبب الترشيح: </span>
          {reason}
        </p>
      ) : null}

      <Link
        href={`/fatwas/${fatwa.number}`}
        className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
      >
        قراءة الفتوى ←
      </Link>
    </article>
  );
}
