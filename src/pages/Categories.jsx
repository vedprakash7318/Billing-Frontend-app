import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  FolderOpen,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories', { params: { search: search.trim() } });
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (cat) => {
    if (cat.productCount > 0) {
      toastError(`Cannot delete: ${cat.productCount} products are in this category.`);
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete Category?',
      text: `Are you sure you want to delete category "${cat.name}"?`,
      confirmButtonText: 'Yes, Delete',
      isDangerous: true,
    });
    if (!confirmed) return;

    try {
      await api.delete(`/admin/categories/${cat.id || cat._id}`);
      toastSuccess('Category deleted');
      fetchCategories();
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Failed to delete');
    }
  };

  return (
    <AppLayout
      title="Categories"
      subtitle={`${categories.length} item groups`}
      actionButton={
        <Link
          to="/categories/new"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500">
              Create product categories like Electronics, Grocery, Apparel, Snacks, etc.
            </p>
            <Link
              to="/categories/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id || cat._id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{cat.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {cat.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Package className="w-3 h-3 text-slate-400" />
                        {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/categories/${cat.id || cat._id}/edit`}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
