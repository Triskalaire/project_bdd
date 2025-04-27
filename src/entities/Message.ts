// src/entities/Message.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
import { Assure } from './Assure';
import { Dossier } from './Dossier';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    contenu!: string;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;

    @ManyToOne(() => Assure, assure => assure.messages, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'assureId' })
    assure!: Assure;

    @ManyToOne(() => Dossier, dossier => dossier.messages, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'dossierId' })
    dossier!: Dossier;
}
