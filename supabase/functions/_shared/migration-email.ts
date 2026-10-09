// Presentation only: preserve the stored letter and choice identifiers.
export function textToHtml(text: string): string {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const inline = (value: string) => escape(value).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  const headings = ["Keep everything, including my photos.", "Keep my account, delete my photos.", "Delete everything."];
  const content = text.split(/\n{2,}/).map((paragraph) => {
    const lines = paragraph.split("\n");
    if (lines.length === 3 && lines.every((line, i) => line.startsWith(headings[i]))) {
      return `<ol style="margin:20px 0;padding-left:36px">${lines.map((line, i) =>
        `<li style="margin:0 0 12px;padding-left:4px"><strong>${inline(headings[i])}</strong>${inline(line.slice(headings[i].length))}</li>`
      ).join("")}</ol>`;
    }
    if (lines.length === 5 && lines[0].startsWith("Your account details") && lines[4].startsWith("Any health information")) {
      return `<ul style="margin:20px 0;padding-left:36px">${lines.map((line) => `<li style="padding-left:4px;margin:0 0 4px">${inline(line)}</li>`).join("")}</ul>`;
    }
    const body = inline(paragraph).replace(/\n/g, "<br>");
    return `<p style="margin:0 0 20px">${paragraph.startsWith("Please note:") ? `<strong><em>${body}</em></strong>` : body}</p>`;
  }).join("");
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">${content}</div>`;
}