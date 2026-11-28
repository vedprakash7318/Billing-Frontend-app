import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';
import { ProductsSkeleton } from '../components/Skeletons';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Load categories for filter bar
  useEffect(() => {
    api.get('/admin/categories').then((res) => {
      if (res.data?.data) setCategories(res.data.data);
    }).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search.trim(),
          categoryId: selectedCat,
        },
      });
      if (res.data?.success) {
        setProducts(res.data.data || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedCat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleDelete = async (prod) => {
    const confirmed = await confirmDialog({
      title: 'Delete Product?',
      text: `Are you sure you want to delete "${prod.title}" (Code: ${prod.uniqueCode})?`,
      confirmButtonText: 'Yes, Delete',
      isDangerous: true,
    });
    if (!confirmed) return;

    try {
      await api.delete(`/admin/products/${prod.id || prod._id}`);
      toastSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Failed to delete product');
    }
  };

  return (
    <AppLayout
      title="Products Catalog"
      subtitle={`${pagination.total} catalog items`}
      actionButton={
        <Link
          to="/products/new"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </Link>
      }
    >
      <div className="space-y-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, code (e.g. PRD-), des..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Horizontal Category Pill Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              setSelectedCat('ALL');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => {
              setSelectedCat('UNCATEGORIZED');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === 'UNCATEGORIZED'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Uncategorized
          </button>
          {categories.map((c) => (
            <button
              key={c.id || c._id}
              onClick={() => {
                setSelectedCat(c.id || c._id);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === (c.id || c._id)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products List */}
        {loading ? (
          <ProductsSkeleton />
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500">
              Add products with title, description, price, category, and auto-generated unique code.
            </p>
            <Link
              to="/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id || p._id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {p.description || 'No description'}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                        {p.uniqueCode}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px]">
                        {p.categoryName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 h-full">
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900 block">₹{p.price}</span>
                    {p.mrp && p.mrp > p.price && (
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className="text-[10px] text-slate-400 line-through">₹{p.mrp}</span>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded">
                          {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Link
                      to={`/products/${p.id || p._id}/edit`}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
