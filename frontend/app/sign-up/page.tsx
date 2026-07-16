import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-grid">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-pulse text-sm tracking-widest uppercase font-display">Nimbus AI</p>
        </div>
        <SignUp
          routing="hash"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  );
}
