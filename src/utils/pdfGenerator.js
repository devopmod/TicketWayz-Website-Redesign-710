export function escapePdfString(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function createPdf(textLines) {
  const lines = Array.isArray(textLines) ? textLines : [textLines];
  const escaped = lines.map(escapePdfString);
  const contentStream = [
    'BT',
    '/F1 12 Tf',
    '50 780 Td',
    escaped.map((line, idx) => `${idx ? '0 -14 Td' : ''}(${line}) Tj`).join('\n'),
    'ET'
  ].join('\n');

  const objects = [];
  objects.push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj');
  objects.push('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj');
  objects.push('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj');
  objects.push(`4 0 obj<</Length ${contentStream.length}>>stream\n${contentStream}\nendstream endobj`);
  objects.push('5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj');

  let pdf = '%PDF-1.1\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

export function downloadTicketsPDF(order, fileName = 'tickets.pdf') {
  if (!order) return;
  const lines = [];
  if (order.orderNumber) lines.push(`Order: ${order.orderNumber}`);
  if (order.event) {
    if (order.event.title) lines.push(`Event: ${order.event.title}`);
    if (order.event.date) lines.push(`Date: ${order.event.date}`);
    if (order.event.location) lines.push(`Location: ${order.event.location}`);
  }
  if (Array.isArray(order.seats)) {
    order.seats.forEach((seat, idx) => {
      const label = seat?.label || seat?.number || seat?.id || `Seat ${idx + 1}`;
      lines.push(`Seat ${idx + 1}: ${label}`);
    });
  }
  const pdfString = createPdf(lines);
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
