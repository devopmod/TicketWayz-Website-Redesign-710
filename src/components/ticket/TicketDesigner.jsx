import React, { useRef, useState } from 'react';
import TicketTemplate from './TicketTemplate';
import { downloadTicketsPDF } from '../../utils/ticketExport';

const defaultData = {
  heroImage: '',
  brand: '',
  artist: '',
  date: '',
  time: '',
  venue: '',
  address: '',
  section: '',
  row: '',
  seat: '',
  price: '',
  currency: '',
  qrValue: '',
  terms: '',
};

const defaultOptions = {
  accent: '',
  darkHeader: false,
  showPrice: true,
  showQr: true,
  showTerms: true,
  rounded: true,
  shadow: true,
};

const TicketDesigner = () => {
  const [data, setData] = useState(defaultData);
  const [options, setOptions] = useState(defaultOptions);
  const previewRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionsChange = (e) => {
    const { name, type, checked, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const exportPdf = async () => {
    const order = {
      company: { name: data.brand },
      event: {
        title: data.artist,
        date: data.date,
        location: data.venue,
        address: data.address,
        note: data.terms,
        image: data.heroImage,
      },
      seats: [
        {
          section: data.section,
          row_number: data.row,
          seat_number: data.seat,
          price: data.price,
          id: data.qrValue,
        },
      ],
      currency: data.currency,
    };

    const settings = {
      design: {
        accent: options.accent,
        darkHeader: options.darkHeader,
        rounded: options.rounded,
        shadow: options.shadow,
        showQRCode: options.showQr,
      },
      ticketContent: {
        showPrice: options.showPrice,
        showTerms: options.showTerms,
      },
    };

    downloadTicketsPDF(order, 'ticket', settings);
  };

  return (
    <div className="flex gap-8">
      <div className="w-80 space-y-2">
        {Object.keys(defaultData).map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-xs" htmlFor={field}>{field}</label>
            <input
              id={field}
              name={field}
              className="border p-1 text-sm"
              value={data[field] || ''}
              onChange={handleChange}
            />
          </div>
        ))}
        <div className="flex flex-col">
          <label className="text-xs" htmlFor="accent">accent</label>
          <input
            id="accent"
            name="accent"
            className="border p-1 text-sm"
            value={options.accent}
            onChange={handleOptionsChange}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="darkHeader"
            type="checkbox"
            name="darkHeader"
            checked={options.darkHeader}
            onChange={handleOptionsChange}
          />
          <label htmlFor="darkHeader">Dark header</label>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="showPrice"
            type="checkbox"
            name="showPrice"
            checked={options.showPrice}
            onChange={handleOptionsChange}
          />
          <label htmlFor="showPrice">Show price</label>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="showQr"
            type="checkbox"
            name="showQr"
            checked={options.showQr}
            onChange={handleOptionsChange}
          />
          <label htmlFor="showQr">Show QR</label>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="showTerms"
            type="checkbox"
            name="showTerms"
            checked={options.showTerms}
            onChange={handleOptionsChange}
          />
          <label htmlFor="showTerms">Show terms</label>
        </div>
        <button
          type="button"
          className="mt-4 px-3 py-2 bg-blue-500 text-white rounded"
          onClick={exportPdf}
        >
          Export PDF
        </button>
      </div>
      <div className="flex items-start justify-center">
        <TicketTemplate ref={previewRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default TicketDesigner;
