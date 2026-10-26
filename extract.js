// PDF -> plain text using pdf.js.
// Deliberately simple for the demo: reads text in the order pdf.js gives it.
// Known gaps: two-column papers, running headers/footers, page numbers, references.

export async function extractText(pdfjsLib, data) {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    pages.push(text);
  }

  return cleanText(pages.join("\n"));
}

// Text fixes that don't need layout information.
export function cleanText(text) {
  return text
    .normalize("NFKC")                      // ligatures like "ﬁ" -> "fi"
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, "$1$2"); // "classi-\nfication" -> "classification"
}
