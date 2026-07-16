import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-grid">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-pulse text-sm tracking-widest uppercase font-display">Nimbus AI</p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  );
}
