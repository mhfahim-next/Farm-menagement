import "server-only";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site";

/** Where a scanned tag leads: the animal's page (the person must be signed in to see it). */
export function animalUrl(id: string) {
  return `${SITE_URL}/dashboard/cattle/${id}`;
}

/** A QR code as an inline SVG string (our own output, safe to inline). Medium error correction survives smudged ear tags. */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
}
