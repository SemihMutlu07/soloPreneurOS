import { LoginForm } from "@/components/hiring/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect || "/hiring";
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card flex flex-col items-center gap-6 p-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-primary">
            Hire-OS Login
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Sign in to access the hiring dashboard
          </p>
        </div>
        {error && (
          <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-4 py-2 w-full text-center">
            Authentication failed. Please try again.
          </div>
        )}
        <LoginForm redirect={redirect} />
      </div>
    </div>
  );
}
