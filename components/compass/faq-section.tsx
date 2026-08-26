export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ items, title }: { items: FaqItem[]; title: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <details key={item.question} className="group py-2.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-gray-900 marker:content-none">
              {item.question}
              <span className="shrink-0 text-lg leading-none text-gray-400 transition group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
