import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClinicalRecord } from '../../clinical-records/entities/clinical_record.entity';

export enum Sexo {
  MASCULINO = 'M',
  FEMENINO = 'F',
}

@Entity({ name: 'patient' })
export class Patient {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  /**
   * Cédula de identidad — identidad única e irrepetible del paciente.
   * Se usa como identificador principal de negocio.
   */
  @Index('IDX_patient_cedula', { unique: true })
  @Column({
    name: 'cedula',
    type: 'varchar',
    length: 12,
    unique: true,
    nullable: false,
    comment: 'Cédula de identidad venezolana. Ej: 12345678',
  })
  cedula: string;

  /**
   * Número de historia clínica asignado manualmente por el médico.
   * Puede ser nulo en la base de datos actual.
   */
  @Column({
    name: 'numero_historia',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Número de historia clínica asignado manualmente por el médico.',
  })
  numero_historia: string | null;

  @Column({
    name: 'nombres',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  nombres: string;

  @Column({
    name: 'apellidos',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  apellidos: string;

  @Column({
    name: 'sexo',
    type: 'enum',
    enum: Sexo,
    nullable: false,
  })
  sexo: Sexo;

  /**
   * Año de nacimiento desglosado (int2 en Postgres)
   */
  @Column({
    name: 'birth_year',
    type: 'smallint',
    nullable: true,
  })
  birth_year: number | null;

  /**
   * Mes de nacimiento desglosado (int2 en Postgres)
   */
  @Column({
    name: 'birth_month',
    type: 'smallint',
    nullable: true,
  })
  birth_month: number | null;

  /**
   * Día de nacimiento desglosado (int2 en Postgres)
   */
  @Column({
    name: 'birth_day',
    type: 'smallint',
    nullable: true,
  })
  birth_day: number | null;

  @OneToMany(() => ClinicalRecord, (record) => record.patient, {
    cascade: true,
  })
  clinical_records: ClinicalRecord[];
}
