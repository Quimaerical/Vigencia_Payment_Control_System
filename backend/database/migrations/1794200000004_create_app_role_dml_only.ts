import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Rol con el que se conecta la aplicación en ejecución (ADR 0017). Las migraciones se
 * ejecutan con el dueño de las tablas; este rol nunca es dueño de nada.
 */
const ROL_APP = 'vigencia_app'

/**
 * Privilegios del rol de la aplicación por tabla (ADR 0017). Solo DML: nunca TRUNCATE,
 * REFERENCES ni TRIGGER. Toda tabla nueva necesita su fila en una migración nueva; la prueba
 * rol_bd_aplicacion.spec.ts falla si falta. Sin acceso: adonis_schema,
 * adonis_schema_versions y users (heredada, sin uso).
 */
const PRIVILEGIOS_APP: Record<string, string> = {
  usuarios: 'SELECT, INSERT, UPDATE',
  personas: 'SELECT, INSERT, UPDATE',
  proyectos: 'SELECT, INSERT, UPDATE',
  grupos_pagos: 'SELECT, INSERT, UPDATE',
  asignaciones: 'SELECT, INSERT, UPDATE',
  solicitudes_pago: 'SELECT, INSERT, UPDATE',
  deudas: 'SELECT, INSERT, UPDATE',
  pagos: 'SELECT, INSERT, UPDATE',
  prorrateos: 'SELECT, INSERT, UPDATE',
  cajas_chicas: 'SELECT, INSERT, UPDATE',
  vales_caja: 'SELECT, INSERT, UPDATE',
  audit_logs: 'SELECT, INSERT',
  auth_access_tokens: 'SELECT, INSERT, UPDATE, DELETE',
  rate_limits: 'SELECT, INSERT, UPDATE, DELETE',
}

/**
 * Tablas con clave serial cuya secuencia necesita USAGE para insertar (rate_limits usa `key`).
 */
const TABLAS_CON_SECUENCIA = Object.keys(PRIVILEGIOS_APP).filter((t) => t !== 'rate_limits')

export default class extends BaseSchema {
  /**
   * Crea el rol de la aplicación sin LOGIN ni atributos privilegiados (si no existe) y le
   * concede solo el DML de la matriz (ADR 0017). El LOGIN y la contraseña los pone una
   * persona en cada entorno.
   */
  async up() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    // 1. Rol global del clúster: se crea una sola vez y sin capacidad de conectarse
    this.schema.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${ROL_APP}') THEN
          CREATE ROLE ${ROL_APP} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS;
        END IF;
      END
      $$;
    `)

    // 2. Puede resolver nombres en public, pero no crear objetos en él
    this.schema.raw(`
      GRANT USAGE ON SCHEMA public TO ${ROL_APP};
      REVOKE CREATE ON SCHEMA public FROM ${ROL_APP};
    `)

    // 3. Matriz de privilegios: se parte de cero en cada tabla para que sea exacta
    for (const [tabla, privilegios] of Object.entries(PRIVILEGIOS_APP)) {
      this.schema.raw(`
        REVOKE ALL ON ${tabla} FROM ${ROL_APP};
        GRANT ${privilegios} ON ${tabla} TO ${ROL_APP};
      `)
    }

    // 4. Secuencias de las claves serial: USAGE basta para nextval() en los INSERT
    for (const tabla of TABLAS_CON_SECUENCIA) {
      this.schema.raw(`GRANT USAGE ON SEQUENCE ${tabla}_id_seq TO ${ROL_APP};`)
    }
  }

  /**
   * Revoca los privilegios concedidos. No borra el rol: es global del clúster y otras
   * bases (vigencia_db, vigencia_test) pueden seguir usándolo.
   */
  async down() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    for (const tabla of TABLAS_CON_SECUENCIA) {
      this.schema.raw(`REVOKE ALL ON SEQUENCE ${tabla}_id_seq FROM ${ROL_APP};`)
    }

    for (const tabla of Object.keys(PRIVILEGIOS_APP)) {
      this.schema.raw(`REVOKE ALL ON ${tabla} FROM ${ROL_APP};`)
    }

    this.schema.raw(`REVOKE USAGE ON SCHEMA public FROM ${ROL_APP};`)
  }
}
