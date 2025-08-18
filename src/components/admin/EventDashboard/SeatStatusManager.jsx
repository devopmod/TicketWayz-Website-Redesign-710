import React from 'react';

const SeatStatusManager = ({ statistics }) => {
  const total = statistics?.totalSeats || 0;
  const sold = statistics?.soldSeats || 0;
  const held = statistics?.heldSeats || 0;
  const available = statistics?.freeSeats || 0;

  const getPercentage = (value) => (total ? (value / total) * 100 : 0);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-4">Seat Status Overview</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Sold</span>
            <span>{sold}/{total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
            <div
              className="h-4 rounded bg-green-500"
              style={{ width: `${getPercentage(sold)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Held</span>
            <span>{held}/{total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
            <div
              className="h-4 rounded bg-yellow-500"
              style={{ width: `${getPercentage(held)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Available</span>
            <span>{available}/{total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-4">
            <div
              className="h-4 rounded bg-gray-500"
              style={{ width: `${getPercentage(available)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatStatusManager;
