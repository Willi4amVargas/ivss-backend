import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admission } from './admission.entity';
import { User } from '../../users/entities/user.entity';

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
    name: 'date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  created_by: string;

  @ManyToOne(() => User, (user) => user.discharges, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @ManyToOne(() => Admission, (record) => record, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admission_id' })
  admission: Admission;
}
