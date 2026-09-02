import { jsPDF } from "jspdf";
import {
  categoryLabel,
  formatNumber,
  formatPrice,
  sortedImages,
  titleCase,
  type Vehicle,
} from "./vehicles";

const GOLD: [number, number, number] = [199, 156, 60];
const DARK: [number, number, number] = [32, 30, 26];
const GREY: [number, number, number] = [110, 106, 98];

async function toDataUrl(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format = blob.type.includes("png") ? "PNG" : "JPEG";
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { data, format };
  } catch {
    return null;
  }
}

export type PdfOptions = { reference?: string | null; buyerName?: string | null };

/** Generates a buyer-safe vehicle detail PDF. Never includes seller documents. */
export async function generateVehiclePdf(vehicle: Vehicle, options: PdfOptions = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Header band
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 74, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CarAdda", M, 42);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Trusted multi-vehicle marketplace", M, 58);
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, W - M, 42, { align: "right" });
  if (options.reference) {
    doc.text(`Enquiry Ref: ${options.reference}`, W - M, 58, { align: "right" });
  }

  let y = 104;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${vehicle.company} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`, M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GREY);
  doc.text(
    `${categoryLabel(vehicle.category)} • ${vehicle.manufacturing_year} • ${vehicle.location}`,
    M,
    y,
  );
  y += 24;

  doc.setFillColor(250, 246, 235);
  doc.setDrawColor(...GOLD);
  doc.roundedRect(M, y, W - M * 2, 44, 6, 6, "FD");
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(formatPrice(Number(vehicle.price)), M + 14, y + 29);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text("Asking price (negotiable)", W - M - 14, y + 29, { align: "right" });
  y += 66;

  // Images
  const imgs = sortedImages(vehicle).slice(0, 3);
  const loaded = (await Promise.all(imgs.map((i) => toDataUrl(i.image_url)))).filter(Boolean) as {
    data: string;
    format: string;
  }[];
  if (loaded.length) {
    const gap = 10;
    const first = loaded[0]!;
    const bigW = loaded.length > 1 ? (W - M * 2) * 0.62 : W - M * 2;
    const bigH = 150;
    doc.addImage(first.data, first.format, M, y, bigW, bigH, undefined, "FAST");
    const rest = loaded.slice(1);
    if (rest.length) {
      const sx = M + bigW + gap;
      const sw = W - M - sx;
      const sh = (bigH - gap * (rest.length - 1)) / rest.length;
      rest.forEach((im, i) => {
        doc.addImage(im.data, im.format, sx, y + i * (sh + gap), sw, sh, undefined, "FAST");
      });
    }
    y += bigH + 24;
  }

  // Spec table
  const specs: [string, string][] = [
    ["Category", categoryLabel(vehicle.category)],
    ["Company", vehicle.company],
    ["Model", vehicle.model],
    ["Variant", vehicle.variant || "—"],
    ["Manufacturing year", String(vehicle.manufacturing_year)],
    ["Registration year", vehicle.registration_year ? String(vehicle.registration_year) : "—"],
    ["Mileage", `${formatNumber(vehicle.mileage)} km`],
    ["Fuel type", titleCase(vehicle.fuel_type)],
    ["Transmission", titleCase(vehicle.transmission)],
    ["Ownership", `${titleCase(vehicle.ownership)} owner`],
    ["Condition", titleCase(vehicle.condition)],
    ["Location", vehicle.location],
    ["Listing status", titleCase(vehicle.status)],
    ["Verification", titleCase(vehicle.verification_status)],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text("Vehicle specifications", M, y);
  y += 8;
  doc.setDrawColor(...GOLD);
  doc.line(M, y, M + 90, y);
  y += 14;

  doc.setFontSize(10);
  const colW = (W - M * 2) / 2;
  specs.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * colW;
    const ry = y + row * 22;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text(label, x, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(value, x + 130, ry);
  });
  y += Math.ceil(specs.length / 2) * 22 + 16;

  if (vehicle.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Description", M, y);
    y += 8;
    doc.setDrawColor(...GOLD);
    doc.line(M, y, M + 70, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize(vehicle.description, W - M * 2), M, y);
    y += doc.splitTextToSize(vehicle.description, W - M * 2).length * 13 + 12;
  }

  if (options.buyerName) {
    doc.setTextColor(...GREY);
    doc.setFontSize(9);
    doc.text(`Prepared for: ${options.buyerName}`, M, y);
  }

  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(230, 226, 218);
  doc.line(M, H - 54, W - M, H - 54);
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    "This document contains public listing information only. Seller identity documents and address proof are never included.",
    M,
    H - 38,
  );
  doc.text("CarAdda • caradda.in", M, H - 26);

  const name = `CarAdda-${vehicle.company}-${vehicle.model}${
    options.reference ? `-${options.reference}` : ""
  }`
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-");
  doc.save(`${name}.pdf`);
}
