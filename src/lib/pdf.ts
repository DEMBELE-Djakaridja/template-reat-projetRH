import { jsPDF } from "jspdf";
import type { Decision, Acte } from "../context/AppContext";

export function downloadDecisionPdf(decision: Decision) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(232, 117, 26);
  doc.text("MINISTÈRE DE LA FONCTION PUBLIQUE", margin, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Union — Discipline — Travail", pageWidth - margin, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 4;
  doc.setDrawColor(232, 117, 26);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N° ${decision.id}/MFP/DRH/GCPE`, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DÉCISION", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(decision.titre, pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(9);
  const bodyLines = [
    "Le Ministre de la Fonction Publique,",
    "Vu la Constitution de la République de Côte d'Ivoire du 08 novembre 2016 ;",
    "Vu la loi n°92-570 du 11 Septembre 1992 portant Statut Général de la Fonction Publique ;",
  ];
  bodyLines.forEach(line => { doc.text(line, margin, y); y += 6; });
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("DÉCIDE :", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  const article1 = doc.splitTextToSize(
    `ARTICLE 1er : Des congés/permissions sont accordés aux fonctionnaires désignés en annexe de la présente décision, de type ${decision.type}.`,
    pageWidth - margin * 2
  );
  doc.text(article1, margin, y);
  y += article1.length * 5 + 3;
  const article2 = doc.splitTextToSize(
    "ARTICLE 2 : La présente décision prend effet à compter de la date de sa signature et sera enregistrée partout où besoin sera.",
    pageWidth - margin * 2
  );
  doc.text(article2, margin, y);
  y += article2.length * 5 + 10;

  // Table
  const colX = [margin, margin + 45, margin + 90, margin + 120, margin + 150];
  const colW = [45, 45, 30, 30, pageWidth - margin - (margin + 150)];
  const headers = ["Agent", "Matricule", "Du", "Au", "Durée"];
  doc.setFillColor(245, 246, 248);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  headers.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5));
  y += 7;
  doc.setFont("helvetica", "normal");
  decision.agents.forEach(a => {
    doc.rect(margin, y, pageWidth - margin * 2, 7);
    doc.text(a.nom, colX[0] + 2, y + 5);
    doc.text(a.matricule, colX[1] + 2, y + 5);
    doc.text(a.debut || "—", colX[2] + 2, y + 5);
    doc.text(a.fin || "—", colX[3] + 2, y + 5);
    doc.text(a.duree ? `${a.duree}j` : "—", colX[4] + 2, y + 5);
    y += 7;
  });
  y += 15;

  doc.setFontSize(9);
  doc.text(`Abidjan, le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - margin, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Le Ministre de la Fonction Publique", pageWidth - margin, y, { align: "right" });

  doc.save(`${decision.id}.pdf`);
}

export function downloadActePdf(acte: Acte) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(232, 117, 26);
  doc.text("MINISTÈRE DE LA FONCTION PUBLIQUE", margin, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Union — Discipline — Travail", pageWidth - margin, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 4;
  doc.setDrawColor(232, 117, 26);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N° ${acte.id}/MFP/DRH/GCPE`, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ACTE DE CESSATION D'ACTIVITÉ", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Réf. demande de congé : ${acte.congeId}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(9);
  doc.text("Le Gestionnaire de la Direction des Ressources Humaines,", margin, y);
  y += 6;
  doc.text("Vu la loi n°92-570 du 11 Septembre 1992 portant Statut Général de la Fonction Publique ;", margin, y);
  y += 6;
  doc.text(`Vu la demande de congé n° ${acte.congeId} validée par les autorités compétentes ;`, margin, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFIE :", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  const article1 = doc.splitTextToSize(
    `ARTICLE 1er : L'agent ${acte.agent}, matricule ${acte.matricule}, affecté à la ${acte.direction}, cesse d'exercer ses fonctions à compter du ${acte.debut} jusqu'au ${acte.fin} inclus, dans le cadre d'un(e) ${acte.type}, soit une durée de ${acte.duree} jour(s).`,
    pageWidth - margin * 2
  );
  doc.text(article1, margin, y);
  y += article1.length * 5 + 3;
  const article2 = doc.splitTextToSize(
    "ARTICLE 2 : Le présent acte est établi et enregistré conformément à la demande de congé susvisée, et prend effet à compter de sa validation.",
    pageWidth - margin * 2
  );
  doc.text(article2, margin, y);
  y += article2.length * 5 + 15;

  doc.setFontSize(9);
  doc.text(`Abidjan, le ${acte.dateSignature ?? acte.dateCreation}`, pageWidth - margin, y, { align: "right" });
  y += 4;
  if (acte.signatureDataUrl) {
    const sigWidth = 45;
    const sigHeight = 16;
    doc.addImage(acte.signatureDataUrl, "PNG", pageWidth - margin - sigWidth, y, sigWidth, sigHeight);
    y += sigHeight + 2;
  } else {
    y += 14;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Le Directeur", pageWidth - margin, y, { align: "right" });

  doc.save(`${acte.id}.pdf`);
}
