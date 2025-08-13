import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import TicketTemplate from './TicketTemplate.jsx';

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
  gate: '',
  price: '',
  currency: '',
  ticketId: '',
  terms: '',
};

const defaultOptions = {
  accent: '#000000',
  darkHeader: false,
  showPrice: true,
  showQr: true,
  showTerms: true,
  rounded: true,
  shadow: true,
  qrValue: '',
};

const TicketDesigner = () => {
  const [data, setData] = useState(defaultData);
  const [options, setOptions] = useState(defaultOptions);
  const ticketRef = useRef(null);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (e) => {
    const { name, type, checked, value } = e.target;
    setOptions((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const exportPng = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket.png';
    a.click();
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-semibold">Ticket Designer</h2>
        {Object.keys(defaultData).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm text-gray-600" htmlFor={key}>
              {key}
            </label>
            <input
              id={key}
              name={key}
              value={data[key]}
              onChange={handleDataChange}
              className="border p-2 rounded"
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="color"
              name="accent"
              value={options.accent}
              onChange={handleOptionChange}
            />
            <span>Accent</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="darkHeader"
              checked={options.darkHeader}
              onChange={handleOptionChange}
            />
            <span>Dark header</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="showPrice"
              checked={options.showPrice}
              onChange={handleOptionChange}
            />
            <span>Show price</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="showQr"
              checked={options.showQr}
              onChange={handleOptionChange}
            />
            <span>Show QR</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="showTerms"
              checked={options.showTerms}
              onChange={handleOptionChange}
            />
            <span>Show terms</span>
          </label>
        </div>

        <button
          type="button"
          onClick={exportPng}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export PNG
        </button>
      </div>

      <div className="flex-1">
        <TicketTemplate
          ref={ticketRef}
          data={data}
          options={{ ...options, qrValue: options.qrValue || data.ticketId }}
        />
      </div>
    </div>
  );
};

export default TicketDesigner;

