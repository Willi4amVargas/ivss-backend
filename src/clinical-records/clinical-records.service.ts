import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsService } from '../patients/patients.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';
import { ClinicalRecord } from './entities/clinical_record.entity';
import { Diagnosis } from './entities/diagnosis.entity';

@Injectable()
export class ClinicalRecordsService {
  constructor(
    @InjectRepository(ClinicalRecord)
    private readonly clinicalRecordRepository: Repository<ClinicalRecord>,
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
    private readonly patientsService: PatientsService,
  ) {}

  /**
   * Calcula la edad en años completos de una persona a una fecha de referencia.
   * Esta función es el núcleo de la precisión estadística: fija la edad_ingreso
   * de forma irrevocable al momento del evento clínico.
   */
  private calcularEdadEnFecha(
    fechaNacimiento: Date,
    fechaReferencia: Date,
  ): number {
    let edad = fechaReferencia.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = fechaReferencia.getMonth();
    const mesBirth = fechaNacimiento.getMonth();

    if (
      mesActual < mesBirth ||
      (mesActual === mesBirth &&
        fechaReferencia.getDate() < fechaNacimiento.getDate())
    ) {
      edad--;
    }

    if (edad < 0) {
      throw new BadRequestException(
        'La fecha de ingreso no puede ser anterior a la fecha de nacimiento del paciente.',
      );
    }

    return edad;
  }

  private calcularEdadEnYear(
    fechaNacimiento: number,
    fechaReferencia: number,
  ): number {
    const edad = fechaReferencia - fechaNacimiento;

    if (edad < 0) {
      throw new BadRequestException(
        'La fecha de ingreso no puede ser anterior a la fecha de nacimiento del paciente.',
      );
    }

    return edad;
  }

  /**
   * Calcula los días de hospitalización entre ingreso y egreso.
   * Se redondea al entero superior (1 día mínimo si hubo egreso el mismo día).
   */
  private calcularDiasHospitalizacion(ingreso: Date, egreso: Date): number {
    const diffMs = egreso.getTime() - ingreso.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(diffDias, 1); // Mínimo 1 día aunque sea el mismo día
  }

  async create(dto: CreateClinicalRecordDto): Promise<ClinicalRecord> {
    // 1. Verificar que el paciente existe
    const patient = await this.patientsService.findOne(dto.patient_id);

    // 2. Construir las fechas
    const fechaIngreso = new Date(dto.fecha_ingreso);
    const fechaEgreso = dto.fecha_egreso ? new Date(dto.fecha_egreso) : null;

    // 3. Calcular edad_ingreso estáticamente — NUNCA debe recalcularse
    let edadIngreso = -1;
    if (patient.birth_year) {
      edadIngreso = this.calcularEdadEnYear(
        patient.birth_year,
        fechaIngreso.getFullYear(),
      );
    }

    // 4. Calcular dias_hospitalizacion si hay fecha de egreso
    const diasHospitalizacion =
      fechaEgreso !== null
        ? this.calcularDiasHospitalizacion(fechaIngreso, fechaEgreso)
        : null;

    // 5. Validar coherencia de mortalidad: si el paciente murió, debe tener fecha de egreso
    if (dto.estatus_mortalidad === true && !fechaEgreso) {
      throw new BadRequestException(
        'Si el estatus de mortalidad es verdadero, se debe registrar la fecha de egreso.',
      );
    }

    // 6. Construir y guardar la historia clínica
    const clinicalRecord = this.clinicalRecordRepository.create({
      patient_id: patient.id,
      fecha_ingreso: fechaIngreso,
      fecha_egreso: fechaEgreso,
      edad_ingreso: edadIngreso,
      dias_hospitalizacion: diasHospitalizacion,
      estatus_mortalidad: dto.estatus_mortalidad ?? false,
    });

    const savedRecord =
      await this.clinicalRecordRepository.save(clinicalRecord);

    // 7. Guardar los diagnósticos vinculados
    const diagnoses = dto.diagnoses.map((dxDto) =>
      this.diagnosisRepository.create({
        ...dxDto,
        clinical_record_id: savedRecord.id,
      }),
    );

    await this.diagnosisRepository.save(diagnoses);

    return this.findOne(savedRecord.id);
  }

  async findAll(): Promise<ClinicalRecord[]> {
    return this.clinicalRecordRepository.find({
      relations: { patient: true, diagnoses: true },
      order: { fecha_ingreso: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ClinicalRecord> {
    const record = await this.clinicalRecordRepository.findOne({
      where: { id },
      relations: { patient: true, diagnoses: true },
    });
    if (!record) {
      throw new NotFoundException(
        `Historia clínica con ID "${id}" no encontrada.`,
      );
    }
    return record;
  }

  async findByPatient(patientId: string): Promise<ClinicalRecord[]> {
    await this.patientsService.findOne(patientId); // Verifica que el paciente existe
    return this.clinicalRecordRepository.find({
      where: { patient_id: patientId },
      relations: { diagnoses: true },
      order: { fecha_ingreso: 'DESC' },
    });
  }

  /**
   * Actualización principal: registrar el egreso del paciente.
   * Al recibir fecha_egreso, recalcula dias_hospitalizacion.
   * Si se marca mortalidad, se exige fecha de egreso.
   */
  async update(
    id: string,
    dto: UpdateClinicalRecordDto,
  ): Promise<ClinicalRecord> {
    const record = await this.findOne(id);

    let fechaEgreso = record.fecha_egreso;
    let diasHospitalizacion = record.dias_hospitalizacion;

    if (dto.fecha_egreso !== undefined) {
      fechaEgreso = new Date(dto.fecha_egreso);

      // Re-validar coherencia con la fecha de ingreso almacenada
      if (fechaEgreso < record.fecha_ingreso) {
        throw new BadRequestException(
          'La fecha de egreso no puede ser anterior a la fecha de ingreso registrada.',
        );
      }

      diasHospitalizacion = this.calcularDiasHospitalizacion(
        record.fecha_ingreso,
        fechaEgreso,
      );
    }

    // Validar mortalidad requiere fecha de egreso
    const nuevaMortalidad = dto.estatus_mortalidad ?? record.estatus_mortalidad;
    const nuevaFechaEgreso = fechaEgreso;
    if (nuevaMortalidad === true && !nuevaFechaEgreso) {
      throw new BadRequestException(
        'Para registrar la mortalidad, debe existir una fecha de egreso.',
      );
    }

    Object.assign(record, {
      fecha_egreso: fechaEgreso,
      dias_hospitalizacion: diasHospitalizacion,
      estatus_mortalidad: nuevaMortalidad,
    });

    return this.clinicalRecordRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.clinicalRecordRepository.remove(record);
  }
}
