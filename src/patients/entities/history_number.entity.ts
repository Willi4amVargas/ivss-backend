import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity({ name: 'history_number' })
export class HistoryNumber {
  @PrimaryColumn({ name: 'patient_id' })
  patient_id: string;

  @PrimaryColumn({
    name: 'history_number',
    type: 'varchar',
    length: 25,
    nullable: false,
    comment: 'Número de historia clínica asignado manualmente por el médico.',
  })
  history_number: string;

  @ManyToOne(() => Patient, (patient) => patient.history_numbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
