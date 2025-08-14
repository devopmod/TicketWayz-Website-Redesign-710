import { toPng } from 'html-to-image';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TicketTemplate } from '../../components/ticket';

/**
 * Combine event notes and custom text into a single terms string.
 * @param {Object} [order={}] Order data containing event info and terms
 * @param {Object} [settings={}] Template settings that may include custom text
 * @returns {string} Joined terms text
 */
export function buildTermsText(order = {}, settings = {}) {
  const eventNote = order?.event?.note;
  const ticketContent = settings.ticketContent || {};
  return [
    eventNote,
    ticketContent.customInstructions,
    ticketContent.termsAndConditions,
    order?.terms,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Validate hero or event image URL allowing only http(s) or data URIs.
 * @param {string} url Image URL to validate
 * @returns {string|null} Sanitised URL or null if invalid
 */
export function validateImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  if (url.startsWith('/')) return new URL(url, window.location.origin).href;
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') return url;
  } catch {
    // ignore
  }
  console.warn('Hero image URL must be an absolute, publicly accessible URL:', url);
  return null;
}

/**
 * Build TicketTemplate props from order, seat and settings objects.
 * @param {Object} [order={}] Order data
 * @param {Object} [seat={}] Seat-specific data
 * @param {Object} [settings={}] Template settings
 * @returns {{data: Object, options: Object}} Props for TicketTemplate
 */
export function buildTicketTemplateProps(order = {}, seat = {}, settings = {}) {
  settings = settings || {};
  const design = settings.design || {};
  const ticketContent = settings.ticketContent || {};

  const event = order.event || {};
  const company = order.company || {};
  const seatInfo = seat || order.seat || {};

  const dateObj = event.date ? new Date(event.date) : null;
  const date = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString() : order.date;
  const time =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : order.time;

  const data = {
    heroImage: design.heroUrl || event.image || order.heroImage,
    brand: company.name || order.brand,
    artist: event.title || order.artist,
    date,
    time,
    venue: event.location || order.venue,
    address: event.address || order.address,
    section: seatInfo.section || seatInfo.zoneName || seatInfo.zone?.name || order.section,
    row: seatInfo.row_number || order.row,
    seat: seatInfo.seat_number || order.seat,
    price: seatInfo.price ?? order.price,
    currency: order.currency,
    qrValue: seatInfo.id || order.orderNumber || order.qrValue,
    ticketType: seatInfo.ticketType || seatInfo.type || order.ticketType,
    terms: buildTermsText(order, settings),
  };

  const options = {
    accent: design.accent,
    darkHeader: design.darkHeader,
    showPrice: ticketContent.showPrice,
    showQr: design.showQRCode,
    showTerms: ticketContent.showTerms ?? true,
    rounded: design.rounded,
    shadow: design.shadow,
    scale: settings.scale || design.scale,
  };

  return { data, options };
}

/**
 * Generate a PDF of tickets and trigger download in the browser.
 *
 * @param {Object} order Order data including event, company and seats
 * @param {string} [baseFileName='ticket'] Base name for the resulting file
 * @param {Object} [templateSettings] Ticket template settings
 * @returns {Promise<void>} Resolves when the download has been triggered
 */
export async function downloadTicketsPDF(order, baseFileName = 'ticket', templateSettings) {
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
  settings.ticketContent = settings.ticketContent || {};
  order.event = order.event || {};
  settings.design.heroUrl = validateImageUrl(settings.design.heroUrl);
  order.event.image = validateImageUrl(order.event.image);

  const seats = Array.isArray(order.seats) && order.seats.length > 0 ? order.seats : [null];
  const images = [];

  for (const seat of seats) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-10000px';
    document.body.appendChild(wrapper);

    const seatInfo = seat || order.seat || {};
    const { data, options } = buildTicketTemplateProps(order, seatInfo, settings);

    const markup = renderToStaticMarkup(
      React.createElement(TicketTemplate, { data, options }),
    );
    wrapper.innerHTML = markup;

    const child = wrapper.firstElementChild;
    if (child && child.style) {
      child.style.width = '560px';
      const scale = options.scale;
      if (scale && scale !== 1) {
        child.style.transform = `scale(${scale})`;
        child.style.transformOrigin = 'top left';
      }
      if (options.rounded !== undefined) {
        child.style.borderRadius = options.rounded ? '24px' : '0';
      }
      if (options.shadow !== undefined) {
        child.style.boxShadow = options.shadow
          ? '0 25px 50px -12px rgba(0,0,0,0.25)'
          : 'none';
      }
    }

    await new Promise((r) => setTimeout(r, 100));

    try {
      const dataUrl = await toPng(wrapper.firstElementChild, {
        cacheBust: true,
        backgroundColor: null,
        style: {
          transform: child?.style.transform,
          transformOrigin: child?.style.transformOrigin,
          borderRadius: child?.style.borderRadius,
          boxShadow: child?.style.boxShadow,
        },
      });
      images.push(dataUrl);
    } catch (err) {
      console.error('Error generating image', err);
    }

    document.body.removeChild(wrapper);
  }

  if (images.length === 0) return;

  let PDFDocument;
  try {
    ({ PDFDocument } = await import('pdf-lib'));
  } catch (err) {
    console.error('pdf-lib not available', err);
    return;
  }

  const pdfDoc = await PDFDocument.create();
  const PAGE_WIDTH = 595.28; // A4 width in points
  const PAGE_HEIGHT = 841.89; // A4 height in points
  for (const img of images) {
    const pngBytes = await fetch(img).then((res) => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const scale = Math.min(PAGE_WIDTH / pngImage.width, PAGE_HEIGHT / pngImage.height);
    const imgWidth = pngImage.width * scale;
    const imgHeight = pngImage.height * scale;
    const x = (PAGE_WIDTH - imgWidth) / 2;
    const y = (PAGE_HEIGHT - imgHeight) / 2;
    page.drawImage(pngImage, {
      x,
      y,
      width: imgWidth,
      height: imgHeight,
    });
  }
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default downloadTicketsPDF;
