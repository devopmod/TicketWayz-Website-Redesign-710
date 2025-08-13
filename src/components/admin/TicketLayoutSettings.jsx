import React from 'react';
import TicketPreview from './TicketPreview';

const TicketLayoutSettings = ({ settings, onDownloadPreview, onRefreshPreview, ticketData }) => {
  return (
    <div className="space-y-6">
      <TicketPreview
        settings={settings}
        onDownload={onDownloadPreview}
        onRefresh={onRefreshPreview}
        ticketData={ticketData}
        qrValue={ticketData?.ticketNumber}
      />
    </div>
  );
};

export default TicketLayoutSettings;
