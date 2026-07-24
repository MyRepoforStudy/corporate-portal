import { getLocale, getDictionary } from "@/lib/i18n";
import { BirthdayLookup } from "@/components/org-structure/birthday-lookup";

export default function BirthdaysPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return <BirthdayLookup locale={locale} dict={dict.orgStructure} />;
}
