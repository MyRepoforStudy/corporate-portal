import {
  Link as LinkIcon,
  Globe,
  FileText,
  BookOpen,
  Wifi,
  Mail,
  Phone,
  Users,
  CalendarClock,
  Wrench,
  Video,
  Database,
  GraduationCap,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// Curated icon set for admin-managed "Полезные ссылки" - a plain string
// column (ResourceLink.icon), not a DB enum, so this list can grow without
// a migration. Unknown/missing values fall back to ExternalLink at the
// render site (components/layout/icon-sidebar.tsx).
export const RESOURCE_LINK_ICONS: Record<string, LucideIcon> = {
  Link: LinkIcon,
  Globe,
  FileText,
  BookOpen,
  Wifi,
  Mail,
  Phone,
  Users,
  CalendarClock,
  Wrench,
  Video,
  Database,
  GraduationCap,
  MessageSquare,
};

export const RESOURCE_LINK_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "Link", label: "Ссылка" },
  { value: "Globe", label: "Сайт" },
  { value: "FileText", label: "Документ" },
  { value: "BookOpen", label: "База знаний" },
  { value: "Wifi", label: "Wi-Fi / VPN" },
  { value: "Mail", label: "Почта" },
  { value: "Phone", label: "Телефон" },
  { value: "Users", label: "Люди" },
  { value: "CalendarClock", label: "Календарь" },
  { value: "Wrench", label: "Инструмент" },
  { value: "Video", label: "Видео" },
  { value: "Database", label: "База данных" },
  { value: "GraduationCap", label: "Обучение" },
  { value: "MessageSquare", label: "Чат" },
];
