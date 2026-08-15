import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity({ name: 'hospital_evolution' })
export class HospitalEvolution {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'admission_id', type: 'uuid', nullable: false })
  admission_id: string;

  @Column({
    name: 'description',
    nullable: false,
  })
  description: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => Admission, (record) => record, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admission_id' })
  admission: Admission;
}
