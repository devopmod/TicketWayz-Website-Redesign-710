import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'qrcode';
import TicketTemplate from '../components/ticket/TicketTemplate.js';

const DEFAULT_HERO = 'https://via.placeholder.com/560x160.png?text=Ticket';

function validateImageUrl(url) {
  if (!url) return undefined;
  if (String(url).startsWith('data:image')) return String(url);
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') return url;
  } catch {
    // ignore invalid URLs
  }
  return undefined;
}

function validateColor(color) {
  if (typeof color !== 'string') return undefined;
  const value = color.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : undefined;
}

export function sanitizeTicket(data = {}) {
  const stringFields = [
    'ticketType',
    'heroImage',
    'heroUrl',
    'brand',
    'artist',
    'date',
    'time',
    'venue',
    'address',
    'section',
    'row',
    'seat',
    'gate',
    'currency',
    'qrImage',
    'qrValue',
    'ticketId',
    'terms',
    'accent',
  ];
  const result = { ...data };
  for (const key of stringFields) {
    const val = result[key];
    result[key] = val === undefined || val === null ? undefined : String(val);
  }
  return result;
}

function coerceBoolean(override, setting, fallback) {
  return override !== undefined
    ? Boolean(override)
    : setting !== undefined
      ? Boolean(setting)
      : fallback;
}

function coerceNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export async function applyTicketTemplate(data = {}) {
  const { order = {}, seat = {}, settings = {}, ...rest } = data;
  const event = order.event || {};
  const company = order.company || {};
  const seatInfo = Object.keys(seat).length ? seat : order.seat || {};

  let date = rest.date;
  let time = rest.time;
  const dateTime = rest.dateTime || event.date;
  if (dateTime && !date && !time) {
    try {
      const dt = new Date(dateTime);
      date = dt.toLocaleDateString();
      time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // ignore parsing errors
    }
  }

  const reserved = Boolean(
    seatInfo.section || seatInfo.row_number || seatInfo.seat_number,
  );

  const heroUrl =
    validateImageUrl(rest.heroUrl) ||
    validateImageUrl(settings.design?.heroUrl) ||
    validateImageUrl(event.image) ||
    DEFAULT_HERO;

  const priceSource = rest.price ?? seatInfo.price ?? order.price;
  const priceVal = priceSource !== undefined ? coerceNumber(priceSource) : undefined;

  const roundedVal = coerceNumber(rest.rounded ?? settings.design?.rounded);

  const ticketData = sanitizeTicket({
    ticketType: rest.ticketType || (reserved ? 'reserved' : 'ga'),
    heroImage: heroUrl,
    heroUrl,
    brand: rest.brand || company.name,
    artist: rest.artist || event.title,
    date,
    time,
    venue: rest.venue || event.location,
    address: rest.address || event.address,
    section: reserved ? rest.section || seatInfo.section : undefined,
    row: reserved ? rest.row || seatInfo.row_number : undefined,
    seat: reserved ? rest.seat || seatInfo.seat_number : undefined,
    gate: reserved ? rest.gate || seatInfo.gate : undefined,
    price: priceVal,
    currency: rest.currency || order.currency,
    ticketId: rest.ticketId || seatInfo.id || order.orderNumber,
    terms: rest.terms || settings.terms,
  });

  const options = sanitizeTicket({
    accent: validateColor(rest.accent ?? settings.design?.accent),
    darkHeader: coerceBoolean(
      rest.darkHeader,
      settings.design?.darkHeader,
      false,
    ),
    showPrice: coerceBoolean(
      rest.showPrice,
      settings.ticketContent?.showPrice,
      true,
    ),
    showQr: coerceBoolean(
      rest.showQr,
      settings.design?.showQr ?? settings.design?.showQRCode,
      true,
    ),
    showTerms: coerceBoolean(
      rest.showTerms,
      settings.ticketContent?.showTerms,
      true,
    ),
    shadow: coerceBoolean(rest.shadow, settings.design?.shadow, true),
    rounded: roundedVal,
    radius: roundedVal,
    qrValue: rest.qrValue || order.orderNumber || seatInfo.id,
  });

  if (options.showQr && options.qrValue) {
    try {
      ticketData.qrImage = await QRCode.toDataURL(String(options.qrValue));
    } catch {
      ticketData.qrImage = '';
    }
  }

  return renderToStaticMarkup(
    React.createElement(TicketTemplate, { data: ticketData, options }),
  );
}

export default applyTicketTemplate;
