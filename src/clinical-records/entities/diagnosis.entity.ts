import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ClinicalRecord } from './clinical_record.entity';

@Entity({ name: 'diagnosis' })
@Unique('UQ_diagnosis_record_orden', ['clinical_record_id', 'orden'])
@Check('CHK_diagnosis_orden_rango', '"orden" BETWEEN 1 AND 4')
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  /**
   * Código ICD-11 proveniente exclusivamente del servicio local de la OMS.
   * No se permite texto libre. Ej: "BA00"
   */
  @Column({
    name: 'icd_code',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Código ICD-11 validado. Origen exclusivo: API OMS local.',
  })
  icd_code: string;

  /**
   * Título oficial del diagnóstico según la OMS, en el idioma configurado.
   */
  @Column({
    name: 'icd_title',
    type: 'varchar',
    length: 500,
    nullable: false,
    comment:
      'Título oficial ICD-11 del diagnóstico. Origen exclusivo: API OMS local.',
  })
  icd_title: string;

  /**
   * Posición del diagnóstico dentro del ingreso (dx1, dx2, dx3, dx4).
   * Restricción CHECK garantiza el rango 1-4 a nivel de base de datos.
   * Restricción UNIQUE garantiza que no haya dos dx en la misma posición por ingreso.
   */
  @Column({
    name: 'orden',
    type: 'smallint',
    nullable: false,
    comment:
      'Posición del diagnóstico: 1 (principal), 2, 3, 4 (secundarios). Máximo 4 por ingreso.',
  })
  orden: number;

  // ─── Relaciones ───────────────────────────────────────────────────────────

  @Index('IDX_diagnosis_clinical_record_id')
  @Column({ name: 'clinical_record_id', type: 'uuid', nullable: false })
  clinical_record_id: string;

  @ManyToOne(() => ClinicalRecord, (record) => record.diagnoses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinical_record_id' })
  clinical_record: ClinicalRecord;
}
