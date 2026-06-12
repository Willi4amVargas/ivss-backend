import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdmissionDiagnosisDto {
  @ApiProperty({
    description: 'Código del diagnóstico (ej. CIE-10)',
    maxLength: 20,
    example: 'A00.0',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  code: string;

  @ApiProperty({
    description: 'Título o nombre del diagnóstico',
    maxLength: 500,
    example: 'Cólera debido a Vibrio cholerae 01, biotipo cholerae',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción numérica adicional o código interno',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  // @Transform(({ value }: { value: string }) => value.toUpperCase())
  description?: number;
}

export class UpdateAdmissionDiagnosisDto {
  @ApiPropertyOptional({
    description: 'Código del diagnóstico (ej. CIE-10)',
    maxLength: 20,
    example: 'A00.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  code?: string;

  @ApiPropertyOptional({
    description: 'Título o nombre del diagnóstico',
    maxLength: 500,
    example: 'Cólera debido a Vibrio cholerae 01, biotipo cholerae',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción numérica adicional o código interno',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  // @Transform(({ value }: { value: string }) => value.toUpperCase())
  description?: number;
}

export class CreateAdmissionDto {
  @ApiProperty({
    description: 'Identificador único (UUID) del paciente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  patient_id: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora del ingreso en formato ISO8601',
    example: '2026-03-30T14:32:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  admission_date?: Date;

  @ApiProperty({
    description: 'Lista de motivos de la consulta',
    type: [String],
    example: ['Fiebre alta', 'Dolor de cabeza intenso'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Transform(({ value }: { value: string[] }) =>
    value.map((v) => v.toUpperCase()),
  )
  consult_reason: string[];

  @ApiProperty({
    description: 'Estado o condición actual del paciente al ingresar',
    example:
      'Paciente consciente, orientado en tiempo y espacio, con deshidratación leve.',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  current_condition: string;

  @ApiProperty({
    description: 'Antecedentes médicos relevantes del paciente',
    type: [String],
    example: ['Hipertensión arterial', 'Alergia a la penicilina'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Transform(({ value }: { value: string[] }) =>
    value.map((v) => v.toUpperCase()),
  )
  background: string[];

  @ApiProperty({
    description: 'Detalles del examen físico de admisión',
    example:
      'Presión arterial: 120/80 mmHg, Frecuencia cardíaca: 75 bpm, Temperatura: 38.5°C.',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  admission_exam: string;

  @ApiPropertyOptional({
    description: 'Lista de diagnósticos de admisión asociados',
    type: () => [CreateAdmissionDiagnosisDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos un diagnóstico de ingreso.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAdmissionDiagnosisDto)
  diagnoses?: CreateAdmissionDiagnosisDto[];
}

export class UpdateAdmissionDto {
  @ApiPropertyOptional({
    description: 'Fecha y hora del ingreso en formato ISO8601',
    example: '2026-03-30T14:32:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  admission_date?: Date;

  @ApiPropertyOptional({
    description: 'Lista de motivos de la consulta',
    type: [String],
    example: ['Fiebre alta', 'Dolor de cabeza intenso'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: string[] }) =>
    value.map((v) => v.toUpperCase()),
  )
  consult_reason?: string[];

  @ApiPropertyOptional({
    description: 'Estado o condición actual del paciente al ingresar',
    example:
      'Paciente consciente, orientado en tiempo y espacio, con deshidratación leve.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  current_condition?: string;

  @ApiPropertyOptional({
    description: 'Antecedentes médicos relevantes del paciente',
    type: [String],
    example: ['Hipertensión arterial', 'Alergia a la penicilina'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: string[] }) =>
    value.map((v) => v.toUpperCase()),
  )
  background?: string[];

  @ApiPropertyOptional({
    description: 'Detalles del examen físico de admisión',
    example:
      'Presión arterial: 120/80 mmHg, Frecuencia cardíaca: 75 bpm, Temperatura: 38.5°C.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  admission_exam?: string;

  @ApiPropertyOptional({
    description: 'Lista de diagnósticos de admisión asociados',
    type: () => [CreateAdmissionDiagnosisDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdmissionDiagnosisDto)
  diagnoses?: CreateAdmissionDiagnosisDto[];
}
