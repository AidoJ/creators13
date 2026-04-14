import jsPDF from "jspdf";

const PHOTO_ORDER = [
  { key: "face_front_closed", label: "Face Front" },
  { key: "face_front_smiling", label: "Face Smiling" },
  { key: "face_side", label: "Face Side" },
  { key: "body_front", label: "Body Front" },
  { key: "body_back", label: "Body Back" },
  { key: "body_side", label: "Body Side" },
  { key: "feet", label: "Feet" },
  { key: "hands", label: "Hands" },
] as const;

const GENERIC_FALLBACK: Record<string, string> = {
  face_front_closed: "photo_1",
  face_front_smiling: "photo_2",
  face_side: "photo_3",
  body_front: "photo_4",
  body_back: "photo_5",
  body_side: "photo_6",
  feet: "photo_7",
  hands: "photo_8",
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

function drawCroppedImage(
  doc: jsPDF,
  img: HTMLImageElement,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  fit: "cover" | "contain" = "cover"
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(boxW * 4);
  canvas.height = Math.round(boxH * 4);
  const ctx = canvas.getContext("2d")!;

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = boxW / boxH;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (fit === "cover") {
    if (imgRatio > boxRatio) {
      sw = img.naturalHeight * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / boxRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  doc.addImage(dataUrl, "JPEG", x, y, boxW, boxH);
}

export async function generateProfilingPdf(
  photoMap: Record<string, string>,
  subjectName?: string
): Promise<Blob> {
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 8;
  const gap = 3;

  // Layout matching reference image:
  // Left half: 3 face photos (row 1), feet + hands (row 2)
  // Right half: 3 body photos (full height)
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2 - (subjectName ? 8 : 0);
  const topY = margin + (subjectName ? 8 : 0);

  // Title
  if (subjectName) {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(subjectName, margin, margin + 5);
  }

  // Right side: 3 body photos take ~55% of width
  const bodyZoneW = contentW * 0.55;
  const leftZoneW = contentW - bodyZoneW - gap;

  // Body photos: 3 equal columns, full height
  const bodyPhotoW = (bodyZoneW - gap * 2) / 3;
  const bodyPhotoH = contentH;
  const bodyStartX = margin + leftZoneW + gap;

  // Left zone: row 1 = 3 face photos, row 2 = feet + hands
  const faceRowH = contentH * 0.55;
  const bottomRowH = contentH - faceRowH - gap;
  const facePhotoW = (leftZoneW - gap * 2) / 3;

  const resolve = (key: string) => photoMap[key] || photoMap[GENERIC_FALLBACK[key]] || null;

  const loadTasks: { key: string; url: string }[] = [];
  for (const p of PHOTO_ORDER) {
    const url = resolve(p.key);
    if (url) loadTasks.push({ key: p.key, url });
  }

  const images: Record<string, HTMLImageElement> = {};
  const results = await Promise.allSettled(
    loadTasks.map(async (t) => {
      const img = await loadImage(t.url);
      images[t.key] = img;
    })
  );

  // Draw face row (top-left)
  const faceKeys = ["face_front_closed", "face_front_smiling", "face_side"];
  faceKeys.forEach((key, i) => {
    if (images[key]) {
      const x = margin + i * (facePhotoW + gap);
      drawCroppedImage(doc, images[key], x, topY, facePhotoW, faceRowH, "contain");
    }
  });

  // Draw feet & hands (bottom-left)
  const bottomKeys = ["feet", "hands"];
  const bottomPhotoW = (leftZoneW - gap) / 2;
  bottomKeys.forEach((key, i) => {
    if (images[key]) {
      const x = margin + i * (bottomPhotoW + gap);
      drawCroppedImage(doc, images[key], x, topY + faceRowH + gap, bottomPhotoW, bottomRowH, "contain");
    }
  });

  // Draw body photos (right side)
  const bodyKeys = ["body_front", "body_back", "body_side"];
  bodyKeys.forEach((key, i) => {
    if (images[key]) {
      const x = bodyStartX + i * (bodyPhotoW + gap);
      drawCroppedImage(doc, images[key], x, topY, bodyPhotoW, bodyPhotoH, "cover");
    }
  });

  return doc.output("blob");
}
