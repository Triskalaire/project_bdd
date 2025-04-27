// src/entities/Dossier.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
import { Assure }       from './Assure';
import { Justificatif } from './Justificatif';
import { Message }      from './Message';

@Entity('dossiers')
export class Dossier {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    numeroDossier!: string;

    @Column()
    description!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    montantTotal!: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    montantRembourse!: number;

    @Column({ default: 'EN_ATTENTE' })
    statut!: string;

    @Column()
    typeSoin!: string;

    @ManyToOne(() => Assure, assure => assure.dossiers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assureId' })
    assure!: Assure;

    @OneToMany(() => Justificatif, j => j.dossier, { cascade: ['remove'], onDelete: 'CASCADE' })
    justificatifs!: Justificatif[];

    @OneToMany(() => Message, m => m.dossier, { cascade: ['remove'], onDelete: 'CASCADE' })
    messages!: Message[];

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
}
