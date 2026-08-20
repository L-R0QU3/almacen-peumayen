import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

// Fuentes Roboto incluidas en pdfmake (base64 en vfs_fonts.js)
const vfs = require('pdfmake/build/vfs_fonts.js');

const FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fonts');
const FONT_FILES = {
  'Roboto-Regular.ttf': 'normal',
  'Roboto-Medium.ttf': 'bold', // pdfmake usa Medium como "bold"
  'Roboto-Italic.ttf': 'italics',
  'Roboto-MediumItalic.ttf': 'bolditalics',
};

// pdfmake (servidor): instancia oficial con políticas de acceso restringidas
const pdfmake = require('pdfmake');
if (typeof pdfmake.setLocalAccessPolicy === 'function') {
  // solo se permite leer las fuentes propias (nada más del sistema de archivos)
  pdfmake.setLocalAccessPolicy((filePath) => filePath.startsWith(FONT_DIR));
}
if (typeof pdfmake.setUrlAccessPolicy === 'function') {
  pdfmake.setUrlAccessPolicy(() => false); // sin descargas externas
}

// Extrae las fuentes a disco la primera vez (el printer de servidor las lee por ruta)
for (const file of Object.keys(FONT_FILES)) {
  const target = path.join(FONT_DIR, file);
  if (!existsSync(target)) {
    if (!existsSync(FONT_DIR)) mkdirSync(FONT_DIR, { recursive: true });
    const b64 = vfs[file];
    if (!b64) throw new Error(`Fuente no encontrada en vfs: ${file}`);
    writeFileSync(target, Buffer.from(b64, 'base64'));
  }
}

// Registra las fuentes en la instancia pdfmake
pdfmake.addFonts?.({
  Roboto: Object.fromEntries(
    Object.entries(FONT_FILES).map(([file, style]) => [style, path.join(FONT_DIR, file)])
  ),
});

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const fmtDate = (d) => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(`${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    date
  );
};

/**
 * Genera el PDF de una cotización (pdfmake, servidor).
 * `items` son los snapshots históricos; `business` la configuración del negocio.
 */
export async function buildQuotationPdf({ quotation, items, business }) {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [36, 36, 36, 64],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#171a1f' },
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: business.name || 'Almacén Peumayen', bold: true, fontSize: 18, color: '#15803d' },
              business.rut ? { text: `RUT: ${business.rut}`, fontSize: 8, marginTop: 2 } : null,
              business.phone ? { text: `Tel: ${business.phone}`, fontSize: 8 } : null,
              business.address ? { text: business.address, fontSize: 8 } : null,
            ].filter(Boolean),
          },
          {
            width: 'auto',
            alignment: 'right',
            stack: [
              { text: 'COTIZACIÓN', bold: true, fontSize: 14 },
              { text: quotation.number, bold: true, fontSize: 12, marginTop: 2 },
              { text: `Estado: ${quotation.status.replaceAll('_', ' ')}`, fontSize: 8, marginTop: 4 },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e1e6eb' }], margin: [0, 12, 0, 12] },
      {
        columns: [
          { width: '*', stack: [{ text: 'Cliente', bold: true, fontSize: 8, color: '#64707d' }, { text: quotation.customer_name || 'Sin cliente', fontSize: 10, marginTop: 2 }] },
          { width: 'auto', stack: [{ text: 'Emisión', bold: true, fontSize: 8, color: '#64707d' }, { text: fmtDate(quotation.issue_date), fontSize: 10, marginTop: 2 }] },
          { width: 'auto', stack: [{ text: 'Vigencia', bold: true, fontSize: 8, color: '#64707d' }, { text: fmtDate(quotation.valid_until), fontSize: 10, marginTop: 2 }] },
        ],
        columnGap: 16,
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          widths: [52, '*', 40, 70, 70],
          body: [
            [
              { text: 'SKU', style: 'tableHeader' },
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Cant.', style: 'tableHeader', alignment: 'right' },
              { text: 'Precio unit.', style: 'tableHeader', alignment: 'right' },
              { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
            ],
            ...items.map((it) => [
              { text: it.sku, color: '#64707d' },
              it.product_name,
              { text: String(it.quantity), alignment: 'right' },
              { text: clp.format(it.unit_price), alignment: 'right' },
              { text: clp.format(it.subtotal), alignment: 'right', bold: true },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i) => (i === 0 || i === 1 ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => '#e1e6eb',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
      {
        columns: [{ width: '*', text: '' }, { width: 'auto', text: clp.format(quotation.total), bold: true, fontSize: 14, marginTop: 12 }],
        margin: [0, 8, 0, 0],
      },
      quotation.observations
        ? { text: [{ text: 'Observaciones: ', bold: true }, quotation.observations], fontSize: 8, marginTop: 16 }
        : null,
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 8, color: '#64707d', fillColor: '#f3f5f7' },
    },
    footer: (currentPage, pageCount) => ({
      text: `${business.name || 'Almacén Peumayen'} · ${quotation.number} · Página ${currentPage} de ${pageCount}`,
      alignment: 'center',
      fontSize: 7,
      color: '#96a0ad',
      margin: [0, 20, 0, 0],
    }),
  };

  const output = pdfmake.createPdf(docDefinition);
  return output.getBuffer();
}
