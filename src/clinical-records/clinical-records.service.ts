import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Admission } from './entities/admission.entity';
import { AdmissionDiagnosis } from './entities/admission_diagnosis.entity';
import { HospitalEvolution } from './entities/hospital_evolution.entity';
import { Discharges } from './entities/discharges.entity';
import { DischargeDiagnosis } from './entities/discharges_diagnosis.entity';
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import {
  CreateHospitalEvolutionDto,
  UpdateHospitalEvolutionDto,
} from './dto/hospital-evolution.dto';
import { CreateDischargeDto, UpdateDischargeDto } from './dto/discharge.dto';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class ClinicalRecordsService {
  constructor(
    @InjectRepository(Admission)
    private readonly admissionRepo: Repository<Admission>,
    @InjectRepository(AdmissionDiagnosis)
    private readonly admissionDiagnosisRepo: Repository<AdmissionDiagnosis>,
    @InjectRepository(HospitalEvolution)
    private readonly evolutionRepo: Repository<HospitalEvolution>,
    @InjectRepository(Discharges)
    private readonly dischargeRepo: Repository<Discharges>,
    @InjectRepository(DischargeDiagnosis)
    private readonly dischargeDiagnosisRepo: Repository<DischargeDiagnosis>,
    private readonly entityManager: EntityManager,
    private readonly patientsService: PatientsService,
  ) {}

  // --- Admission & Admission Diagnosis ---

  async createAdmission(dto: CreateAdmissionDto): Promise<Admission> {
    // Validate patient exists
    await this.patientsService.findOne(dto.patient_id);

    return this.entityManager.transaction(async (manager) => {
      const admission = manager.create(Admission, {
        patient_id: dto.patient_id,
        admission_date: dto.admission_date,
        consult_reason: dto.consult_reason,
        current_condition: dto.current_condition,
        background: dto.background,
        admission_exam: dto.admission_exam,
      });
      const savedAdmission = await manager.save(Admission, admission);

      if (dto.diagnoses && dto.diagnoses.length > 0) {
        const diagnoses = dto.diagnoses.map((d) =>
          manager.create(AdmissionDiagnosis, {
            ...d,
            admission_record_id: savedAdmission.id,
          }),
        );
        await manager.save(AdmissionDiagnosis, diagnoses);
      }

      return this.findOneAdmission(savedAdmission.id, manager);
    });
  }

  async findAllAdmissions(): Promise<Admission[]> {
    return this.admissionRepo.find({
      relations: {
        patient: true,
        admission_diagnosis: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOneAdmission(
    id: string,
    manager: EntityManager = this.entityManager,
  ): Promise<Admission> {
    const admission = await manager.findOne(Admission, {
      where: { id },
      relations: {
        patient: true,
        admission_diagnosis: true,
      },
    });
    if (!admission) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }
    return admission;
  }

  async updateAdmission(
    id: string,
    dto: UpdateAdmissionDto,
  ): Promise<Admission> {
    return this.entityManager.transaction(async (manager) => {
      const admission = await this.findOneAdmission(id, manager);

      if (dto.admission_date) admission.admission_date = dto.admission_date;
      if (dto.consult_reason) admission.consult_reason = dto.consult_reason;
      if (dto.current_condition)
        admission.current_condition = dto.current_condition;
      if (dto.background) admission.background = dto.background;
      if (dto.admission_exam) admission.admission_exam = dto.admission_exam;

      await manager.save(Admission, admission);

      if (dto.diagnoses) {
        await manager.delete(AdmissionDiagnosis, { admission_record_id: id });
        if (dto.diagnoses.length > 0) {
          const diagnoses = dto.diagnoses.map((d) =>
            manager.create(AdmissionDiagnosis, {
              ...d,
              admission_record_id: id,
            }),
          );
          await manager.save(AdmissionDiagnosis, diagnoses);
        }
      }

      return this.findOneAdmission(id, manager);
    });
  }

  async removeAdmission(id: string): Promise<void> {
    return this.entityManager.transaction(async (manager) => {
      const admission = await this.findOneAdmission(id, manager);

      // Manually delete discharge if exists because cascade is not configured on the Discharge side in entities
      const discharge = await manager.findOne(Discharges, {
        where: { admission_record_id: id },
      });
      if (discharge) {
        await manager.remove(Discharges, discharge);
      }

      // Admissions and evolutions should be cascaded by DB or we can manually delete them just in case
      await manager.delete(HospitalEvolution, { admission_record_id: id });

      await manager.remove(Admission, admission);
    });
  }

  // --- Hospital Evolution ---

  async createEvolution(
    dto: CreateHospitalEvolutionDto,
  ): Promise<HospitalEvolution> {
    // Check if admission exists
    await this.findOneAdmission(dto.admission_record_id);

    const evolution = this.evolutionRepo.create({
      admission_record_id: dto.admission_record_id,
      description: dto.description,
    });
    return this.evolutionRepo.save(evolution);
  }

  async findAllEvolutions(admissionId: string): Promise<HospitalEvolution[]> {
    return this.evolutionRepo.find({
      where: { admission_record_id: admissionId },
      order: { created_at: 'ASC' },
    });
  }

  async findOneEvolution(id: string): Promise<HospitalEvolution> {
    const evolution = await this.evolutionRepo.findOne({ where: { id } });
    if (!evolution) {
      throw new NotFoundException(`Evolution with ID ${id} not found`);
    }
    return evolution;
  }

  async updateEvolution(
    id: string,
    dto: UpdateHospitalEvolutionDto,
  ): Promise<HospitalEvolution> {
    const evolution = await this.findOneEvolution(id);
    if (dto.description) {
      evolution.description = dto.description;
    }
    return this.evolutionRepo.save(evolution);
  }

  async removeEvolution(id: string): Promise<void> {
    const evolution = await this.findOneEvolution(id);
    await this.evolutionRepo.remove(evolution);
  }

  // --- Discharge & Discharge Diagnosis ---

  async createDischarge(dto: CreateDischargeDto): Promise<Discharges> {
    return this.entityManager.transaction(async (manager) => {
      // Verify admission
      await this.findOneAdmission(dto.admission_record_id, manager);

      const discharge = manager.create(Discharges, {
        admission_record_id: dto.admission_record_id,
        discharge_date: dto.discharge_date,
        discharge_exam: dto.discharge_exam,
        morbility_status: dto.morbility_status,
        treatment_plan: dto.treatment_plan,
      });
      const savedDischarge = await manager.save(Discharges, discharge);

      if (dto.diagnoses && dto.diagnoses.length > 0) {
        const diagnoses = dto.diagnoses.map((d) =>
          manager.create(DischargeDiagnosis, {
            ...d,
            discharge_record_id: savedDischarge.id,
          }),
        );
        await manager.save(DischargeDiagnosis, diagnoses);
      }

      return this.findOneDischarge(savedDischarge.id, manager);
    });
  }

  async findAllDischarges(): Promise<Discharges[]> {
    return this.dischargeRepo.find({
      relations: {
        discharges_diagnosis: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOneDischarge(
    id: string,
    manager: EntityManager = this.entityManager,
  ): Promise<Discharges> {
    const discharge = await manager.findOne(Discharges, {
      where: { id },
      relations: {
        discharges_diagnosis: true,
      },
    });
    if (!discharge) {
      throw new NotFoundException(`Discharge with ID ${id} not found`);
    }
    return discharge;
  }

  async updateDischarge(
    id: string,
    dto: UpdateDischargeDto,
  ): Promise<Discharges> {
    return this.entityManager.transaction(async (manager) => {
      const discharge = await this.findOneDischarge(id, manager);

      if (dto.discharge_date) discharge.discharge_date = dto.discharge_date;
      if (dto.discharge_exam) discharge.discharge_exam = dto.discharge_exam;
      if (dto.morbility_status !== undefined)
        discharge.morbility_status = dto.morbility_status;
      if (dto.treatment_plan) discharge.treatment_plan = dto.treatment_plan;

      await manager.save(Discharges, discharge);

      if (dto.diagnoses) {
        await manager.delete(DischargeDiagnosis, { discharge_record_id: id });
        if (dto.diagnoses.length > 0) {
          const diagnoses = dto.diagnoses.map((d) =>
            manager.create(DischargeDiagnosis, {
              ...d,
              discharge_record_id: id,
            }),
          );
          await manager.save(DischargeDiagnosis, diagnoses);
        }
      }

      return this.findOneDischarge(id, manager);
    });
  }

  async removeDischarge(id: string): Promise<void> {
    const discharge = await this.findOneDischarge(id);
    await this.dischargeRepo.remove(discharge);
  }
}
