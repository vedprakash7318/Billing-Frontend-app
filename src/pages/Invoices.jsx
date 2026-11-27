import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Receipt,
  Search,
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  X,
  CreditCard,
  Plus,
  Download,
} from 'lucide-react';
import api from '../services/api';
import { downloadInvoicePdf } from '../utils/pdfGenerator';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/invoices', {
        params: { page: pagination.page, limit: pagination.limit, search: search.trim() },
      });
      if (res.data?.success) {
        setInvoices(res.data.data || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [pagination.page, search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout
      title="Past Bills & Invoices"
      subtitle={`${pagination.total} sales receipts`}
      backTo="/"
      actionButton={
        <Link
          to="/billing"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bill</span>
        </Link>
      }
    >
      <div className="space-y-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, customer name, mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading bills history...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No invoices generated yet</h3>
            <p className="text-xs text-slate-500">
              Start billing customers to generate printable thermal receipts.
            </p>
            <Link
              to="/billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              <span>Create First Bill</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id || inv._id}
                onClick={() => setSelectedInvoice(inv)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 truncate">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {inv.paymentMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {inv.customerName} {inv.customerPhone ? `• ${inv.customerPhone}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {inv.items?.length || 0} items
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Billed by: {inv.billedBy?.name || 'Store Admin'} ({inv.billedBy?.designation || inv.billedBy?.role || 'Staff'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1.5">
                  <span className="font-black text-sm text-slate-900 block">
                    ₹{inv.grandTotal?.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadInvoicePdf(inv);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors">
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPRINT MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <span className="text-xs font-bold font-mono">Invoice #{selectedInvoice.invoiceNumber}</span>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Receipt */}
              <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] text-slate-900 space-y-3 print-receipt-area bg-white">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                  <p className="font-extrabold text-xs uppercase tracking-wide">
                    {selectedInvoice.billSnapshot?.headerTitle || 'TAX INVOICE'}
                  </p>
                  <h2 className="font-black text-base uppercase leading-tight">
                    {selectedInvoice.billSnapshot?.businessName || 'BILLING STORE'}
                  </h2>
                  {selectedInvoice.billSnapshot?.tagline && (
                    <p className="text-[10px] text-slate-600 italic">
                      {selectedInvoice.billSnapshot?.tagline}
                    </p>
                  )}
                  {selectedInvoice.billSnapshot?.showAddress && selectedInvoice.billSnapshot?.address && (
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {selectedInvoice.billSnapshot?.address}
                    </p>
                  )}
                  {selectedInvoice.billSnapshot?.showPhone && selectedInvoice.billSnapshot?.phone && (
                    <p className="text-[10px] text-slate-800 font-bold">
                      Ph: {selectedInvoice.billSnapshot?.phone}
                    </p>
                  )}
                  {selectedInvoice.billSnapshot?.showGstin && selectedInvoice.billSnapshot?.gstin && (
                    <p className="text-[10px] text-slate-800 font-bold">
                      GSTIN: {selectedInvoice.billSnapshot?.gstin}
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-[10px] py-1 border-b border-dashed border-slate-300">
                  <div>
                    <p className="font-bold">Bill: {selectedInvoice.invoiceNumber}</p>
                    <p>Customer: {selectedInvoice.customerName}</p>
                    {selectedInvoice.customerPhone && <p>Ph: {selectedInvoice.customerPhone}</p>}
                    <p className="text-emerald-700 font-bold mt-0.5">
                      Billed By: {selectedInvoice.billedBy?.name || 'Store Admin'} ({selectedInvoice.billedBy?.designation || selectedInvoice.billedBy?.role || 'Staff'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                    <p>Time: {new Date(selectedInvoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="font-bold text-emerald-700">{selectedInvoice.paymentMode} (PAID)</p>
                  </div>
                </div>

                <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                    <span>Item</span>
                    <span>Qty x Rate</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {selectedInvoice.items?.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[130px] font-medium">{it.title}</span>
                      <span>{it.quantity} x ₹{it.price}</span>
                      <span className="font-bold text-right">₹{it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-right text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span>- ₹{selectedInvoice.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-800">
                    <span>TOTAL AMOUNT:</span>
                    <span>₹{selectedInvoice.grandTotal?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-2">
                  {selectedInvoice.billSnapshot?.upiId && (
                    <p className="text-[10px] bg-slate-100 p-1 rounded font-bold">
                      UPI: {selectedInvoice.billSnapshot?.upiId}
                    </p>
                  )}
                  {selectedInvoice.billSnapshot?.footerMessage && (
                    <p className="font-bold text-[10px] text-slate-950">
                      {selectedInvoice.billSnapshot?.footerMessage}
                    </p>
                  )}
                  {selectedInvoice.billSnapshot?.termsAndConditions && (
                    <div className="text-[8.5px] text-slate-500 whitespace-pre-line text-left border-t border-dotted border-slate-300 pt-1">
                      <span className="font-bold block uppercase text-slate-700">Terms & Conditions:</span>
                      {selectedInvoice.billSnapshot?.termsAndConditions}
                    </div>
                  )}
                  {selectedInvoice.billSnapshot?.showSignatory && (
                    <div className="pt-3 text-right">
                      <p className="border-t border-slate-400 inline-block px-3 text-[9px] font-bold text-slate-700">
                        {selectedInvoice.billSnapshot?.authorizedSignatoryText || 'Authorized Signatory'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(selectedInvoice)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt-area, .print-receipt-area * {
            visibility: visible;
          }
          .print-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
