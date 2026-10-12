// ============================================================
// Lazy jsPDF loader.
// ============================================================

// jsPDF arrastra html2canvas y dompurify (~380 kB). Sólo se carga cuando
// el usuario exporta un PDF, para que el arranque del CRM sea ligero.
export async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}
