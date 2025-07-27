import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../common/SafeIcon';

const {
  FiMove,
  FiSquare,
  FiCircle,
  FiMousePointer,
  FiTrash2,
  FiCopy,
  FiGrid,
  FiLayers,
  FiTriangle,
  FiPaintBucket
} = FiIcons;

const DesignerToolbar = ({
  selectedTool,
  onToolChange,
  onDeleteElement,
  onDuplicateElement,
  selectedElement,
  onClearCanvas,
  onToggleGrid,
  showGrid = true,
  // New category painting props
  selectedCategory = null,
  categories = {}
}) => {
  const tools = [
    { id: 'select', label: 'Select', icon: FiMousePointer, hotkey: 'V' },
    { id: 'pan', label: 'Pan', icon: FiMove, hotkey: 'H' },
    {
      id: 'paint-category',
      label: 'Paint Category',
      icon: FiPaintBucket,
      hotkey: 'P',
      disabled: !selectedCategory
    },
    { id: 'seat', label: 'Add Seat', icon: FiCircle, hotkey: 'S' },
    { id: 'section', label: 'Add Section', icon: FiSquare, hotkey: 'R' },
    { id: 'polygon', label: 'Add Polygon', icon: FiTriangle, hotkey: 'G' },
    { id: 'stage', label: 'Add Stage', icon: FiLayers, hotkey: 'T' }
  ];

  const actions = [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: FiCopy,
      disabled: !selectedElement,
      onClick: onDuplicateElement
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: FiTrash2,
      disabled: !selectedElement,
      onClick: onDeleteElement,
      className: 'text-red-400 hover:text-red-300'
    }
  ];

  const utilities = [
    {
      id: 'grid',
      label: showGrid ? 'Hide Grid' : 'Show Grid',
      icon: FiGrid,
      onClick: onToggleGrid,
      active: showGrid
    }
  ];

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <div className="space-y-6">
        {/* Drawing Tools */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => !tool.disabled && onToolChange(tool.id)}
                disabled={tool.disabled}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  selectedTool === tool.id
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : tool.disabled
                    ? 'border-zinc-600 text-gray-600 cursor-not-allowed'
                    : 'border-zinc-600 hover:border-zinc-500 text-gray-300 hover:text-white'
                }`}
                title={`${tool.label} (${tool.hotkey})${tool.disabled ? ' - Select a category first' : ''}`}
              >
                <SafeIcon icon={tool.icon} className="w-5 h-5 mb-1" />
                <span className="text-xs">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Painting Info */}
        {selectedTool === 'paint-category' && selectedCategory && (
          <div className="bg-zinc-700/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Painting Category</h4>
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: categories[selectedCategory]?.color }}
              />
              <div>
                <div className="text-sm text-white">{selectedCategory}</div>
                <div className="text-xs text-gray-400">{categories[selectedCategory]?.name}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click on seats to assign this category
            </p>
          </div>
        )}

        {/* Polygon Tool Info */}
        {selectedTool === 'polygon' && (
          <div className="bg-zinc-700/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Polygon Tool</h4>
            <p className="text-xs text-gray-400 mt-2">
              Click to add points. Click near the first point or double-click to complete the polygon.
            </p>
          </div>
        )}

        {/* Select Tool Info */}
        {selectedTool === 'select' && (
          <div className="bg-zinc-700/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Select Tool</h4>
            <p className="text-xs text-gray-400 mt-2">
              Click and drag to move elements. Use handles to resize.
            </p>
          </div>
        )}

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Actions</h3>
          <div className="space-y-2">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`w-full flex items-center p-2 rounded-lg text-left transition-colors ${
                  action.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : `text-gray-300 hover:bg-zinc-700 hover:text-white ${action.className || ''}`
                }`}
              >
                <SafeIcon icon={action.icon} className="w-4 h-4 mr-2" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Utilities */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">View</h3>
          <div className="space-y-2">
            {utilities.map(utility => (
              <button
                key={utility.id}
                onClick={utility.onClick}
                className={`w-full flex items-center p-2 rounded-lg text-left transition-colors ${
                  utility.active
                    ? 'text-yellow-400 bg-yellow-400/10'
                    : 'text-gray-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <SafeIcon icon={utility.icon} className="w-4 h-4 mr-2" />
                {utility.label}
              </button>
            ))}
            <button
              onClick={onClearCanvas}
              className="w-full flex items-center p-2 rounded-lg text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>

        {/* Hotkeys Help */}
        <div className="pt-4 border-t border-zinc-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Hotkeys</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <div>V - Select Tool</div>
            <div>H - Pan Tool</div>
            <div>P - Paint Category</div>
            <div>S - Seat Tool</div>
            <div>R - Section Tool</div>
            <div>G - Polygon Tool</div>
            <div>T - Stage Tool</div>
            <div>Del - Delete Selected</div>
            <div>Ctrl+D - Duplicate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerToolbar;