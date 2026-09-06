export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#fafcfc] p-6 md:p-10" dir="rtl" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-6">
        <div className="h-16 rounded-[24px] bg-[#e8eded]" />
        <div className="h-32 rounded-[28px] bg-[#e8eded]" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-[24px] bg-[#e8eded]" />)}
        </div>
      </div>
    </main>
  );
}
