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

const SafeText = ({ text, className, ...props }) => (
  <span className={className} {...props}>
    {toStr(text)}
  </span>
);

const MiniQR = ({ image, ticketId }) => {
  if (!image) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 bg-white flex items-center justify-center">
        <img
          data-slot="qrImage"
          src={image}
          alt="QR code"
          className="w-full h-full object-cover"
        />
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
    rounded = true,
    shadow = true,
  } = options;

  const isGA = !section && !row && !seat;
  const sectionValue = section || (isGA ? 'GA' : undefined);
  const fieldsCount = [
    sectionValue,
    row,
    seat,
    gate,
    showPrice && price,
  ].filter(Boolean).length;

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[fieldsCount] || 'grid-cols-1';

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
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div
            className={[
              'absolute inset-0',
              darkHeader
                ? 'bg-black/70'
                : 'bg-gradient-to-b from-transparent via-black/30 to-black/70',
            ].join(' ')}
          />
          {brand && (
            <span
              data-slot="brand"
              className="absolute top-4 left-4 px-2 py-1 text-white text-xs font-semibold rounded"
              style={accent ? { backgroundColor: accent } : { backgroundColor: '#000000b3' }}
            >
              {brand}
            </span>
          )}
        </div>
        <div className="p-6 space-y-2">
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
            <div className="text-sm">
              <SafeText data-slot="venue" text={venue} />
            </div>
          )}
          {address && (
            <div className="text-sm text-gray-500">
              <SafeText data-slot="address" text={address} />
            </div>
          )}

          {fieldsCount > 0 && (
            <div className={`mt-6 grid ${gridClass} gap-4 text-center`}>
              {sectionValue && (
                <div className="flex flex-col text-center">
                  <div className="text-xs text-gray-500">
                    {isGA ? 'ADMISSION' : 'SECTION'}
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={accent ? { color: accent } : undefined}
                  >
                    <SafeText data-slot="section" text={sectionValue} />
                  </div>
                </div>
              )}
              {row && (
                <div className="flex flex-col text-center">
                  <div className="text-xs text-gray-500">ROW</div>
                  <div
                    className="text-lg font-semibold"
                    style={accent ? { color: accent } : undefined}
                  >
                    <SafeText data-slot="row" text={row} />
                  </div>
                </div>
              )}
              {seat && (
                <div className="flex flex-col text-center">
                  <div className="text-xs text-gray-500">SEAT</div>
                  <div
                    className="text-lg font-semibold"
                    style={accent ? { color: accent } : undefined}
                  >
                    <SafeText data-slot="seat" text={seat} />
                  </div>
                </div>
              )}
              {gate && (
                <div className="flex flex-col text-center">
                  <div className="text-xs text-gray-500">GATE</div>
                  <div
                    className="text-lg font-semibold"
                    style={accent ? { color: accent } : undefined}
                  >
                    <SafeText data-slot="gate" text={gate} />
                  </div>
                </div>
              )}
              {showPrice && price && (
                <div className="flex flex-col text-center">
                  <div className="text-xs text-gray-500">PRICE</div>
                  <div
                    className="text-lg font-semibold"
                    style={accent ? { color: accent } : undefined}
                  >
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
            </div>
          )}

          {showQr && qrImage && (
            <div className="mt-6 flex items-center justify-center">
              <MiniQR image={qrImage} ticketId={ticketId} />
            </div>
          )}
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
