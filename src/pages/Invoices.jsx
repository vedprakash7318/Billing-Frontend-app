import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Receipt,
  Search,
  Printer,
  X,
  Plus,
  Download,
  User,
} from 'lucide-react';
import api from '../services/api';
import { downloadInvoicePdf } from '../utils/pdfGenerator';
import { InvoicesSkeleton } from '../components/Skeletons';

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
          <InvoicesSkeleton />
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
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer select-none space-y-2.5"
              >
                {/* 1. Header: Invoice Number, Mode & Grand Total */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-mono text-xs font-black text-slate-900 tracking-tight">
                        #{inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${inv.paymentMode === 'CASH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : inv.paymentMode === 'UPI'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            : inv.paymentMode === 'CARD'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                      >
                        {inv.paymentMode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      ₹{inv.grandTotal?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 2. Customer & Date Row */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="min-w-0 truncate pr-2">
                    <span className="font-bold text-slate-800">
                      {inv.customerName || 'Walk-in Customer'}
                    </span>
                    {inv.customerPhone && (
                      <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                        ({inv.customerPhone})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {inv.items?.length || 0} {inv.items?.length === 1 ? 'item' : 'items'}
                  </div>
                </div>

                {/* 3. Footer: Employee Name & Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0 truncate">
                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">
                      {inv.billedBy?.name || 'Ved Prakash'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadInvoicePdf(inv);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-2.5 py-1 rounded-lg border border-indigo-200/50 transition-all"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(inv);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 active:scale-95 px-2.5 py-1 rounded-lg border border-emerald-200/50 transition-all"
                      title="Print Thermal Receipt"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPRINT / PREVIEW MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">

              {/* Clean Modal Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-tight">
                      Invoice #{selectedInvoice.invoiceNumber}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Thermal Receipt Preview</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Receipt Paper */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto font-mono text-[11px] text-slate-900 space-y-3 print-receipt-area bg-white">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                  <p className="font-extrabold text-xs uppercase tracking-wide text-slate-500">
                    {selectedInvoice.billSnapshot?.headerTitle || 'TAX INVOICE'}
                  </p>
                  <h2 className="font-black text-base uppercase leading-tight text-slate-950">
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
                  <div className="space-y-0.5">
                    <p className="font-bold">Bill: #{selectedInvoice.invoiceNumber}</p>
                    <p>Customer: {selectedInvoice.customerName}</p>
                    {selectedInvoice.customerPhone && <p>Ph: {selectedInvoice.customerPhone}</p>}
                    <p className="text-emerald-700 font-bold mt-1">
                      Cashier: {selectedInvoice.billedBy?.name || 'Store Admin'} ({selectedInvoice.billedBy?.designation || selectedInvoice.billedBy?.role || 'Staff'})
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                    <p>Time: {new Date(selectedInvoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="font-bold text-emerald-700">{selectedInvoice.paymentMode} (PAID)</p>
                  </div>
                </div>

                <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                    <span>Item</span>
                    <span>Qty × Rate</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {selectedInvoice.items?.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[130px] font-medium">{it.title}</span>
                      <span>{it.quantity} × ₹{it.price}</span>
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
                  <div className="flex justify-between text-xs font-black text-slate-950 pt-1.5 border-t border-slate-800">
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

              {/* Clean Footer Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(selectedInvoice)}
                  className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200/80 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
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
