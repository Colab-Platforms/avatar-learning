import PDFDocument from "pdfkit";
import { AVATAR_MARK_BASE64 } from "./avatarMarkBase64.js";

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completedAt: Date;
  certificateId: string;
}

const NAVY = "#1e3a5f";
const DARK_NAVY = "#0f2942";
const SLATE = "#5b6b7c";
const LIGHT_BLUE = "#a8bfd6";
const GOLD = "#e8c04c";
const GOLD_DARK = "#c9a02f";

const LOGO_BUFFER = Buffer.from(AVATAR_MARK_BASE64, "base64");

function drawSeal(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save();
  doc.circle(cx, cy, 26).fillColor(GOLD).fill();
  doc.circle(cx, cy, 26).strokeColor(GOLD_DARK).lineWidth(1.5).stroke();
  doc.circle(cx, cy, 20).strokeColor("#ffffff").lineWidth(1).stroke();

  doc
    .strokeColor("#ffffff")
    .lineWidth(2.5)
    .moveTo(cx - 9, cy)
    .lineTo(cx - 3, cy + 7)
    .lineTo(cx + 10, cy - 8)
    .stroke();

  doc
    .moveTo(cx - 10, cy + 22)
    .lineTo(cx - 2, cy + 40)
    .lineTo(cx - 12, cy + 34)
    .lineTo(cx - 10, cy + 22)
    .fillColor(GOLD_DARK)
    .fill();
  doc
    .moveTo(cx + 10, cy + 22)
    .lineTo(cx + 2, cy + 40)
    .lineTo(cx + 12, cy + 34)
    .lineTo(cx + 10, cy + 22)
    .fillColor(GOLD)
    .fill();
  doc.restore();
}

function drawSignature(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  role: string,
) {
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor(SLATE)
    .lineWidth(0.75)
    .stroke();
  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(9)
    .text(role, x, y + 6, { width, align: "center" });
}

export function buildCertificatePdf(data: CertificateData): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const { width, height } = doc.page;

  doc.rect(0, 0, width, height).fill("#ffffff");

  const watermarkSize = height * 0.85;
  doc.save();
  doc.opacity(0.05);
  doc.image(
    LOGO_BUFFER,
    (width - watermarkSize) / 2,
    (height - watermarkSize) / 2,
    { width: watermarkSize, height: watermarkSize },
  );
  doc.restore();

  const outerMargin = 20;
  doc
    .lineWidth(3)
    .strokeColor(DARK_NAVY)
    .rect(
      outerMargin,
      outerMargin,
      width - outerMargin * 2,
      height - outerMargin * 2,
    )
    .stroke();

  const logoSize = 36;
  const logoY = 44;
  const logoTextGap = 8;
  const textBlockWidth = 230;
  const headerBlockWidth = logoSize + logoTextGap + textBlockWidth;
  const headerLeft = width / 2 - headerBlockWidth / 2;
  const textLeft = headerLeft + logoSize + logoTextGap;

  doc.image(LOGO_BUFFER, headerLeft, logoY, {
    width: logoSize,
    height: logoSize,
  });
  doc
    .fillColor(DARK_NAVY)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text("AVATAR", textLeft, logoY + 3, { width: textBlockWidth });
  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(8.5)
    .text("DIRECT2HIRE AI LEARNING PROGRAMME", textLeft, logoY + 24, {
      width: textBlockWidth,
      characterSpacing: 0.5,
    });

  doc
    .moveTo(headerLeft, logoY + 46)
    .lineTo(headerLeft + headerBlockWidth, logoY + 46)
    .strokeColor(LIGHT_BLUE)
    .lineWidth(0.75)
    .stroke();

  doc
    .fillColor(DARK_NAVY)
    .font("Helvetica-Bold")
    .fontSize(42)
    .text("CERTIFICATE", 0, 122, { align: "center", characterSpacing: 2 });
  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(13)
    .text("O F   A C H I E V E M E N T", 0, 172, { align: "center" });

  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(12)
    .text("This certificate is proudly presented to", 0, 210, {
      align: "center",
    });

  doc
    .fillColor(DARK_NAVY)
    .font("Times-BoldItalic")
    .fontSize(32)
    .text(data.studentName, 0, 232, { align: "center" });

  const dividerY = 268;
  doc
    .moveTo(width / 2 - 130, dividerY)
    .lineTo(width / 2 + 130, dividerY)
    .strokeColor(NAVY)
    .lineWidth(1)
    .stroke();
  doc
    .circle(width / 2, dividerY, 2.5)
    .fillColor(NAVY)
    .fill();

  const monthYear = data.completedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
  });

  const paraLeft = 130;
  const paraWidth = width - paraLeft * 2;
  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(11.5)
    .text("This certificate is awarded to ", paraLeft, 286, {
      continued: true,
      width: paraWidth,
      align: "left",
      lineGap: 4,
    })
    .fillColor(DARK_NAVY)
    .font("Helvetica-Bold")
    .text(data.studentName, { continued: true })
    .fillColor(SLATE)
    .font("Helvetica")
    .text(" for the successful completion of ", { continued: true })
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .text(data.courseTitle, { continued: true })
    .fillColor(SLATE)
    .font("Helvetica")
    .text(
      ` at Avatar Direct2Hire during the month of ${monthYear}. We hope this certificate will be a great motivation.`,
    );

  const footerY = height - 96;
  drawSignature(doc, 90, footerY, 190, "Program Director");
  drawSeal(doc, width / 2, footerY - 16);
  drawSignature(doc, width - 280, footerY, 190, "Head of Placements");

  doc
    .fillColor(SLATE)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Certificate ID: ${data.certificateId}`,
      outerMargin + 16,
      height - outerMargin - 20,
    );

  return doc;
}
