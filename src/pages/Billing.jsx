import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Package,
  History,
  X,
  ArrowRight,
  ShoppingCart,
  ScanBarcode,
  Trash2,
  Tag,
  Check,
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import api from '../services/api';
import { toastSuccess, toastError, confirmDialog } from '../utils/alerts';

export default function Billing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loadingProds, setLoadingProds] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_cart') || '[]');
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage and notify AppLayout
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('pos_cart_updated'));
  }, [cart]);

  // Load products & categories for instant client-side filtering
  useEffect(() => {
    Promise.all([
      api.get('/admin/products?limit=150&status=active'),
      api.get('/admin/categories'),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data?.data) setProducts(prodRes.data.data);
        if (catRes.data?.data) setCategories(catRes.data.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingProds(false));
  }, []);

  // Filter products based on search or category
  const trimmedSearch = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !trimmedSearch ||
      p.title.toLowerCase().includes(trimmedSearch) ||
      (p.uniqueCode && p.uniqueCode.toLowerCase().includes(trimmedSearch));

    const matchesCat =
      selectedCat === 'ALL' ||
      (p.category && (p.category._id === selectedCat || p.category === selectedCat || p.category.id === selectedCat));

    return matchesSearch && matchesCat;
  });

  // Cart operations (uses functional update so continuous camera scan never drops updates)
  const addToCart = (product) => {
    const prodId = product.id || product._id;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product === prodId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: Math.round(newQty * updated[existingIndex].price * 100) / 100,
        };
        return updated;
      }
      return [
        ...prevCart,
        {
          product: prodId,
          title: product.title,
          uniqueCode: product.uniqueCode,
          price: product.price,
          mrp: product.mrp || product.price,
          quantity: 1,
          total: product.price,
        },
      ];
    });
    toastSuccess(`+1 ${product.title}`);
  };

  const handleBarcodeScanned = (rawCode) => {
    const cleanCode = rawCode.trim().toUpperCase();
    const matched = products.find(
      (p) => p.uniqueCode && p.uniqueCode.toUpperCase() === cleanCode
    );
    if (matched) {
      addToCart(matched);
    } else {
      toastError(`No product found with barcode: ${cleanCode}`);
      setSearch(cleanCode);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      updated[index].quantity = newQty;
      updated[index].total = Math.round(newQty * updated[index].price * 100) / 100;
      setCart(updated);
    }
  };

  const setExactQuantity = (index, val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) return;
    const updated = [...cart];
    updated[index].quantity = num;
    updated[index].total = Math.round(num * updated[index].price * 100) / 100;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearBill = async () => {
    if (cart.length === 0) return;
    const confirmed = await confirmDialog({
      title: 'Clear Cart?',
      text: 'All added products will be removed.',
      confirmButtonText: 'Yes, Clear All',
      isDangerous: true,
    });
    if (confirmed) {
      setCart([]);
    }
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toastError('Please select at least one product before proceeding.');
      return;
    }
    navigate('/billing/checkout');
  };

  return (
    <AppLayout
      title="POS Billing"
      subtitle="Step 1: Select & Add Items"
      actionButton={
        <Link
          to="/invoices"
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span>Past Bills</span>
        </Link>
      }
    >
      <div className="space-y-3.5 pb-36">
        
        {/* Search Bar + Barcode Camera Scan Trigger */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search product title or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    e.preventDefault();
                    const query = search.trim().toUpperCase();
                    const exactMatch = products.find(
                      (p) =>
                        (p.uniqueCode && p.uniqueCode.toUpperCase() === query) ||
                        p.title.toUpperCase() === query
                    );
                    if (exactMatch) {
                      addToCart(exactMatch);
                      setSearch('');
                    } else if (filteredProducts.length === 1) {
                      addToCart(filteredProducts[0]);
                      setSearch('');
                    }
                  }
                }}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 transition-all"
              title="Scan Barcode via Camera"
            >
              <ScanBarcode className="w-4 h-4 text-emerald-400" />
              <span>Scan</span>
            </button>
          </div>

          {/* Quick Category Chips for One-Tap Filtering */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedCat('ALL')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCat === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id || cat._id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id || cat._id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCat === (cat.id || cat._id)
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product Items List (Shows Search Results OR Category Items) */}
          {loadingProds ? (
            <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
              Loading inventory catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 space-y-1">
              <p>No products found {search ? `for "${search}"` : ''}</p>
              <Link to="/products/new" className="text-emerald-600 font-bold hover:underline inline-block text-xs">
                + Create New Product
              </Link>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1.5 divide-y divide-slate-100">
              {filteredProducts.slice(0, 25).map((p) => {
                const prodId = p.id || p._id;
                const inCart = cart.find((item) => item.product === prodId);
                return (
                  <div
                    key={prodId}
                    className="pt-2 pb-1 px-1.5 flex items-center justify-between gap-2 hover:bg-emerald-50/40 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 font-medium truncate max-w-[100px]">
                            {p.uniqueCode}
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            ₹{p.price}
                          </span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{p.mrp}
                            </span>
                          )}
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded">
                              {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0 ${
                        inCart
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? `Add (${inCart.quantity})` : 'Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Cart / Added Items Section */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Cart Items ({totalItemsCount})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearBill}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 active:scale-95 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400">
                Tap '+ Add' on any product or scan barcode to add items.
              </p>
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-slate-100">
              {cart.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">
                        ₹{item.price} each • {item.uniqueCode}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                          Save ₹{((item.mrp - item.price) * item.quantity).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, -1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setExactQuantity(idx, e.target.value)}
                      className="w-8 text-center text-xs font-black bg-transparent focus:outline-none text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, 1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-emerald-50 hover:text-emerald-600 active:scale-90 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right min-w-[65px] shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{item.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(idx)}
                      className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 inline-block"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal & Proceed Button inside Cart Card */}
          {cart.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Cart Subtotal:</span>
              <span className="font-black text-slate-900 text-sm">₹{subtotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Floating / Sticky Bottom Quick Checkout Drawer (when items are in cart) */}
        {cart.length > 0 && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-3 z-40">
            <div className="bg-slate-950 text-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 border border-slate-800">
              <div className="pl-2">
                <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wide block">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                </span>
                <span className="text-base font-black text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Camera Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title="Scan Item Barcode"
          subtitle="Point camera at retail barcode (Kurkure, Soap, etc.)"
          continuous={true}
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </AppLayout>
  );
}
