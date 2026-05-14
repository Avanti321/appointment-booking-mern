// frontend/src/utils/downloadPrescriptionPDF.js
// Generates and downloads a styled prescription PDF in the browser.
// Uses jsPDF + jspdf-autotable — install with:
//   npm install jspdf jspdf-autotable

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Format "14_5_2026" → "14 May 2026"
const formatDate = (slotDate) => {
    const months = ["", "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"]
    const [day, month, year] = slotDate.split('_')
    return `${day} ${months[Number(month)]} ${year}`
}

export const downloadPrescriptionPDF = (rx) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const PRIMARY   = [95, 111, 255]   // #5f6FFF — matches your app theme
    const LIGHT_BG  = [240, 244, 255]
    const DARK_TEXT = [30,  30,  50]
    const GRAY_TEXT = [100, 100, 120]
    const PAGE_W    = 210
    const MARGIN    = 18

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.setFillColor(...PRIMARY)
    doc.rect(0, 0, PAGE_W, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PRESCRIPTO', MARGIN, 13)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Digital Prescription', MARGIN, 20)

    // Date + Time (top-right of header)
    doc.setFontSize(9)
    const dateStr = `Date: ${formatDate(rx.slotDate)}   Time: ${rx.slotTime}`
    doc.text(dateStr, PAGE_W - MARGIN, 13, { align: 'right' })

    // ── Doctor info card ──────────────────────────────────────────────────────
    let y = 36

    doc.setFillColor(...LIGHT_BG)
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 26, 3, 3, 'F')

    doc.setTextColor(...DARK_TEXT)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Dr. ${rx.docData?.name || ''}`, MARGIN + 4, y + 8)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_TEXT)
    doc.text(rx.docData?.speciality || '', MARGIN + 4, y + 14)

    const degreeExp = [rx.docData?.degree, rx.docData?.experience]
        .filter(Boolean).join('  ·  ')
    doc.text(degreeExp, MARGIN + 4, y + 20)

    // ── Patient info ──────────────────────────────────────────────────────────
    y += 32

    doc.setTextColor(...DARK_TEXT)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient', MARGIN, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_TEXT)

    const patientName   = rx.userData?.name   || rx.patientName  || ''
    const patientGender = rx.userData?.gender || ''
    const patientDob    = rx.userData?.dob    || ''

    doc.text(patientName,   MARGIN, y + 6)
    if (patientGender) doc.text(`Gender: ${patientGender}`, MARGIN, y + 11)
    if (patientDob)    doc.text(`DOB: ${patientDob}`,       MARGIN + 50, y + 11)

    // ── Divider ───────────────────────────────────────────────────────────────
    y += 20
    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(0.4)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)

    // ── Diagnosis ─────────────────────────────────────────────────────────────
    if (rx.diagnosis) {
        y += 8
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK_TEXT)
        doc.text('Diagnosis', MARGIN, y)

        y += 5
        doc.setFillColor(...LIGHT_BG)
        doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 10, 2, 2, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...GRAY_TEXT)
        doc.text(rx.diagnosis, MARGIN + 4, y + 6.5)
        y += 14
    }

    // ── Medicines table ───────────────────────────────────────────────────────
    y += 4
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.text('Medicines', MARGIN, y)
    y += 4

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
        body: (rx.medicines || []).map(m => [
            m.name        || '',
            m.dosage      || '',
            m.frequency   || '',
            m.duration    || '',
            m.instructions || '—'
        ]),
        headStyles: {
            fillColor:  PRIMARY,
            textColor:  [255, 255, 255],
            fontStyle:  'bold',
            fontSize:   9,
            cellPadding: 3
        },
        bodyStyles: {
            fontSize:    9,
            textColor:   DARK_TEXT,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [247, 249, 255]
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            4: { textColor: GRAY_TEXT, fontStyle: 'italic' }
        },
        tableLineColor: [220, 225, 255],
        tableLineWidth: 0.2
    })

    y = doc.lastAutoTable.finalY + 8

    // ── Doctor's Notes ────────────────────────────────────────────────────────
    if (rx.notes) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK_TEXT)
        doc.text("Doctor's Notes", MARGIN, y)

        y += 5
        doc.setFillColor(255, 252, 235)   // soft yellow
        const noteLines = doc.splitTextToSize(rx.notes, PAGE_W - MARGIN * 2 - 8)
        const noteH     = noteLines.length * 5 + 8
        doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, noteH, 2, 2, 'F')
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...GRAY_TEXT)
        doc.text(noteLines, MARGIN + 4, y + 6)
        y += noteH + 6
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = 287
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, footerY, PAGE_W - MARGIN, footerY)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_TEXT)
    doc.text('This is a digitally generated prescription from Prescripto.', PAGE_W / 2, footerY + 5, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, PAGE_W / 2, footerY + 9, { align: 'center' })

    // ── Save ──────────────────────────────────────────────────────────────────
    const fileName = `Prescription_Dr${(rx.docData?.name || 'Doctor').replace(/\s+/g, '_')}_${formatDate(rx.slotDate).replace(/\s/g, '_')}.pdf`
    doc.save(fileName)
}