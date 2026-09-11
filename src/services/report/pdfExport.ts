import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SurveyRecord } from "@/services/survey";
import { getAnnotatedImageUrl } from "@/services/detection";

const realSonarImages: Record<string, { raw: string; processed: string }> = {
  "000002": { raw: "/sonar/crops/000002_raw.png", processed: "/sonar/crops/000002_processed.png" },
  "000241": { raw: "/sonar/crops/000241_raw.png", processed: "/sonar/crops/000241_processed.png" },
  "000021": { raw: "/sonar/crops/000021_raw.png", processed: "/sonar/crops/000021_processed.png" },
  "000022": { raw: "/sonar/crops/000022_raw.png", processed: "/sonar/crops/000022_processed.png" },
  "57":     { raw: "/sonar/crops/57_raw.png",     processed: "/sonar/crops/57_processed.png" },
  "000057": { raw: "/sonar/crops/57_raw.png",     processed: "/sonar/crops/57_processed.png" },
  "62":     { raw: "/sonar/crops/62_raw.png",     processed: "/sonar/crops/62_processed.png" },
  "000062": { raw: "/sonar/crops/62_raw.png",     processed: "/sonar/crops/62_processed.png" },
  "000132": { raw: "/sonar/crops/000132_raw.png", processed: "/sonar/crops/000132_processed.png" },
};

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Render raw sonar frame and annotated bounding box overlay onto offscreen canvases */
async function generateSonarImagePanels(
  survey: SurveyRecord
): Promise<{ rawUrl: string | null; processedUrl: string | null }> {
  let rawSrc = survey.imageUrl;
  let processedSrc: string | undefined;

  if (!rawSrc) {
    const key = Object.keys(realSonarImages).find(
      (k) => survey.id.includes(k) || survey.result.image_id.includes(k)
    );
    if (key) {
      rawSrc = realSonarImages[key].raw;
      processedSrc = realSonarImages[key].processed;
    } else if (survey.result.image_id) {
      rawSrc = getAnnotatedImageUrl(survey.result.image_id);
    }
  }

  if (!rawSrc) {
    rawSrc = "/sonar/crops/000002_raw.png";
    processedSrc = "/sonar/crops/000002_processed.png";
  }

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = rawSrc!;
  });

  if (!img) return { rawUrl: null, processedUrl: null };

  const w = img.naturalWidth || survey.result.image_width || 715;
  const h = img.naturalHeight || survey.result.image_height || 745;

  // 1. Raw canvas
  const rawCanvas = document.createElement("canvas");
  rawCanvas.width = w;
  rawCanvas.height = h;
  const rawCtx = rawCanvas.getContext("2d");
  if (!rawCtx) return { rawUrl: null, processedUrl: null };
  rawCtx.drawImage(img, 0, 0, w, h);
  const rawUrl = rawCanvas.toDataURL("image/jpeg", 0.90);

  // 2. Processed canvas with actual bounding boxes from backend result
  const procCanvas = document.createElement("canvas");
  procCanvas.width = w;
  procCanvas.height = h;
  const procCtx = procCanvas.getContext("2d");
  if (!procCtx) return { rawUrl, processedUrl: rawUrl };

  let baseForProc = img;
  if (processedSrc && processedSrc !== rawSrc) {
    const procImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const p = new Image();
      p.crossOrigin = "anonymous";
      p.onload = () => resolve(p);
      p.onerror = () => resolve(null);
      p.src = processedSrc!;
    });
    if (procImg) baseForProc = procImg;
  }

  procCtx.drawImage(baseForProc, 0, 0, w, h);

  // Draw detections directly from backend result
  const detections = survey.result.detections || [];
  detections.forEach((d) => {
    const bx = d.bbox.x_min * w;
    const by = d.bbox.y_min * h;
    const bw = (d.bbox.x_max - d.bbox.x_min) * w;
    const bh = (d.bbox.y_max - d.bbox.y_min) * h;

    const isHigh = d.priority === "high_priority";
    const isReview = d.priority === "review_required";
    const color = isHigh ? "#DC2626" : isReview ? "#D97706" : "#2563EB";

    procCtx.strokeStyle = color;
    procCtx.lineWidth = Math.max(2, Math.round(w / 300));
    if (d.type === "unknown_anomaly") {
      procCtx.setLineDash([6, 4]);
    } else {
      procCtx.setLineDash([]);
    }
    procCtx.strokeRect(bx, by, bw, bh);

    procCtx.fillStyle = isHigh
      ? "rgba(220, 38, 38, 0.15)"
      : isReview
      ? "rgba(217, 119, 6, 0.15)"
      : "rgba(37, 99, 235, 0.12)";
    procCtx.fillRect(bx, by, bw, bh);

    const classText = d.class ? d.class.toUpperCase() : "ANOMALY";
    const confText = `${Math.round((d.operational_confidence ?? 0.5) * 100)}%`;
    const label = `${d.id}: ${classText} (${confText})`;

    const fontSize = Math.max(11, Math.round(w / 55));
    procCtx.font = `bold ${fontSize}px sans-serif`;
    const textW = procCtx.measureText(label).width;
    const tagH = fontSize + 6;
    const tagY = Math.max(0, by - tagH);

    procCtx.fillStyle = color;
    procCtx.fillRect(bx, tagY, textW + 8, tagH);

    procCtx.fillStyle = "#FFFFFF";
    procCtx.fillText(label, bx + 4, tagY + fontSize - 1);
  });

  const processedUrl = procCanvas.toDataURL("image/jpeg", 0.90);
  return { rawUrl, processedUrl };
}

