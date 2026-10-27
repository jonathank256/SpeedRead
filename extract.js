// PDF converted to plain text using pdf.js.
// Reads text in the order pdf.js gives it.
// Current gaps include: two-column papers, running headers/footers, page numbers, references to be addressed in full version.

export async function extractText(pdfjsLib, data) {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p); // by page
    const content = await page.getTextContent(); // content of page
    let text = "";
    for (const item of content.items) {
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    pages.push(text); // get all text scraped, ensuring 
  }

  return cleanText(pages.join("\n")); // full text for all pages
}

// Text fixes that don't need layout information.
export function cleanText(text) {
  return text
    .normalize("NFKC") // ligatures like "ﬁ" -> "fi"
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, "$1$2"); // "classi-\nfication" becomes "classification" e.g.
}
