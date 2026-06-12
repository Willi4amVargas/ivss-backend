import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { HistoryNumber } from './entities/history_number.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(HistoryNumber)
    private readonly historyNumberRepository: Repository<HistoryNumber>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    // Verificar unicidad de cédula
    const existingByCedula = await this.patientRepository.findOne({
      where: { document_id: dto.document_id },
    });
    if (existingByCedula) {
      throw new ConflictException(
        `Ya existe un paciente registrado con la cédula ${dto.document_id}.`,
      );
    }
    const { history_numbers, ...otherDto } = dto;

    const patient = this.patientRepository.create({
      ...otherDto,
    });

    const createdPatient = await this.patientRepository.save(patient);

    if (history_numbers) {
      const patientId = createdPatient.id;

      const historyNumbers = history_numbers.map((hn) =>
        this.historyNumberRepository.create({
          patient_id: patientId,
          history_number: hn,
        }),
      );
      await this.historyNumberRepository.save(historyNumbers);
    }

    return createdPatient;
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { status: true },
      order: { lastnames: 'ASC', names: 'ASC' },
      relations: { history_numbers: true },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: { clinical_records: true, history_numbers: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con ID "${id}" no encontrado en el sistema.`,
      );
    }
    return patient;
  }

  async findByCedula(cedula: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { document_id: cedula },
      relations: { clinical_records: true, history_numbers: true },
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
      relations: { clinical_records: true, history_numbers: true },
      order: { lastnames: 'ASC', names: 'ASC' },
    });
    if (!patients || patients.length === 0) {
      throw new NotFoundException(
        `No se encontraron pacientes con la cédula similar a "${cedula}".`,
      );
    }
    return patients;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);

    // Si se actualiza la cédula, verificar que no exista en otro paciente
    if (dto.document_id) {
      const existing = await this.patientRepository.findOne({
        where: { document_id: dto.document_id },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `La cédula ${dto.document_id} ya está asignada a otro paciente.`,
        );
      }
    }

    const updatedPatient = { ...patient, ...dto, updated_at: new Date() };

    // quitamos history_numbers del objeto final
    const { history_numbers, ...otherUpdatedPatient } = updatedPatient;

    for (const hn of history_numbers) {
      if (typeof hn === 'string') {
        const historyNumberAdd = this.historyNumberRepository.create({
          patient_id: id,
          history_number: hn,
        });
        await this.historyNumberRepository.save(historyNumberAdd);
      }
    }

    const updatedFinalPatient =
      await this.patientRepository.save(otherUpdatedPatient);

    return updatedFinalPatient;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.update(patient.id, { status: false });
    return;
  }
}
