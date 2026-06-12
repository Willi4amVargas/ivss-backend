// import { Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import * as ExcelJS from 'exceljs';
// import { ClinicalRecord } from '../clinical-records/entities/clinical_record.entity';
// import { Diagnosis } from '../clinical-records/entities/diagnosis.entity';

// // ─── Tipos de Retorno de los Reportes ────────────────────────────────────────

// export interface ReporteMorbilidad {
//   rango_etario: string;
//   total_ingresos: number;
//   total_fallecidos: number;
//   tasa_mortalidad_pct: number;
// }

// export interface ReporteDiagnosticoMortalidad {
//   icd_code: string;
//   icd_title: string;
//   total_casos: number;
//   casos_fallecidos: number;
//   tasa_mortalidad_pct: number;
//   promedio_dias_hospitalizacion: number;
// }

// export interface ReportePromedioDias {
//   icd_code: string;
//   icd_title: string;
//   total_casos: number;
//   promedio_dias: number;
//   min_dias: number;
//   max_dias: number;
// }

// export interface ResumenGeneral {
//   total_ingresos: number;
//   total_pacientes_unicos: number;
//   total_fallecidos: number;
//   tasa_mortalidad_global_pct: number;
//   promedio_dias_global: number;
//   promedio_edad_ingreso: number;
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// /**
//  * Clasifica una edad en el rango etario estándar usado en epidemiología hospitalaria.
//  * Los rangos siguen la convención de la OPS/OMS para Medicina Interna.
//  */
// function clasificarRangoEtario(edad: number): string {
//   if (edad < 1) return '< 1 año';
//   if (edad <= 4) return '1-4 años';
//   if (edad <= 14) return '5-14 años';
//   if (edad <= 24) return '15-24 años';
//   if (edad <= 34) return '25-34 años';
//   if (edad <= 44) return '35-44 años';
//   if (edad <= 54) return '45-54 años';
//   if (edad <= 64) return '55-64 años';
//   if (edad <= 74) return '65-74 años';
//   return '75+ años';
// }

// /**
//  * Ordena los rangos etarios en el orden correcto para presentación en reportes.
//  */
// const ORDEN_RANGOS_ETARIOS: string[] = [
//   '< 1 año',
//   '1-4 años',
//   '5-14 años',
//   '15-24 años',
//   '25-34 años',
//   '35-44 años',
//   '45-54 años',
//   '55-64 años',
//   '65-74 años',
//   '75+ años',
// ];

// // ─── Servicio ─────────────────────────────────────────────────────────────────

// @Injectable()
// export class StatisticsService {
//   private readonly logger = new Logger(StatisticsService.name);

//   constructor(
//     @InjectRepository(ClinicalRecord)
//     private readonly clinicalRecordRepository: Repository<ClinicalRecord>,
//     @InjectRepository(Diagnosis)
//     private readonly diagnosisRepository: Repository<Diagnosis>,
//   ) {}

//   /**
//    * REPORTE 1 — Resumen General del Servicio
//    *
//    * Métricas globales del departamento de Medicina Interna.
//    * Punto de partida de cualquier análisis estadístico.
//    */
//   async getResumenGeneral(
//     fechaInicio?: Date,
//     fechaFin?: Date,
//   ): Promise<ResumenGeneral> {
//     const qb = this.clinicalRecordRepository
//       .createQueryBuilder('cr')
//       .select([
//         'COUNT(cr.id) AS total_ingresos',
//         'COUNT(DISTINCT cr.patient_id) AS total_pacientes_unicos',
//         'SUM(CASE WHEN cr.estatus_mortalidad = TRUE THEN 1 ELSE 0 END) AS total_fallecidos',
//         'ROUND(AVG(cr.dias_hospitalizacion)::NUMERIC, 2) AS promedio_dias_global',
//         'ROUND(AVG(cr.edad_ingreso)::NUMERIC, 1) AS promedio_edad_ingreso',
//       ]);

//     if (fechaInicio) {
//       qb.andWhere('cr.fecha_ingreso >= :fechaInicio', { fechaInicio });
//     }
//     if (fechaFin) {
//       qb.andWhere('cr.fecha_ingreso <= :fechaFin', { fechaFin });
//     }

//     const raw = await qb.getRawOne<{
//       total_ingresos: string;
//       total_pacientes_unicos: string;
//       total_fallecidos: string;
//       promedio_dias_global: string;
//       promedio_edad_ingreso: string;
//     }>();

//     const totalIngresos = parseInt(raw?.total_ingresos ?? '0', 10);
//     const totalFallecidos = parseInt(raw?.total_fallecidos ?? '0', 10);

