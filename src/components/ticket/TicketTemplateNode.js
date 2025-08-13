import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Sanitize ticket data by forcing known fields to strings
export function sanitizeTicket(data = {}) {
  const stringFields = [
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
  const result = { ...data };
  for (const key of stringFields) {
    const val = result[key];
    result[key] = val === undefined || val === null ? undefined : String(val);
  }
  return result;
}

// Render a labelled slot used for seat information, price, etc.
function slot(label, value) {
  if (!value) return null;
  return React.createElement(
    'div',
    null,
    React.createElement('div', { className: 'text-xs text-gray-500' }, label),
    React.createElement('div', { className: 'text-lg font-semibold' }, value),
  );
}

const TicketTemplate = (props = {}) => {
  const data = sanitizeTicket(props.data || {});
  const options = props.options || {};

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
  } = data;

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

  const classes = [
    'ticket w-[560px] bg-white text-gray-900 font-sans border',
    rounded ? 'rounded-lg overflow-hidden' : '',
    shadow ? 'shadow-md' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const gridCols = showPrice && price ? 'grid-cols-5' : 'grid-cols-4';

  return React.createElement(
    'div',
    { className: classes },
    React.createElement(
      'div',
      { className: 'relative h-40 w-full' },
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
        ? React.createElement('h1', { className: 'text-2xl font-bold' }, artist)
        : null,
      date || time
        ? React.createElement(
            'div',
            { className: 'text-sm text-gray-600' },
            [date, time].filter(Boolean).join(' '),
          )
        : null,
      venue ? React.createElement('div', { className: 'text-sm' }, venue) : null,
      address
        ? React.createElement('div', { className: 'text-sm text-gray-500' }, address)
        : null,
      React.createElement(
        'div',
        { className: `mt-6 grid ${gridCols} gap-4 text-center` },
        slot('SECTION', section),
        slot('ROW', row),
        slot('SEAT', seat),
        slot('GATE', gate),
        showPrice && price
          ? slot(
              'PRICE',
              React.createElement(
                React.Fragment,
                null,
                price,
                currency ? ` ${currency}` : '',
              ),
            )
          : null,
      ),
      showQr
        ? React.createElement(
            'div',
            { className: 'mt-6 flex items-center justify-between' },
            React.createElement(
              'div',
              { className: 'flex flex-col items-center' },
              React.createElement(
                'div',
                { className: 'w-32 h-32 bg-gray-200 flex items-center justify-center' },
                qr
                  ? React.createElement('img', {
                      src: qr,
                      alt: 'QR code',
                      className: 'w-full h-full object-cover',
                    })
                  : null,
              ),
              qrValue
                ? React.createElement(
                    'div',
                    { className: 'mt-2 text-xs text-gray-500' },
                    qrValue,
                  )
                : null,
              ticketId
                ? React.createElement(
                    'div',
                    { className: 'text-xs text-gray-500' },
                    ticketId,
                  )
                : null,
            ),
          )
        : null,
      showTerms && terms
        ? React.createElement(
            'div',
            { className: 'mt-6 text-[10px] text-gray-500' },
            terms,
          )
        : null,
    ),
  );
};

export default TicketTemplate;
