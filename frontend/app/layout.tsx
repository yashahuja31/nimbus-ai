import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nimbus AI — Your AI Cloud Engineer",
  description: "Plan, approve, and execute infrastructure changes safely.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#6C8CFF",
    colorBackground: "#0A0C10",
    colorInputBackground: "#14171D",
    colorInputText: "#EEF1F5",
    colorText: "#EEF1F5",
    colorTextSecondary: "#7C8492",
    borderRadius: "0.6rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-line",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body className="font-sans min-h-screen">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
