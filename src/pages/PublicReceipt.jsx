import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer, CheckCircle2, AlertCircle, Store } from 'lucide-react';

export default function PublicReceipt() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`/api/public/receipt/${id}`)
      .then((res) => {
        if (res.data?.success) {
          setInvoice(res.data.data);
        } else {
          setError('Receipt not found');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Invalid or expired receipt link');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg border border-slate-200 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded-lg mx-auto skeleton-shimmer" />
          <div className="h-4 w-48 bg-slate-100 rounded mx-auto skeleton-shimmer" />
          <div className="border-t border-dashed border-slate-200 my-4 pt-4 space-y-2">
            <div className="h-4 bg-slate-100 rounded skeleton-shimmer" />
            <div className="h-4 bg-slate-100 rounded skeleton-shimmer" />
            <div className="h-4 bg-slate-100 rounded skeleton-shimmer" />
          </div>
          <div className="h-9 bg-slate-200 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-slate-200 space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-base font-black text-slate-900">Receipt Not Found</h1>
          <p className="text-xs text-slate-500">{error || 'This digital receipt link is invalid.'}</p>
        </div>
      </div>
    );
  }

  const snap = invoice.billSnapshot || {};

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 px-4 flex flex-col items-center">
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Digital Bill</span>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Receipt Paper */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200 font-mono text-[11px] text-slate-900 space-y-3 print:shadow-none print:border-none print:p-2">
        {/* HEADER */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
          <p className="font-extrabold text-xs uppercase tracking-wide">
            {snap.headerTitle || 'TAX INVOICE'}
          </p>
          <h2 className="font-black text-base uppercase leading-tight">
            {snap.businessName || 'BILLING STORE'}
          </h2>
          {snap.tagline && <p className="text-[10px] text-slate-600 italic">{snap.tagline}</p>}
          {snap.showAddress && snap.address && (
            <p className="text-[10px] text-slate-600 leading-tight">{snap.address}</p>
          )}
          {snap.showPhone && snap.phone && (
            <p className="text-[10px] text-slate-800 font-bold">Ph: {snap.phone}</p>
          )}
          {snap.showGstin && snap.gstin && (
            <p className="text-[10px] text-slate-800 font-bold">GSTIN: {snap.gstin}</p>
          )}
        </div>

        {/* METADATA */}
        <div className="flex justify-between text-[10px] py-1 border-b border-dashed border-slate-300">
          <div>
            <p className="font-bold">Bill: {invoice.invoiceNumber}</p>
            <p>Customer: {invoice.customerName}</p>
            {invoice.customerPhone && <p>Ph: {invoice.customerPhone}</p>}
          </div>
          <div className="text-right">
            <p>Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p>
            <p>
              Time:{' '}
              {new Date(invoice.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="font-bold text-emerald-700">{invoice.paymentMode} (PAID)</p>
          </div>
        </div>

        {/* ITEMS */}
        <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[10px]">
          <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
            <span>Item</span>
            <span>Qty x Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {invoice.items?.map((it, i) => (
            <div key={i} className="flex justify-between">
              <span className="truncate max-w-[140px] font-medium">{it.title}</span>
              <span>
                {it.quantity} x ₹{it.price}
              </span>
              <span className="font-bold text-right">₹{it.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="space-y-1 text-right text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal:</span>
            <span>₹{invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Discount:</span>
              <span>- ₹{invoice.discount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-800">
            <span>TOTAL AMOUNT:</span>
            <span>₹{invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-2">
          {snap.upiId && (
            <p className="text-[10px] bg-slate-100 p-1 rounded font-bold">UPI: {snap.upiId}</p>
          )}
          {snap.footerMessage && (
            <p className="font-bold text-[10px] text-slate-950">{snap.footerMessage}</p>
          )}
          {snap.termsAndConditions && (
            <div className="text-[8.5px] text-slate-500 whitespace-pre-line text-left border-t border-dotted border-slate-300 pt-1">
              <span className="font-bold block uppercase text-slate-700">Terms & Conditions:</span>
              {snap.termsAndConditions}
            </div>
          )}
          {snap.showSignatory && (
            <div className="pt-3 text-right">
              <p className="border-t border-slate-400 inline-block px-3 text-[9px] font-bold text-slate-700">
                {snap.authorizedSignatoryText || 'Authorized Signatory'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
