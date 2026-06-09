import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo } from '../entities/patient.entity';

export class CreatePatientDto {
  /**
   * Cédula de identidad venezolana.
   */
  @ApiProperty({
    description: 'Cédula de identidad (ej. 12345678)',
    example: '12345678',
  })
  @IsString({ message: 'La cédula debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La cédula es obligatoria.' })
  @MaxLength(12, {
    message: 'La cédula no puede exceder los 12 caracteres.',
  })
  cedula: string;

  /**
   * Número de historia clínica asignado manualmente por el médico.
   */
  @ApiPropertyOptional({
    description: 'Número de historia clínica',
    example: 'HC-001',
  })
  @IsString({ message: 'El número de historia debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(20, {
    message: 'El número de historia no puede exceder los 20 caracteres.',
  })
  numero_historia?: string | null;

  @ApiProperty({ description: 'Nombres del paciente', example: 'JUAN CARLOS' })
  @IsString({ message: 'El campo nombres debe ser texto.' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  @MaxLength(100, {
    message: 'Los nombres no pueden exceder los 100 caracteres.',
  })
  nombres: string;

  @ApiProperty({ description: 'Apellidos del paciente', example: 'PEREZ' })
  @IsString({ message: 'El campo apellidos debe ser texto.' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @MaxLength(100, {
    message: 'Los apellidos no pueden exceder los 100 caracteres.',
  })
  apellidos: string;

  @ApiPropertyOptional({
    description: 'Año de nacimiento (4 dígitos)',
    example: 1980,
  })
  @IsInt({ message: 'El año de nacimiento debe ser un número entero.' })
  @Min(1900, { message: 'El año de nacimiento debe ser mayor a 1900.' })
  @Max(new Date().getFullYear(), {
    message: 'El año de nacimiento no puede ser mayor al año actual.',
  })
  @IsOptional()
  birth_year?: number | null;

  @ApiPropertyOptional({ description: 'Mes de nacimiento (1-12)', example: 8 })
  @IsInt({ message: 'El mes de nacimiento debe ser un número entero.' })
  @Min(1, { message: 'El mes mínimo es 1 (Enero).' })
  @Max(12, { message: 'El mes máximo es 12 (Diciembre).' })
  @IsOptional()
  birth_month?: number | null;

  @ApiPropertyOptional({ description: 'Día de nacimiento (1-31)', example: 25 })
  @IsInt({ message: 'El día de nacimiento debe ser un número entero.' })
  @Min(1, { message: 'El día mínimo es 1.' })
  @Max(31, { message: 'El día máximo es 31.' })
  @IsOptional()
  birth_day?: number | null;

  @ApiProperty({
    enum: Sexo,
    description: 'Sexo biológico',
    example: Sexo.MASCULINO,
  })
  @IsEnum(Sexo, {
    message: `El sexo debe ser uno de los siguientes valores: ${Object.values(Sexo).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El sexo es obligatorio.' })
  sexo: Sexo;
}
