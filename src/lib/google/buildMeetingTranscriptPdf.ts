// src/lib/google/buildMeetingTranscriptPdf.ts
import { PDFDocument, StandardFonts } from "pdf-lib";
import type {
  Meeting,
  MeetingSegment,
  MeetingSpeaker,
} from "@/generated/prisma";

type BuildArgs = {
  meeting: Meeting;
  segments: MeetingSegment[];
  speakers: MeetingSpeaker[];
};

const PAGE_MARGIN = 50;
const BODY_FONT_SIZE = 11;
const HEADER_FONT_SIZE = 20;
const META_FONT_SIZE = 10;
const LINE_HEIGHT = 14;

export async function buildMeetingTranscriptPdf(
  args: BuildArgs
): Promise<Buffer> {
  const { meeting, segments, speakers } = args;

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = height - PAGE_MARGIN;

  const maxWidth = width - PAGE_MARGIN * 2;

  const drawTextWrapped = (
    text: string,
    opts?: { bold?: boolean; size?: number }
  ) => {
    const size = opts?.size ?? BODY_FONT_SIZE;
    const font = opts?.bold ? fontBold : fontRegular;

    const words = text.split(/\s+/);
    let line = "";

    for (const word of words) {
      const testLine = line ? line + " " + word : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && line) {
        // render current line
        ensureSpaceForLine();
        page.drawText(line, {
          x: PAGE_MARGIN,
          y: cursorY,
          size,
          font,
        });
        cursorY -= LINE_HEIGHT;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ensureSpaceForLine();
      page.drawText(line, {
        x: PAGE_MARGIN,
        y: cursorY,
        size,
        font,
      });
      cursorY -= LINE_HEIGHT;
    }
  };

  const ensureSpaceForLine = () => {
    if (cursorY < PAGE_MARGIN + LINE_HEIGHT) {
      const newPage = pdfDoc.addPage();
      ({ width, height } = newPage.getSize());
      cursorY = height - PAGE_MARGIN;
      // reassign page reference
      (page as any) = newPage;
    }
  };

  const addSpacing = (lines: number = 1) => {
    cursorY -= LINE_HEIGHT * lines;
    if (cursorY < PAGE_MARGIN) {
      const newPage = pdfDoc.addPage();
      ({ width, height } = newPage.getSize());
      cursorY = height - PAGE_MARGIN;
      (page as any) = newPage;
    }
  };

  // --- Header ---
  ensureSpaceForLine();
  page.drawText(meeting.title, {
    x: PAGE_MARGIN,
    y: cursorY,
    size: HEADER_FONT_SIZE,
    font: fontBold,
  });
  cursorY -= LINE_HEIGHT * 2;

  // meta
  drawTextWrapped(`Meeting ID: ${meeting.id}`, { size: META_FONT_SIZE });
  drawTextWrapped(`Exported at: ${new Date().toISOString()}`, {
    size: META_FONT_SIZE,
  });
  addSpacing(1);

  // Speakers
  if (speakers.length) {
    drawTextWrapped("Speakers", { bold: true, size: 12 });
    addSpacing(0.2);

    speakers.forEach((s) => {
      drawTextWrapped(`#${s.speakerIndex + 1}: ${s.label}`, {
        size: META_FONT_SIZE,
      });
    });

    addSpacing(1);
  }

  // Transcript
  drawTextWrapped("Transcript", { bold: true, size: 12 });
  addSpacing(0.5);

  if (segments.length) {
    const labelByIdx = new Map(speakers.map((s) => [s.speakerIndex, s.label]));

    segments.forEach((seg) => {
      const sec = Math.floor(seg.startMs / 1000);
      const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, "0");
      const s = (sec % 60).toString().padStart(2, "0");
      const ts = `${m}:${s}`;

      const label =
        labelByIdx.get(seg.speakerIndex) ?? `Speaker ${seg.speakerIndex + 1}`;

      drawTextWrapped(`[${ts}] ${label}`, {
        bold: true,
        size: META_FONT_SIZE,
      });
      drawTextWrapped(seg.text, { size: BODY_FONT_SIZE });
      addSpacing(0.5);
    });
  } else {
    drawTextWrapped(meeting.transcript ?? "", {
      size: BODY_FONT_SIZE,
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
