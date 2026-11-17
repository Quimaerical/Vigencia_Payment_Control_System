import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Invalida los access tokens emitidos antes de que existiera la expiración de 8 horas
 * (ADR 0003). Un token con expires_at NULL valdría para siempre.
 */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  /**
   * Borra los tokens sin fecha de expiración; sus dueños vuelven a iniciar sesión.
   */
  async up() {
    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('expires_at').delete()
    })
  }

  /**
   * Sin vuelta atrás: en BD solo estaba el hash, los tokens borrados no se pueden recrear.
   */
  async down() {
    // Intencionalmente vacío.
  }
}