//     return {
//       total_ingresos: totalIngresos,
//       total_pacientes_unicos: parseInt(
//         raw?.total_pacientes_unicos ?? '0',
//         10,
//       ),
//       total_fallecidos: totalFallecidos,
//       tasa_mortalidad_global_pct:
//         totalIngresos > 0
//           ? parseFloat(
//               ((totalFallecidos / totalIngresos) * 100).toFixed(2),
//             )
//           : 0,
//       promedio_dias_global: parseFloat(raw?.promedio_dias_global ?? '0'),
//       promedio_edad_ingreso: parseFloat(raw?.promedio_edad_ingreso ?? '0'),
//     };
//   }

//   /**
//    * REPORTE 2 — Morbilidad y Mortalidad por Rango Etario
//    *
//    * Agrupa los ingresos por rangos etarios estándar de la OPS.
//    * Fundamental para análisis epidemiológico de la distribución etaria
//    * de la enfermedad en el departamento.
//    *
//    * QueryBuilder: agrupa por edad_ingreso, agrupa en rangos en memoria
//    * para evitar lógica CASE compleja en SQL no portátil.
//    */
//   async getMorbilityByAgeRange(
//     fechaInicio?: Date,
//     fechaFin?: Date,
//   ): Promise<ReporteMorbilidad[]> {
//     const qb = this.clinicalRecordRepository
//       .createQueryBuilder('cr')
//       .select([
//         'cr.edad_ingreso AS edad_ingreso',
//         'COUNT(cr.id) AS total_ingresos',
//         'SUM(CASE WHEN cr.estatus_mortalidad = TRUE THEN 1 ELSE 0 END) AS total_fallecidos',
//       ])
//       .groupBy('cr.edad_ingreso')
//       .orderBy('cr.edad_ingreso', 'ASC');

//     if (fechaInicio) {
//       qb.andWhere('cr.fecha_ingreso >= :fechaInicio', { fechaInicio });
//     }
//     if (fechaFin) {
//       qb.andWhere('cr.fecha_ingreso <= :fechaFin', { fechaFin });
//     }

//     const rawRows = await qb.getRawMany<{
//       edad_ingreso: string;
//       total_ingresos: string;
//       total_fallecidos: string;
//     }>();

//     // Consolidar por rangos etarios
//     const rangoMap = new Map<
//       string,
//       { total_ingresos: number; total_fallecidos: number }
//     >();

//     for (const row of rawRows) {
//       const edad = parseInt(row.edad_ingreso, 10);
//       const rango = clasificarRangoEtario(edad);
//       const ingresos = parseInt(row.total_ingresos, 10);
//       const fallecidos = parseInt(row.total_fallecidos, 10);

//       const existing = rangoMap.get(rango) ?? {
//         total_ingresos: 0,
//         total_fallecidos: 0,
//       };
//       rangoMap.set(rango, {
//         total_ingresos: existing.total_ingresos + ingresos,
//         total_fallecidos: existing.total_fallecidos + fallecidos,
//       });
//     }

//     // Construir resultado ordenado
//     return ORDEN_RANGOS_ETARIOS.filter((rango) => rangoMap.has(rango)).map(
//       (rango) => {
//         const datos = rangoMap.get(rango)!;
//         return {
//           rango_etario: rango,
//           total_ingresos: datos.total_ingresos,
//           total_fallecidos: datos.total_fallecidos,
//           tasa_mortalidad_pct:
//             datos.total_ingresos > 0
//               ? parseFloat(
//                   (
//                     (datos.total_fallecidos / datos.total_ingresos) *
//                     100
//                   ).toFixed(2),
//                 )
//               : 0,
//         };
//       },
//     );
//   }

//   /**
//    * REPORTE 3 — Frecuencia de Diagnósticos cruzado con Mortalidad
//    *
//    * El reporte epidemiológico más importante del sistema.
//    * Responde: "¿Cuáles son los diagnósticos más frecuentes y cuál
//    * es su tasa de mortalidad asociada en Medicina Interna?"
//    *
//    * JOIN: diagnosis → clinical_record
//    * Filtra solo diagnósticos principales (orden = 1) para morbilidad primaria,
//    * o todos los diagnósticos si se indica.
//    */
//   async getDiagnosisFrequencyWithMortality(
//     opciones: {
//       solodiagnosticoPrincipal?: boolean;
//       limite?: number;
//       fechaInicio?: Date;
//       fechaFin?: Date;
//     } = {},
//   ): Promise<ReporteDiagnosticoMortalidad[]> {
//     const {
//       solodiagnosticoPrincipal = true,
//       limite = 20,
//       fechaInicio,
//       fechaFin,
//     } = opciones;

