import React, { useEffect, useState, forwardRef } from 'react';
import QRCode from 'qrcode';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
export const CARD_WIDTH = 560;
export const HEADER_HEIGHT = 160;

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------
const toStr = (val) => (val === undefined || val === null ? '' : String(val));

export function sanitizeTicket(data = {}) {
  const fields = [
    'heroImage',
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
    'price',
    'currency',
    'qrImage',
    'ticketId',
    'terms',
  ];
  const result = {};
  for (const key of fields) {
    const val = data[key];
    if (val !== undefined && val !== null) result[key] = toStr(val);
  }
  return result;
}

export const SafeText = ({ text, className }) =>
  React.createElement('span', { className }, toStr(text));

export const Slot = ({ label, value, accent }) =>
  !value
    ? null
    : React.createElement(
        'div',
        { className: 'flex flex-col text-center' },
        React.createElement('div', { className: 'text-xs text-gray-500' }, label),
        React.createElement(
          'div',
          {
            className: 'text-lg font-semibold',
            style: accent ? { color: accent } : undefined,
          },
          React.createElement(SafeText, { text: value }),
        ),
      );

export const MiniQR = ({ image, qrValue, ticketId }) =>
  !image
    ? null
    : React.createElement(
        'div',
        { className: 'flex flex-col items-center' },
        React.createElement(
          'div',
          { className: 'w-32 h-32 bg-gray-200 flex items-center justify-center' },
          React.createElement('img', {
            src: image,
            alt: 'QR code',
            className: 'w-full h-full object-cover',
          }),
        ),
        qrValue
          ? React.createElement(
              'div',
              { className: 'mt-2 text-xs text-gray-500' },
              React.createElement(SafeText, { text: qrValue }),
            )
          : null,
        ticketId
          ? React.createElement(
              'div',
              { className: 'text-xs text-gray-500' },
              React.createElement(SafeText, { text: ticketId }),
            )
          : null,
      );

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {}

  render() {
    const { error } = this.state;
    const { children } = this.props;
    return error
      ? React.createElement(
          'div',
          { className: 'p-4 text-red-500' },
          'Error rendering ticket',
        )
      : children;
  }
}

// -----------------------------------------------------------------------------
// Ticket Template
// -----------------------------------------------------------------------------
const TicketTemplate = forwardRef((props = {}, ref) => {
  const { data = {}, options = {} } = props;
  const ticket = sanitizeTicket(data);
  const {
    heroImage,
    brand,
    artist,
    date,
    time,
    venue,
    address,
    section,
    row,
    seat,
    gate,
    price,
    currency,
    qrImage,
    ticketId,
    terms,
  } = ticket;

  const {
    accent,
    darkHeader = false,
    showPrice = true,
    showQr = true,
    showTerms = true,
    radius,
    shadow = true,
    qrValue,
  } = options;

  const rounded =
    radius === undefined ? true : radius !== false && radius !== 0 && radius !== 'none';

  const [qr, setQr] = useState(qrImage);

  useEffect(() => {
    if (!qr && showQr && qrValue) {
      QRCode.toDataURL(String(qrValue))
        .then(setQr)
        .catch(() => {});
    }
  }, [qr, showQr, qrValue]);

  const isGA = !section && !row && !seat;

  const slotItems = [];
  if (isGA) {
    slotItems.push({ label: 'ADMISSION', value: 'GA' });
    if (gate) slotItems.push({ label: 'GATE', value: gate });
  } else {
    if (section) slotItems.push({ label: 'SECTION', value: section });
    if (row) slotItems.push({ label: 'ROW', value: row });
    if (seat) slotItems.push({ label: 'SEAT', value: seat });
    if (gate) slotItems.push({ label: 'GATE', value: gate });
  }
  if (showPrice && price) {
    slotItems.push({
      label: 'PRICE',
      value: currency ? `${price} ${currency}` : price,
    });
  }

  const gridClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
    }[slotItems.length] || 'grid-cols-1';

  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(
      'div',
      {
        ref,
        className: [
          'ticket bg-white text-gray-900 font-sans border',
          rounded ? 'rounded-lg overflow-hidden' : '',
          shadow ? 'shadow-md' : '',
        ]
          .filter(Boolean)
          .join(' '),
        style: { width: CARD_WIDTH },
      },
      React.createElement(
        'div',
        { className: 'relative w-full', style: { height: HEADER_HEIGHT } },
        heroImage
          ? React.createElement('img', {
              src: heroImage,
              alt: '',
              className: 'absolute inset-0 w-full h-full object-cover',
            })
          : null,
        React.createElement('div', {
          className: [
            'absolute inset-0',
            darkHeader
              ? 'bg-black/70'
              : 'bg-gradient-to-b from-transparent via-black/30 to-black/70',
          ].join(' '),
        }),
        brand
          ? React.createElement(
              'span',
              {
                className:
                  'absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded',
                style: accent
                  ? { backgroundColor: accent }
                  : { backgroundColor: '#000000b3' },
              },
              brand,
            )
          : null,
      ),
      React.createElement(
        'div',
        { className: 'p-6 space-y-2' },
        artist
          ? React.createElement(
              'h1',
              { className: 'text-2xl font-bold' },
              React.createElement(SafeText, { text: artist }),
            )
          : null,
        date || time
          ? React.createElement(
              'div',
              { className: 'text-sm text-gray-600' },
              React.createElement(SafeText, {
                text: [date, time].filter(Boolean).join(' '),
              }),
            )
          : null,
        venue
          ? React.createElement(
              'div',
              { className: 'text-sm' },
              React.createElement(SafeText, { text: venue }),
            )
          : null,
        address
          ? React.createElement(
              'div',
              { className: 'text-sm text-gray-500' },
              React.createElement(SafeText, { text: address }),
            )
          : null,
        slotItems.length
          ? React.createElement(
              'div',
              { className: `mt-6 grid ${gridClass} gap-4 text-center` },
              ...slotItems.map((s) =>
                React.createElement(Slot, {
                  key: `${s.label}-${s.value}`,
                  accent,
                  ...s,
                }),
              ),
            )
          : null,
        showQr
          ? React.createElement(
              'div',
              { className: 'mt-6 flex items-center justify-center' },
              React.createElement(MiniQR, {
                image: qr,
                qrValue,
                ticketId,
              }),
            )
          : null,
        showTerms && terms
          ? React.createElement(
              'div',
              { className: 'mt-6 text-[10px] text-gray-500' },
              React.createElement(SafeText, { text: terms }),
            )
          : null,
      ),
    ),
  );
});

export default TicketTemplate;

