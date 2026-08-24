const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number) {
  return String(value).replace(/[\/٫]/g, ".").replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

export function formatPersianNumber(value: number) {
  return toPersianDigits(value.toLocaleString("en-US"));
}
