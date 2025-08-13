import React from 'react';
import TicketPreview from './TicketPreview';

const TicketLayoutSettings = ({
  settings,
  onChange,
  onDownloadPreview,
  onRefreshPreview,
  ticketData,
}) => {
  const handle = (section, field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
        <div className="flex flex-col">
          <label className="text-sm mb-1 text-zinc-700 dark:text-zinc-300">Brand</label>
          <input
            type="text"
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1"
            value={settings.companyInfo.brand || ''}
            onChange={handle('companyInfo', 'brand')}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1 text-zinc-700 dark:text-zinc-300">Accent</label>
          <input
            type="color"
            className="h-10 w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
            value={settings.design.accent || '#f59e0b'}
            onChange={handle('design', 'accent')}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-600"
            checked={settings.design.darkHeader}
            onChange={handle('design', 'darkHeader')}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Dark header</span>
        </label>

        <div className="flex flex-col">
          <label className="text-sm mb-1 text-zinc-700 dark:text-zinc-300">Rounded (px)</label>
          <input
            type="number"
            min="0"
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1"
            value={settings.design.rounded ?? 24}
            onChange={handle('design', 'rounded')}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-600"
            checked={settings.design.shadow}
            onChange={handle('design', 'shadow')}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Shadow</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-600"
            checked={settings.ticketContent.showPrice}
            onChange={handle('ticketContent', 'showPrice')}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Show price</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-600"
            checked={settings.design.showQRCode}
            onChange={handle('design', 'showQRCode')}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Show QR</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-zinc-300 dark:border-zinc-600"
            checked={settings.ticketContent.showTerms}
            onChange={handle('ticketContent', 'showTerms')}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Show terms</span>
        </label>
      </div>

      <TicketPreview
        settings={settings}
        accent={settings.design.accent}
        darkHeader={settings.design.darkHeader}
        radius={settings.design.rounded}
        shadow={settings.design.shadow}
        showPrice={settings.ticketContent.showPrice}
        showQr={settings.design.showQRCode}
        showTerms={settings.ticketContent.showTerms}
        onDownload={onDownloadPreview}
        onRefresh={onRefreshPreview}
        ticketData={ticketData}
        qrValue={ticketData?.ticketNumber}
      />
    </div>
  );
};

export default TicketLayoutSettings;
