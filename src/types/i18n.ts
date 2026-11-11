import type { Locale } from "@/config/site";

export type { Locale };

export type TranslationDictionary = {
  brand: string;
  navigation: {
    home: string;
    health: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    phase: string;
  };
  health: {
    title: string;
    description: string;
    status: string;
    ready: string;
  };
  notFound: {
    title: string;
    description: string;
    home: string;
    admin: string;
  };
  shell: {
    menu: string;
    language: string;
    footer: string;
  };
  orders: {
    title: string;
    source: Record<string, string>;
    type: Record<string, string>;
    payment: Record<string, string>;
    status: Record<string, string>;
    fields: Record<string, string>;
    actions: Record<string, string>;
    messages: Record<string, string>;
  };
  inventory?: {
    title: string;
    units: Record<string, string>;
    types: Record<string, string>;
    movements: Record<string, string>;
    statuses: Record<string, string>;
    empty: string;
  };
};
