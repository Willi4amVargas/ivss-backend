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

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    // Normalizar la cédula a mayúsculas y sin guión para comparación interna
    const cedulaNormalizada = dto.cedula.toUpperCase().replace('-', '');

    // Verificar unicidad de cédula
    const existingByCedula = await this.patientRepository.findOne({
      where: { cedula: cedulaNormalizada },
    });
    if (existingByCedula) {
      throw new ConflictException(
        `Ya existe un paciente registrado con la cédula ${dto.cedula}.`,
      );
    }

    const patient = this.patientRepository.create({
      ...dto,
      cedula: cedulaNormalizada,
    });

    return this.patientRepository.save(patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: { clinical_records: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con ID "${id}" no encontrado en el sistema.`,
      );
    }
    return patient;
  }

  async findByCedula(cedula: string): Promise<Patient> {
    const cedulaNormalizada = cedula.toUpperCase().replace('-', '');
    const patient = await this.patientRepository.findOne({
      where: { cedula: cedulaNormalizada },
      relations: { clinical_records: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con cédula "${cedula}" no encontrado en el sistema.`,
      );
    }
    return patient;
  }

  async searchByCedula(cedula: string): Promise<Patient[]> {
    const cedulaNormalizada = cedula.toUpperCase().replace('-', '');
    const patients = await this.patientRepository.find({
      where: {
        // 4. Aplicamos el operador Like con los comodines %
        cedula: Like(`%${cedulaNormalizada}%`),
      },
      relations: { clinical_records: true },
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
    if (dto.cedula) {
      const cedulaNormalizada = dto.cedula.toUpperCase().replace('-', '');
      const existing = await this.patientRepository.findOne({
        where: { cedula: cedulaNormalizada },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `La cédula ${dto.cedula} ya está asignada a otro paciente.`,
        );
      }
      dto.cedula = cedulaNormalizada;
    }

    // if (dto.numero_historia) {
    //   const existing = await this.patientRepository.findOne({
    //     where: { numero_historia: dto.numero_historia },
    //   });
    //   if (existing && existing.id !== id) {
    //     throw new ConflictException(
    //       `El número de historia "${dto.numero_historia}" ya está asignado a otro paciente.`,
    //     );
    //   }
    // }

    Object.assign(patient, {
      ...dto,
    });

    return this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }
}
