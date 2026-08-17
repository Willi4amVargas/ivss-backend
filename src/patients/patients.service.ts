import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { HistoryNumber } from './entities/history_number.entity';

@Injectable()
export class PatientsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(HistoryNumber)
    private readonly historyNumberRepository: Repository<HistoryNumber>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
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

      const patient = queryRunner.manager.create(Patient, otherDto);
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

      return createdPatient;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const patients = await this.patientRepository.find({
      where: { status: true },
      order: { lastnames: 'ASC', names: 'ASC' },
      relations: { history_numbers: true },
    });
    const finalPatients = patients.map((p) => {
      return {
        ...p,
        history_numbers: p.history_numbers.map((h) => h.history_number),
      };
    });
    return finalPatients;
  }

  async findOne(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: { admissions: true, history_numbers: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con ID "${id}" no encontrado en el sistema.`,
      );
    }
    const patientFormat = {
      ...patient,
      history_numbers: patient.history_numbers.map((h) => h.history_number),
    };
    return patientFormat;
  }

  async findByCedula(cedula: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { document_id: cedula },
      relations: { admissions: true, history_numbers: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con cédula "${cedula}" no encontrado en el sistema.`,
      );
    }
    return patient;
  }

  async searchByCedula(cedula: string): Promise<Patient[]> {
    const patients = await this.patientRepository.find({
      where: {
        document_id: Like(`%${cedula}%`),
        status: true,
      },
      relations: { history_numbers: true },
      order: { lastnames: 'ASC', names: 'ASC' },
    });
    if (!patients || patients.length === 0) {
      throw new NotFoundException(
        `No se encontraron pacientes con la cédula similar a "${cedula}".`,
      );
    }
    return patients;
  }

  async findByHistoryNumber(historia: string) {
    const patient = await this.patientRepository.findOne({
      where: {
        history_numbers: {
          history_number: historia,
        },
      },
      relations: {
        history_numbers: true,
      },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con numero de historia "${historia}" no encontrado en el sistema.`,
      );
    }
    return patient;
  }

  async searchByHistoryNumber(historia: string) {
    const patients = await this.patientRepository.find({
      where: {
        history_numbers: {
          history_number: Like(`%${historia}%`),
        },
      },
      relations: {
        history_numbers: true,
      },
    });
    if (!patients || patients.length === 0) {
      throw new NotFoundException(
        `No se encontraron pacientes con numero de historia similar a "${historia}".`,
      );
    }
    return patients;
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
        updated_at: new Date(),
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const patient = await queryRunner.manager.findOne(Patient, {
        where: { id },
      });
      if (!patient) {
        new NotFoundException(`No se encontraron pacientes con el id "${id}".`);
      }
      await queryRunner.manager.update(Patient, { id }, { status: false });
      await queryRunner.commitTransaction();
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeHistoryNumber(id: string, history: string) {
    try {
      const removeHistory = await this.historyNumberRepository.delete({
        patient_id: id,
        history_number: history,
      });
      return removeHistory;
    } catch (error) {
      throw error;
    }
  }
}
