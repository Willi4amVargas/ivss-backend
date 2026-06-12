// import {
//   Controller,
//   Get,
//   Query,
//   Res,
//   StreamableFile,
// } from '@nestjs/common';
// import type { Response } from 'express';
// import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
// import { StatisticsService } from './statistics.service';

// @ApiTags('statistics')
// @Controller('statistics')
// export class StatisticsController {
//   constructor(private readonly statisticsService: StatisticsService) {}

//   /**
//    * GET /statistics/summary
//    * Retorna las métricas globales del servicio de Medicina Interna.
//    */
//   @Get('summary')
//   @ApiOperation({ summary: 'Obtener resumen general de estadísticas' })
//   @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
//   @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
//   @ApiResponse({ status: 200, description: 'Resumen estadístico devuelto exitosamente.' })
//   getSummary(
//     @Query('fechaInicio') fechaInicio?: string,
//     @Query('fechaFin') fechaFin?: string,
//   ) {
//     return this.statisticsService.getResumenGeneral(
//       fechaInicio ? new Date(fechaInicio) : undefined,
//       fechaFin ? new Date(fechaFin) : undefined,
//     );
//   }

//   /**
//    * GET /statistics/morbility-by-age?fechaInicio=2025-01-01&fechaFin=2025-12-31
//    * Retorna morbilidad y mortalidad agrupada por rangos etarios OPS.
//    */
//   @Get('morbility-by-age')
//   @ApiOperation({ summary: 'Obtener morbilidad por rango de edad' })
//   @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
//   @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
//   @ApiResponse({ status: 200, description: 'Morbilidad por edad devuelta.' })
//   getMorbilityByAge(
//     @Query('fechaInicio') fechaInicio?: string,
//     @Query('fechaFin') fechaFin?: string,
//   ) {
//     return this.statisticsService.getMorbilityByAgeRange(
//       fechaInicio ? new Date(fechaInicio) : undefined,
//       fechaFin ? new Date(fechaFin) : undefined,
//     );
//   }

//   /**
//    * GET /statistics/diagnosis-mortality?solodiagnosticoPrincipal=true&limite=20
//    * Retorna frecuencia de diagnósticos cruzada con tasa de mortalidad.
//    * Es el reporte epidemiológico central del sistema.
//    */
//   @Get('diagnosis-mortality')
//   @ApiOperation({ summary: 'Obtener frecuencia de diagnósticos con mortalidad' })
//   @ApiQuery({ name: 'solodiagnosticoPrincipal', required: false, type: Boolean, description: 'Filtrar solo por diagnóstico principal' })
//   @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Límite de resultados' })
//   @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
//   @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
//   @ApiResponse({ status: 200, description: 'Estadísticas de diagnósticos devueltas.' })
//   getDiagnosisMortality(
//     @Query('solodiagnosticoPrincipal') solodiagnosticoPrincipal?: string,
//     @Query('limite') limite?: string,
//     @Query('fechaInicio') fechaInicio?: string,
//     @Query('fechaFin') fechaFin?: string,
//   ) {
//     return this.statisticsService.getDiagnosisFrequencyWithMortality({
//       solodiagnosticoPrincipal: solodiagnosticoPrincipal !== 'false',
//       limite: limite ? parseInt(limite, 10) : 20,
//       fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
//       fechaFin: fechaFin ? new Date(fechaFin) : undefined,
//     });
//   }

//   /**
//    * GET /statistics/avg-hospitalization?limite=20
//    * Retorna el promedio de días de hospitalización por diagnóstico principal.
//    */
//   @Get('avg-hospitalization')
//   @ApiOperation({ summary: 'Obtener promedio de días de hospitalización por diagnóstico' })
//   @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Límite de resultados' })
//   @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
//   @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
//   @ApiResponse({ status: 200, description: 'Promedios devueltos exitosamente.' })
//   getAvgHospitalization(
//     @Query('limite') limite?: string,
//     @Query('fechaInicio') fechaInicio?: string,
//     @Query('fechaFin') fechaFin?: string,
//   ) {
//     return this.statisticsService.getAvgHospitalizationByDiagnosis({
//       limite: limite ? parseInt(limite, 10) : 20,
//       fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
//       fechaFin: fechaFin ? new Date(fechaFin) : undefined,
//     });
//   }

//   /**
//    * GET /statistics/export?fechaInicio=2025-01-01&fechaFin=2025-12-31
//    *
//    * Genera y descarga el reporte estadístico completo en formato .xlsx.
//    * Contiene 4 hojas: Resumen General, Morbilidad por Edad,
//    * Diagnósticos con Mortalidad, y Promedio de Días por Diagnóstico.
//    */
//   @Get('export')
//   @ApiOperation({ summary: 'Exportar estadísticas a Excel' })
//   @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
//   @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
//   @ApiResponse({ status: 200, description: 'Archivo Excel descargable.' })
//   async exportToExcel(
//     @Query('fechaInicio') fechaInicio?: string,
//     @Query('fechaFin') fechaFin?: string,
//     @Res({ passthrough: true }) res?: Response,
//   ): Promise<StreamableFile> {
//     const fechaGeneracion = new Date()
//       .toISOString()
//       .slice(0, 10)
//       .replace(/-/g, '');
//     const nombreArchivo = `IVSS_MedicinaInterna_Estadisticas_${fechaGeneracion}.xlsx`;

//     const buffer = await this.statisticsService.exportToExcel({
//       fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
//       fechaFin: fechaFin ? new Date(fechaFin) : undefined,
//     });

//     res?.set({
//       'Content-Type':
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
//       'Content-Length': buffer.length,
//     });

//     return new StreamableFile(buffer);
//   }
// }
