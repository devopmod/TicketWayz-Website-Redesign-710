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

const MiniQR = ({ value }) => {
  if (!value) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=164x164`;
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border p-3">
        <div className="w-[164px] h-[164px] border flex items-center justify-center">
          <img
            data-slot="qrValue"
            src={src}
            alt="QR code"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <SafeText data-slot="qrValue (text)" text={value} />
      </div>
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
    qrValue,
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
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )}
          <div
            className={[
              'absolute inset-0 z-10',
              darkHeader
                ? 'bg-black/60'
                : 'bg-gradient-to-b from-black/20 via-black/40 to-black/80',
            ].join(' ')}
          />
          {brand && (
            <span
              data-slot="brand"
              className="absolute top-4 left-4 z-20 px-2 py-1 text-white text-xs font-semibold rounded"
              style={accent ? { backgroundColor: accent } : { backgroundColor: '#000000b3' }}
            >
              {brand}
            </span>
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

            {(sectionValue || row || seat || (showPrice && price)) && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col text-left">
                  {sectionValue && (
                    <>
                      <div className="text-xs text-gray-500">
                        {isGA ? 'ADMISSION' : 'SECTION'}
                      </div>
                      <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                        <SafeText data-slot="section" text={sectionValue} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col text-right">
                  {showPrice && price && (
                    <>
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
                    </>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  {row && (
                    <>
                      <div className="text-xs text-gray-500">ROW</div>
                      <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                        <SafeText data-slot="row" text={row} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col text-right">
                  {seat && (
                    <>
                      <div className="text-xs text-gray-500">SEAT</div>
                      <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                        <SafeText data-slot="seat" text={seat} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {showQr && qrValue && (
              <div className="mt-6 flex items-center justify-center">
                <MiniQR value={qrValue} />
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
