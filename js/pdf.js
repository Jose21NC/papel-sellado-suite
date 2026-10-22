// Lectura y dibujo de los PDF de papel sellado con pdf.js (corre en el hilo principal: funciona también abriendo index.html sin servidor).
const PDF = (() => {
  const docs = new Map(); // fileId -> Promise<PDFDocumentProxy>
  const images = new Map(); // `${fileId}:${page}:${scale}` -> Promise<objectURL>

  function load(fileId, blob) {
    if (!docs.has(fileId)) {
      docs.set(fileId, blob.arrayBuffer().then((data) => pdfjsLib.getDocument({ data, isEvalSupported: false }).promise));
    }
    return docs.get(fileId);
  }

  // Devuelve las hojas encontradas en el PDF con su valor, serie, número y renglones.
  async function analyze(fileId, blob, filename) {
    const doc = await load(fileId, blob);
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const { items } = await page.getTextContent();
      const simple = items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], size: Math.hypot(it.transform[2], it.transform[3]) }));
      pages.push(PS_PARSE.parsePage(simple, vp.width, vp.height));
    }
    return PS_PARSE.groupSheets(pages, filename);
  }

  // Imagen de una página. scale 2 para pantalla; 300/72 para imprimir a 300 ppp.
  function image(fileId, blob, pageIndex, scale) {
    const key = `${fileId}:${pageIndex}:${scale}`;
    if (!images.has(key)) {
      images.set(key, (async () => {
        const doc = await load(fileId, blob);
        const page = await doc.getPage(pageIndex + 1);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        const out = await new Promise((r) => canvas.toBlob(r, 'image/png'));
        canvas.width = canvas.height = 0; // libera la memoria del lienzo
        return URL.createObjectURL(out);
      })());
      images.get(key).catch(() => images.delete(key));
    }
    return images.get(key);
  }

  function forget(fileId) {
    docs.get(fileId)?.then((d) => d.destroy()).catch(() => {});
    docs.delete(fileId);
    for (const [key, url] of images) if (key.startsWith(fileId + ':')) { url.then(URL.revokeObjectURL).catch(() => {}); images.delete(key); }
  }

  return { analyze, image, forget };
})();
