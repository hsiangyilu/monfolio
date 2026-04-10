"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    unauthorized: "此帳號未獲授權登入",
    OAuthCallbackError: "Google 驗證失敗，請重試",
    AccessDenied: "此帳號未獲授權登入",
    default: "登入時發生錯誤，請重試",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.default
    : null;

  function handleSignIn() {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] px-6">
      {/* Desktop: card wrapper, Mobile: no card */}
      <div className="w-full max-w-sm md:card-premium md:p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#e8b462] flex items-center justify-center">
            <span className="text-[#3d2b2f] font-bold text-xl">M</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#3d2b2f]">monfolio</h1>
            <p className="text-sm text-[#7e706a] mt-1">資產管理平台</p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full bg-[#f44336]/10 text-[#f44336] rounded-lg p-3 text-sm text-center"
          >
            {errorMessage}
          </div>
        )}

        {/* Google sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full h-11 rounded-lg bg-[#3d2b2f] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#3d2b2f]/90 transition-colors focus-visible:ring-3 focus-visible:ring-[#e8b462]/50 focus-visible:outline-none disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>登入中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#E8B462"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#E8B462"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#CD7B65"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#CD7B65"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>使用 Google 帳號登入</span>
            </>
          )}
        </button>

        {/* Trust signal */}
        <p className="text-xs text-[#7e706a]">僅限授權帳號登入</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
          <div className="animate-spin h-6 w-6 border-2 border-[#e8b462] border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
