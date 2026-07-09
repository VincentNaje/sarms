import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F0F0F0] p-6">
      <div className="w-full max-w-md rounded-lg bg-white px-10 py-12 shadow-lg">
        <h1 className="mb-10 text-center text-3xl font-normal text-gray-800">
          Login
        </h1>
        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
