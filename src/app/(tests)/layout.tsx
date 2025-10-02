import { AuthGuard } from "@/components/auth/auth-guard";

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
