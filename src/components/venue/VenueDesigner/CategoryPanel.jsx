import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../common/SafeIcon';

const { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } = FiIcons;

const CategoryPanel = ({ 
  categories = {}, 
  selectedCategory = null,
  onCategorySelect,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    color: '#3B82F6'
  });

  const colorPresets = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const handleCreateCategory = () => {
    setFormData({ id: '', name: '', color: '#3B82F6' });
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const handleEditCategory = (categoryId) => {
    const category = categories[categoryId];
    setFormData({
      id: categoryId,
      name: category.name,
      color: category.color
    });
    setEditingCategory(categoryId);
    setShowCreateModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.id.trim() || !formData.name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate ID format (slug-like)
    const idRegex = /^[A-Z_][A-Z0-9_]*$/;
    if (!idRegex.test(formData.id)) {
      alert('Category ID must be uppercase letters, numbers, and underscores only (e.g., PAR_L, VIP)');
      return;
    }

    if (editingCategory) {
      // Update existing category
      onCategoryUpdate(editingCategory, {
        name: formData.name.trim(),
        color: formData.color
      }, formData.id !== editingCategory ? formData.id : null);
    } else {
      // Create new category
      if (categories[formData.id]) {
        alert('Category ID already exists');
        return;
      }
      
      onCategoryCreate(formData.id, {
        name: formData.name.trim(),
        color: formData.color
      });
    }

    setShowCreateModal(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm(`Delete category "${categories[categoryId]?.name}"? This will remove the category from all seats.`)) {
      onCategoryDelete(categoryId);
    }
  };

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Categories</h3>
        <button
          onClick={handleCreateCategory}
          className="flex items-center px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-sm transition-colors"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4 mr-1" />
          New
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {Object.entries(categories).map(([categoryId, category]) => (
          <div
            key={categoryId}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
              selectedCategory === categoryId 
                ? 'bg-yellow-400/20 border-2 border-yellow-400' 
                : 'bg-zinc-700/50 hover:bg-zinc-700 border-2 border-transparent'
            }`}
            onClick={() => onCategorySelect(categoryId)}
          >
            <div
              className="w-6 h-6 rounded-full mr-3 border-2 border-white/20"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">{categoryId}</div>
              <div className="text-gray-400 text-xs truncate">{category.name}</div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(categoryId);
                }}
                className="p-1 hover:bg-zinc-600 rounded transition-colors"
              >
                <SafeIcon icon={FiEdit2} className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(categoryId);
                }}
                className="p-1 hover:bg-zinc-600 rounded transition-colors"
              >
                <SafeIcon icon={FiTrash2} className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(categories).length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No categories yet</p>
          <p className="text-xs mt-1">Create your first category to get started</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Category ID *
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      placeholder="PAR_L, VIP, BALC"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Uppercase letters, numbers, and underscores only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                      placeholder="Parterre Left, VIP, Balcony"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Color
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {colorPresets.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            formData.color === color 
                              ? 'border-white scale-110' 
                              : 'border-zinc-600 hover:border-zinc-500'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 bg-zinc-700 border border-zinc-600 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors flex items-center"
                  >
                    <SafeIcon icon={FiCheck} className="w-4 h-4 mr-1" />
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryPanel;