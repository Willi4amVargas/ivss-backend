import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { IcdApiService, IcdDiagnosticResult } from './icd-api.service';

@ApiTags('diagnostics')
@Controller('diagnostics')
export class IcdApiController {
  constructor(private readonly icdApiService: IcdApiService) {}

  /**
   * GET /diagnostics/search?query=diabetes
   *
   * Proxy al servicio ICD-11 local para búsqueda en tiempo real.
   * El frontend usa este endpoint para que el médico estandarice
   * el diagnóstico antes de enviarlo en la historia clínica.
   *
   * FLUJO CORRECTO:
   * 1. Médico escribe en el buscador → frontend llama a este endpoint
   * 2. Se selecciona un resultado (icd_code + icd_title)
   * 3. El frontend incluye esos valores en el POST /clinical-records
   *
   * @param query Término de búsqueda en español. Ej: "diabetes mellitus tipo 2"
   */
  @Get('search')
  @ApiOperation({ summary: 'Buscar diagnósticos en CIE-11' })
  @ApiQuery({ name: 'query', description: 'Término de búsqueda (min 2 caracteres)' })
  @ApiResponse({ status: 200, description: 'Resultados de la búsqueda devueltos.' })
  @ApiResponse({ status: 400, description: 'Falta el parámetro de búsqueda o es muy corto.' })
  async search(
    @Query('query') query: string,
  ): Promise<IcdDiagnosticResult[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'El parámetro "query" es obligatorio y debe tener al menos 2 caracteres.',
      );
    }
    return this.icdApiService.searchDiagnostics(query, {
      medicalCodingMode: true,
      flatResults: false,
      useFlexisearch: false,
      highlightingEnabled: false,
    });
  }

  /**
   * GET /diagnostics/search?query=x&flexisearch=true
   * Versión con búsqueda flexible (tolerante a errores ortográficos).
   */
  @Get('search/flexible')
  @ApiOperation({ summary: 'Buscar diagnósticos en CIE-11 (Búsqueda Flexible)' })
  @ApiQuery({ name: 'query', description: 'Término de búsqueda (min 2 caracteres)' })
  @ApiResponse({ status: 200, description: 'Resultados de la búsqueda devueltos.' })
  @ApiResponse({ status: 400, description: 'Falta el parámetro de búsqueda o es muy corto.' })
  async searchFlexible(
    @Query('query') query: string,
  ): Promise<IcdDiagnosticResult[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        'El parámetro "query" es obligatorio y debe tener al menos 2 caracteres.',
      );
    }
    return this.icdApiService.searchDiagnostics(query, {
      medicalCodingMode: true,
      flatResults: true,
      useFlexisearch: true,
      includeKeywordResult: true,
      highlightingEnabled: false,
    });
  }
}
