import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDischargeDiagnosisDto {
  @ApiProperty({
    description: 'Código del diagnóstico de egreso (ej. CIE-11 / CIE-10)',
    maxLength: 20,
    example: 'BC02.0',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'Título o descripción formal del diagnóstico',
    maxLength: 500,
    example: 'Neumonía bacteriana no especificada',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción numérica adicional o identificador interno',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  description?: number;
}

export class UpdateDischargeDiagnosisDto {
  @ApiPropertyOptional({
    description: 'Código del diagnóstico de egreso (ej. CIE-11 / CIE-10)',
    maxLength: 20,
    example: 'BC02.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Título o descripción formal del diagnóstico',
    maxLength: 500,
    example: 'Neumonía bacteriana no especificada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción numérica adicional o identificador interno',
    example: 456,
  })
  @IsOptional()
  @IsNumber()
  description?: number;
}

export class CreateDischargeDto {
  @ApiProperty({
    description:
      'Identificador único (UUID) del registro de admisión correlativo',
    example: 'a5c84d72-1b34-4bc2-89fa-112233445566',
  })
  @IsUUID()
  @IsNotEmpty()
  admission_record_id: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora del egreso hospitalario en formato ISO8601',
    example: '2026-06-12T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  discharge_date?: Date;

  @ApiProperty({
    description:
      'Detalles del examen físico de egreso y condiciones clínicas de salida',
    example:
      'Campos pulmonares limpios, ruidos cardíacos rítmicos sin soplos. Tolerando adecuadamente bipedestación.',
  })
  @IsString()
  @IsNotEmpty()
  discharge_exam: string;

  @ApiPropertyOptional({
    description:
      'Estado de morbilidad del paciente al egreso (true si presenta secuelas o condiciones crónicas activas)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  morbility_status?: boolean;

  @ApiPropertyOptional({
    description:
      'Plan terapéutico, recomendaciones, medicamentos e indicaciones post-hospitalización',
    example:
      'Amoxicilina 500mg VO cada 8 horas por 7 días. Control por consulta externa en 2 semanas.',
  })
  @IsOptional()
  @IsString()
  treatment_plan?: string;

  @ApiPropertyOptional({
    description:
      'Lista de diagnósticos definitivos asociados al egreso del paciente',
    type: [CreateDischargeDiagnosisDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDischargeDiagnosisDto)
  @IsOptional()
  diagnoses?: CreateDischargeDiagnosisDto[];
}

export class UpdateDischargeDto {
  @ApiPropertyOptional({
    description: 'Fecha y hora del egreso hospitalario en formato ISO8601',
    example: '2026-06-12T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  discharge_date?: Date;

  @ApiPropertyOptional({
    description:
      'Detalles del examen físico de egreso y condiciones clínicas de salida',
    example:
      'Campos pulmonares limpios, ruidos cardíacos rítmicos sin soplos. Tolerando adecuadamente bipedestación.',
  })
  @IsOptional()
  @IsString()
  discharge_exam?: string;

  @ApiPropertyOptional({
    description:
      'Estado de morbilidad del paciente al egreso (true si presenta secuelas o condiciones crónicas activas)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  morbility_status?: boolean;

  @ApiPropertyOptional({
    description:
      'Plan terapéutico, recomendaciones, medicamentos e indicaciones post-hospitalización',
    example:
      'Amoxicilina 500mg VO cada 8 horas por 7 días. Control por consulta externa en 2 semanas.',
  })
  @IsOptional()
  @IsString()
  treatment_plan?: string;

  @ApiPropertyOptional({
    description:
      'Lista de diagnósticos definitivos asociados al egreso del paciente',
    type: [CreateDischargeDiagnosisDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDischargeDiagnosisDto)
  diagnoses?: CreateDischargeDiagnosisDto[];
}
