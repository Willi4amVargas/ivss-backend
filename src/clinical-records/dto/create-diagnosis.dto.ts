import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO anidado para cada diagnóstico dentro de una historia clínica.
 * Los datos de icd_code e icd_title DEBEN provenir del servicio ICD-11 local.
 * No se permite texto libre arbitrario.
 */
export class CreateDiagnosisDto {
  /**
   * Código ICD-11 oficial. Ej: "BA00", "5A10", "CA26.Z"
   * Debe ser el código `theCode` retornado por el servicio ICD-11 local.
   */
  @ApiProperty({ description: 'Código CIE-11', example: '5A10' })
  @IsString({ message: 'El código ICD debe ser texto.' })
  @IsNotEmpty({ message: 'El código ICD es obligatorio.' })
  @MinLength(2, { message: 'El código ICD debe tener al menos 2 caracteres.' })
  @MaxLength(20, { message: 'El código ICD no puede exceder 20 caracteres.' })
  icd_code: string;

  /**
   * Título oficial del diagnóstico según la OMS.
   * Debe ser el `title` retornado por el servicio ICD-11 local.
   */
  @ApiProperty({ description: 'Título oficial del diagnóstico', example: 'Diabetes mellitus tipo 2' })
  @IsString({ message: 'El título ICD debe ser texto.' })
  @IsNotEmpty({ message: 'El título ICD es obligatorio.' })
  @MinLength(2, {
    message: 'El título ICD debe tener al menos 2 caracteres.',
  })
  @MaxLength(500, {
    message: 'El título ICD no puede exceder 500 caracteres.',
  })
  icd_title: string;

  /**
   * Posición del diagnóstico: 1 (principal), 2, 3, 4 (secundarios).
   * No puede haber dos diagnósticos con el mismo orden en una misma historia.
   */
  @ApiProperty({ description: 'Orden de importancia del diagnóstico (1 principal, 2-4 secundarios)', example: 1, minimum: 1, maximum: 4 })
  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(1, { message: 'El orden mínimo del diagnóstico es 1 (principal).' })
  @Max(4, {
    message:
      'El orden máximo del diagnóstico es 4. Solo se permiten 4 diagnósticos por ingreso.',
  })
  orden: number;
}
