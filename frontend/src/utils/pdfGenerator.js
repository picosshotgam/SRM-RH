import { jsPDF } from 'jspdf';

// Helper to load an image asynchronously in the browser
const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// Helper to format dates as DD/MM/YYYY
const formatDateFR = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
};

// Helper to draw a tick mark using lines
const drawTick = (doc, x, y) => {
  doc.setDrawColor(75, 149, 58); // Logo Green
  doc.setLineWidth(0.6);
  doc.line(x, y, x + 1.2, y + 1.2);
  doc.line(x + 1.2, y + 1.2, x + 3.5, y - 1.8);
};

// Helper to draw standard header boxes
const drawHeaderBox = (doc, formTitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  const boxWidth = 85;
  const boxHeight = 18;
  const x = (pageWidth - boxWidth) / 2; // Center horizontally
  const y = 12;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);

  // Main box
  doc.rect(x, y, boxWidth, boxHeight);

  // Horizontal line
  doc.line(x, y + 9, x + boxWidth, y + 9);

  // Text
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Processus : Gérer les Ressources Humaines', x + 3, y + 5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Formulaire : ${formTitle}`, x + 3, y + 15);
};

// Cache for footer image data URL
let cachedFooterDataUrl = null;

const getFooterDataUrl = () => {
  if (cachedFooterDataUrl) return cachedFooterDataUrl;

  try {
    const canvas = document.createElement('canvas');
    // High Resolution for print quality (300 DPI equivalent)
    canvas.width = 2280;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Watermark Artwork - Recreated from Reference Image (Mint Green Moroccan Arches & Leaf Stem)
    ctx.save();

    const baseY = 345;

    // Linear gradient for mint green fill (opaque at top, fading out at base)
    const mintGrad = ctx.createLinearGradient(0, baseY - 350, 0, baseY);
    mintGrad.addColorStop(0, 'rgba(160, 220, 168, 0.55)');
    mintGrad.addColorStop(0.75, 'rgba(175, 228, 182, 0.30)');
    mintGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = mintGrad;
    ctx.strokeStyle = 'rgba(145, 210, 154, 0.45)';
    ctx.lineWidth = 3;

    // Helper to draw Moroccan pointed arch (onion dome tip)
    const drawPointedArch = (x, width, height) => {
      const halfW = width / 2;
      const apexX = x + halfW;
      const topY = baseY - height;
      const shoulderY = baseY - height * 0.55;

      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, shoulderY);
      ctx.bezierCurveTo(x, topY + height * 0.12, apexX - halfW * 0.35, topY, apexX, topY);
      ctx.bezierCurveTo(apexX + halfW * 0.35, topY, x + width, topY + height * 0.12, x + width, shoulderY);
      ctx.lineTo(x + width, baseY);
      ctx.closePath();
    };

    // A. Leaf Stem Motif on Left
    ctx.beginPath();
    ctx.moveTo(240, baseY - 15);
    ctx.quadraticCurveTo(290, baseY - 120, 360, baseY - 230);
    ctx.strokeStyle = 'rgba(150, 215, 158, 0.55)';
    ctx.lineWidth = 4;
    ctx.stroke();

    const drawLeafShape = (cx, cy, rx, ry, deg) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -ry);
      ctx.bezierCurveTo(rx * 0.85, -ry * 0.4, rx * 0.85, ry * 0.4, 0, ry);
      ctx.bezierCurveTo(-rx * 0.85, ry * 0.4, -rx * 0.85, -ry * 0.4, 0, -ry);
      ctx.closePath();
      ctx.fillStyle = mintGrad;
      ctx.fill();
      ctx.restore();
    };

    drawLeafShape(235, baseY - 100, 28, 62, -60); // Bottom-left leaf
    drawLeafShape(275, baseY - 145, 26, 68, -35); // Middle-left leaf
    drawLeafShape(325, baseY - 200, 24, 72, -15); // Top-left leaf
    drawLeafShape(365, baseY - 235, 22, 65, 10);  // Top-right leaf
    drawLeafShape(390, baseY - 190, 25, 60, 40);  // Middle-right leaf

    // B. Small Arch on Left
    drawPointedArch(510, 180, 200);
    ctx.fill();

    // C. Large Central Double Arch with Inner Cutout
    // Outer Arch
    drawPointedArch(940, 400, 340);
    ctx.fill();

    // Inner Arch Cutout
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    drawPointedArch(1000, 280, 260);
    ctx.fill();

    // Inner Pointed Roof Accent at Bottom
    ctx.beginPath();
    ctx.moveTo(1060, baseY);
    ctx.lineTo(1140, baseY - 110);
    ctx.lineTo(1220, baseY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(165, 222, 172, 0.40)';
    ctx.fill();
    ctx.restore();

    // D. Small Arch on Right
    drawPointedArch(1590, 180, 200);
    ctx.fill();

    ctx.restore();

    // 2. Red Horizontal Separator Line
    const lineY = 360;
    ctx.fillStyle = '#c21a22';
    ctx.fillRect(40, lineY, 2200, 3);

    // 3. Central Zellij Diamond Emblem
    const centerX = 1140;
    ctx.save();
    ctx.translate(centerX, lineY + 1.5);
    ctx.rotate((45 * Math.PI) / 180);

    // Green outer square
    ctx.fillStyle = '#4b953a';
    ctx.fillRect(-13, -13, 26, 26);

    // Red inner star square
    ctx.fillStyle = '#c21a22';
    ctx.fillRect(-6.5, -6.5, 13, 13);
    ctx.restore();

    // 4. Line 1 (Arabic + Corporate IDs)
    const line1Y = 410;
    const fontStr = "18px 'Segoe UI', Arial, 'Amiri', 'Traditional Arabic', sans-serif";
    const fontBoldStr = "bold 18px 'Segoe UI', Arial, 'Amiri', 'Traditional Arabic', sans-serif";

    const line1Tokens = [
      { text: "ICE : ", color: "#c21a22", font: fontBoldStr },
      { text: "003659658000030 : رقم التعريف الموحد  ;  ", color: "#111111", font: fontStr },
      { text: "IF : ", color: "#c21a22", font: fontBoldStr },
      { text: "66996025 : التعريف الضريبي  ;  ", color: "#111111", font: fontStr },
      { text: "RC : ", color: "#c21a22", font: fontBoldStr },
      { text: "85709 : السجل التجاري  ;  ", color: "#111111", font: fontStr },
      { text: "CRC : ", color: "#c21a22", font: fontBoldStr },
      { text: "05 35 55 00 00 : مركز العلاقة مع الزبناء  ;  ", color: "#111111", font: fontStr },
      { text: "Capital Social ", color: "#c21a22", font: fontBoldStr },
      { text: "100.000.000 MAD : ر  ;  10 زنقة محمد الكغاط، ص.ب 2097، فاس", color: "#111111", font: fontStr }
    ];

    // Measure total width of Line 1
    let width1 = 0;
    line1Tokens.forEach(t => {
      ctx.font = t.font;
      width1 += ctx.measureText(t.text).width;
    });

    let currentX1 = Math.max(40, (canvas.width - width1) / 2);
    line1Tokens.forEach(t => {
      ctx.font = t.font;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, currentX1, line1Y);
      currentX1 += ctx.measureText(t.text).width;
    });

    // 5. Line 2 (French + Digital Contact)
    const line2Y = 448;
    const line2Tokens = [
      { text: "10, Rue Mohamed El Kaghat, B.P. 2097, Fès  ;  ", color: "#111111", font: fontStr },
      { text: "Tél : ", color: "#c21a22", font: fontBoldStr },
      { text: "05 35 62 50 15/16/17  ;  ", color: "#111111", font: fontStr },
      { text: "Fax : ", color: "#c21a22", font: fontBoldStr },
      { text: "05 35 62 07 95  ;  ", color: "#111111", font: fontStr },
      { text: "e-Mail : ", color: "#c21a22", font: fontBoldStr },
      { text: "contact@srm-fm.ma  ;  البريد الإلكتروني  ;  ", color: "#111111", font: fontStr },
      { text: "Web : ", color: "#c21a22", font: fontBoldStr },
      { text: "www.srm-fm.ma  ;  ", color: "#111111", font: fontStr },
      { text: "Bureau d'ordre digital : ", color: "#c21a22", font: fontBoldStr },
      { text: "bo.srm-fm.ma", color: "#111111", font: fontStr }
    ];

    let width2 = 0;
    line2Tokens.forEach(t => {
      ctx.font = t.font;
      width2 += ctx.measureText(t.text).width;
    });

    let currentX2 = Math.max(40, (canvas.width - width2) / 2);
    line2Tokens.forEach(t => {
      ctx.font = t.font;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, currentX2, line2Y);
      currentX2 += ctx.measureText(t.text).width;
    });

    cachedFooterDataUrl = canvas.toDataURL('image/png');
    return cachedFooterDataUrl;
  } catch (err) {
    console.error("Error creating footer canvas:", err);
    return null;
  }
};

