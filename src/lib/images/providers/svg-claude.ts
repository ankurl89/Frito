/**
 * Claude-SVG image provider — the zero-dependency default (no image API key).
 *
 * Prompts Claude to emit raw SVG artwork on a transparent background. Quality
 * ceiling is geometric/vector — fine as a fallback, but Flux is preferred when
 * configured. Returns an SVG data URI.
 */

import { openrouter, MODELS } from "@/lib/openrouter";
import { ImageProvider, GenerateArtworkInput, GeneratedArtwork } from "../types";

export class SvgClaudeProvider implements ImageProvider {
  readonly name = "claude-svg";

  isConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async generateArtwork({ prompt, brandColors = [] }: GenerateArtworkInput): Promise<GeneratedArtwork> {
    const colorLine = brandColors.length ? `Use these colors: ${brandColors.join(", ")}.` : "";
    const res = await openrouter.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: "user",
        content: `Build an SVG print graphic. ${prompt}
${colorLine}

OUTPUT RULES — STRICT
- Output ONLY the SVG. No markdown, no explanation.
- Start with: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
- End with: </svg>
- TRANSPARENT background — no background rect.
- Use paths, circles, polygons, text (font-family Arial or Georgia).
- 10–20 bold shapes, centered with ~5% padding.
- Every <path> self-closed, every <text>/<g> closed.`,
      }],
      max_tokens: 8000,
      temperature: 0.4,
    });

    const raw = res.choices[0].message.content || "";
    const svg = extractSvg(raw);
    if (!svg) throw new Error("Claude did not return valid SVG");

    const url = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    return { url, format: "svg", provider: this.name, svg };
  }
}

function extractSvg(raw: string): string {
  let source = raw;
  const fenced = raw.match(/```(?:svg|xml)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) source = fenced[1];
  const start = source.indexOf("<svg");
  if (start === -1) return "";
  source = source.slice(start);
  const end = source.lastIndexOf("</svg>");
  if (end !== -1) return source.slice(0, end + 6);
  const lastGt = source.lastIndexOf(">");
  if (lastGt === -1) return "";
  return closeUnbalanced(source.slice(0, lastGt + 1)) + "</svg>";
}

function closeUnbalanced(svg: string): string {
  const stack: string[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const selfClose = m[2] === "/" || m[0].endsWith("/>");
    if (selfClose) continue;
    if (m[0].startsWith("</")) {
      const i = stack.lastIndexOf(m[1]);
      if (i !== -1) stack.splice(i, 1);
    } else if (m[1].toLowerCase() !== "svg") stack.push(m[1]);
  }
  return svg + stack.reverse().map(t => `</${t}>`).join("");
}
