import React from 'react';
import { pdf, Document } from '@react-pdf/renderer';
import { TicketTemplatePDF } from '../../components/ticket';

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
  if (!/^https?:/i.test(url)) {
    return new URL(url, window.location.origin).href;
  }
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
  const pages = [];

  for (const seat of seats) {
    const seatInfo = seat || order.seat || {};
    const { data, options } = buildTicketTemplateProps(order, seatInfo, settings);
    pages.push(
      React.createElement(TicketTemplatePDF, {
        key: pages.length,
        data,
        options,
      }),
    );
  }

  if (pages.length === 0) return;

  const doc = pdf(React.createElement(Document, null, pages));
  const blob = await doc.toBlob();
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