// Helper to draw the standard footer matching the corporate document
const drawFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const footerImg = getFooterDataUrl();
  
  if (footerImg) {
    // 190mm width, 40mm height anchored at bottom of page
    doc.addImage(footerImg, 'PNG', 10, pageHeight - 42, 190, 40);
  } else {
    // Fallback if canvas fails
    doc.setDrawColor(194, 26, 34);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 15, 200, pageHeight - 15);
  }
};

// 1. GENERATE ORDRE DE MISSION PDF
export const generateMissionPdf = async (data) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Load official logo image
    const logoImg = await loadImage('/logo.jpg');
  
    // Safely extract employee attributes
    const empName = data.employeeName || (data.employee ? `${data.employee.nom || ''} ${data.employee.prenom || ''}`.trim() : '');
    const empMatricule = data.employeeMatricule || (data.employee ? data.employee.matricule : '');
    const empDept = data.employeeDept || (data.employee && data.employee.department ? data.employee.department.name : (data.employee ? data.employee.departement : ''));
    const empFonction = data.employeeFonction || (data.employee ? data.employee.fonction : '');
    const empDirection = data.employeeDirection || (data.employee ? data.employee.direction_province : 'TAZA');

    // Page Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, 190, 277);
    
    // Draw Logo (Left side)
    if (logoImg) {
      // Aspect ratio: width 35mm, height 22.5mm
      doc.addImage(logoImg, 'JPEG', 15, 12, 35, 22.5);
    } else {
      // Fallback if logo not found
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SRM FÈS-MEKNÈS', 15, 20);
    }
    
    // Draw Header Box (Right side)
    drawHeaderBox(doc, 'Ordre de mission');
    
    // Title: Partie réservée au service concerné
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Partie réservée au service concerné :', 15, 45);
    // Draw underline
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(15, 46.5, 78, 46.5);
    
    // Form fields
    doc.setFontSize(10.5);
    let currentY = 55;
    const lineSpacing = 7.5;
    
    // Nom et prénom + Matricule (same row)
    doc.setFont('Helvetica', 'bold');
    doc.text('Nom et prénom :', 15, currentY);
    const nameLabelWidth = doc.getTextWidth('Nom et prénom :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empName || ''), 15 + nameLabelWidth + 2, currentY);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Matricule :', 110, currentY);
    const matLabelWidth = doc.getTextWidth('Matricule :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empMatricule || ''), 110 + matLabelWidth + 2, currentY);
    
    currentY += lineSpacing;
    
    // Département
    doc.setFont('Helvetica', 'bold');
    doc.text('Département :', 15, currentY);
    const deptLabelWidth = doc.getTextWidth('Département :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empDept || ''), 15 + deptLabelWidth + 2, currentY);
    
    currentY += lineSpacing;
    
    // Direction/Province : TAZA
    doc.setFont('Helvetica', 'bold');
    doc.text(`Direction/Province : ${empDirection || 'TAZA'}`, 15, currentY);
  
  currentY += lineSpacing;
  
  // Raison
  doc.setFont('Helvetica', 'bold');
  doc.text('Raison :', 15, currentY);
  const raisonLabelWidth = doc.getTextWidth('Raison :');
  doc.setFont('Helvetica', 'normal');
  doc.text(String(data.raison || ''), 15 + raisonLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Destination
  doc.setFont('Helvetica', 'bold');
  doc.text('Destination :', 15, currentY);
  const destLabelWidth = doc.getTextWidth('Destination :');
  doc.setFont('Helvetica', 'normal');
  doc.text(String(data.destination || ''), 15 + destLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Observation
  doc.setFont('Helvetica', 'bold');
  doc.text('Observation :', 15, currentY);
  const obsLabelWidth = doc.getTextWidth('Observation :');
  doc.setFont('Helvetica', 'normal');
  const obsLines = doc.splitTextToSize(data.observation || 'Néant', 140);
  doc.text(obsLines, 15 + obsLabelWidth + 2, currentY);
  
  // Adjust height according to observation length
  const obsHeight = obsLines.length * 5;
  currentY += obsHeight + 2;
  
  // Date de départ
  doc.setFont('Helvetica', 'bold');
  doc.text('Date de départ :', 15, currentY);
  const startLabelWidth = doc.getTextWidth('Date de départ :');
  doc.setFont('Helvetica', 'normal');
  doc.text(formatDateFR(data.dateDepart), 15 + startLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Date de retour
  doc.setFont('Helvetica', 'bold');
  doc.text('Date de retour :', 15, currentY);
  const endLabelWidth = doc.getTextWidth('Date de retour :');
  doc.setFont('Helvetica', 'normal');
  doc.text(formatDateFR(data.dateRetour), 15 + endLabelWidth + 2, currentY);
  
  currentY += 10;
  
  // Section: Moyen de Transport
  doc.setFont('Helvetica', 'bold');
  doc.text('Moyen de Transport :', 15, currentY);
  doc.line(15, currentY + 1.2, 53, currentY + 1.2);
  
  currentY += 7.5;
  doc.setFont('Helvetica', 'normal');
  
  const isServiceVehicle = data.moyenTransport === 'vehicule_service';
  
  // Checkmark 1: Véhicule de Service
  if (isServiceVehicle) {
    drawTick(doc, 16, currentY - 1);
  } else {
    doc.text('[  ]', 15, currentY);
  }
  doc.text('Véhicule de Service', 22, currentY);
  
  currentY += 7.5;
  
  // Checkmark 2: Marque / Matricule
  if (isServiceVehicle) {
    drawTick(doc, 16, currentY - 1);
  } else {
    doc.text('[  ]', 15, currentY);
  }
  const marqueText = isServiceVehicle ? (data.marqueVehicule || '..........') : '..........';
  const matText = isServiceVehicle ? (data.matriculeVehicule || '..........') : '..........';
  doc.text(`Marque : ${marqueText}       Matricule : ${matText}`, 22, currentY);
  
  // If another mode is selected, draw a third line for clarity
  if (!isServiceVehicle) {
    currentY += 7.5;
    drawTick(doc, 16, currentY - 1);
    const modeLabel = data.moyenTransport.charAt(0).toUpperCase() + data.moyenTransport.slice(1);
    doc.text(`Autre Moyen de Transport : ${modeLabel}`, 22, currentY);
  }
  
  currentY += 12;
  
  // Fait à Taza le...
  const today = new Date().toLocaleDateString('fr-FR');
  doc.text(`Fait à TAZA : le ${today}`, 125, currentY);
  
  currentY += 10;
  
  // Signatures
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Responsable hiérarchique', 20, currentY);
  doc.text('Responsable des Ressources Humaines', 95, currentY);
  
  currentY += 28;
  
  doc.text('Le Directeur Provincial de TAZA', 115, currentY);
  
  currentY += 20;
  
  // Division line separating upper section from lower post-mission section
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(15, currentY, 195, currentY);
  
  currentY += 7;
  
  // Bottom section: Partie à renseigner après la réalisation de la mission
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Partie à renseigner après la réalisation de la mission :', 15, currentY);
  
  currentY += 7;
  doc.text('La durée de déplacement :', 15, currentY);
  
  currentY += 7.5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Date heure de départ : ................................................................ à ..............................', 15, currentY);
  
  currentY += 7.5;
  doc.text("Date heure d'arrivée : ................................................................. à ..............................", 15, currentY);
  
  currentY += 10;
  doc.setFont('Helvetica', 'bold');
  doc.text('Signature de l\'agent', 140, currentY);
  
    // Footer address info
    drawFooter(doc);
    
    // Save PDF file
    doc.save(`Ordre_Mission_${data.employeeMatricule}_${data.destination}.pdf`);
  } catch (error) {
    console.error("Error generating mission PDF:", error);
    alert("Erreur lors de la génération du PDF d'ordre de mission : " + error.message);
  }
};

// 2. GENERATE DEMANDE DE CONGÉ PDF
export const generateCongePdf = async (data) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Load official logo image
    const logoImg = await loadImage('/logo.jpg');
  
    // Safely extract employee attributes
    const empName = data.employeeName || (data.employee ? `${data.employee.nom || ''} ${data.employee.prenom || ''}`.trim() : '');
    const empMatricule = data.employeeMatricule || (data.employee ? data.employee.matricule : '');
    const empDept = data.employeeDept || (data.employee && data.employee.department ? data.employee.department.name : (data.employee ? data.employee.departement : ''));
    const empFonction = data.employeeFonction || (data.employee ? data.employee.fonction : '');
    const empDirection = data.employeeDirection || (data.employee ? data.employee.direction_province : 'TAZA');

    // Page Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, 190, 277);
    
    // Draw Logo (Left side)
    if (logoImg) {
      doc.addImage(logoImg, 'JPEG', 15, 12, 35, 22.5);
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SRM FÈS-MEKNÈS', 15, 20);
    }
    
    // Draw Header Box (Right side)
    drawHeaderBox(doc, 'Demande de congé');
    
    // Highlighted Box "Service Ressources Humaines"
    doc.setDrawColor(75, 149, 58);
    doc.setFillColor(242, 248, 243);
    doc.setLineWidth(0.4);
    doc.rect(15, 42, 180, 8, 'FD');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(75, 149, 58);
    doc.text('Service Ressources Humaines', 105, 47.5, { align: 'center' });
    
    // Solid Banner "Partie réservée à l'agent"
    doc.setFillColor(75, 149, 58);
    doc.rect(15, 54, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Partie réservée à l'agent", 105, 59.5, { align: 'center' });
    
    // Fields Layout
    let currentY = 72;
    const lineSpacing = 8.5;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    
    // Nom et Prénom + Matricule row
    doc.setFont('Helvetica', 'bold');
    doc.text('Nom et prénom :', 15, currentY);
    const nameLabelWidth = doc.getTextWidth('Nom et prénom :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empName || ''), 15 + nameLabelWidth + 2, currentY);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Matricule :', 130, currentY);
    const matLabelWidth = doc.getTextWidth('Matricule :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empMatricule || ''), 130 + matLabelWidth + 2, currentY);
    
    currentY += lineSpacing;
    
    // Fonction
    doc.setFont('Helvetica', 'bold');
    doc.text('Fonction :', 15, currentY);
    const funcLabelWidth = doc.getTextWidth('Fonction :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empFonction || ''), 15 + funcLabelWidth + 2, currentY);
    
    currentY += lineSpacing;
    
    // Département
    doc.setFont('Helvetica', 'bold');
    doc.text('Département :', 15, currentY);
    const deptLabelWidth = doc.getTextWidth('Département :');
    doc.setFont('Helvetica', 'normal');
    doc.text(String(empDept || ''), 15 + deptLabelWidth + 2, currentY);
    
    currentY += lineSpacing;
    
    // Direction/Province : TAZA
    doc.setFont('Helvetica', 'bold');
    doc.text(`Direction/Province : ${empDirection || 'TAZA'}`, 15, currentY);
  
  currentY += 12;
  
  // List elements
  // Bullet 1: Période de congé
  doc.setFont('Helvetica', 'bold');
  doc.text('-  Période de congé : Du', 20, currentY);
  const periodLabelWidth = doc.getTextWidth('-  Période de congé : Du');
  doc.setFont('Helvetica', 'normal');
  doc.text(`${formatDateFR(data.dateDepart)}    au    ${formatDateFR(data.dateRetour)}`, 20 + periodLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Bullet 2: Nombre de jours
  doc.setFont('Helvetica', 'bold');
  doc.text('-  Nombre de jours :', 20, currentY);
  const daysLabelWidth = doc.getTextWidth('-  Nombre de jours :');
  doc.setFont('Helvetica', 'normal');
  doc.text(`${data.nombreJours} jours`, 20 + daysLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Bullet 3: Date Reprise
  doc.setFont('Helvetica', 'bold');
  doc.text('-  L\'agent devra rejoindre son service le :', 20, currentY);
  const returnLabelWidth = doc.getTextWidth('-  L\'agent devra rejoindre son service le :');
  doc.setFont('Helvetica', 'normal');
  doc.text(formatDateFR(data.dateReprise), 20 + returnLabelWidth + 2, currentY);
  
  currentY += lineSpacing;
  
  // Bullet 4: Motif
  doc.setFont('Helvetica', 'bold');
  doc.text('-  Motif de congé :', 20, currentY);
  const motifLabelWidth = doc.getTextWidth('-  Motif de congé :');
  doc.setFont('Helvetica', 'normal');
  doc.text(String(data.motif || 'Congé annuel'), 20 + motifLabelWidth + 2, currentY);
  
  currentY += 14;
  
  // Fait à Taza le...
  const today = new Date().toLocaleDateString('fr-FR');
  doc.text(`Fait à TAZA le : ${today}`, 130, currentY);
  
  currentY += 8;
  
  // Signatures
  doc.setFont('Helvetica', 'bold');
  doc.text('Signature de l\'agent', 25, currentY);
  doc.text('Signature chef immédiat', 130, currentY);
  
  currentY += 24;
  
  // Interim box
  doc.setDrawColor(75, 149, 58);
  doc.rect(15, currentY, 180, 14);
  doc.setFont('Helvetica', 'bold');
  doc.text('L\'intérimaire sera assuré par :', 18, currentY + 6);
  
  doc.setFont('Helvetica', 'normal');
  const interimInfo = data.interimName 
    ? `${data.interimName} (Matricule: ${data.interimMatricule})`
    : '...........................................................................................';
  doc.text(interimInfo, 75, currentY + 6);
  
  
  currentY += 20;
  
  // Visas table
  const colWidth = 60;
  const tableHeight = 40;
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(75, 149, 58);
  
  doc.rect(15, currentY, 180, tableHeight);
  doc.line(15 + colWidth, currentY, 15 + colWidth, currentY + tableHeight);
  doc.line(15 + (61 * 2), currentY, 15 + (61 * 2), currentY + tableHeight);
  doc.line(15, currentY + 7, 195, currentY + 7);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 149, 58);
  doc.text('Visa Responsable Hiérarchique', 15 + 5, currentY + 4.5);
  doc.text('Responsable des Ressources Humaines', 15 + colWidth + 2, currentY + 4.5);
  doc.text('Directeur Provincial', 15 + (colWidth * 2) + 15, currentY + 4.5);
  
  currentY += tableHeight + 8;
  
  // Notes
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(194, 26, 34);
  doc.text('N.B. - Cette demande doit parvenir au Directeur Capital Humain 10 jours au moins avant la date de départ.', 15, currentY);
  currentY += 4.5;
  doc.text('- Le Titre de congé est établi à la demande d\'une période de congé à partir de 10 jours et plus.', 15, currentY);
  
    // Footer
    drawFooter(doc);
    
    // Save file
    doc.save(`Demande_Conge_${data.employeeMatricule}.pdf`);
  } catch (error) {
    console.error("Error generating conge PDF:", error);
    alert("Erreur lors de la génération du PDF de demande de congé : " + error.message);
  }
};
