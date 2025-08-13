import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { formatDateTime } from './formatDateTime.js';
import { buildTermsText } from './ticketUtils.js';

function sanitizeValue(value) {
  return value === undefined || value === null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

function sanitizeTicket(order = {}, seat = {}) {
  const event = order.event || {};
  const seatData = seat || {};
  return {
    event: {
      title: sanitizeValue(event.title || event.artist),
      date: event.date,
      location: sanitizeValue(event.location),
      image: event.image,
      note: sanitizeValue(event.note)
    },
    companyName: sanitizeValue(order.company?.name || ''),
    orderNumber: sanitizeValue(order.orderNumber || order.id),
    price: sanitizeValue(seatData.price || order.price || order.totalPrice),
    seat: {
      section: sanitizeValue(seatData.section),
      row: sanitizeValue(seatData.row_number || seatData.row),
      seat: sanitizeValue(seatData.seat_number || seatData.number),
      zone: sanitizeValue(seatData.zone?.name)
    },
    ticketId: sanitizeValue(seatData.id || order.id),
    terms: sanitizeValue(order.terms)
  };
}

function validateImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') return url;
  } catch {
    // ignore invalid URL
  }
  console.warn('Hero image URL must be an absolute, publicly accessible URL:', url);
  return null;
}

function hexToRgb(hex) {
  const value = hex?.replace('#', '') || '000000';
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return rgb(r / 255, g / 255, b / 255);
}
function drawRoundedRect(page, x, y, width, height, radius, options = {}) {
  const path = [
    `M ${x + radius} ${y}`,
    `H ${x + width - radius}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `Q ${x} ${y + height} ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    'Z'
  ].join(' ');
  page.drawSvgPath(path, options);
}

