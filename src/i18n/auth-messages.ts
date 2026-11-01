import type { Locale } from "@/config/site";

export const authMessages: Record<
  Locale,
  {
    invalidCredentials: string;
    resetError: string;
    resetSent: string;
    updateError: string;
    linkError: string;
    updated: string;
  }
> = {
  ar: {
    invalidCredentials: "بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.",
    resetError: "تعذر إرسال رابط الاستعادة. حاول مرة أخرى.",
    resetSent: "إذا كان البريد مسجلًا، فسيتم إرسال رابط استعادة كلمة المرور.",
    updateError: "تعذر تحديث كلمة المرور. افتح رابط الاستعادة مرة أخرى.",
    linkError: "رابط الدعوة منتهي أو غير صالح. اطلب دعوة جديدة من الإدارة.",
    updated: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
  },
  en: {
    invalidCredentials: "The email or password is incorrect.",
    resetError: "The recovery link could not be sent. Try again.",
    resetSent: "If the email is registered, a password recovery link will be sent.",
    updateError: "The password could not be updated. Open the recovery link again.",
    linkError:
      "This invitation link is expired or invalid. Ask the administrator for a new invitation.",
    updated: "Your password was updated. You can sign in now.",
  },
  it: {
    invalidCredentials: "L'email o la password non sono corrette.",
    resetError: "Non è stato possibile inviare il link di recupero. Riprova.",
    resetSent: "Se l'email è registrata, verrà inviato un link per recuperare la password.",
    updateError: "Non è stato possibile aggiornare la password. Apri di nuovo il link di recupero.",
    linkError:
      "Il link d'invito è scaduto o non valido. Chiedi un nuovo invito all'amministratore.",
    updated: "La password è stata aggiornata. Ora puoi accedere.",
  },
};

export function getAuthMessages(locale?: Locale) {
  if (locale) return authMessages[locale];
  if (typeof document === "undefined") return authMessages.ar;
  const documentLocale = document.documentElement.lang as Locale;
  return authMessages[documentLocale] ?? authMessages.ar;
}
