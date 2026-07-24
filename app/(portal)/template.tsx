// Next.js remounts template.tsx (unlike layout.tsx) on every navigation,
// which is exactly what we need to replay the CSS entrance animation per page.
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
