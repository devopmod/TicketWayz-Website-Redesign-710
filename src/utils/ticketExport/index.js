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

    const event = order.event || {};
    const company = order.company || {};
    const seatInfo = seat || order.seat || {};
    const dateObj = event.date ? new Date(event.date) : null;
    const date = dateObj ? dateObj.toLocaleDateString() : undefined;
    const time = dateObj
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;

    const data = {
      heroImage: settings.design?.heroUrl || event.image,
      brand: company.name,
      artist: event.title,
      date,
      time,
      venue: event.location,
      address: event.address,
      section: seatInfo.section,
      row: seatInfo.row_number,
      seat: seatInfo.seat_number,
      price: seatInfo.price || order.price,
      currency: order.currency,
      qrValue: seatInfo.id || order.orderNumber,
      terms: buildTermsText(order, settings),
    };

    const options = {
      accent: settings.design?.accent,
      darkHeader: settings.design?.darkHeader,
      showPrice: settings.ticketContent?.showPrice,
      showQr: settings.design?.showQRCode,
      showTerms: settings.ticketContent?.showTerms ?? true,
      rounded: settings.design?.rounded,
      shadow: settings.design?.shadow,
    };

    const markup = renderToStaticMarkup(
      React.createElement(TicketTemplate, { data, options }),
    );
    wrapper.innerHTML = markup;

    const child = wrapper.firstElementChild;
    if (child && child.style) {
      child.style.width = '560px';
      const scale = settings.scale || settings.design.scale;
      if (scale && scale !== 1) {
        child.style.transform = `scale(${scale})`;
        child.style.transformOrigin = 'top left';
      }
    }

    await new Promise((r) => setTimeout(r, 100));

    try {
      const dataUrl = await toPng(wrapper.firstElementChild, {
        cacheBust: true,
        backgroundColor: null,
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
  for (const img of images) {
    const pngBytes = await fetch(img).then((res) => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height,
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