async function drawTicketPage(pdfDoc, order, seat, settings = {}, font) {
  const data = sanitizeTicket(order, seat);
  const { colorScheme = {}, design = {}, qrCode = {}, ticketContent = {}, companyInfo = {} } = settings;

  const termsText = buildTermsText(order, settings);
  const showTerms = ticketContent.showTerms !== false && termsText;

  const pageWidth = 560;
  const pageHeight = showTerms ? 860 : 700;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const backgroundColor = hexToRgb(colorScheme.background || '#FFFFFF');
  const textColor = hexToRgb(colorScheme.text || '#111827');
  const grayColor = hexToRgb(colorScheme.gray || '#6B7280');
  const lightGray = hexToRgb(colorScheme.lightGray || '#D1D5DB');
  const accentColor = hexToRgb(design.accent || colorScheme.accent || '#10B981');

  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: backgroundColor });

  const margin = 12;
  const cardX = margin;
  const cardY = margin;
  const cardWidth = pageWidth - margin * 2;
  const cardHeight = pageHeight - margin * 2;
  const radius = design.rounded ?? 24;

  if (design.shadow !== false) {
    drawRoundedRect(page, cardX + 4, cardY - 4, cardWidth, cardHeight, radius, {
      color: rgb(0, 0, 0),
      opacity: 0.1
    });
  }
  drawRoundedRect(page, cardX, cardY, cardWidth, cardHeight, radius, { color: backgroundColor });

  // hero banner
  const heroHeight = 192;
  const bannerY = cardY + cardHeight - heroHeight;
  const heroUrl = design.heroUrl || data.event.image;
  if (heroUrl) {
    try {
      const response = await fetch(heroUrl, { mode: 'cors', headers: { Accept: 'image/*' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const imgBytes = await response.arrayBuffer();
      let img;
      if (heroUrl.startsWith('data:image/png')) img = await pdfDoc.embedPng(imgBytes);
      else img = await pdfDoc.embedJpg(imgBytes);
      page.drawImage(img, { x: cardX, y: bannerY, width: cardWidth, height: heroHeight });
    } catch (err) {
      console.warn(`Failed to fetch hero image from ${heroUrl}:`, err);
      page.drawRectangle({ x: cardX, y: bannerY, width: cardWidth, height: heroHeight, color: accentColor });
    }
  } else {
    page.drawRectangle({ x: cardX, y: bannerY, width: cardWidth, height: heroHeight, color: accentColor });
  }

  page.drawRectangle({
    x: cardX,
    y: bannerY,
    width: cardWidth,
    height: heroHeight,
    color: rgb(0, 0, 0),
    opacity: design.darkHeader ? 0.6 : 0.3
  });

  // brand pill
  const brand = companyInfo.brand || companyInfo.name || data.companyName || 'TicketWayz';
  const pillFont = 12;
  const dotSize = 8;
  const pillPadX = 12;
  const pillPadY = 6;
  const brandWidth = font.widthOfTextAtSize(brand, pillFont);
  const pillWidth = brandWidth + pillPadX * 2 + dotSize + 8;
  const pillHeight = pillFont + pillPadY * 2;
  const pillX = cardX + (cardWidth - pillWidth) / 2;
  const pillY = bannerY + heroHeight - pillHeight - 16;
  drawRoundedRect(page, pillX, pillY, pillWidth, pillHeight, pillHeight / 2, {
    color: rgb(0, 0, 0),
    opacity: 0.6
  });
  page.drawCircle({
    x: pillX + pillPadX + dotSize / 2,
    y: pillY + pillHeight / 2,
    size: dotSize / 2,
    color: accentColor
  });
  page.drawText(brand, {
    x: pillX + pillPadX + dotSize + 8,
    y: pillY + pillPadY,
    size: pillFont,
    font,
    color: backgroundColor
  });

  // body content
  const padX = 24;
  const padTop = 32;
  let cursorY = bannerY - 24 - padTop;

  if (data.event.title) {
    const titleSize = 24;
    page.drawText(data.event.title, {
      x: cardX + padX,
      y: cursorY,
      size: titleSize,
      font,
      color: textColor
    });
    cursorY -= titleSize + 12;
  }
  if (ticketContent.showDateTime !== false && data.event.date) {
    const { dateTime } = formatDateTime(data.event.date);
    const size = 16;
    page.drawText(dateTime, {
      x: cardX + padX,
      y: cursorY,
      size,
      font,
      color: grayColor
    });
    cursorY -= size + 4;
  }
  if (ticketContent.showVenueInfo !== false && data.event.location) {
    const size = 16;
    page.drawText(data.event.location, {
      x: cardX + padX,
      y: cursorY,
      size,
      font,
      color: grayColor
    });
    cursorY -= size + 4;
  }

  // info grid
  cursorY -= 12;
  const gridItems = [];
  if (data.seat.section || data.seat.row || data.seat.seat) {
    if (data.seat.section) gridItems.push(['SECTION', data.seat.section]);
    if (data.seat.row) gridItems.push(['ROW', data.seat.row]);
    if (data.seat.seat) gridItems.push(['SEAT', data.seat.seat]);
  } else {
    gridItems.push(['ADMISSION', 'GA']);
  }
  if (ticketContent.showPrice !== false && data.price) {
    gridItems.push(['PRICE', data.price]);
  }
  const colWidth = (cardWidth - padX * 2) / 2;
  const labelSize = 12;
  const valueSize = 16;
  const rowHeight = labelSize + valueSize + 8;
  gridItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = cardX + padX + col * colWidth;
    const y = cursorY - row * rowHeight;
    page.drawText(item[0], { x, y, size: labelSize, font, color: grayColor });
    page.drawText(String(item[1]), {
      x,
      y: y - labelSize - 4,
      size: valueSize,
      font,
      color: accentColor
    });
  });
  const gridRows = Math.ceil(gridItems.length / 2);
  cursorY -= gridRows * rowHeight + 24;

  // QR block
  if (design.showQRCode !== false) {
    try {
      const qrValue = qrCode.value || data.ticketId || data.orderNumber || 'Ticket';
      const qrDataUrl = await QRCode.toDataURL(qrValue);
      const qrBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrBytes);
      const blockSize = 164;
      const blockPad = 16;
      const qrSize = blockSize - blockPad * 2;
      const blockRadius = 12;
      const qrX = cardX + (cardWidth - blockSize) / 2;
      const qrY = cursorY - blockSize;
      drawRoundedRect(page, qrX, qrY, blockSize, blockSize, blockRadius, {
        color: backgroundColor,
        borderColor: lightGray,
        borderWidth: 1
      });
      page.drawImage(qrImage, {
        x: qrX + blockPad,
        y: qrY + blockPad,
        width: qrSize,
        height: qrSize
      });
      cursorY = qrY - 16;
      if (qrCode.value) {
        const textWidth = font.widthOfTextAtSize(String(qrCode.value), 12);
        page.drawText(String(qrCode.value), {
          x: cardX + (cardWidth - textWidth) / 2,
          y: cursorY,
          size: 12,
          font,
          color: grayColor
        });
        cursorY -= 16;
      }
      if (data.ticketId) {
        const idText = `ID: ${data.ticketId}`;
        const idWidth = font.widthOfTextAtSize(idText, 12);
        page.drawText(idText, {
          x: cardX + (cardWidth - idWidth) / 2,
          y: cursorY,
          size: 12,
          font,
          color: grayColor
        });
        cursorY -= 24;
      }
    } catch {
      // ignore
    }
  }

  // terms section
  if (showTerms) {
    page.drawLine({
      start: { x: cardX + padX, y: cursorY },
      end: { x: cardX + cardWidth - padX, y: cursorY },
      thickness: 1,
      color: lightGray,
      dashArray: [4, 4]
    });
    cursorY -= 16;
    page.drawText(String(termsText), {
      x: cardX + padX,
      y: cursorY,
      size: 12,
      font,
      color: grayColor,
      maxWidth: cardWidth - padX * 2
    });
  }
}

export async function downloadTicketsPDF(order, fileName = 'tickets.pdf', templateSettings) {
  if (!order) return;

  let settings = templateSettings;
  if (!settings) {
    try {
      const stored = localStorage.getItem('ticketTemplateSettings');
      if (stored) settings = JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  settings = settings || {};

  settings.design = settings.design || {};
  order.event = order.event || {};
  settings.design.heroUrl = validateImageUrl(settings.design.heroUrl);
  order.event.image = validateImageUrl(order.event.image);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fetch('https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf').then((res) =>
    res.arrayBuffer()
  );
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  if (Array.isArray(order.seats) && order.seats.length > 0) {
    for (const seat of order.seats) {
      await drawTicketPage(pdfDoc, order, seat, settings, font);
    }
  } else {
    await drawTicketPage(pdfDoc, order, null, settings, font);
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

export { drawTicketPage };

