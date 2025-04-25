import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Mutuelle } from "./Mutuelle";
import { Assure } from "./Assure";
import { Message } from "./Message";
import { Justificatif } from "./Justificatif";

@Entity("dossiers")
export class Dossier {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    numeroDossier!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    montantTotal!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    montantRembourse!: number;

    @Column()
    statut!: "EN_ATTENTE" | "EN_COURS" | "ACCEPTE" | "REFUSE";

    @Column()
    typeSoin!: "OPTIQUE" | "DENTAIRE" | "HOSPITALISATION" | "AUTRE";

    @ManyToOne(() => Mutuelle, mutuelle => mutuelle.dossiers)
    mutuelle!: Mutuelle;

    @ManyToOne(() => Assure, assure => assure.dossiers)
    assure!: Assure;

    @OneToMany(() => Message, message => message.dossier)
    messages!: Message[];

    @OneToMany(() => Justificatif, justificatif => justificatif.dossier)
    justificatifs!: Justificatif[];

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 