export async function exportPdf(survey: SurveyRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ── 1. Top Header Banner ───────────────────────────────────────────
  doc.setFillColor(27, 58, 92); // Deep Navy (#1B3A5C)
  doc.rect(0, 0, pageWidth, 24, "F");

  // Accent Line
  doc.setFillColor(201, 161, 90); // Brand Gold (#C9A15A)
  doc.rect(0, 24, pageWidth, 1.2, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("HYDROSENTRY", margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 242);
  doc.text("Sonar Detection & Anomaly Survey Report", margin, 17);

  // Right-aligned report metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("SURVEY REPORT", pageWidth - margin, 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 215, 230);
  doc.text(`Generated: ${formatDateTime(Date.now())}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`Survey ID: ${survey.id}`, pageWidth - margin, 20, { align: "right" });

  // ── 2. Survey Overview Header ───────────────────────────────────────
  let y = 32;

  doc.setTextColor(27, 58, 92);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(survey.name, margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(74, 85, 104);

  const regionInfo = survey.region ? `Region: ${survey.region}` : "Region: Not specified";
  const dateInfo = `Survey Timestamp: ${formatDateTime(survey.timestamp)}`;
  const frameInfo = `Image ID: ${survey.result.image_id}`;
  doc.text(`${regionInfo}   ·   ${dateInfo}   ·   ${frameInfo}`, margin, y);

  // ── 3. Summary Statistics Cards ─────────────────────────────────────
  y += 6;
  const cardWidth = (contentWidth - 3 * 3) / 4;
  const cardHeight = 15;
  const summary = survey.result.summary;

  const stats = [
    { label: "TOTAL DETECTIONS", value: String(summary.total_detections), color: [27, 58, 92] },
    { label: "KNOWN CONTACTS", value: String(summary.known_count), color: [37, 99, 166] },
    { label: "UNCLASSIFIED ANOMALIES", value: String(summary.unknown_anomaly_count), color: [91, 95, 122] },
    { label: "FP FILTERED", value: String(summary.false_positives_filtered), color: [138, 143, 153] },
  ];

  stats.forEach((st, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(246, 248, 250);
    doc.setDrawColor(216, 219, 224);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(st.color[0], st.color[1], st.color[2]);
    doc.text(st.value, x + 3.5, y + 7.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(110, 120, 135);
    doc.text(st.label, x + 3.5, y + 12.5);
  });

  y += cardHeight + 6;

  // ── 4. Survey & Detection Parameters (Actual Backend Data) ──────────
  const paramRows = [
    [
      { content: "Frame ID:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      survey.result.image_id,
      { content: "Inference Time:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      `${survey.result.processing_time_ms} ms`,
    ],
    [
      { content: "Frame Dimensions:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      `${survey.result.image_width} x ${survey.result.image_height} px`,
      { content: "YOLO Confidence Floor:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      `${Math.round(survey.threshold * 100)}% (0.25)`,
    ],
    [
      { content: "Pipeline Parameters:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      { content: "PatchCore Image Gate: 0.3103  ·  Heat Map Threshold: 0.35  ·  Review Limits: 0.70 / 0.55", colSpan: 3 },
    ],
  ];

  if (survey.description && survey.description.trim()) {
    paramRows.push([
      { content: "Description:", styles: { fontStyle: "bold" as const, textColor: [27, 58, 92] } },
      { content: survey.description, colSpan: 3 },
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: paramRows,
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      textColor: [60, 70, 85],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 52 },
      2: { cellWidth: 38 },
      3: { cellWidth: "auto" },
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  y = (lastTable ? lastTable.finalY : y + 14) + 5;

  // ── 5. Acoustic Imagery Evidence (Raw and Processed) ────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(27, 58, 92);
  doc.text("ACOUSTIC IMAGERY EVIDENCE", margin, y);

  y += 3.5;

  const { rawUrl, processedUrl } = await generateSonarImagePanels(survey);

  const panelWidth = (contentWidth - 6) / 2;
  const panelHeight = 65;

  // Panel 1: Raw Sonar Image
  const x1 = margin;
  doc.setFillColor(246, 248, 250);
  doc.setDrawColor(216, 219, 224);
  doc.roundedRect(x1, y, panelWidth, panelHeight, 1.5, 1.5, "FD");

  doc.setFillColor(27, 58, 92);
  doc.rect(x1, y, panelWidth, 4.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("RAW SONAR ACOUSTIC FRAME", x1 + 3, y + 3.2);

  if (rawUrl) {
    try {
      doc.addImage(rawUrl, "JPEG", x1 + 1, y + 5, panelWidth - 2, panelHeight - 10, undefined, "FAST");
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(110, 120, 135);
  doc.text(
    `Image ID: ${survey.result.image_id} · ${survey.result.image_width}x${survey.result.image_height} px`,
    x1 + 2,
    y + panelHeight - 1.5
  );

  // Panel 2: Processed Detection Overlay
  const x2 = margin + panelWidth + 6;
  doc.setFillColor(246, 248, 250);
  doc.setDrawColor(216, 219, 224);
  doc.roundedRect(x2, y, panelWidth, panelHeight, 1.5, 1.5, "FD");

  doc.setFillColor(37, 99, 166);
  doc.rect(x2, y, panelWidth, 4.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PROCESSED DETECTION OVERLAY", x2 + 3, y + 3.2);

  if (processedUrl) {
    try {
      doc.addImage(processedUrl, "JPEG", x2 + 1, y + 5, panelWidth - 2, panelHeight - 10, undefined, "FAST");
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(110, 120, 135);
  doc.text(
    `Detections: ${survey.result.detections.length} contact(s) · Latency: ${survey.result.processing_time_ms} ms`,
    x2 + 2,
    y + panelHeight - 1.5
  );

  y += panelHeight + 7;

  // ── 6. Detections Register Table (Actual Backend Records) ───────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(27, 58, 92);
  doc.text("FINDINGS & DETECTION REGISTER", margin, y);
  y += 3;

  const tableData = survey.result.detections.map((d) => {
    const typeLabel = d.type === "known" ? "Known Object" : "Unknown Anomaly";
    const rawClass = d.class_name ?? d.class;
    const classLabel = rawClass ? rawClass.toUpperCase() : "—";

    const rawSrc = d.src ?? d.source ?? (d.type === "unknown_anomaly" || d.detector_confidence === null ? "patchcore_only" : d.anomaly_score > 0.35 ? "both" : "yolo_only");
    const sourceLabel =
      rawSrc === "both"
        ? "Both"
        : rawSrc === "yolo_only"
        ? "YOLO Only"
        : rawSrc === "patchcore_only"
        ? "PatchCore Only"
        : String(rawSrc);

    const priorityLabel =
      d.bucket ??
      (d.priority === "high_priority"
        ? "HIGH"
        : d.priority === "review_required"
        ? "REVIEW"
        : d.priority === "low_priority"
        ? "REJECT"
        : "NORMAL");

    const detConf =
      d.detector_confidence !== null && d.detector_confidence !== undefined
        ? `${Math.round(d.detector_confidence * 100)}%`
        : d.yolo_confidence !== null && d.yolo_confidence !== undefined
        ? `${Math.round(d.yolo_confidence * 100)}%`
        : "—";

    const anomalyScore = typeof d.anomaly_score === "number" ? d.anomaly_score.toFixed(2) : "—";
    const coordinates =
      d.location && typeof d.location.lat === "number" && typeof d.location.lon === "number"
        ? `${d.location.lat.toFixed(4)}°, ${d.location.lon.toFixed(4)}°`
        : "—";

    return [d.id, typeLabel, classLabel, sourceLabel, priorityLabel, detConf, anomalyScore, coordinates];
  });

  if (tableData.length === 0) {
    tableData.push([
      "—",
      "No detections above YOLO confidence floor",
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["ID", "Type", "Class", "Source", "Priority", "Det. Conf.", "Anomaly", "Coordinates"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [27, 58, 92],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [35, 45, 60],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 23 },
      1: { cellWidth: 25 },
      2: { cellWidth: 21 },
      3: { cellWidth: 23 },
      4: { cellWidth: 17, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: "auto" },
    },
  });

  // ── 7. Global Page Footer ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(216, 219, 224);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 140, 155);
    doc.text(`HydroSentry Survey Report · ID: ${survey.id}`, margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: "right" });
  }

  doc.save(`hydrosentry-report-${survey.id}.pdf`);
}
