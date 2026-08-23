import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

export enum Modules {
  CLINICAL_RECORDS = 'clinical_records',
  PATIENTS = 'patients',
  STATISTICS = 'statistics',
}
@Entity({ name: 'profile_permisions' })
export class ProfilePermisions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Modules,
  })
  module: Modules;

  @Column({ type: 'uuid' })
  profile_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Profile, (profile) => profile.profile_permisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
