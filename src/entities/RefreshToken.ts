import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    UpdateDateColumn,
    CreateDateColumn,
} from "typeorm"
import { User } from "./User.js"

@Entity({ name: "refreshTokens" })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamp" })
    expiresAt: Date

    @ManyToOne(() => User)
    user: User

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date
}
