import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ─── Tipos espejados del servicio frontend ─────────────────────────────────

export interface ISimplePropertyValue {
  propertyId: string;
  label: string;
  important: boolean;
  propertyValueType: 0 | 1 | 2 | 3;
}

export interface ISimpleEntity {
  id: string;
  title: string;
  matchingPVs?: ISimplePropertyValue[];
  propertiesTruncate: boolean;
  theCode?: string;
  entityType: 0 | 1 | 2;
  important: boolean;
}

export interface ISearchResult {
  destinationEntities: ISimpleEntity[];
  error: boolean;
  errorMessage?: string;
  resultChopped: boolean;
  wordSuggestionsChopped: false;
  guessType: 1 | 2 | 3;
  uniqueSearchId: string;
  words?: string;
}

/**
 * Resultado normalizado para consumo del backend y del frontend clínico.
 * Representa un diagnóstico ICD-11 listo para ser almacenado en la DB.
 */
export interface IcdDiagnosticResult {
  /** Código ICD-11. Ej: "BA00", "5A10" */
  code: string;
  /** Título oficial OMS en español */
  title: string;
  /** URI completa en la API de la OMS */
  uri: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALUES_AMBIGUOS = ['other', 'unspecified'];

/**
 * Formatea una URI de la API OMS extrayendo el identificador numérico final.
 * Replica la lógica del frontend para consistencia total.
 */
function formatICDUri(uri: string): string {
  const parts = uri.split('/');
  const last = parts.at(-1);
  if (!last) throw new Error(`URI ICD inválida: ${uri}`);

  if (VALUES_AMBIGUOS.includes(last.toLowerCase())) {
    const secondToLast = parts.at(-2);
    if (!secondToLast) throw new Error(`URI ICD inválida (ambigua): ${uri}`);
    return secondToLast;
  }
  return last;
}

// ─── Servicio ────────────────────────────────────────────────────────────────

@Injectable()
export class IcdApiService {
  private readonly logger = new Logger(IcdApiService.name);
  private readonly baseUrl: string;
  private readonly releaseId: string;
  private readonly linearization: string;
  private readonly requestHeaders: HeadersInit;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('ICD_API_LOCAL_URL');
    this.releaseId =
      this.configService.get<string>('ICD_RELEASE_ID') ?? '2026-01';
    this.linearization =
      this.configService.get<string>('ICD_LINEARIZATION') ?? 'mms';
    this.requestHeaders = {
      'API-Version': this.configService.get<string>('ICD_API_VERSION') ?? 'v2',
      'Accept-Language':
        this.configService.get<string>('ICD_API_LANGUAGE') ?? 'es',
      Accept: 'application/json',
    };
  }

  /**
   * Construye una URL segura con el path y parámetros dados.
   * SÓLO fetch nativo. Prohibido axios o cualquier librería HTTP de terceros.
   */
  private buildUrl(path: string, params?: Record<string, string>): URL {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url;
  }

  /**
   * Búsqueda de diagnósticos por texto en la linearización MMS de la ICD-11.
   * Devuelve resultados normalizados listos para almacenar en la base de datos.
   *
   * @param query Término de búsqueda. Ej: "diabetes", "hipertensión arterial"
   * @param opciones Parámetros adicionales para refinar la búsqueda
   */
  async searchDiagnostics(
    query: string,
    opciones: {
      useFlexisearch?: boolean;
      flatResults?: boolean;
      includeKeywordResult?: boolean;
      medicalCodingMode?: boolean;
      highlightingEnabled?: boolean;
    } = {},
  ): Promise<IcdDiagnosticResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const path = `/icd/release/11/${this.releaseId}/${this.linearization}/search`;
    const url = this.buildUrl(path, {
      q: query.trim(),
      useFlexisearch: String(opciones.useFlexisearch ?? false),
      flatResults: String(opciones.flatResults ?? false),
      includeKeywordResult: String(opciones.includeKeywordResult ?? false),
      medicalCodingMode: String(opciones.medicalCodingMode ?? true),
      highlightingEnabled: String(opciones.highlightingEnabled ?? true),
    });

    this.logger.debug(`ICD-11 search → ${url.toString()}`);

    let data: ISearchResult;

    try {
      // ─── FETCH NATIVO — PROHIBIDO AXIOS ────────────────────────────────
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.requestHeaders,
      });

      if (!response.ok) {
        throw new Error(
          `ICD API respondió con estado ${response.status}: ${response.statusText}`,
        );
      }

      data = (await response.json()) as ISearchResult;
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error consultando ICD-11 API: ${mensaje}`);
      throw new InternalServerErrorException(
        `No se pudo conectar con el servicio de clasificación ICD-11: ${mensaje}`,
      );
    }

    if (data.error) {
      this.logger.warn(`ICD API retornó error: ${data.errorMessage}`);
      return [];
    }

    // Normalizar y filtrar entidades con código válido
    return data.destinationEntities
      .filter(
        (entity): entity is ISimpleEntity & { theCode: string } =>
          !!entity.theCode && entity.entityType === 0,
      )
      .map((entity) => ({
        code: entity.theCode,
        title: entity.title,
        uri: entity.id,
      }));
  }

  /**
   * Obtiene los detalles completos de una entidad de la linearización por su URI.
   * Útil para confirmar el diagnóstico antes de guardarlo.
   *
   * @param uri URI completa de la entidad ICD-11
   */
  async getEntityByUri(uri: string): Promise<{
    code: string | null;
    title: string;
    uri: string;
  }> {
    const entityId = formatICDUri(uri);
    const path = `/icd/release/11/${this.releaseId}/${this.linearization}/${entityId}`;
    const url = this.buildUrl(path);

    this.logger.debug(`ICD-11 entity → ${url.toString()}`);

    try {
      // ─── FETCH NATIVO ───────────────────────────────────────────────────
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.requestHeaders,
      });

      if (!response.ok) {
        throw new Error(
          `ICD API respondió con estado ${response.status}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        '@id': string;
        code?: string;
        title: { '@value': string };
      };

      return {
        code: data.code ?? null,
        title: data.title['@value'],
        uri: data['@id'],
      };
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error obteniendo entidad ICD-11: ${mensaje}`);
      throw new InternalServerErrorException(
        `No se pudo obtener la entidad ICD-11: ${mensaje}`,
      );
    }
  }
}
