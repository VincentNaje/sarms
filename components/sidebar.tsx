"use client";

import AvatarUpload from "@/components/avatar-upload";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookText,
  BookOpen,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/(protected)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Student", icon: Users },
  { href: "/subjects", label: "Subjects", icon: BookText },
  { href: "/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: ClipboardList },
];

export default function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col bg-[#1b4d5c] text-white">
      <div className="flex flex-col items-center gap-2 px-4 pt-8 pb-6">
        <AvatarUpload />
        {userEmail && (
          <span className="max-w-full truncate text-[1px] text-white/70 whitespace-pre-line text-center">
            College of Tourism Management 
          </span>
          
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-sky-600/90 font-medium text-white"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="px-3 pb-6">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </form>
    </aside>
  );
}
