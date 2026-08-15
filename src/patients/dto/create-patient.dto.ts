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
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Genders } from '../entities/patient.entity';
import { Transform } from 'class-transformer';
import {
  ToUpperCaseString,
  ToUpperCaseStringArray,
} from '../../utils/transforms/to-uppercase.transform';

export class CreatePatientDto {
  /**
   * Cédula de identidad venezolana.
   */
  @ApiProperty({
    description: 'Cédula de identidad (ej. 12345678)',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  document_id: string;

  /**
   * Número de historia clínica asignado manualmente por el médico.
   */
  @ApiPropertyOptional({
    description: 'Números de historia clínica del paciente',
    example: ['HC-001', 'HC-002'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(100, { each: true })
  @Transform(ToUpperCaseStringArray)
  history_numbers?: string[];

  @ApiProperty({ description: 'Nombres del paciente', example: 'JUAN CARLOS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(ToUpperCaseString)
  names: string;

  @ApiProperty({ description: 'Apellidos del paciente', example: 'PEREZ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(ToUpperCaseString)
  lastnames: string;

  @ApiPropertyOptional({
    description: 'Año de nacimiento (4 dígitos)',
    example: 1980,
  })
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  @IsOptional()
  birth_year: number | null;

  @ApiPropertyOptional({ description: 'Mes de nacimiento (1-12)', example: 8 })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  birth_month: number | null;

  @ApiPropertyOptional({ description: 'Día de nacimiento (1-31)', example: 25 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  birth_day: number | null;

  @ApiProperty({
    enum: Genders,
    description: 'Sexo biológico',
    example: Genders.MALE,
  })
  @IsEnum(Genders)
  @IsNotEmpty()
  gender: Genders;

  @ApiProperty({
    description: 'Direccion del paciente',
    example: 'Barrio obrero...',
  })
  @IsString()
  @MaxLength(200)
  @Transform(ToUpperCaseString)
  address: string;

  @ApiProperty({
    description: 'Estado del paciente',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  status: boolean;
}