//     const qb = this.diagnosisRepository
//       .createQueryBuilder('dx')
//       .innerJoin('dx.clinical_record', 'cr')
//       .select([
//         'dx.icd_code AS icd_code',
//         'dx.icd_title AS icd_title',
//         'COUNT(dx.id) AS total_casos',
//         'SUM(CASE WHEN cr.estatus_mortalidad = TRUE THEN 1 ELSE 0 END) AS casos_fallecidos',
//         'ROUND(AVG(cr.dias_hospitalizacion)::NUMERIC, 2) AS promedio_dias_hospitalizacion',
//       ])
//       .groupBy('dx.icd_code')
//       .addGroupBy('dx.icd_title')
//       .orderBy('total_casos', 'DESC')
//       .limit(limite);

//     if (solodiagnosticoPrincipal) {
//       qb.andWhere('dx.orden = :orden', { orden: 1 });
//     }

//     if (fechaInicio) {
//       qb.andWhere('cr.fecha_ingreso >= :fechaInicio', { fechaInicio });
//     }
//     if (fechaFin) {
//       qb.andWhere('cr.fecha_ingreso <= :fechaFin', { fechaFin });
//     }

//     const rawRows = await qb.getRawMany<{
//       icd_code: string;
//       icd_title: string;
//       total_casos: string;
//       casos_fallecidos: string;
//       promedio_dias_hospitalizacion: string;
//     }>();

//     return rawRows.map((row) => {
//       const totalCasos = parseInt(row.total_casos, 10);
//       const casosFallecidos = parseInt(row.casos_fallecidos, 10);
//       return {
//         icd_code: row.icd_code,
//         icd_title: row.icd_title,
//         total_casos: totalCasos,
//         casos_fallecidos: casosFallecidos,
//         tasa_mortalidad_pct:
//           totalCasos > 0
//             ? parseFloat(
//                 ((casosFallecidos / totalCasos) * 100).toFixed(2),
//               )
//             : 0,
//         promedio_dias_hospitalizacion: parseFloat(
//           row.promedio_dias_hospitalizacion ?? '0',
//         ),
//       };
//     });
//   }

//   /**
//    * REPORTE 4 — Promedio de Días de Hospitalización por Diagnóstico
//    *
//    * Permite identificar qué patologías generan estancias más largas
//    * y requieren mayor uso de recursos hospitalarios.
//    */
//   async getAvgHospitalizationByDiagnosis(
//     opciones: {
//       limite?: number;
//       fechaInicio?: Date;
//       fechaFin?: Date;
//     } = {},
//   ): Promise<ReportePromedioDias[]> {
//     const { limite = 20, fechaInicio, fechaFin } = opciones;

//     const qb = this.diagnosisRepository
//       .createQueryBuilder('dx')
//       .innerJoin('dx.clinical_record', 'cr')
//       .where('cr.dias_hospitalizacion IS NOT NULL')
//       .select([
//         'dx.icd_code AS icd_code',
//         'dx.icd_title AS icd_title',
//         'COUNT(dx.id) AS total_casos',
//         'ROUND(AVG(cr.dias_hospitalizacion)::NUMERIC, 2) AS promedio_dias',
//         'MIN(cr.dias_hospitalizacion) AS min_dias',
//         'MAX(cr.dias_hospitalizacion) AS max_dias',
//       ])
//       .andWhere('dx.orden = :orden', { orden: 1 }) // Solo diagnóstico principal
//       .groupBy('dx.icd_code')
//       .addGroupBy('dx.icd_title')
//       .orderBy('promedio_dias', 'DESC')
//       .limit(limite);

//     if (fechaInicio) {
//       qb.andWhere('cr.fecha_ingreso >= :fechaInicio', { fechaInicio });
//     }
//     if (fechaFin) {
//       qb.andWhere('cr.fecha_ingreso <= :fechaFin', { fechaFin });
//     }

//     const rawRows = await qb.getRawMany<{
//       icd_code: string;
//       icd_title: string;
//       total_casos: string;
//       promedio_dias: string;
//       min_dias: string;
//       max_dias: string;
//     }>();

//     return rawRows.map((row) => ({
//       icd_code: row.icd_code,
//       icd_title: row.icd_title,
//       total_casos: parseInt(row.total_casos, 10),
//       promedio_dias: parseFloat(row.promedio_dias),
//       min_dias: parseInt(row.min_dias, 10),
//       max_dias: parseInt(row.max_dias, 10),
//     }));
//   }

