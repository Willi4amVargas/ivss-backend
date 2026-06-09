import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Diagnosis } from './diagnosis.entity';

@Entity({ name: 'clinical_record' })
@Check('CHK_fechas_coherentes', '"fecha_egreso" IS NULL OR "fecha_egreso" >= "fecha_ingreso"')
export class ClinicalRecord {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'fecha_ingreso',
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Fecha y hora de ingreso del paciente a hospitalización.',
  })
  fecha_ingreso: Date;

  @Column({
    name: 'fecha_egreso',
    type: 'timestamp with time zone',
    nullable: true,
    default: null,
    comment: 'Fecha y hora de egreso. NULL mientras el paciente sigue hospitalizado.',
  })
  fecha_egreso: Date | null;

  /**
   * Calculado automáticamente en el service al registrar/actualizar el egreso.
   * Se almacena estáticamente para garantizar la integridad estadística histórica.
   */
  @Column({
    name: 'dias_hospitalizacion',
    type: 'integer',
    nullable: true,
    default: null,
    comment: 'Días entre ingreso y egreso. Calculado y fijado estáticamente al registrar el egreso.',
  })
  dias_hospitalizacion: number | null;

  /**
   * Edad calculada estáticamente al momento del ingreso.
   * No debe recalcularse nunca; representa la edad epidemiológica del evento.
   */
  @Column({
    name: 'edad_ingreso',
    type: 'smallint',
    nullable: false,
    comment: 'Edad del paciente en años completos al momento exacto del ingreso. Fijada estáticamente.',
  })
  edad_ingreso: number;

  @Column({
    name: 'estatus_mortalidad',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'TRUE si el paciente falleció durante esta hospitalización.',
  })
  estatus_mortalidad: boolean;

  // ─── Relaciones ───────────────────────────────────────────────────────────

  @Index('IDX_clinical_record_patient_id')
  @Column({ name: 'patient_id', type: 'uuid', nullable: false })
  patient_id: string;

  @ManyToOne(() => Patient, (patient) => patient.clinical_records, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @OneToMany(() => Diagnosis, (diagnosis) => diagnosis.clinical_record, {
    cascade: true,
    eager: false,
  })
  diagnoses: Diagnosis[];
}
