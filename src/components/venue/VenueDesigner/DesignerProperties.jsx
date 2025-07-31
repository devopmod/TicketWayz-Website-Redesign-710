import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../common/SafeIcon';

const { FiSettings, FiHash, FiSquare, FiPalette, FiTag, FiUsers } = FiIcons;

const DesignerProperties = ({ selectedElement, onElementUpdate, onElementDelete, categories = {} }) => {
  if (!selectedElement) {
    return (
      <div className="bg-zinc-800 p-4 rounded-lg">
        <div className="text-center text-gray-400 py-8">
          <SafeIcon icon={FiSettings} className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an element to edit properties</p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onElementUpdate({ ...selectedElement, [property]: value });
  };

  const handlePointUpdate = (index, axis, value) => {
    if (selectedElement.type === 'polygon' && selectedElement.points) {
      const newPoints = [...selectedElement.points];
      newPoints[index] = { ...newPoints[index], [axis]: parseInt(value) || 0 };
      onElementUpdate({ ...selectedElement, points: newPoints });
    }
  };

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Properties</h3>
        <button
          onClick={onElementDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete Element"
        >
          <SafeIcon icon={FiSettings} className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Element Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Element Type</label>
          <div className="px-3 py-2 bg-zinc-700 rounded-lg text-white capitalize">
            {selectedElement.type}
          </div>
        </div>

        {/* Category Assignment */}
        {selectedElement.type !== 'stage' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <SafeIcon icon={FiTag} className="inline w-4 h-4 mr-1" /> Category
            </label>
            <select
              value={selectedElement.categoryId || ''}
              onChange={(e) => handlePropertyChange('categoryId', e.target.value || null)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="">No Category</option>
              {Object.entries(categories).map(([categoryId, category]) => (
                <option key={categoryId} value={categoryId}>
                  {categoryId} - {category.name}
                </option>
              ))}
            </select>
            {selectedElement.categoryId && categories[selectedElement.categoryId] && (
              <div className="mt-2 flex items-center text-sm">
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: categories[selectedElement.categoryId].color }}
                />
                <span className="text-gray-300">{categories[selectedElement.categoryId].name}</span>
              </div>
            )}
          </div>
        )}

        {/* Position */}
        {selectedElement.type !== 'polygon' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Polygon Points */}
        {selectedElement.type === 'polygon' && selectedElement.points && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Polygon Points</label>
            <div className="max-h-48 overflow-y-auto pr-2">
              {selectedElement.points.map((point, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Point {index + 1} X</label>
                    <input
                      type="number"
                      value={Math.round(point.x)}
                      onChange={(e) => handlePointUpdate(index, 'x', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Point {index + 1} Y</label>
                    <input
                      type="number"
                      value={Math.round(point.y)}
                      onChange={(e) => handlePointUpdate(index, 'y', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        {selectedElement.type === 'seat' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <SafeIcon icon={FiSquare} className="inline w-4 h-4 mr-1" /> Size
            </label>
            <input
              type="number"
              value={selectedElement.size || 20}
              onChange={(e) => handlePropertyChange('size', parseInt(e.target.value) || 20)}
              min="10"
              max="50"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
        )}

        {/* Dimensions for section and stage */}
        {(selectedElement.type === 'section' || selectedElement.type === 'stage') && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <SafeIcon icon={FiSquare} className="inline w-4 h-4 mr-1" /> Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  value={selectedElement.width || 100}
                  onChange={(e) => handlePropertyChange('width', parseInt(e.target.value) || 100)}
                  min="50"
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  value={selectedElement.height || 80}
                  onChange={(e) => handlePropertyChange('height', parseInt(e.target.value) || 80)}
                  min="40"
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Capacity for sections and polygons */}
        {(selectedElement.type === 'section' || selectedElement.type === 'polygon') && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <SafeIcon icon={FiUsers} className="inline w-4 h-4 mr-1" /> Seating Capacity
            </label>
            <input
              type="number"
              value={selectedElement.capacity || 1}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const capacity = value > 0 ? (value <= 1000 ? value : 1000) : 1;
                handlePropertyChange('capacity', capacity);
              }}
              min="1"
              max="1000"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            />
            <p className="text-xs text-gray-500 mt-1">Number of seats in this {selectedElement.type} (1-1000)</p>
          </div>
        )}

        {/* Bookable toggle for sections, polygons and seats */}
        {(selectedElement.type === 'section' || selectedElement.type === 'polygon' || selectedElement.type === 'seat') && (
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.is_bookable !== false}
                onChange={(e) => handlePropertyChange('is_bookable', e.target.checked)}
                className="w-4 h-4 text-yellow-400 bg-transparent border-gray-500 focus:ring-yellow-400 mr-2"
              />
              <span className="text-sm font-medium text-gray-400">Bookable</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              When disabled, this {selectedElement.type} cannot be booked by customers
            </p>
          </div>
        )}

        {/* Color (for stages only - categories handle colors for other elements) */}
        {selectedElement.type === 'stage' && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <SafeIcon icon={FiPalette} className="inline w-4 h-4 mr-1" /> Color
            </label>
            <input
              type="color"
              value={selectedElement.color || '#6B7280'}
              onChange={(e) => handlePropertyChange('color', e.target.value)}
              className="w-full h-10 bg-zinc-700 border border-zinc-600 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Label */}
        {(selectedElement.type === 'section' || selectedElement.type === 'polygon' || selectedElement.type === 'stage') && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Label</label>
            <input
              type="text"
              value={selectedElement.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              placeholder={`e.g. ${selectedElement.type === 'stage' ? 'STAGE' : 'Section A'}`}
            />
          </div>
        )}

        {/* Seat-specific properties */}
        {selectedElement.type === 'seat' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <SafeIcon icon={FiHash} className="inline w-4 h-4 mr-1" /> Seat Number
              </label>
              <input
                type="text"
                value={selectedElement.number || ''}
                onChange={(e) => handlePropertyChange('number', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                placeholder="e.g. A-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Section & Row</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Section</label>
                  <input
                    type="text"
                    value={selectedElement.section || 'A'}
                    onChange={(e) => handlePropertyChange('section', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Row</label>
                  <input
                    type="number"
                    value={selectedElement.row || 1}
                    onChange={(e) => handlePropertyChange('row', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Note about pricing */}
        {selectedElement.type !== 'stage' && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-200 mb-1">💡 Pricing</h4>
            <p className="text-xs text-blue-200/80">
              Prices are set per category in the Event creation wizard, not in the venue designer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerProperties;