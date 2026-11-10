import { DataSource } from "typeorm"

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas
    for (const entity of entities) {
        await connection.query(
            `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
        )
    }
}

export const isJWT = (token: string | null | undefined): boolean => {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
    return !!token && jwtRegex.test(token)
}
