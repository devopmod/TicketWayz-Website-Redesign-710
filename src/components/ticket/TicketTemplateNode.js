import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const TicketTemplate = (props) => {
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
    qrValue,
    ticketId,
    terms,
    rounded = true,
    shadow = true,
    showQr = true,
    showPrice = true,
    showTerms = true,
    darkHeader = false,
  } = props;

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
                'absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded',
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
        section
          ? React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'text-xs text-gray-500' },
                'SECTION',
              ),
              React.createElement(
                'div',
                { className: 'text-lg font-semibold' },
                section,
              ),
            )
          : null,
        row
          ? React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'text-xs text-gray-500' },
                'ROW',
              ),
              React.createElement('div', { className: 'text-lg font-semibold' }, row),
            )
          : null,
        seat
          ? React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'text-xs text-gray-500' },
                'SEAT',
              ),
              React.createElement(
                'div',
                { className: 'text-lg font-semibold' },
                seat,
              ),
            )
          : null,
        gate
          ? React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'text-xs text-gray-500' },
                'GATE',
              ),
              React.createElement(
                'div',
                { className: 'text-lg font-semibold' },
                gate,
              ),
            )
          : null,
        showPrice && price
          ? React.createElement(
              'div',
              null,
              React.createElement(
                'div',
                { className: 'text-xs text-gray-500' },
                'PRICE',
              ),
              React.createElement(
                'div',
                { className: 'text-lg font-semibold' },
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
