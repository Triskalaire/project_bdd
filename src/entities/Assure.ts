import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Mutuelle } from "./Mutuelle";
import { Dossier } from "./Dossier";

@Entity("assures")
export class Assure {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    nom!: string;

    @Column()
    prenom!: string;

    @Column()
    email!: string;

    @Column()
    telephone!: string;

    @Column()
    dateNaissance!: Date;

    @Column({ select: false })
    numeroSecuriteSociale!: string;

    @Column()
    numeroSecuriteSocialeHash!: string;

    @Column({ select: false })
    iban!: string;

    @Column()
    ibanHash!: string;

    @Column({ type: "text", select: false })
    historiqueMedical!: string;

    @Column({ type: "text" })
    historiqueMedicalHash!: string;

    @ManyToOne(() => Mutuelle, mutuelle => mutuelle.assures)
    mutuelle!: Mutuelle;

    @OneToMany(() => Dossier, dossier => dossier.assure)
    dossiers!: Dossier[];

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 