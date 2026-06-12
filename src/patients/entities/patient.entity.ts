import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HistoryNumber } from './history_number.entity';
import { Admission } from '../../clinical-records/entities/admission.entity';

export enum Genders {
  MALE = 'M',
  FEMALE = 'F',
}

@Entity({ name: 'patient' })
export class Patient {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  /**
   * Cédula de identidad — identidad única e irrepetible del paciente.
   * Se usa como identificador principal de negocio.
   */
  @Index('IDX_patient_document_id', { unique: true })
  @Column({
    name: 'document_id',
    type: 'varchar',
    length: 14,
    unique: true,
    nullable: false,
    comment: 'Cédula de identidad venezolana. Ej: 12345678',
  })
  document_id: string;

  @Column({
    name: 'names',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  names: string;

  @Column({
    name: 'lastnames',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  lastnames: string;

  @Column({
    name: 'address',
    type: 'varchar',
    nullable: true,
  })
  address: string;

  @Column({
    name: 'gender',
    type: 'enum',
    enum: Genders,
    nullable: false,
  })
  gender: Genders;

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

  @Column({
    name: 'status',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  status: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => HistoryNumber, (history) => history.patient)
  history_numbers: HistoryNumber[];

  @OneToMany(() => Admission, (admission) => admission.patient)
  admissions: Admission[];
}
