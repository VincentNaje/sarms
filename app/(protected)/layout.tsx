import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar userEmail={user?.email} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}