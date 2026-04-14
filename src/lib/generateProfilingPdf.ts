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

type FitMode = "cover" | "contain" | "subject-cover";

type SubjectBounds = { left: number; right: number; top: number; bottom: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function percentile(values: number[], q: number) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * q)));
  return values[index];
}

function detectSubjectBounds(img: HTMLImageElement): SubjectBounds | null {
  const scale = Math.min(1, 800 / img.naturalHeight);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const edgeSampleW = Math.max(4, Math.round(width * 0.04));
  const edgeSampleH = Math.max(4, Math.round(height * 0.04));
  const startY = Math.max(2, Math.round(height * 0.04));
  const endY = Math.min(height - 2, Math.round(height * 0.96));
  const startX = Math.max(2, Math.round(width * 0.16));
  const endX = Math.min(width - 2, Math.round(width * 0.84));
  const stepY = Math.max(1, Math.round(height / 260));
  const stepX = Math.max(1, Math.round(width / 220));
  const threshold = 42;
  const minRowSpan = width * 0.1;
  const minColSpan = height * 0.45;
  const lefts: number[] = [];
  const rights: number[] = [];
  const tops: number[] = [];
  const bottoms: number[] = [];

  const pixelAt = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]] as const;
  };

  const averageHorizontalEdge = (start: number, end: number, y: number): [number, number, number] => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let x = start; x < end; x++) {
      const [r, g, b, alpha] = pixelAt(x, y);
      if (alpha < 10) continue;
      red += r;
      green += g;
      blue += b;
      count += 1;
    }

    if (!count) return [0, 0, 0];
    return [red / count, green / count, blue / count];
  };

  const averageVerticalEdge = (x: number, start: number, end: number): [number, number, number] => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let y = start; y < end; y++) {
      const [r, g, b, alpha] = pixelAt(x, y);
      if (alpha < 10) continue;
      red += r;
      green += g;
      blue += b;
      count += 1;
    }

    if (!count) return [0, 0, 0];
    return [red / count, green / count, blue / count];
  };

  for (let y = startY; y < endY; y += stepY) {
    const leftBg = averageHorizontalEdge(0, edgeSampleW, y);
    const rightBg = averageHorizontalEdge(width - edgeSampleW, width, y);

    let left = 0;
    while (left < width / 2) {
      const [r, g, b, alpha] = pixelAt(left, y);
      if (alpha > 10 && colorDistance([r, g, b], leftBg) > threshold) break;
      left += 1;
    }

    let right = width - 1;
    while (right > width / 2) {
      const [r, g, b, alpha] = pixelAt(right, y);
      if (alpha > 10 && colorDistance([r, g, b], rightBg) > threshold) break;
      right -= 1;
    }

    if (right - left > minRowSpan) {
      lefts.push(left);
      rights.push(right);
    }
  }

  for (let x = startX; x < endX; x += stepX) {
    const topBg = averageVerticalEdge(x, 0, edgeSampleH);
    const bottomBg = averageVerticalEdge(x, height - edgeSampleH, height);

    let top = 0;
    while (top < height / 2) {
      const [r, g, b, alpha] = pixelAt(x, top);
      if (alpha > 10 && colorDistance([r, g, b], topBg) > threshold) break;
      top += 1;
    }

    let bottom = height - 1;
    while (bottom > height / 2) {
      const [r, g, b, alpha] = pixelAt(x, bottom);
      if (alpha > 10 && colorDistance([r, g, b], bottomBg) > threshold) break;
      bottom -= 1;
    }

    if (bottom - top > minColSpan) {
      tops.push(top);
      bottoms.push(bottom);
    }
  }

  if (!lefts.length || !rights.length || !tops.length || !bottoms.length) return null;

  lefts.sort((a, b) => a - b);
  rights.sort((a, b) => a - b);
  tops.sort((a, b) => a - b);
  bottoms.sort((a, b) => a - b);

  const left = percentile(lefts, 0.03);
  const right = percentile(rights, 0.97);
  const top = percentile(tops, 0.03);
  const bottom = percentile(bottoms, 0.97);

  return {
    left: left / scale,
    right: right / scale,
    top: top / scale,
    bottom: bottom / scale,
  };
}

function fitBoundsToAspect(
  bounds: SubjectBounds,
  imageWidth: number,
  imageHeight: number,
  targetRatio: number
): { left: number; top: number; width: number; height: number } | null {
  const boundsWidth = Math.max(1, bounds.right - bounds.left);
  const boundsHeight = Math.max(1, bounds.bottom - bounds.top);

  let cropWidth = boundsWidth;
  let cropHeight = boundsHeight;

  if (boundsWidth / boundsHeight > targetRatio) {
    cropHeight = boundsWidth / targetRatio;
  } else {
    cropWidth = boundsHeight * targetRatio;
  }

  if (cropWidth > imageWidth || cropHeight > imageHeight) return null;

  const left = clamp(bounds.left - (cropWidth - boundsWidth) / 2, 0, imageWidth - cropWidth);
  const top = clamp(bounds.top - (cropHeight - boundsHeight) / 2, 0, imageHeight - cropHeight);

  return {
    left,
    top,
    width: cropWidth,
    height: cropHeight,
  };
}

