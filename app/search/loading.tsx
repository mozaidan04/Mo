export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">🔎 البحث بالذكاء الاصطناعي</h1>
      <p className="mt-4 text-muted">جارٍ البحث في المكتبة…</p>
      <div className="mt-8 grid gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
