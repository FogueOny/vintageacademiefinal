import CorrectionsClientPage from "./ClientPage";

// Disable prerender/SSG to avoid running browser-only code at build time
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function CorrectionsPage() {
  return <CorrectionsClientPage />;
}