function getAspectLockedSubjectCrop(
  img: HTMLImageElement,
  boxRatio: number
): { left: number; top: number; width: number; height: number } | null {
  const bounds = detectSubjectBounds(img);
  if (!bounds) return null;

  const spanW = Math.max(1, bounds.right - bounds.left);
  const spanH = Math.max(1, bounds.bottom - bounds.top);
  const paddedBounds: SubjectBounds = {
    left: clamp(bounds.left - Math.max(24, spanW * 0.08), 0, img.naturalWidth),
    right: clamp(bounds.right + Math.max(24, spanW * 0.08), 0, img.naturalWidth),
    top: clamp(bounds.top - Math.max(20, spanH * 0.05), 0, img.naturalHeight),
    bottom: clamp(bounds.bottom + Math.max(28, spanH * 0.04), 0, img.naturalHeight),
  };

  return (
    fitBoundsToAspect(paddedBounds, img.naturalWidth, img.naturalHeight, boxRatio) ??
    fitBoundsToAspect(bounds, img.naturalWidth, img.naturalHeight, boxRatio)
  );
}

function drawCroppedImage(
  doc: jsPDF,
  img: HTMLImageElement,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  fit: FitMode = "cover"
) {
  const canvas = document.createElement("canvas");
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = boxW / boxH;

  if (fit === "cover") {
    canvas.width = Math.round(boxW * 4);
    canvas.height = Math.round(boxH * 4);
    const ctx = canvas.getContext("2d")!;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (imgRatio > boxRatio) {
      sw = img.naturalHeight * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / boxRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    doc.addImage(dataUrl, "JPEG", x, y, boxW, boxH);
  } else if (fit === "subject-cover") {
    const crop = getAspectLockedSubjectCrop(img, boxRatio);

    if (crop) {
      canvas.width = Math.round(boxW * 4);
      canvas.height = Math.round(boxH * 4);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, crop.left, crop.top, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      doc.addImage(dataUrl, "JPEG", x, y, boxW, boxH);
    } else {
      // Safe fallback when the detected subject is wider than the slot ratio.
      let drawW: number, drawH: number;
      if (imgRatio > boxRatio) {
        drawW = boxW;
        drawH = boxW / imgRatio;
      } else {
        drawH = boxH;
        drawW = boxH * imgRatio;
      }
      const offsetX = x + (boxW - drawW) / 2;
      const offsetY = y + (boxH - drawH) / 2;

      canvas.width = Math.round(drawW * 4);
      canvas.height = Math.round(drawH * 4);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      doc.addImage(dataUrl, "JPEG", offsetX, offsetY, drawW, drawH);
    }
  } else {
    // contain: fit image inside box, centred, with whitespace
    let drawW: number, drawH: number;
    if (imgRatio > boxRatio) {
      drawW = boxW;
      drawH = boxW / imgRatio;
    } else {
      drawH = boxH;
      drawW = boxH * imgRatio;
    }
    const offsetX = x + (boxW - drawW) / 2;
    const offsetY = y + (boxH - drawH) / 2;

    canvas.width = Math.round(drawW * 4);
    canvas.height = Math.round(drawH * 4);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    doc.addImage(dataUrl, "JPEG", offsetX, offsetY, drawW, drawH);
  }
}

function formatUploadDate(date: Date): string {
  const day = date.getDate();
  const suffix = (day > 3 && day < 21) ? "th" : ["th","st","nd","rd"][day % 10] || "th";
  const month = date.toLocaleString("en-AU", { month: "long" });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

export async function generateProfilingPdf(
  photoMap: Record<string, string>,
  subjectName?: string,
  uploadDate?: Date
): Promise<Blob> {
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 8;
  const gap = 3;

  const hasHeader = !!(subjectName || uploadDate);
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2 - (hasHeader ? 8 : 0);
  const topY = margin + (hasHeader ? 8 : 0);

  // Title + date
  if (hasHeader) {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const parts: string[] = [];
    if (subjectName) parts.push(subjectName);
    if (uploadDate) parts.push(formatUploadDate(uploadDate));
    doc.text(parts.join("  —  "), margin, margin + 5);
  }

  // Right side: 3 body photos take ~55% of width
  const bodyZoneW = contentW * 0.6;
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
  await Promise.allSettled(
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

  // Draw body photos (right side) — crop background while keeping the full subject visible at full column size
  const bodyKeys = ["body_front", "body_back", "body_side"];
  bodyKeys.forEach((key, i) => {
    if (images[key]) {
      const x = bodyStartX + i * (bodyPhotoW + gap);
      drawCroppedImage(doc, images[key], x, topY, bodyPhotoW, bodyPhotoH, "subject-cover");
    }
  });

  return doc.output("blob");
}
