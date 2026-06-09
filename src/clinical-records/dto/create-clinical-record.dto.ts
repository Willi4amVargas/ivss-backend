import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Validate,
  ValidateNested,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { CreateDiagnosisDto } from './create-diagnosis.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Validador custom que garantiza que fecha_egreso >= fecha_ingreso.
 * Es fundamental para la integridad estadística: días_hospitalizacion
 * no puede ser negativo ni incoherente.
 */
@ValidatorConstraint({ name: 'FechaEgresoCoherente', async: false })
export class FechaEgresoCoherenteConstraint
  implements ValidatorConstraintInterface
{
  validate(
    fecha_egreso: string | undefined,
    args: ValidationArguments,
  ): boolean {
    if (!fecha_egreso) return true; // null es válido (paciente aún hospitalizado)
    const obj = args.object as CreateClinicalRecordDto;
    if (!obj.fecha_ingreso) return false;

    const ingreso = new Date(obj.fecha_ingreso);
    const egreso = new Date(fecha_egreso);

    return egreso >= ingreso;
  }

  defaultMessage(): string {
    return 'La fecha de egreso no puede ser anterior a la fecha de ingreso.';
  }
}

/**
 * Validador que garantiza que no haya órdenes de diagnóstico duplicados
 * dentro del mismo DTO (dx1, dx2, dx3, dx4 deben ser únicos).
 */
@ValidatorConstraint({ name: 'OrdenDiagnosticoUnico', async: false })
export class OrdenDiagnosticoUnicoConstraint
  implements ValidatorConstraintInterface
{
  validate(diagnoses: CreateDiagnosisDto[] | undefined): boolean {
    if (!diagnoses || !Array.isArray(diagnoses)) return true;
    const ordenes = diagnoses.map((d) => d.orden);
    return ordenes.length === new Set(ordenes).size;
  }

  defaultMessage(): string {
    return 'No puede haber dos diagnósticos con el mismo orden (posición) dentro del mismo ingreso.';
  }
}

export class CreateClinicalRecordDto {
  /**
   * UUID del paciente al que pertenece este ingreso.
   * El paciente DEBE existir previamente en el sistema.
   */
  @ApiProperty({ description: 'UUID del paciente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido.' })
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio.' })
  patient_id: string;

  /**
   * Fecha y hora de ingreso a hospitalización.
   * Formato ISO 8601: YYYY-MM-DDTHH:mm:ssZ
   */
  @ApiProperty({ description: 'Fecha de ingreso', example: '2023-10-01T12:00:00Z' })
  @IsDateString(
    {},
    {
      message:
        'La fecha de ingreso debe ser una fecha/hora válida en formato ISO 8601.',
    },
  )
  @IsNotEmpty({ message: 'La fecha de ingreso es obligatoria.' })
  fecha_ingreso: string;

  /**
   * Fecha y hora de egreso. Puede ser null si el paciente sigue hospitalizado.
   * REGLA DE NEGOCIO: Debe ser >= fecha_ingreso.
   */
  @ApiProperty({ description: 'Fecha de egreso (Opcional)', example: '2023-10-10T12:00:00Z', required: false })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de egreso debe ser una fecha/hora válida en formato ISO 8601.',
    },
  )
  @Validate(FechaEgresoCoherenteConstraint)
  fecha_egreso?: string;

  /**
   * Estado de mortalidad. TRUE si el paciente falleció durante esta hospitalización.
   * Default: false
   */
  @ApiProperty({ description: 'Indica si el paciente falleció (Mortalidad)', example: false, required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estatus de mortalidad debe ser un booleano.' })
  estatus_mortalidad?: boolean;

  /**
   * Lista de diagnósticos ICD-11. Mínimo 1, máximo 4.
   * TODOS los datos deben provenir del servicio ICD-11 local; no se permite texto libre.
   * No puede haber dos diagnósticos con el mismo orden dentro del mismo ingreso.
   */
  @ApiProperty({ type: [CreateDiagnosisDto], description: 'Lista de diagnósticos (1 a 4)' })
  @IsArray({ message: 'Los diagnósticos deben ser un arreglo.' })
  @ArrayMinSize(1, {
    message: 'Se requiere al menos 1 diagnóstico por ingreso.',
  })
  @ArrayMaxSize(4, {
    message: 'No se permiten más de 4 diagnósticos por ingreso.',
  })
  @ValidateNested({ each: true })
  @Validate(OrdenDiagnosticoUnicoConstraint)
  @Type(() => CreateDiagnosisDto)
  diagnoses: CreateDiagnosisDto[];
}
