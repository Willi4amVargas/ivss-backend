import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull, FindManyOptions } from 'typeorm';
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
import { PaginationQueryParamsDto } from '../utils/pagination/pagination.dto';
import { PaginationMeta } from '../utils/pagination/pagination.meta';

@Injectable()
export class ClinicalRecordsService {
  constructor(
    private dataSource: DataSource,
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
    private readonly patientsService: PatientsService,
  ) {}

  // --- Admission & Admission Diagnosis ---
  async createAdmission(dto: CreateAdmissionDto) {
    // Validate patient exists
    const patientExist = await this.patientsService.findOne(dto.patient_id);

    if (!patientExist) {
      throw new NotFoundException('El paciente no existe');
    }
    const admisionsIds = patientExist.admissions.map((e) => e.id);
    // Comprobamos que el paciente NO tenga ya una admision registrada, SIN una ALTA
    const dischargeCount = await this.dischargeRepo.count({
      where: {
        admission_id: In(admisionsIds),
      },
    });

    if (dischargeCount !== admisionsIds.length) {
      throw new ConflictException(
        'El paciente ya cuenta con una admisión activa y no ha sido dado de alta',
      );
    }

    // Lo hacemos una variable para convertirlo en un objeto tipo Date de una vez si existe
    let admisionDate = dto.admission_date;
    if (admisionDate) {
      const actualDate = new Date();
      admisionDate = new Date(admisionDate);
      if (admisionDate > actualDate) {
        throw new BadRequestException(
          'La fecha de la admision no puede ser mayor a la fecha actual',
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const admission = queryRunner.manager.create(Admission, {
        patient_id: dto.patient_id,
        admission_date: admisionDate,
        consult_reason: dto.consult_reason,
        current_condition: dto.current_condition,
        background: dto.background,
        admission_exam: dto.admission_exam,
      });
      const savedAdmission = await queryRunner.manager.save(
        Admission,
        admission,
      );

      const savedDiagnosis = await Promise.all(
        dto.diagnoses.map(async (diagnose) => {
          const dg = queryRunner.manager.create(AdmissionDiagnosis, {
            admission_id: savedAdmission.id,
            code: diagnose.code,
            title: diagnose.title,
            description: diagnose.description,
          });
          const { admission_id, ...otherDiagnosisData } =
            await queryRunner.manager.save(AdmissionDiagnosis, dg);
          return otherDiagnosisData;
        }),
      );

      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return { ...savedAdmission, diagnosis: savedDiagnosis };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllAdmissions(
    status: boolean = false,
    pagination: PaginationQueryParamsDto,
  ) {
    const skip = pagination.limit * (pagination.page - 1);
    const cacheKey = `admissions_page_${pagination.page}_limit_${pagination.limit}_status_${status}`;
    const findManyOptions: FindManyOptions<Admission> = status
      ? {
          relations: {
            patient: true,
            admission_diagnosis: true,
            discharge: true,
          },
          select: {
            admission_diagnosis: {
              id: true,
              code: true,
              title: true,
              description: true,
            },
          },
          order: { created_at: 'DESC' },
          take: pagination.limit,
          skip: skip,
          cache: {
            id: cacheKey,
            milliseconds: 86400000,
          },
        }
      : {
          relations: {
            patient: true,
            admission_diagnosis: true,
            discharge: true,
          },
          select: {
            admission_diagnosis: {
              id: true,
              code: true,
              title: true,
              description: true,
            },
          },
          where: {
            discharge: {
              id: IsNull(),
            },
          },
          order: { created_at: 'DESC' },
          take: pagination.limit,
          skip: skip,
          cache: {
            id: cacheKey,
            milliseconds: 86400000,
          },
        };
    const [admissions, total] = await this.admissionRepo.findAndCount({
      ...findManyOptions,
    });

    return {
      data: admissions,
      meta: PaginationMeta({
        currentCount: admissions.length,
        queryParams: pagination,
        totalCount: total,
      }),
    };
  }

  async findOneAdmission(id: string) {
    const admission = await this.admissionRepo.findOne({
      where: { id },
      relations: {
        patient: true,
        admission_diagnosis: true,
        discharge: {
          discharges_diagnosis: true,
        },
      },
      select: {
        admission_diagnosis: {
          id: true,
          code: true,
          title: true,
          description: true,
        },
        discharge: {
          id: true,
          discharge_exam: true,
          morbility_status: true,
          treatment_plan: true,
          created_at: true,
          updated_at: true,
          discharges_diagnosis: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
        },
      },
      cache: {
        id: `admission_${id}`,
        milliseconds: 86400000,
      },
    });
    if (!admission) {
      throw new NotFoundException(`Admission with ID ${id} not found`);
    }

    return { ...admission };
  }

  async updateAdmission(id: string, dto: UpdateAdmissionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { diagnoses, ...admissionData } = dto;

      const updatedAdmission = await queryRunner.manager.update(Admission, id, {
        admission_date: admissionData.admission_date,
        admission_exam: admissionData.admission_exam,
        background: admissionData.background,
        consult_reason: admissionData.consult_reason,
        current_condition: admissionData.current_condition,
        updated_at: new Date(),
      });

      if (diagnoses) {
        for (const dg of diagnoses) {
          const { id: diagnosisId, ...diagnosisData } = dg;
          await queryRunner.manager.upsert(
            AdmissionDiagnosis,
            {
              id: dg.id,
              admission_id: id,
              code: diagnosisData.code,
              description: diagnosisData.description,
              title: diagnosisData.title,
            },
            ['id'],
          );
        }
      }
      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return updatedAdmission;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeAdmission(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const admission = await this.findOneAdmission(id);
      const discharge = await queryRunner.manager.findOne(Discharges, {
        where: { admission_id: id },
      });
      if (discharge) {
        await queryRunner.manager.remove(Discharges, discharge);
      }
      await queryRunner.manager.delete(HospitalEvolution, { admission_id: id });
      const deletedAdmission = await queryRunner.manager.remove(
        Admission,
        admission,
      );
      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return deletedAdmission;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeAdmissionDiagnose(id: string) {
    await this.dataSource.queryResultCache?.clear();
    return this.admissionDiagnosisRepo.delete({
      id,
    });
  }

  // --- Hospital Evolution ---
  async createEvolution(dto: CreateHospitalEvolutionDto) {
    await this.findOneAdmission(dto.admission_id);

    const evolution = this.evolutionRepo.create({
      admission_id: dto.admission_id,
      description: dto.description,
    });
    const savedEvolution = await this.evolutionRepo.save(evolution);
    await this.dataSource.queryResultCache?.clear();
    return savedEvolution;
  }

  async findAllEvolutions(admissionId: string): Promise<HospitalEvolution[]> {
    return this.evolutionRepo.find({
      where: { admission_id: admissionId },
      order: { created_at: 'ASC' },
      cache: {
        id: `admission_evolutions_${admissionId}`,
        milliseconds: 86400000,
      },
    });
  }

  async findOneEvolution(id: string): Promise<HospitalEvolution> {
    const evolution = await this.evolutionRepo.findOne({
      where: { id },
      cache: { id: `evolution_${id}`, milliseconds: 86400000 },
    });
    if (!evolution) {
      throw new NotFoundException(`Evolution with ID ${id} not found`);
    }
    return evolution;
  }

  async updateEvolution(id: string, dto: UpdateHospitalEvolutionDto) {
    const evolutionUpdated = await this.evolutionRepo.update(id, {
      description: dto.description,
    });
    await this.dataSource.queryResultCache?.clear();
    return evolutionUpdated;
  }

  async removeEvolution(id: string) {
    const deleteEvolution = await this.evolutionRepo.delete({
      id,
    });
    await this.dataSource.queryResultCache?.clear();
    return deleteEvolution;
  }

  // --- Discharge & Discharge Diagnosis ---
  async createDischarge(dto: CreateDischargeDto) {
    const admission = await this.findOneAdmission(dto.admission_id);

    // la fecha del alta no puede ser menor a la fecha de ingreso
    let dischargeDate = dto.discharge_date;
    if (dischargeDate) {
      const actualDate = new Date();
      dischargeDate = new Date(dischargeDate);
      if (dischargeDate > actualDate) {
        throw new BadRequestException(
          'La fecha del alta no puede ser mayor a la fecha actual',
        );
      }
      if (admission.admission_date > dischargeDate) {
        throw new BadRequestException(
          'La fecha del alta no puede ser menor a la fecha de ingreso',
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // comprobamos que la admision pasada no tenga ya una alta, por ahora que lo haga la db :D (terrible error)
      const discharge = queryRunner.manager.create(Discharges, {
        admission_id: dto.admission_id,
        discharge_date: dischargeDate,
        discharge_exam: dto.discharge_exam,
        morbility_status: dto.morbility_status,
        treatment_plan: dto.treatment_plan,
      });
      const saveDischarge = await queryRunner.manager.save(discharge);

      const savedDiagnosis = await Promise.all(
        dto.diagnoses.map(async (diagnose) => {
          const dg = queryRunner.manager.create(DischargeDiagnosis, {
            discharge_id: saveDischarge.id,
            code: diagnose.code,
            title: diagnose.title,
            description: diagnose.description,
          });
          const { discharge_id, ...otherDiagnosisData } =
            await queryRunner.manager.save(DischargeDiagnosis, dg);
          return otherDiagnosisData;
        }),
      );
      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return { ...saveDischarge, diagnosis: savedDiagnosis };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error?.code === '23505') {
        throw new ConflictException(
          'Esta admisión ya tiene un alta médica registrada.',
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllDischarges(pagination: PaginationQueryParamsDto) {
    const skip = pagination.limit * (pagination.page - 1);
    const cacheKey = `admissions_page_${pagination.page}_limit_${pagination.limit}`;
    const [discharges, total] = await this.dischargeRepo.findAndCount({
      relations: {
        discharges_diagnosis: true,
        admission: {
          patient: true,
        },
      },
      select: {
        discharges_diagnosis: {
          id: true,
          code: true,
          title: true,
          description: true,
        },
      },
      order: { created_at: 'DESC' },
      take: pagination.limit,
      skip,
      cache: {
        id: cacheKey,
        milliseconds: 86400000,
      },
    });
    return {
      data: discharges,
      meta: PaginationMeta({
        currentCount: discharges.length,
        queryParams: pagination,
        totalCount: total,
      }),
    };
  }

  async findOneDischarge(id: string) {
    const discharge = await this.dischargeRepo.findOne({
      where: { id },
      relations: {
        admission: {
          admission_diagnosis: true,
        },
        discharges_diagnosis: true,
      },
      select: {
        admission: {
          admission_diagnosis: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
        },
        discharges_diagnosis: {
          id: true,
          code: true,
          title: true,
          description: true,
        },
      },
      cache: {
        id: `discharge_${id}`,
        milliseconds: 86400000,
      },
    });
    if (!discharge) {
      throw new NotFoundException(`Discharge with ID ${id} not found`);
    }
    return discharge;
  }

  async updateDischarge(id: string, dto: UpdateDischargeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const updateDischarge = await queryRunner.manager.update(
        Discharges,
        {
          id,
        },
        {
          discharge_date: dto.discharge_date,
          discharge_exam: dto.discharge_exam,
          morbility_status: dto.morbility_status,
          treatment_plan: dto.treatment_plan,
        },
      );
      if (dto.diagnoses) {
        await Promise.all(
          dto.diagnoses.map((dg) =>
            queryRunner.manager.update(
              DischargeDiagnosis,
              {
                id: dg.id,
              },
              {
                code: dg.code,
                title: dg.title,
                description: dg.description,
              },
            ),
          ),
        );
      }

      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return updateDischarge;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeDischarge(id: string) {
    const deleteDischarge = await this.dischargeRepo.delete({
      id,
    });
    await this.dataSource.queryResultCache?.clear();
    return deleteDischarge;
  }

  async removeDischargeDiagnose(id: string) {
    await this.dataSource.queryResultCache?.clear();
    return this.dischargeDiagnosisRepo.delete({
      id,
    });
  }
}
