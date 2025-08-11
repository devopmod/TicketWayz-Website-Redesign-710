import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

function hexToRgb(hex) {
  const value = hex?.replace('#', '') || '000000';
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return rgb(r / 255, g / 255, b / 255);
}

export async function downloadTicketsPDF(order, fileName = 'tickets.pdf') {
  if (!order) return;

  let settings = {};
  try {
    const stored = localStorage.getItem('ticketTemplateSettings');
    if (stored) settings = JSON.parse(stored);
  } catch {
    // ignore
  }

  const pdfDoc = await PDFDocument.create();

  let pageWidth = 400;
  let pageHeight = 600;
  if (settings.design?.layout === 'horizontal') {
    pageWidth = 600;
    pageHeight = 400;
  }
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const { colorScheme = {}, design = {}, qrCode = {}, ticketContent = {}, companyInfo = {} } = settings;

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: hexToRgb(colorScheme.background || '#FFFFFF')
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let fontSize = 12;
  if (design.fontSize === 'small') fontSize = 10;
  else if (design.fontSize === 'large') fontSize = 16;

  const textColor = hexToRgb(colorScheme.text || '#000000');
  let cursorY = pageHeight - 40;

  // Company Logo
  if (design.showCompanyLogo && settings.companyLogo) {
    try {
      const bytes = await fetch(settings.companyLogo).then((res) => res.arrayBuffer());
      let logo;
      if (settings.companyLogo.startsWith('data:image/png')) logo = await pdfDoc.embedPng(bytes);
      else logo = await pdfDoc.embedJpg(bytes);
      const scaled = logo.scale(80 / logo.width);
      page.drawImage(logo, {
        x: 40,
        y: pageHeight - scaled.height - 40,
        width: scaled.width,
        height: scaled.height
      });
      cursorY = pageHeight - scaled.height - 60;
    } catch {
      // ignore logo errors
    }
  }

  // Event Title
  if (order.event?.title) {
    page.drawText(order.event.title, {
      x: 40,
      y: cursorY,
      size: fontSize + 4,
      font,
      color: hexToRgb(colorScheme.primary || '#000000')
    });
    cursorY -= fontSize + 14;
  }

  if (ticketContent.showDateTime && order.event?.date) {
    page.drawText(String(order.event.date), {
      x: 40,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 4;
  }

  if (ticketContent.showVenueInfo && order.event?.location) {
    page.drawText(String(order.event.location), {
      x: 40,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 8;
  }

  // Separator
  page.drawRectangle({
    x: 40,
    y: cursorY,
    width: pageWidth - 80,
    height: 1,
    color: hexToRgb(colorScheme.secondary || '#000000')
  });
  cursorY -= fontSize + 8;

  if (order.orderNumber) {
    page.drawText(`Order: ${order.orderNumber}`, {
      x: 40,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 4;
  }

  if (Array.isArray(order.seats)) {
    order.seats.forEach((seat, idx) => {
      const label = seat?.label || seat?.number || seat?.id || `Seat ${idx + 1}`;
      page.drawText(`Seat ${idx + 1}: ${label}`, {
        x: 40,
        y: cursorY,
        size: fontSize,
        font,
        color: textColor
      });
      cursorY -= fontSize + 4;
    });
  }

  if (ticketContent.showPrice && order.totalPrice) {
    page.drawText(`Total: ${order.totalPrice}`, {
      x: 40,
      y: cursorY,
      size: fontSize,
      font,
      color: hexToRgb(colorScheme.accent || '#000000')
    });
    cursorY -= fontSize + 8;
  }

  if (ticketContent.customInstructions) {
    page.drawText(ticketContent.customInstructions, {
      x: 40,
      y: cursorY,
      size: fontSize - 2,
      font,
      color: textColor,
      maxWidth: pageWidth - 80
    });
    cursorY -= fontSize + 10;
  }

  // Company Info footer
  const footerLines = [];
  if (companyInfo.name) footerLines.push(companyInfo.name);
  if (companyInfo.phone) footerLines.push(companyInfo.phone);
  if (companyInfo.website) footerLines.push(companyInfo.website);
  footerLines.forEach((line, idx) => {
    page.drawText(line, {
      x: 40,
      y: 20 + idx * (fontSize - 2),
      size: fontSize - 2,
      font,
      color: textColor
    });
  });

  // QR Code
  if (design.showQRCode) {
    try {
      const qrData = [];
      if (qrCode.includeEventInfo && order.event?.title) qrData.push(order.event.title);
      if (qrCode.includeSeatInfo && Array.isArray(order.seats)) {
        qrData.push(order.seats.map((s, i) => s?.label || s?.number || `Seat ${i + 1}`).join(','));
      }
      if (qrCode.includeOrderInfo && order.orderNumber) qrData.push(order.orderNumber);
      if (companyInfo.name) qrData.push(companyInfo.name);
      const qrString = qrData.join('|') || 'TicketWayz';
      const qrDataUrl = await QRCode.toDataURL(qrString);
      const qrBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrBytes);
      const sizeMap = { small: 64, medium: 96, large: 128 };
      const qrSize = sizeMap[qrCode.size] || 96;
      const positions = {
        'top-left': { x: 20, y: pageHeight - qrSize - 20 },
        'top-right': { x: pageWidth - qrSize - 20, y: pageHeight - qrSize - 20 },
        'bottom-left': { x: 20, y: 20 },
        'bottom-right': { x: pageWidth - qrSize - 20, y: 20 },
        center: { x: (pageWidth - qrSize) / 2, y: (pageHeight - qrSize) / 2 }
      };
      const pos = positions[qrCode.position] || positions['bottom-right'];
      page.drawImage(qrImage, { x: pos.x, y: pos.y, width: qrSize, height: qrSize });
    } catch {
      // ignore QR errors
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

