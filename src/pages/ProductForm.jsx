import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Package,
  Save,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Tag,
  ScanBarcode,
  Search,
  Check,
  ChevronDown,
  Lock,
  Percent,
  Plus,
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');

  // Searchable Category Dropdown State
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const catDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mrp: '',
    price: '',
    categoryId: '',
    uniqueCode: '',
    isActive: true,
  });

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load categories and auto-generate code on mount if new
  useEffect(() => {
    Promise.all([
      api.get('/admin/categories'),
      !isEditing ? api.get('/admin/products/generate-code') : Promise.resolve({ data: {} }),
    ])
      .then(([catsRes, codeRes]) => {
        const catList = catsRes.data?.data || [];
        setCategories(catList);

        if (!isEditing) {
          const autoCode = codeRes.data?.code || `PRD-${Date.now().toString().slice(-6)}`;
          setFormData((prev) => ({
            ...prev,
            categoryId: catList[0]?.id || catList[0]?._id || '',
            uniqueCode: autoCode,
          }));
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingCats(false));
  }, [isEditing]);

  // Load product details if editing
  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    api
      .get(`/admin/products/${id}`)
      .then((res) => {
        const p = res.data?.data;
        if (p) {
          setFormData({
            title: p.title || '',
            description: p.description || '',
            mrp: p.mrp !== undefined && p.mrp !== null ? p.mrp.toString() : p.price?.toString() || '',
            price: p.price?.toString() || '0',
            categoryId: p.category?._id || p.category || '',
            uniqueCode: p.uniqueCode || '',
            isActive: Boolean(p.isActive),
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleGenerateFreshCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await api.get('/admin/products/generate-code');
      if (res.data?.code) {
        setFormData((prev) => ({ ...prev, uniqueCode: res.data.code }));
        toastSuccess(`New code generated: ${res.data.code}`);
      }
    } catch {
      const fallback = `PRD-${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ ...prev, uniqueCode: fallback }));
    } finally {
      setGeneratingCode(false);
    }
  };

  // Discount calculation
  const numMrp = Number(formData.mrp) || 0;
  const numPrice = Number(formData.price) || 0;
  const discountAmount = numMrp > numPrice ? numMrp - numPrice : 0;
  const discountPercent =
    numMrp > 0 && discountAmount > 0 ? Math.round((discountAmount / numMrp) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId) {
      setError('Please select or create a category first.');
      return;
    }

    if (numPrice <= 0) {
      setError('Please enter a valid Selling Price.');
      return;
    }

    if (!isEditing) {
      const user = JSON.parse(localStorage.getItem('client_admin_user') || '{}');
      const currentSub = user?.tenant?.currentSubscription;
      const isExpired =
        !currentSub ||
        currentSub.status === 'EXPIRED' ||
        user?.tenant?.status === 'EXPIRED' ||
        (currentSub.endDate && new Date(currentSub.endDate) < new Date());

      if (isExpired) {
        setError('Subscription expired! Please renew or activate a plan to add products.');
        toastError('Subscription expired! Please renew or activate a plan to add products.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        mrp: numMrp > 0 ? numMrp : numPrice,
        price: numPrice,
        categoryId: formData.categoryId,
        uniqueCode: formData.uniqueCode.trim().toUpperCase(),
        isActive: formData.isActive,
      };

      if (isEditing) {
        await api.put(`/admin/products/${id}`, payload);
        toastSuccess('Product updated successfully!');
      } else {
        await api.post('/admin/products', payload);
        toastSuccess('Product added to catalog!');
      }

      navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save product';
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Filtered categories for searchable dropdown
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase().trim())
  );
  const selectedCategory = categories.find(
    (c) => (c.id || c._id) === formData.categoryId
  );

  return (
    <AppLayout
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      subtitle="Catalog Inventory"
      backTo="/products"
      hideBottomNav={true}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {loading || loadingCats ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">Loading form...</div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
            <Layers className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Category Exists</h3>
            <p className="text-xs text-slate-500">
              Please create at least one category before adding products.
            </p>
            <Link
              to="/categories/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Create Category Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Basmati Rice 5kg / Kurkure Masala Munch"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-semibold"
              />
            </div>

            {/* Unique Code / SKU (Auto-generated - NON-EDITABLE / READ-ONLY) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Unique Code / SKU (Auto) *</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Auto</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateFreshCode}
                  disabled={generatingCode}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingCode ? 'animate-spin' : ''}`} />
                  <span>Generate New</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* READ ONLY NON-EDITABLE FIELD */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={formData.uniqueCode}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono font-bold uppercase select-all cursor-not-allowed"
                    title="Auto-generated unique code (locked). Use 'Generate New' or 'Scan' to change."
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 transition-all"
                  title="Scan Retail Barcode via Camera"
                >
                  <ScanBarcode className="w-4 h-4 text-emerald-400" />
                  <span>Scan</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-assigned unique barcode/SKU. Non-editable manually. Tap 'Scan' to capture packaging barcode.
              </p>
            </div>

            {/* MRP & Selling Price (Both inputs with Live Discount Calculation) */}
            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Pricing & Customer Discount
                </span>
                {discountAmount > 0 ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-pulse">
                    <Percent className="w-3 h-3" />
                    <span>{discountPercent}% OFF (Save ₹{discountAmount.toFixed(2)})</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    Set MRP higher than Selling Price to show discount
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* MRP Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MRP (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={formData.price || '300'}
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 block">Printed price on pack</span>
                </div>

                {/* Selling Price Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="250"
                      value={formData.price}
                      onChange={(e) => {
                        const newPrice = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          price: newPrice,
                          // If MRP is empty, auto-sync MRP to this selling price
                          mrp: prev.mrp ? prev.mrp : newPrice,
                        }));
                      }}
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-emerald-500 rounded-xl text-xs font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <span className="text-[9.5px] text-emerald-600 font-bold mt-0.5 block">Actual price billed</span>
                </div>
              </div>
            </div>

            {/* Category: Custom Searchable Dropdown */}
            <div className="relative" ref={catDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCatDropdownOpen((prev) => !prev);
                  setCatSearch('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between text-left transition-all focus:outline-none focus:border-emerald-500"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Tag className="w-3 h-3" />
                  </div>
                  <span className="truncate">
                    {selectedCategory ? selectedCategory.name : 'Select a Category...'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isCatDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Floating Dropdown Panel */}
              {isCatDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search input inside dropdown */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type to search category..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="w-full py-1.5 pr-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Filtered list of categories */}
                  <div className="max-h-48 overflow-y-auto no-scrollbar p-1 space-y-0.5">
                    {filteredCategories.length === 0 ? (
                      <div className="py-4 text-center text-[11px] text-slate-400">
                        <p>No category matching "{catSearch}"</p>
                        <Link
                          to="/categories/new"
                          className="text-emerald-600 font-bold hover:underline mt-1 inline-block"
                        >
                          + Create New Category
                        </Link>
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isSelected = (c.id || c._id) === formData.categoryId;
                        return (
                          <button
                            key={c.id || c._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, categoryId: c.id || c._id });
                              setIsCatDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Product description, weight, specifications..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800">Available for Billing</p>
                <p className="text-[11px] text-slate-500">Show item in POS counter & sales invoice</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <Link
                to="/products"
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 text-center hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : isEditing ? 'Update Item' : 'Add to Catalog'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Barcode Camera Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title="Scan Product Barcode"
          subtitle="Point at packaging barcode to capture code"
          continuous={false}
          onScan={(code) => {
            const cleanCode = code.trim().toUpperCase();
            setFormData((prev) => ({ ...prev, uniqueCode: cleanCode }));
            toastSuccess(`Barcode captured: ${cleanCode}`);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </AppLayout>
  );
}
