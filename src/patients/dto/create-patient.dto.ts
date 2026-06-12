import {
  IsArray,
  IsBoolean,
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
import { Genders } from '../entities/patient.entity';
import { Transform } from 'class-transformer';

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
  document_id: string;

  /**
   * Número de historia clínica asignado manualmente por el médico.
   */
  @ApiPropertyOptional({
    description: 'Números de historia clínica del paciente',
    example: ['HC-001', 'HC-002'],
  })
  @IsOptional()
  @IsArray({ message: 'El número de historia debe ser un arreglo.' })
  @IsString({
    each: true,
    message: 'Cada número de historia debe ser una cadena de texto.',
  })
  @MaxLength(100, {
    each: true,
    message: 'Cada número de historia no puede exceder los 100 caracteres.',
  })
  @Transform(({ value }: { value: string[] }) =>
    value.map((item) => item.toUpperCase()),
  )
  history_numbers?: string[];

  @ApiProperty({ description: 'Nombres del paciente', example: 'JUAN CARLOS' })
  @IsString({ message: 'El campo nombres debe ser texto.' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  @MaxLength(100, {
    message: 'Los nombres no pueden exceder los 100 caracteres.',
  })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  names: string;

  @ApiProperty({ description: 'Apellidos del paciente', example: 'PEREZ' })
  @IsString({ message: 'El campo apellidos debe ser texto.' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @MaxLength(100, {
    message: 'Los apellidos no pueden exceder los 100 caracteres.',
  })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  lastnames: string;

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
  birth_year: number | null;

  @ApiPropertyOptional({ description: 'Mes de nacimiento (1-12)', example: 8 })
  @IsInt({ message: 'El mes de nacimiento debe ser un número entero.' })
  @Min(1, { message: 'El mes mínimo es 1 (Enero).' })
  @Max(12, { message: 'El mes máximo es 12 (Diciembre).' })
  @IsOptional()
  birth_month: number | null;

  @ApiPropertyOptional({ description: 'Día de nacimiento (1-31)', example: 25 })
  @IsInt({ message: 'El día de nacimiento debe ser un número entero.' })
  @Min(1, { message: 'El día mínimo es 1.' })
  @Max(31, { message: 'El día máximo es 31.' })
  @IsOptional()
  birth_day: number | null;

  @ApiProperty({
    enum: Genders,
    description: 'Sexo biológico',
    example: Genders.MALE,
  })
  @IsEnum(Genders, {
    message: `El sexo debe ser uno de los siguientes valores: ${Object.values(Genders).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El sexo es obligatorio.' })
  gender: Genders;

  @ApiProperty({
    description: 'Direccion del paciente',
    example: 'Barrio obrero...',
  })
  @IsString({ message: 'El campo direccion debe ser texto.' })
  @MaxLength(200, {
    message: 'La direccion no pueden exceder los 200 caracteres.',
  })
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  address: string;

  @ApiProperty({
    description: 'Estado del paciente',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  status: boolean;
}