//   // ─── EXPORTACIÓN A EXCEL ────────────────────────────────────────────────────

//   /**
//    * Genera un buffer .xlsx con los tres reportes epidemiológicos en hojas separadas.
//    * Retorna el buffer listo para enviar como response stream.
//    *
//    * Hoja 1: Resumen General
//    * Hoja 2: Morbilidad por Rango Etario
//    * Hoja 3: Frecuencia de Diagnósticos con Mortalidad
//    * Hoja 4: Promedio de Días por Diagnóstico
//    */
//   async exportToExcel(opciones: {
//     fechaInicio?: Date;
//     fechaFin?: Date;
//   }): Promise<Buffer> {
//     this.logger.log('Generando reporte Excel...');

//     const [resumen, morbilidad, diagnosticos, promedios] = await Promise.all([
//       this.getResumenGeneral(opciones.fechaInicio, opciones.fechaFin),
//       this.getMorbilityByAgeRange(opciones.fechaInicio, opciones.fechaFin),
//       this.getDiagnosisFrequencyWithMortality({
//         solodiagnosticoPrincipal: true,
//         limite: 50,
//         ...opciones,
//       }),
//       this.getAvgHospitalizationByDiagnosis({ limite: 50, ...opciones }),
//     ]);

//     const workbook = new ExcelJS.Workbook();
//     workbook.creator = 'IVSS — Sistema Piloto de Automatización Estadística';
//     workbook.created = new Date();
//     workbook.modified = new Date();

//     // ─── Estilos comunes ──────────────────────────────────────────────────
//     const estiloEncabezado: Partial<ExcelJS.Style> = {
//       font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
//       fill: {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FF1A3A5C' }, // Azul institucional IVSS
//       },
//       alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
//       border: {
//         bottom: { style: 'medium', color: { argb: 'FF1A3A5C' } },
//       },
//     };

//     const estiloFila: Partial<ExcelJS.Style> = {
//       alignment: { vertical: 'middle', horizontal: 'left' },
//       border: {
//         bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
//       },
//     };

//     const estiloFilaAlternada: Partial<ExcelJS.Style> = {
//       ...estiloFila,
//       fill: {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FFF0F4FA' },
//       },
//     };

//     const aplicarEstiloFilas = (
//       sheet: ExcelJS.Worksheet,
//       desde: number,
//     ): void => {
//       sheet.eachRow((row, rowNumber) => {
//         if (rowNumber >= desde) {
//           const estilo =
//             (rowNumber - desde) % 2 === 0
//               ? estiloFilaAlternada
//               : estiloFila;
//           row.eachCell((cell) => {
//             cell.style = estilo;
//           });
//         }
//       });
//     };

//     // ─── HOJA 1: Resumen General ──────────────────────────────────────────
//     const hojaResumen = workbook.addWorksheet('Resumen General');
//     hojaResumen.mergeCells('A1:B1');
//     hojaResumen.getCell('A1').value =
//       'Hospital Dr. Patrocinio Peñuela Ruíz — Medicina Interna';
//     hojaResumen.getCell('A1').style = {
//       font: { bold: true, size: 14, color: { argb: 'FF1A3A5C' } },
//       alignment: { horizontal: 'center' },
//     };
//     hojaResumen.getRow(1).height = 30;

//     hojaResumen.mergeCells('A2:B2');
//     const periodoText =
//       opciones.fechaInicio && opciones.fechaFin
//         ? `Período: ${opciones.fechaInicio.toLocaleDateString('es-VE')} — ${opciones.fechaFin.toLocaleDateString('es-VE')}`
//         : `Generado: ${new Date().toLocaleDateString('es-VE')}`;
//     hojaResumen.getCell('A2').value = periodoText;
//     hojaResumen.getCell('A2').style = {
//       font: { italic: true, color: { argb: 'FF666666' } },
//       alignment: { horizontal: 'center' },
//     };

//     hojaResumen.columns = [
//       { header: 'Indicador', key: 'indicador', width: 40 },
//       { header: 'Valor', key: 'valor', width: 20 },
//     ];
//     hojaResumen.getRow(3).values = ['Indicador', 'Valor'];
//     hojaResumen.getRow(3).eachCell((cell) => (cell.style = estiloEncabezado));
//     hojaResumen.getRow(3).height = 25;

