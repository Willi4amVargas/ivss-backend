import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { HistoryNumber } from './entities/history_number.entity';
import { PaginationQueryParamsDto } from '../utils/pagination/pagination.dto';
import { PaginationMeta } from '../utils/pagination/pagination.meta';
import { getCacheKeyByWhere } from '../utils/cache/getCacheKeyByWhere';

@Injectable()
export class PatientsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(HistoryNumber)
    private readonly historyNumberRepository: Repository<HistoryNumber>,
  ) {}

  async create(dto: CreatePatientDto, user_id: string): Promise<Patient> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingByCedula = await queryRunner.manager.findOne(Patient, {
        where: { document_id: dto.document_id },
      });

      if (existingByCedula) {
        throw new ConflictException(
          `Ya existe un paciente registrado con la cédula ${dto.document_id}.`,
        );
      }

      const { history_numbers, ...otherDto } = dto;

      const patient = queryRunner.manager.create(Patient, {
        document_id: otherDto.document_id,
        names: otherDto.names,
        lastnames: otherDto.lastnames,
        address: otherDto.address,
        gender: otherDto.gender,
        birth_year: otherDto.birth_year,
        birth_month: otherDto.birth_day,
        birth_day: otherDto.birth_day,
        status: otherDto.status,
        created_by: user_id,
      });
      const createdPatient = await queryRunner.manager.save(patient);

      if (history_numbers && history_numbers.length > 0) {
        const historyNumbers = history_numbers.map((hn) =>
          queryRunner.manager.create(HistoryNumber, {
            patient_id: createdPatient.id,
            history_number: hn,
          }),
        );

        await queryRunner.manager.save(historyNumbers);
      }

      await queryRunner.commitTransaction();
      await this.dataSource.queryResultCache?.clear();
      return createdPatient;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    pagination: PaginationQueryParamsDto,
    where?: FindOptionsWhere<Patient> | FindOptionsWhere<Patient>[] | undefined,
  ) {
    const skip = pagination.limit * (pagination.page - 1);
    const cacheKey = `patients_page_${pagination.page}_limit_${pagination.limit}${getCacheKeyByWhere(where)}`;
    const [patients, total] = await this.patientRepository.findAndCount({
      where,
      order: { lastnames: 'ASC', names: 'ASC', created_at: 'DESC' },
      relations: { history_numbers: true },
      take: pagination.limit,
      skip,
      cache: {
        id: cacheKey,
        milliseconds: 86400000,
      },
    });
    const finalPatients = patients.map((p) => {
      return {
        ...p,
        history_numbers: p.history_numbers.map((h) => h.history_number),
      };
    });
    return {
      data: finalPatients,
      meta: PaginationMeta({
        queryParams: pagination,
        totalCount: total,
        currentCount: patients.length,
      }),
    };
  }

  async findOne(
    where: FindOptionsWhere<Patient> | FindOptionsWhere<Patient>[] | undefined,
  ) {
    const cacheKey = `patient_${getCacheKeyByWhere(where)}`;
    const patient = await this.patientRepository.findOne({
      where,
      relations: { admissions: true, history_numbers: true },
      cache: {
        id: cacheKey,
        milliseconds: 86400000,
      },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con ${getCacheKeyByWhere(where)} no encontrado en el sistema.`,
      );
    }
    return {
      ...patient,
      history_numbers: patient.history_numbers.map((h) => h.history_number),
    };
  }

  async update(id: string, dto: UpdatePatientDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const patient = await queryRunner.manager.findOne(Patient, {
        where: { id },
      });

      if (!patient) {
        throw new NotFoundException(
          `No se encontraron pacientes con el id "${id}".`,
        );
      }

      if (dto.document_id) {
        const existing = await queryRunner.manager.findOne(Patient, {
          where: { document_id: dto.document_id },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `La cédula ${dto.document_id} ya está asignada a otro paciente.`,
          );
        }
      }

      const updatedPatient = await queryRunner.manager.update(Patient, id, {
        document_id: dto.document_id,
        names: dto.names,
        lastnames: dto.lastnames,
        address: dto.address,
        gender: dto.gender,
        birth_year: dto.birth_year,
        birth_month: dto.birth_month,
        status: dto.status,
      });

      if (dto.history_numbers) {
        for (const hn of dto.history_numbers) {
          if (typeof hn === 'string') {
            await queryRunner.manager.upsert(
              HistoryNumber,
              {
                patient_id: id,
                history_number: hn,
              },
              ['patient_id', 'history_number'],
            );
          }
        }
      }

      await this.dataSource.queryResultCache?.clear();
      await queryRunner.commitTransaction();
      return updatedPatient;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.patientRepository.update(
        {
          id,
        },
        {
          status: false,
        },
      );
      await this.dataSource.queryResultCache?.clear();
    } catch (error) {
      throw error;
    }
  }

  async removeHistoryNumber(id: string, history: string) {
    try {
      await this.historyNumberRepository.delete({
        patient_id: id,
        history_number: history,
      });
      await this.dataSource.queryResultCache?.clear();
      return;
    } catch (error) {
      throw error;
    }
  }
}
