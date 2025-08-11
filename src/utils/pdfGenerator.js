import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fontkit from '@pdf-lib/fontkit';

function hexToRgb(hex) {
  const value = hex?.replace('#', '') || '000000';
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return rgb(r / 255, g / 255, b / 255);
}

async function drawTicketPage(pdfDoc, font, order, seatLabel, settings) {
  const { colorScheme = {}, design = {}, qrCode = {}, ticketContent = {}, companyInfo = {} } = settings;

  let pageWidth = 400;
  let pageHeight = 600;
  if (design.layout === 'horizontal') {
    pageWidth = 600;
    pageHeight = 400;
  }
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: hexToRgb(colorScheme.background || '#FFFFFF')
  });

  let fontSize = 12;
  if (design.fontSize === 'small') fontSize = 10;
  else if (design.fontSize === 'large') fontSize = 16;

  const textColor = hexToRgb(colorScheme.text || '#000000');
  let cursorY = pageHeight - 40;

  // logo
  if (design.showCompanyLogo && settings.companyLogo) {
    try {
      const bytes = await fetch(settings.companyLogo).then((r) => r.arrayBuffer());
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
      // ignore
    }
  }

  // title
  if (order.event?.title) {
    const title = order.event.title;
    const size = fontSize + 4;
    const width = font.widthOfTextAtSize(title, size);
    page.drawText(title, {
      x: (pageWidth - width) / 2,
      y: cursorY,
      size,
      font,
      color: hexToRgb(colorScheme.primary || '#000000')
    });
    cursorY -= size + 10;
  }

  if (ticketContent.showDateTime && order.event?.date) {
    const dateStr = String(order.event.date);
    const width = font.widthOfTextAtSize(dateStr, fontSize);
    page.drawText(dateStr, {
      x: (pageWidth - width) / 2,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 4;
  }

  if (ticketContent.showVenueInfo && order.event?.location) {
    const loc = String(order.event.location);
    const width = font.widthOfTextAtSize(loc, fontSize);
    page.drawText(loc, {
      x: (pageWidth - width) / 2,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 8;
  }

  // separator
  page.drawLine({
    start: { x: 40, y: cursorY },
    end: { x: pageWidth - 40, y: cursorY },
    thickness: 1,
    color: hexToRgb(colorScheme.secondary || '#000000'),
    dashArray: [3, 3]
  });
  cursorY -= fontSize + 8;

  const ticketNumber = order.ticketNumber || `T-${order.orderNumber || ''}`;
  page.drawText(`Билет №: ${ticketNumber}`, {
    x: 40,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor
  });
  cursorY -= fontSize + 4;

  if (order.orderNumber) {
    page.drawText(`Заказ №: ${order.orderNumber}`, {
      x: 40,
      y: cursorY,
      size: fontSize,
      font,
      color: textColor
    });
    cursorY -= fontSize + 4;
  }

  page.drawText(`Место: ${seatLabel}`, {
    x: 40,
    y: cursorY,
    size: fontSize,
    font,
    color: textColor
  });
  cursorY -= fontSize + 4;

  if (ticketContent.showPrice && (order.totalPrice || order.price)) {
    const price = order.price || order.totalPrice;
    page.drawText(`Цена: ${price}`, {
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
    cursorY -= fontSize + 8;
  }

  // footer company info
  const footer = [];
  if (companyInfo.name) footer.push(companyInfo.name);
  if (companyInfo.phone) footer.push(companyInfo.phone);
  if (companyInfo.website) footer.push(companyInfo.website);
  footer.forEach((line, idx) => {
    page.drawText(line, {
      x: 40,
      y: 20 + idx * (fontSize - 2),
      size: fontSize - 2,
      font,
      color: textColor
    });
  });

  // QR code
  if (design.showQRCode) {
    try {
      const qrData = [];
      if (qrCode.includeEventInfo && order.event?.title) qrData.push(order.event.title);
      if (qrCode.includeSeatInfo) qrData.push(seatLabel);
      if (qrCode.includeOrderInfo && order.orderNumber) qrData.push(order.orderNumber);
      if (companyInfo.name) qrData.push(companyInfo.name);
      const qrString = qrData.join('|') || 'TicketWayz';
      const dataUrl = await QRCode.toDataURL(qrString);
      const qrBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
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
      // ignore
    }
  }
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
  pdfDoc.registerFontkit(fontkit);

  let font;
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans.ttf';
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    font = await pdfDoc.embedFont(fontBytes);
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const seats = Array.isArray(order.seats) && order.seats.length ? order.seats : [{ label: '' }];

  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i];
    const label = seat?.label || seat?.number || seat?.id || `Seat ${i + 1}`;
    await drawTicketPage(pdfDoc, font, order, label, settings);
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


