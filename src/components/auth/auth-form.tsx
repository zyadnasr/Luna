"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { getAuthMessages } from "@/i18n/auth-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/ui/logo-mark";
import { useLocale } from "@/components/ui/locale-provider";
import type { Locale } from "@/config/site";

const authCopy: Record<Locale, Record<string, string>> = {
  ar: {
    workspace: "مساحة الإدارة",
    welcome: "مرحبًا بعودتك",
    loginDescription: "سجّل الدخول لإدارة مساحة Luna Healthy.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    hide: "إخفاء",
    show: "إظهار",
    checking: "جارٍ التحقق...",
    signIn: "تسجيل الدخول",
    forgot: "نسيت كلمة المرور؟",
    recovery: "استعادة الوصول",
    forgotDescription: "أدخل بريد الحساب وسنرسل لك رابطًا آمنًا لإعادة التعيين.",
    sending: "جارٍ الإرسال...",
    sendRecovery: "إرسال رابط الاستعادة",
    backToLogin: "العودة لتسجيل الدخول",
    secureUpdate: "تحديث آمن",
    newPassword: "كلمة مرور جديدة",
    newPasswordDescription: "اختر كلمة مرور قوية لحماية حساب الإدارة.",
    newPasswordLabel: "كلمة المرور الجديدة",
    savePassword: "حفظ كلمة المرور",
    backToSite: "العودة للموقع",
    calm: "هدوء في الواجهة.",
    clarity: "وضوح في العمل.",
    footer: "مساحة Luna Healthy لإدارة التفاصيل اليومية بعناية.",
  },
  en: {
    workspace: "Admin workspace",
    welcome: "Welcome back",
    loginDescription: "Sign in to manage the Luna Healthy workspace.",
    email: "Email address",
    password: "Password",
    hide: "Hide",
    show: "Show",
    checking: "Signing in...",
    signIn: "Sign in",
    forgot: "Forgot password?",
    recovery: "Access recovery",
    forgotDescription: "Enter your account email and we will send a secure reset link.",
    sending: "Sending...",
    sendRecovery: "Send recovery link",
    backToLogin: "Back to sign in",
    secureUpdate: "Secure update",
    newPassword: "New password",
    newPasswordDescription: "Choose a strong password to protect the admin account.",
    newPasswordLabel: "New password",
    savePassword: "Save password",
    backToSite: "Back to site",
    calm: "Calm at the surface.",
    clarity: "Clarity at work.",
    footer: "A considered space for Luna Healthy's daily operations.",
  },
  it: {
    workspace: "Area amministrazione",
    welcome: "Bentornato",
    loginDescription: "Accedi per gestire lo spazio Luna Healthy.",
    email: "Indirizzo email",
    password: "Password",
    hide: "Nascondi",
    show: "Mostra",
    checking: "Accesso...",
    signIn: "Accedi",
    forgot: "Password dimenticata?",
    recovery: "Recupero accesso",
    forgotDescription: "Inserisci l'email dell'account e invieremo un link sicuro per il reset.",
    sending: "Invio...",
    sendRecovery: "Invia link di recupero",
    backToLogin: "Torna all'accesso",
    secureUpdate: "Aggiornamento sicuro",
    newPassword: "Nuova password",
    newPasswordDescription: "Scegli una password forte per proteggere l'account admin.",
    newPasswordLabel: "Nuova password",
    savePassword: "Salva password",
    backToSite: "Torna al sito",
    calm: "Calma in superficie.",
    clarity: "Chiarezza nel lavoro.",
    footer: "Uno spazio curato per le operazioni quotidiane di Luna Healthy.",
  },
};

export function LoginForm() {
  const { locale } = useLocale();
  const copy = authCopy[locale];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(getAuthMessages(locale).invalidCredentials);
      setLoading(false);
      return;
    }
    router.push("/admin");
  }
  return (
    <AuthCard eyebrow={copy.workspace} title={copy.welcome} description={copy.loginDescription}>
      <form className="grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="login-email">
          {copy.email}
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="login-password">
          {copy.password}
          <div className="flex gap-2">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm transition hover:border-[var(--color-brand-primary)]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? copy.hide : copy.show}
            </button>
          </div>
        </label>
        {error ? (
          <p
            className="rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={loading}>
          {loading ? copy.checking : copy.signIn}
        </Button>
        <Link
          className="text-center text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-brand-primary)]"
          href="/admin/forgot-password"
        >
          {copy.forgot}
        </Link>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const { locale } = useLocale();
  const copy = authCopy[locale];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
    });
    setLoading(false);
    if (resetError) setError(getAuthMessages(locale).resetError);
    else setMessage(getAuthMessages(locale).resetSent);
  }
  return (
    <AuthCard eyebrow={copy.recovery} title={copy.forgot} description={copy.forgotDescription}>
      <form className="grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="forgot-email">
          {copy.email}
          <Input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {message ? (
          <p
            className="rounded-[var(--radius-sm)] border border-[var(--color-success-border)] bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]"
            role="status"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={loading}>
          {loading ? copy.sending : copy.sendRecovery}
        </Button>
        <Link
          className="text-center text-sm text-[var(--color-text-muted)] underline"
          href="/admin/login"
        >
          {copy.backToLogin}
        </Link>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const { locale } = useLocale();
  const copy = authCopy[locale];
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function prepareSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setReady(Boolean(data.session));
      if (!data.session) setError(getAuthMessages(locale).linkError);
      setLoading(false);
    }

    void prepareSession();
    return () => {
      mounted = false;
    };
  }, [locale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    setError("");
    setLoading(true);
    const { error: updateError } = await supabaseUpdatePassword(password);
    if (updateError) setError(getAuthMessages(locale).updateError);
    else setMessage(getAuthMessages(locale).updated);
    setLoading(false);
  }
  return (
    <AuthCard
      eyebrow={copy.secureUpdate}
      title={copy.newPassword}
      description={copy.newPasswordDescription}
    >
      <form className="grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold" htmlFor="new-password">
          {copy.newPasswordLabel}
          <Input
            id="new-password"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {message ? (
          <p className="text-sm text-[var(--color-success)]" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={!ready || loading}>
          {loading ? copy.checking : copy.savePassword}
        </Button>
      </form>
    </AuthCard>
  );
}

async function supabaseUpdatePassword(password: string) {
  return createClient().auth.updateUser({ password });
}

function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const copy = authCopy[locale];
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[var(--color-background)] px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] shadow-[var(--shadow-elevated)] backdrop-blur-[var(--blur-glass)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden overflow-hidden bg-[var(--color-brand-secondary)] p-10 text-[var(--color-on-brand)] lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute -end-24 -top-24 size-72 rounded-full border border-[var(--glass-border)]"
            aria-hidden="true"
          />
          <div>
            <LogoMark size={68} />
            <p className="mt-8 max-w-xs text-3xl font-semibold leading-tight">
              {copy.calm}
              <br />
              {copy.clarity}
            </p>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[var(--color-on-brand-muted)]">
            {copy.footer}
          </p>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
            >
              {copy.backToSite}
            </Link>
            <LanguageSwitcher />
          </div>
          <section className="mx-auto max-w-md">
            <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">{description}</p>
            <div className="mt-9">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
