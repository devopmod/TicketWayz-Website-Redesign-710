import React, { forwardRef } from 'react';

export const CARD_WIDTH = 560;
export const HEADER_HEIGHT = 192;

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
    'price',
    'currency',
    'ticketId',
    'qrImage',
    'qrValue',
    'terms',
  ];
  const result = {};
  for (const key of fields) {
    const val = data[key];
    if (val !== undefined && val !== null) result[key] = toStr(val);
  }
  return result;
}

const SafeText = ({ text, className, ...props }) => (
  <span className={className} {...props}>
    {toStr(text)}
  </span>
);

const MiniQR = ({ qrImage, qrValue, ticketId }) => {
  const value = qrValue;
  const src =
    qrImage || (value ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=164x164` : null);
  if (!src) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="w-[164px] h-[164px] flex items-center justify-center border border-gray-300">
          <img
            data-slot="qrValue"
            src={src}
            alt="QR code"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        </div>
      </div>
      {ticketId && (
        <div className="mt-2 text-xs text-gray-500">
          <SafeText data-slot="ticketId" text={ticketId} />
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
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
    if (error) {
      return <div className="p-4 text-red-500">Error rendering ticket</div>;
    }
    return children;
  }
}

const TicketTemplate = forwardRef(({ data = {}, options = {} }, ref) => {
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
    price,
    currency,
    ticketId,
    qrImage,
    qrValue,
    terms,
  } = ticket;

  const actualTicketId = ticketId || qrValue;

  const {
    accent,
    darkHeader = false,
    showPrice = true,
    showQr = true,
    showTerms = true,
    rounded = true,
    shadow = true,
  } = options;

  return (
    <ErrorBoundary>
      <div
        ref={ref}
        className={[
          'ticket bg-white text-gray-900 font-sans border',
          rounded ? 'rounded-lg overflow-hidden' : '',
          shadow ? 'shadow-md' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: CARD_WIDTH }}
      >
        <div className="relative w-full" style={{ height: HEADER_HEIGHT }}>
          {heroImage && (
            <img
              data-slot="heroImage"
              src={heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
            />
          )}
          <div
            className={[
              'absolute inset-0 z-10',
              darkHeader
                ? 'bg-black/60'
                : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent',
            ].join(' ')}
          />
          {brand && (
            <div className="absolute inset-x-0 top-6 z-20 flex justify-center">
              <span
                data-slot="brand"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur"
              >
                {brand}
              </span>
            </div>
          )}
        </div>
        <div className="relative -mt-6 rounded-t-[24px] bg-white p-6 pt-8">
          <div className="space-y-2">
            {artist && (
              <h1 className="text-2xl font-bold">
                <SafeText data-slot="artist" text={artist} />
              </h1>
            )}
            {(date || time) && (
              <div className="text-sm text-gray-600">
                {date && <SafeText data-slot="date" text={date} />}
                {time && (
                  <>
                    {date && ' '}
                    <SafeText data-slot="time" text={time} />
                  </>
                )}
              </div>
            )}
            {venue && (
              <div className="text-sm" style={{ color: '#f59e0b' }}>
                <SafeText data-slot="venue" text={venue} />
              </div>
            )}
            {address && (
              <div className="text-sm text-gray-500">
                <SafeText data-slot="address" text={address} />
              </div>
            )}

            {(section || row || seat || (showPrice && price)) && (
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {section && (
                  <div className="flex flex-col text-left">
                    <div className="text-xs text-gray-500">SECTION</div>
                    <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                      <SafeText data-slot="section" text={section} />
                    </div>
                  </div>
                )}
                {showPrice && price && (
                  <div className="flex flex-col text-right">
                    <div className="text-xs text-gray-500">PRICE</div>
                    <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                      <SafeText data-slot="price" text={price} />
                      {currency && (
                        <span>
                          {' '}
                          <SafeText data-slot="currency" text={currency} />
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {row && (
                  <div className="flex flex-col text-left">
                    <div className="text-xs text-gray-500">ROW</div>
                    <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                      <SafeText data-slot="row" text={row} />
                    </div>
                  </div>
                )}
                {seat && (
                  <div className="flex flex-col text-right">
                    <div className="text-xs text-gray-500">SEAT</div>
                    <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                      <SafeText data-slot="seat" text={seat} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {showQr && (qrImage || qrValue) && (
              <div className="mt-6 flex items-center justify-center">
                <MiniQR qrImage={qrImage} qrValue={qrValue} ticketId={actualTicketId} />
              </div>
            )}
            {qrValue && actualTicketId && qrValue !== actualTicketId && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                <SafeText data-slot="qrValue (text)" text={qrValue} />
              </div>
            )}
          </div>
        </div>

        {showTerms && terms && (
          <div className="border-t border-dashed border-gray-300 px-6 py-4 text-[11px] text-gray-500">
            <SafeText data-slot="terms" text={terms} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

export default TicketTemplate;
