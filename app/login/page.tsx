import LoginForm from "./login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1522] p-6">
           {/* Background photo */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay so the white card/text stays readable over any photo */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Login card sits above the photo + overlay */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#232b3d]/90 px-10 py-10 shadow-2xl backdrop-blur">
        <Image src="/logo.png" alt="College Seal" width={112} height={112} className="mx-auto mb-5" />
        <h1 className="mb-1 text-center text-sm font-bold uppercase tracking-wide text-white">
          Southern Luzon Technological College Foundation
        </h1>
        <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-white">
          Pio Duran, Incorporated
        </p>
        <p className="mb-8 text-center text-sm text-gray-300">
          College of Tourism Management
        </p>

        <LoginForm />
      </div>
    </main>
  );
}