//     const resumenData = [
//       ['Total de Ingresos', resumen.total_ingresos],
//       ['Pacientes Únicos Atendidos', resumen.total_pacientes_unicos],
//       ['Total de Fallecidos', resumen.total_fallecidos],
//       [
//         'Tasa de Mortalidad Global (%)',
//         resumen.tasa_mortalidad_global_pct + '%',
//       ],
//       [
//         'Promedio de Días de Hospitalización',
//         resumen.promedio_dias_global + ' días',
//       ],
//       [
//         'Promedio de Edad al Ingreso',
//         resumen.promedio_edad_ingreso + ' años',
//       ],
//     ];
//     resumenData.forEach(([ind, val], i) => {
//       const row = hojaResumen.addRow([ind, val]);
//       const estilo =
//         i % 2 === 0 ? estiloFilaAlternada : estiloFila;
//       row.eachCell((cell) => (cell.style = estilo));
//       row.height = 22;
//     });

//     // ─── HOJA 2: Morbilidad por Rango Etario ─────────────────────────────
//     const hojaMorbilidad = workbook.addWorksheet('Morbilidad por Edad');
//     hojaMorbilidad.columns = [
//       { header: 'Rango Etario', key: 'rango_etario', width: 18 },
//       { header: 'Total Ingresos', key: 'total_ingresos', width: 16 },
//       { header: 'Total Fallecidos', key: 'total_fallecidos', width: 17 },
//       {
//         header: 'Tasa Mortalidad (%)',
//         key: 'tasa_mortalidad_pct',
//         width: 20,
//       },
//     ];
//     hojaMorbilidad.getRow(1).eachCell(
//       (cell) => (cell.style = estiloEncabezado),
//     );
//     hojaMorbilidad.getRow(1).height = 30;

//     morbilidad.forEach((row, i) => {
//       const excelRow = hojaMorbilidad.addRow(row);
//       const estilo = i % 2 === 0 ? estiloFilaAlternada : estiloFila;
//       excelRow.eachCell((cell) => (cell.style = estilo));
//       excelRow.height = 20;
//     });

//     // ─── HOJA 3: Diagnósticos con Mortalidad ─────────────────────────────
//     const hojaDx = workbook.addWorksheet('Diagnósticos y Mortalidad');
//     hojaDx.columns = [
//       { header: 'Código ICD-11', key: 'icd_code', width: 14 },
//       { header: 'Diagnóstico', key: 'icd_title', width: 55 },
//       { header: 'Total Casos', key: 'total_casos', width: 13 },
//       { header: 'Fallecidos', key: 'casos_fallecidos', width: 13 },
//       { header: 'Mortalidad (%)', key: 'tasa_mortalidad_pct', width: 16 },
//       {
//         header: 'Prom. Días Hosp.',
//         key: 'promedio_dias_hospitalizacion',
//         width: 18,
//       },
//     ];
//     hojaDx.getRow(1).eachCell((cell) => (cell.style = estiloEncabezado));
//     hojaDx.getRow(1).height = 30;

//     diagnosticos.forEach((row, i) => {
//       const excelRow = hojaDx.addRow(row);
//       const estilo = i % 2 === 0 ? estiloFilaAlternada : estiloFila;
//       excelRow.eachCell((cell) => (cell.style = estilo));
//       excelRow.height = 20;
//     });

//     // ─── HOJA 4: Promedio de Días por Diagnóstico ─────────────────────────
//     const hojaPromedio = workbook.addWorksheet('Días por Diagnóstico');
//     hojaPromedio.columns = [
//       { header: 'Código ICD-11', key: 'icd_code', width: 14 },
//       { header: 'Diagnóstico', key: 'icd_title', width: 55 },
//       { header: 'Total Casos', key: 'total_casos', width: 13 },
//       { header: 'Promedio Días', key: 'promedio_dias', width: 15 },
//       { header: 'Mín. Días', key: 'min_dias', width: 12 },
//       { header: 'Máx. Días', key: 'max_dias', width: 12 },
//     ];
//     hojaPromedio.getRow(1).eachCell((cell) => (cell.style = estiloEncabezado));
//     hojaPromedio.getRow(1).height = 30;

//     promedios.forEach((row, i) => {
//       const excelRow = hojaPromedio.addRow(row);
//       const estilo = i % 2 === 0 ? estiloFilaAlternada : estiloFila;
//       excelRow.eachCell((cell) => (cell.style = estilo));
//       excelRow.height = 20;
//     });

//     // ─── Generar buffer ────────────────────────────────────────────────────
//     const buffer = await workbook.xlsx.writeBuffer();
//     this.logger.log('Reporte Excel generado exitosamente.');
//     return buffer as unknown as Buffer;
//   }
// }
