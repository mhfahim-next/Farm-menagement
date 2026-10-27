// What a scanned ear tag (or a typed tag number) points to.

/** The animal id in a FarmFlows tag QR code (https://…/dashboard/cattle/<id>). */
export function animalIdFromQr(text: string) {
  return /\/dashboard\/cattle\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(text)?.[1]?.toLowerCase() ?? null;
}

/** The animal for a scan or a typed tag: by the QR's id, else by tag number (any case, "#" optional). */
export function findAnimal<A extends { id: string; tag_number: string }>(text: string, animals: A[]): { id: string } | null {
  const id = animalIdFromQr(text);
  if (id) return { id };
  const tag = text.trim().replace(/^#/, "").toLowerCase();
  if (!tag) return null;
  return animals.find((a) => a.tag_number.toLowerCase() === tag) ?? null;
}
