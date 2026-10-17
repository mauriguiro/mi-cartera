import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Debt } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const sanitizeFileName = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

export const generateAndShareDebtPDF = async (debt: Debt, mode: 'share' | 'download' = 'share') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const payments = Array.isArray(debt.payments) ? debt.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const originalAmount = Number(debt.originalAmount) || 0;
  const remainingAmount = Math.max(0, originalAmount - totalPaid);
  const isPaid = remainingAmount === 0;
  const progressPercent = originalAmount > 0 ? Math.min(100, Math.round((totalPaid / originalAmount) * 100)) : 0;

  // 1. Header Banner
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ESTADO DE CUENTA', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text('Detalle de cuenta y entregas realizadas', margin, 25);
  doc.text(`Fecha de emision: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, 32);

  // Status Badge in Header
  const badgeText = isPaid ? 'SALDADO' : 'PENDIENTE';
  const badgeWidth = 32;
  const badgeX = pageWidth - margin - badgeWidth;
  if (isPaid) {
    doc.setFillColor(22, 163, 74); // green-600
  } else {
    doc.setFillColor(220, 38, 38); // red-600
  }
  doc.roundedRect(badgeX, 13, badgeWidth, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(badgeText, badgeX + badgeWidth / 2, 19, { align: 'center' });

  let y = 52;

  // 2. Account Details Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'FD');

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONCEPTO DE LA CUENTA', margin + 6, y + 8);
  doc.text('ACREEDOR / DESTINATARIO', margin + contentWidth * 0.52, y + 8);
  doc.text('FECHA DE INICIO', margin + contentWidth * 0.82, y + 8);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const conceptLines = doc.splitTextToSize(debt.concept || '-', contentWidth * 0.45);
  doc.text(conceptLines[0], margin + 6, y + 16);
  if (conceptLines[1]) {
    doc.setFontSize(9.5);
    doc.text(conceptLines[1], margin + 6, y + 22);
  }

  doc.setFontSize(11);
  const creditorLines = doc.splitTextToSize(debt.creditor || '-', contentWidth * 0.28);
  doc.text(creditorLines[0], margin + contentWidth * 0.52, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const createdDateStr = debt.createdAt ? format(new Date(debt.createdAt), 'dd/MM/yyyy') : '-';
  doc.text(createdDateStr, margin + contentWidth * 0.82, y + 16);

  y += 36;

  // 3. Summary Cards (Original, Total Entregado, Saldo Pendiente)
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardHeight = 25;

  // Card 1: Monto Original
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MONTO ORIGINAL', margin + 5, y + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12.5);
  doc.text(formatCurrency(originalAmount), margin + 5, y + 18);

  // Card 2: Total Entregado
  const card2X = margin + cardWidth + cardGap;
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(card2X, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');
  doc.setTextColor(21, 128, 61); // green-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`TOTAL ENTREGADO (${progressPercent}%)`, card2X + 5, y + 8);
  doc.setTextColor(22, 101, 52); // green-800
  doc.setFontSize(12.5);
  doc.text(formatCurrency(totalPaid), card2X + 5, y + 18);

  // Card 3: Saldo Pendiente
  const card3X = margin + (cardWidth + cardGap) * 2;
  if (isPaid) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
  } else {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
  }
  doc.roundedRect(card3X, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');
  doc.setTextColor(isPaid ? 21 : 185, isPaid ? 128 : 28, isPaid ? 61 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SALDO RESTANTE', card3X + 5, y + 8);
  doc.setFontSize(12.5);
  doc.text(formatCurrency(remainingAmount), card3X + 5, y + 18);

  y += cardHeight + 6;

  // Progress Bar
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 3.5, 1.5, 1.5, 'F');
  if (progressPercent > 0) {
    doc.setFillColor(22, 163, 74);
    const fillWidth = Math.max(3, (contentWidth * progressPercent) / 100);
    doc.roundedRect(margin, y, fillWidth, 3.5, 1.5, 1.5, 'F');
  }

  y += 12;

  // 4. Payments Table Header
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`DETALLE DE ENTREGAS REALIZADAS (${payments.length})`, margin, y);

  y += 5;

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin, topY, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('#', margin + 5, topY + 6);
    doc.text('FECHA DE ENTREGA', margin + 22, topY + 6);
    doc.text('MONTO ENTREGADO', margin + contentWidth * 0.62, topY + 6, { align: 'right' });
    doc.text('SALDO RESTANTE', margin + contentWidth - 5, topY + 6, { align: 'right' });
    return topY + 9;
  };

  y = drawTableHeader(y);

  if (payments.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 14, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.text('No se registran entregas parciales hasta el momento.', margin + contentWidth / 2, y + 9, {
      align: 'center',
    });
    y += 18;
  } else {
    let runningBalance = originalAmount;

    payments.forEach((payment, index) => {
      if (y > pageHeight - 32) {
        doc.addPage();
        y = 20;
        y = drawTableHeader(y);
      }

      const amount = Number(payment.amount) || 0;
      runningBalance = Math.max(0, runningBalance - amount);
      const rowHeight = 9.5;

      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowHeight, 'FD');

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Entrega ${index + 1}`, margin + 5, y + 6.3);

      doc.setFont('helvetica', 'normal');
      const dateStr = payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : '-';
      doc.text(dateStr, margin + 28, y + 6.3);

      // Amount delivered
      doc.setTextColor(21, 128, 61); // green-700
      doc.setFont('helvetica', 'bold');
      doc.text(`- ${formatCurrency(amount)}`, margin + contentWidth * 0.62, y + 6.3, { align: 'right' });

      // Running balance after this delivery
      doc.setTextColor(runningBalance === 0 ? 21 : 15, runningBalance === 0 ? 128 : 23, runningBalance === 0 ? 61 : 42);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(runningBalance), margin + contentWidth - 5, y + 6.3, { align: 'right' });

      y += rowHeight;
    });

    // Total Row at bottom of table
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 10.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RESUMEN FINAL', margin + 5, y + 7);

    doc.setTextColor(21, 128, 61);
    doc.text(formatCurrency(totalPaid), margin + contentWidth * 0.62, y + 7, { align: 'right' });

    doc.setTextColor(isPaid ? 21 : 185, isPaid ? 128 : 28, isPaid ? 61 : 28);
    doc.text(formatCurrency(remainingAmount), margin + contentWidth - 5, y + 7, { align: 'right' });

    y += 16;
  }

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Reporte generado desde Mi Cartera',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  const fileName = `reporte_${sanitizeFileName(debt.creditor || 'cuenta')}_${sanitizeFileName(debt.concept || 'detalle')}.pdf`;

  if (mode === 'share' && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Estado de Cuenta - ${debt.concept}`,
          text: `Detalle de cuenta: ${debt.concept} (${debt.creditor}). Total entregado: ${formatCurrency(totalPaid)} | Saldo restante: ${formatCurrency(remainingAmount)}`,
          files: [pdfFile],
        });
        return;
      }
    } catch (error) {
      // If user cancels share sheet, don't force download if it was an AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.warn('No se pudo compartir directamente, descargando PDF...', error);
    }
  }

  // Fallback or explicit download
  doc.save(fileName);
};
