import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Mutuelle } from "./Mutuelle";
import { Dossier } from "./Dossier";

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    contenu!: string;

    @Column()
    estLu!: boolean;

    @Column()
    estEnvoyeParMutuelle!: boolean;

    @ManyToOne(() => Mutuelle, mutuelle => mutuelle.messages)
    mutuelle!: Mutuelle;

    @ManyToOne(() => Dossier, dossier => dossier.messages)
    dossier!: Dossier;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 