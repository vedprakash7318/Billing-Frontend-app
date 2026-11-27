import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, professional PDF invoice
 * @param {Object} invoice - Invoice object containing invoiceNumber, customer, items, grandTotal, billedBy, etc.
 */
export function downloadInvoicePdf(invoice) {
  if (!invoice) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const snapshot = invoice.billSnapshot || {};
  const storeName = snapshot.businessName || 'BILLING STORE';
  const tagline = snapshot.tagline || '';
  const address = snapshot.address || '';
  const phone = snapshot.phone || '';
  const gstin = snapshot.gstin || '';
  const billedBy = invoice.billedBy?.name || 'Store Admin';
  const designation = invoice.billedBy?.designation || invoice.billedBy?.role || 'Cashier';

  // Margins & positioning
  let y = 18;
  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Accent
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 6, contentWidth, 34, 'F');

  // Title / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(storeName.toUpperCase(), margin + 4, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  if (tagline) {
    y += 5;
    doc.text(tagline, margin + 4, y);
  }
  if (address) {
    y += 4.5;
    doc.text(address, margin + 4, y);
  }
  if (phone || gstin) {
    y += 4.5;
    const contactStr = [phone ? `Phone: ${phone}` : '', gstin ? `GSTIN: ${gstin}` : ''].filter(Boolean).join('  |  ');
    doc.text(contactStr, margin + 4, y);
  }

  // Invoice Meta Box (Right Side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('TAX INVOICE', pageWidth - margin - 4, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin - 4, 26, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - margin - 4, 31, { align: 'right' });
  doc.text(`Mode: ${invoice.paymentMode || 'CASH'} (PAID)`, pageWidth - margin - 4, 36, { align: 'right' });

  y = 52;

  // Bill To & Cashier / Employee Info Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CUSTOMER DETAILS:', margin + 4, y + 6);
  doc.text('BILLED BY (EMPLOYEE):', margin + 100, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const custName = invoice.customerName || 'Walk-in Customer';
  const custPhone = invoice.customerPhone ? `(${invoice.customerPhone})` : '';
  doc.text(`${custName} ${custPhone}`, margin + 4, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${billedBy}`, margin + 100, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`• ${designation}`, margin + 100 + doc.getTextWidth(billedBy) + 2, y + 12);

  y += 26;

  // Table Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 4, y + 5.5);
  doc.text('Item Description', margin + 14, y + 5.5);
  doc.text('Qty', margin + 110, y + 5.5, { align: 'center' });
  doc.text('Rate (Rs)', margin + 145, y + 5.5, { align: 'right' });
  doc.text('Total (Rs)', pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Items List
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(index + 1), margin + 4, y + 5.2);
    doc.text(String(item.title || 'Item').slice(0, 45), margin + 14, y + 5.2);
    doc.text(String(item.quantity || 1), margin + 110, y + 5.2, { align: 'center' });
    doc.text(Number(item.price || 0).toFixed(2), margin + 145, y + 5.2, { align: 'right' });
    doc.text(Number(item.total || 0).toFixed(2), pageWidth - margin - 4, y + 5.2, { align: 'right' });

    y += 7.5;
  });

  // Table Bottom Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals Box (Right Side)
  const totalBoxX = margin + 105;
  const totalBoxWidth = contentWidth - 105;

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', totalBoxX, y);
  doc.text(`Rs. ${Number(invoice.subtotal || invoice.grandTotal || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });

  if (Number(invoice.discount || 0) > 0) {
    y += 5.5;
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text('Discount:', totalBoxX, y);
    doc.text(`- Rs. ${Number(invoice.discount).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
  }

  y += 7;
  doc.setFillColor(241, 245, 249);
  doc.rect(totalBoxX - 2, y - 5, totalBoxWidth + 4, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAND TOTAL:', totalBoxX, y + 2);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Rs. ${Number(invoice.grandTotal || 0).toFixed(2)}`, pageWidth - margin - 4, y + 2, { align: 'right' });

  y += 18;

  // Footer notes & terms
  if (snapshot.footerMessage) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.footerMessage, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  if (snapshot.termsAndConditions) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const splitTerms = doc.splitTextToSize(`Terms: ${snapshot.termsAndConditions.replace(/\n/g, ' ')}`, contentWidth);
    doc.text(splitTerms, margin, y);
  }

  // Save / Download PDF
  const filename = `Invoice_${invoice.invoiceNumber || 'bill'}.pdf`;
  doc.save(filename);
}
