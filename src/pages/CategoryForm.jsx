import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { Layers, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

export default function CategoryForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    api
      .get(`/admin/categories/${id}`)
      .then((res) => {
        const cat = res.data?.data;
        if (cat) {
          setName(cat.name);
          setDescription(cat.description || '');
          setIsActive(Boolean(cat.isActive));
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load category');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (isEditing) {
        await api.put(`/admin/categories/${id}`, payload);
        toastSuccess('Category updated successfully');
      } else {
        await api.post('/admin/categories', payload);
        toastSuccess('Category created successfully');
      }

      navigate('/categories');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save category';
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      title={isEditing ? 'Edit Category' : 'New Category'}
      subtitle="Catalog Grouping"
      backTo="/categories"
      hideBottomNav={true}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dairy & Beverages, Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Short description for this item grouping..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800">Category Active</p>
                <p className="text-[11px] text-slate-500">Show in billing POS & product catalog</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link
                to="/categories"
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-center hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : isEditing ? 'Update Category' : 'Save Category'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
