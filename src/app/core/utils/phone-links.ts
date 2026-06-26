export function buildWhatsAppHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

  if (/^04\d{9}$/.test(digits)) {
    return `https://wa.me/58${digits.slice(1)}`;
  }

  if (/^58\d{10,11}$/.test(digits)) {
    return `https://wa.me/${digits}`;
  }

  return null;
}
