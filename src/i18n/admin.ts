import type { Locale } from "@/config/site";

export const adminCopy = {
  ar: {
    overview: "نظرة عامة",
    greeting: "مساء الخير،",
    dashboardDescription:
      "هذه نقطة البداية لإدارة عمليات Luna Healthy. لا توجد بيانات تشغيلية مضافة بعد.",
    connected: "الحساب متصل",
    systemReadiness: "جاهزية النظام",
    foundationReady: "الأساس جاهز للخطوة التالية.",
    foundationDescription:
      "تم إعداد الهوية، قاعدة البيانات، الدخول، والأدوار. ستظهر الوحدات التشغيلية هنا بعد اعتماد تفاصيلها.",
    site: "الموقع",
    ready: "جاهز",
    roles: "الأدوار",
    roleCount: "دور",
    data: "البيانات",
    notStarted: "لم تبدأ",
    suggestedStep: "الخطوة المقترحة",
    addTrustedUser: "أضف أول مستخدم موثوق.",
    invitationDescription:
      "إدارة الدعوات ستتوفر لاحقًا. حاليًا يتم تعيين الأدوار من Supabase بشكل آمن.",
    operationalUnits: "الوحدات التشغيلية ستظهر هنا",
    operationalUnitsDescription:
      "لا توجد طلبات أو منتجات أو مخزون لعرضه الآن. هذه حالة إعداد مقصودة وليست بيانات تجريبية.",
    fallbackName: "لونا",
  },
  en: {
    overview: "Overview",
    greeting: "Good evening,",
    dashboardDescription:
      "This is the starting point for managing Luna Healthy operations. No operational data has been added yet.",
    connected: "Account connected",
    systemReadiness: "System readiness",
    foundationReady: "The foundation is ready for the next step.",
    foundationDescription:
      "Identity, database, sign-in, and roles are configured. Operational modules will appear here once their details are approved.",
    site: "Site",
    ready: "Ready",
    roles: "Roles",
    roleCount: "roles",
    data: "Data",
    notStarted: "Not started",
    suggestedStep: "Suggested next step",
    addTrustedUser: "Add your first trusted user.",
    invitationDescription:
      "Invitation management will be available later. For now, roles are assigned securely through Supabase.",
    operationalUnits: "Operational modules will appear here",
    operationalUnitsDescription:
      "There are no orders, products, or inventory to show yet. This is an intentional setup state, not demo data.",
    fallbackName: "Luna",
  },
  it: {
    overview: "Panoramica",
    greeting: "Buonasera,",
    dashboardDescription:
      "Questo è il punto di partenza per gestire le operazioni di Luna Healthy. Non sono ancora stati aggiunti dati operativi.",
    connected: "Account connesso",
    systemReadiness: "Stato del sistema",
    foundationReady: "La base è pronta per il prossimo passo.",
    foundationDescription:
      "Identità, database, accesso e ruoli sono configurati. I moduli operativi appariranno qui dopo l'approvazione dei dettagli.",
    site: "Sito",
    ready: "Pronto",
    roles: "Ruoli",
    roleCount: "ruoli",
    data: "Dati",
    notStarted: "Non iniziati",
    suggestedStep: "Prossimo passo suggerito",
    addTrustedUser: "Aggiungi il primo utente fidato.",
    invitationDescription:
      "La gestione degli inviti sarà disponibile in seguito. Per ora, i ruoli vengono assegnati in modo sicuro tramite Supabase.",
    operationalUnits: "I moduli operativi appariranno qui",
    operationalUnitsDescription:
      "Non ci sono ancora ordini, prodotti o inventario da mostrare. Questo è uno stato di configurazione intenzionale, non dati demo.",
    fallbackName: "Luna",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export function getAdminCopy(locale: Locale) {
  return adminCopy[locale];
}
