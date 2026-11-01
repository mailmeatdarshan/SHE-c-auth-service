import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstname: string

    @Column()
    lastname: string

    @Column({ unique: true })
    email: string

    @Column()
    password: string

    @Column()
    role: string
}
