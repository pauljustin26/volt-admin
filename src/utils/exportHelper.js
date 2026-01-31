import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf"; 
import autoTable from 'jspdf-autotable';

// ==========================================
// 1. EXCEL EXPORT (With Totals & Summary)
// ==========================================
export const exportToExcel = (data, summary, fileName = 'export') => {
  // 1. Create workbook
  const wb = XLSX.utils.book_new();
  
  // 2. Prepare Data
  // We clone data to avoid mutating the original
  const sheetData = [...data];

  // 3. Add Summary Rows at the bottom
  sheetData.push({}); // Empty row for spacing
  sheetData.push({ Date: "SUMMARY REPORT" });
  sheetData.push({ Date: "Total Successful Transactions:", "Trans. ID": summary.count });
  sheetData.push({ Date: "Total Denied/Failed:", "Trans. ID": summary.deniedCount });
  sheetData.push({ Date: "TOTAL REVENUE (Actual):", "Trans. ID": summary.totalAmount });

  const ws = XLSX.utils.json_to_sheet(sheetData);

  // 4. Column Sizing
  const colWidths = [];
  const keys = Object.keys(data[0] || {});
  keys.forEach((key, index) => {
    colWidths[index] = { wch: 20 }; // Default width
  });
  // Make the first column wider for the summary text
  colWidths[0] = { wch: 35 };
  ws['!cols'] = colWidths;

  // 5. Append and Save
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
};

// ==========================================
// 2. PDF EXPORT (With Financial Summary)
// ==========================================
export const exportToPDF = (title, columns, data, summary, fileName = 'report') => {
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const pageWidth = doc.internal.pageSize.getWidth(); 
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [23, 38, 71]; 
  const accentColor = [56, 70, 109]; 

  // --- HEADER ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, "F"); 
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("VoltVault Admin Report", 14, 16);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(title.toUpperCase(), 14, 22);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 16, { align: 'right' });

  // --- TABLE ---
  const columnStyles = {};
  columns.forEach((col, index) => {
    const key = col.key.toLowerCase();
    if (key.includes('amount') || key.includes('cost')) columnStyles[index] = { halign: 'right' };
    else if (key.includes('status') || key.includes('type')) columnStyles[index] = { halign: 'center' };
  });

  autoTable(doc, {
    startY: 35,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.key])),
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: columnStyles,
    
    // --- FOOTER (Pagination) ---
    didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("CONFIDENTIAL - INTERNAL USE ONLY", 14, pageHeight - 10);
        doc.text('Page ' + doc.internal.getNumberOfPages(), pageWidth - 25, pageHeight - 10);
    }
  });

  // --- FINANCIAL SUMMARY BOX (At the end of table) ---
  let finalY = doc.lastAutoTable.finalY + 10;
  
  // Check if we need a new page for summary
  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }

  // Draw Summary Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, finalY, 120, 35, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 20, finalY + 10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  // Stats
  doc.text(`Total Records: ${data.length}`, 20, finalY + 20);
  doc.text(`Successful Transactions: ${summary.count}`, 70, finalY + 20);
  
  doc.setTextColor(220, 53, 69); // Red for denied
  doc.text(`Denied/Failed: ${summary.deniedCount}`, 20, finalY + 28);

  // Total Amount (Green/Bold)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94); // Green
  doc.text(`TOTAL REVENUE: P ${summary.totalAmount.toLocaleString()}`, 70, finalY + 28);

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${fileName}_${dateStr}.pdf`);
};