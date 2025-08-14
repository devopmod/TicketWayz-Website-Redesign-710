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
    let val = data[key];
    if (key === 'seat' && val && typeof val === 'object') {
      val =
        val.seat_number ||
        val.label ||
        val.number ||
        val.id ||
        val.seat?.seat_number ||
        val.seat?.label ||
        '';
    }
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

  const { showPrice = true, showQr = true } = options;

  return (
    <ErrorBoundary>
      <article
        ref={ref}
        className="ticket overflow-hidden rounded-[24px] shadow-2xl bg-white w-[560px] text-gray-900 font-sans"
        data-canvas-width={CARD_WIDTH}
      >
        <div className="relative h-[192px] bg-gray-100">
          {heroImage && (
            <img
              data-slot="heroImage"
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
          <div className="relative flex h-full items-start justify-center p-4">
            {brand && (
              <span
                data-slot="brand"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur"
              >
                {brand}
              </span>
            )}
          </div>
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
                  <div className="flex flex-col text-right ml-auto">
                    <div className="text-xs text-gray-500">PRICE</div>
                    <div
                      className="text-lg font-semibold"
                      style={{ color: '#f59e0b' }}
                      data-slot="price,currency"
                    >
                      {toStr(price)}
                      {currency && ` ${toStr(currency)}`}
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
                  <div className="flex flex-col text-right ml-auto">
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

        {terms && (
          <div className="border-t border-dashed border-gray-300 px-6 py-4 text-[11px] text-gray-500">
            <SafeText data-slot="terms" text={terms} />
          </div>
        )}
      </article>
    </ErrorBoundary>
  );
});

export default TicketTemplate;
