import { Injectable } from '@nestjs/common';
import pdfMake from 'pdfmake';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import path from 'path';
import { readFile } from 'fs/promises';

@Injectable()
export class FilesService {
  constructor() {
    // pdfMake.setLocalAccessPolicy((path) => {
    //   return path.startsWith('fonts/');
    // });
    // pdfMake.setUrlAccessPolicy()
  }
  pdf(docDefinition: TDocumentDefinitions) {
    const fontsPath = path.join(__dirname, '/fonts');

    var fonts: TFontDictionary = {
      Roboto: {
        normal: path.join(fontsPath, 'Roboto-Regular.ttf'),
        bold: path.join(fontsPath, 'Roboto-Medium.ttf'),
        italics: path.join(fontsPath, 'Roboto-Italic.ttf'),
        bolditalics: path.join(fontsPath, 'Roboto-MediumItalic.ttf'),
      },
    };
    pdfMake.addFonts(fonts);
    const pdf = pdfMake.createPdf(docDefinition);

    return pdf.getBuffer();
  }

  async toBase64(file: string, mimeType: string = 'image/png') {
    const filePath = path.join(__dirname, '/assets', file);
    const base64 = await readFile(filePath, {
      encoding: 'base64',
    });
    return `data:${mimeType};base64,${base64}`;
  }
}
