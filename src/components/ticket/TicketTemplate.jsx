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

const SafeText = ({ text, className }) => (
  <span className={className}>{toStr(text)}</span>
);

const Slot = ({ label, value, accent }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className="text-lg font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        <SafeText text={value} />
      </div>
    </div>
  );
};

const MiniQR = ({ image, ticketId }) => {
  if (!image) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 bg-white flex items-center justify-center">
        <img src={image} alt="QR code" className="w-full h-full object-cover" />
      </div>
      {ticketId && (
        <div className="mt-2 text-xs text-gray-500">
          <SafeText text={ticketId} />
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

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[slotItems.length] || 'grid-cols-1';

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
              <SafeText text={artist} />
            </h1>
          )}
          {(date || time) && (
            <div className="text-sm text-gray-600">
              <SafeText text={[date, time].filter(Boolean).join(' ')} />
            </div>
          )}
          {venue && (
            <div className="text-sm">
              <SafeText text={venue} />
            </div>
          )}
          {address && (
            <div className="text-sm text-gray-500">
              <SafeText text={address} />
            </div>
          )}

          {slotItems.length > 0 && (
            <div className={`mt-6 grid ${gridClass} gap-4 text-center`}>
              {slotItems.map((s) => (
                <Slot key={`${s.label}-${s.value}`} accent={accent} {...s} />
              ))}
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
            <SafeText text={terms} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

export default TicketTemplate;
