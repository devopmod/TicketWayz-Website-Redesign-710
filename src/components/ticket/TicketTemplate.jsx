import React, { useEffect, useState, forwardRef } from 'react';
import QRCode from 'qrcode';

const TicketTemplate = forwardRef(({ data = {}, options = {} }, ref) => {
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

  const gridCols = showPrice && price ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div
      ref={ref}
      className={[
        'ticket w-[560px] bg-white text-gray-900 font-sans border',
        rounded ? 'rounded-lg overflow-hidden' : '',
        shadow ? 'shadow-md' : '',
      ].join(' ')}
    >
      <div className="relative h-40 w-full">
        {heroImage && (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div
          className={[
            'absolute inset-0',
            darkHeader
              ? 'bg-black/70'
              : 'bg-gradient-to-b from-transparent via-black/30 to-black/70',
          ].join(' ')}
        ></div>
        {brand && (
          <span
            className="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded"
            style={accent ? { backgroundColor: accent } : { backgroundColor: '#000000b3' }}
          >
            {brand}
          </span>
        )}
      </div>
      <div className="p-6 space-y-2">
        {artist && <h1 className="text-2xl font-bold">{artist}</h1>}
        {(date || time) && (
          <div className="text-sm text-gray-600">{[date, time].filter(Boolean).join(' ')}</div>
        )}
        {venue && <div className="text-sm">{venue}</div>}
        {address && <div className="text-sm text-gray-500">{address}</div>}
        <div className={`mt-6 grid ${gridCols} gap-4 text-center`}>
          {section && (
            <div>
              <div className="text-xs text-gray-500">SECTION</div>
              <div className="text-lg font-semibold">{section}</div>
            </div>
          )}
          {row && (
            <div>
              <div className="text-xs text-gray-500">ROW</div>
              <div className="text-lg font-semibold">{row}</div>
            </div>
          )}
          {seat && (
            <div>
              <div className="text-xs text-gray-500">SEAT</div>
              <div className="text-lg font-semibold">{seat}</div>
            </div>
          )}
          {gate && (
            <div>
              <div className="text-xs text-gray-500">GATE</div>
              <div className="text-lg font-semibold">{gate}</div>
            </div>
          )}
          {showPrice && price && (
            <div>
              <div className="text-xs text-gray-500">PRICE</div>
              <div className="text-lg font-semibold">
                {price}
                {currency ? ` ${currency}` : ''}
              </div>
            </div>
          )}
        </div>
        {showQr && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                {qr && <img src={qr} alt="QR code" className="w-full h-full object-cover" />}
              </div>
              {qrValue && (
                <div className="mt-2 text-xs text-gray-500">{qrValue}</div>
              )}
              {ticketId && (
                <div className="text-xs text-gray-500">{ticketId}</div>
              )}
            </div>
          </div>
        )}
        {showTerms && terms && (
          <div className="mt-6 text-[10px] text-gray-500">{terms}</div>
        )}
      </div>
    </div>
  );
});

export default TicketTemplate;

