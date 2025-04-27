// src/entities/Assure.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';
import { Dossier } from './Dossier';
import { Message } from './Message';

@Entity('assures')
export class Assure {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    nom!: string;

    @Column()
    prenom!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    telephone!: string;

    @Column({ type: 'date' })
    dateNaissance!: Date;

    @Column()
    numeroSecuriteSociale!: string;

    @Column()
    numeroSecuriteSocialeHash!: string;

    @Column()
    iban!: string;

    @Column()
    ibanHash!: string;

    @Column()
    historiqueMedical!: string;

    @Column()
    historiqueMedicalHash!: string;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;

    @OneToMany(() => Dossier, dossier => dossier.assure, {
        cascade: ['remove'],
        onDelete: 'CASCADE'
    })
    dossiers!: Dossier[];

    @OneToMany(() => Message, message => message.assure, {
        cascade: ['remove'],
        onDelete: 'CASCADE'
    })
    messages!: Message[];
}
