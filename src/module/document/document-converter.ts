import puppeteer from 'puppeteer';
import HTMLtoDOCX from 'html-to-docx';
import type HtmlToDocx from 'html-to-docx';
import { existsSync } from 'fs';


export type ConvertFormat = 'pdf' | 'docx' | 'txt';

export interface ConversionResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}


interface DocxOptions extends HtmlToDocx.DocumentOptions {
  header?: boolean;
  footer?: boolean;
  lineHeight?: number;
  margins?: HtmlToDocx.DocumentOptions['margins'] & {
    footer?: number;
  };
}


function buildFullHtml(rawHtml: string): string {
  const isFullDocument = /<html[\s>]/i.test(rawHtml);
  if (isFullDocument) return rawHtml;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* ── Base ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 40px 48px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* ── Headings ── */
    h1, h2, h3, h4 {
      font-family: Arial, Helvetica, sans-serif;
      margin-top: 20px;
      margin-bottom: 8px;
      color: #111;
    }
    h1 { font-size: 16pt; text-align: center; text-transform: uppercase; }
    h2 { font-size: 14pt; }
    h3 { font-size: 12pt; }

    /* ── Paragraphs & spacing ── */
    p  { margin-bottom: 10px; text-align: justify; }
    br { display: block; margin: 4px 0; }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11pt;
    }
    th, td {
      border: 1px solid #555;
      padding: 6px 10px;
      vertical-align: top;
    }
    th { background: #f0f0f0; font-weight: bold; }

    /* ── Lists ── */
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin-bottom: 4px; }

    /* ── Legal-specific ── */
    .party-block  { margin: 16px 0; }
    .signature    { margin-top: 40px; }
    .notice-head  { text-align: center; font-weight: bold; margin-bottom: 16px; }
    .clause       { margin: 10px 0 10px 16px; }

    /* ── Placeholders (show clearly on screen, print normally) ── */
    [data-placeholder], .placeholder {
      color: #c00;
      font-style: italic;
    }
  </style>
</head>
<body>
  ${rawHtml}
</body>
</html>`;
}

// ============================================================================
// PDF CONVERSION  (Puppeteer)
// ============================================================================

async function convertToPdf(htmlContent: string): Promise<Buffer> {
  const chromePath = findChromeExecutable();

  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };

  if (chromePath) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    await page.setContent(buildFullHtml(htmlContent), {
      waitUntil: 'networkidle0',
      timeout: 30_000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}


function findChromeExecutable(): string | undefined {
  const envPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
  ].filter(Boolean) as string[];

  for (const p of envPaths) {
    if (p && existsSync(p)) return p;
  }

  const commonPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of commonPaths) {
    if (existsSync(p)) return p;
  }

  return undefined;
}



async function convertToDocx(htmlContent: string): Promise<Buffer> {
  const options: DocxOptions = {
    table: { row: { cantSplit: true } },
    header: false,
    footer: false,
    pageSize: { width: 12240, height: 15840 }, 
    margins: {
      top: 1134,    
      right: 1134,
      bottom: 1134,
      left: 1134,
    },
    font: 'Times New Roman',
    fontSize: 24, 
    lineHeight: 276, 
  };

  const docxBuffer = await HTMLtoDOCX(buildFullHtml(htmlContent), null, options);

  return Buffer.isBuffer(docxBuffer)
    ? docxBuffer
    : Buffer.from(docxBuffer as ArrayBuffer);
}

function convertToTxt(htmlContent: string): Buffer {
  const text = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return Buffer.from(text, 'utf-8');
}

class DocumentConverterService {
  /**
   * @param htmlContent  
   * @param format       
   * @returns            { buffer, mimeType, extension }
   */
  async convert(htmlContent: string, format: ConvertFormat): Promise<ConversionResult> {
    switch (format) {
      case 'pdf': {
        const buffer = await convertToPdf(htmlContent);
        return { buffer, mimeType: 'application/pdf', extension: 'pdf' };
      }

      case 'docx': {
        const buffer = await convertToDocx(htmlContent);
        return {
          buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
        };
      }

      case 'txt': {
        const buffer = convertToTxt(htmlContent);
        return { buffer, mimeType: 'text/plain', extension: 'txt' };
      }

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  mimeTypeFor(format: ConvertFormat): string {
    const map: Record<ConvertFormat, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return map[format];
  }
}

export default new DocumentConverterService();