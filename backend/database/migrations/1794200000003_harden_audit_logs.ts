import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Tablas cuya evidencia no se puede vaciar con TRUNCATE (ADR 0008). Coincide con
 * TABLAS_FINANCIERAS_INMUTABLES_DELETE de la migración 1794100000009.
 */
const TABLAS_SIN_TRUNCATE = [
  'solicitudes_pago',
  'deudas',
  'pagos',
  'prorrateos',
  'cajas_chicas',
  'vales_caja',
  'audit_logs',
]

/**
 * Cuerpo común de fn_auditar_cambios() a partir de la obtención del contexto de sesión.
 * Es idéntico en up() y down(); solo cambia si se antepone el bypass.
 */
const CUERPO_AUDITORIA = `
        v_usuario_id := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
        v_ip := NULLIF(current_setting('app.current_ip', true), '');

        IF TG_OP = 'INSERT' THEN
          v_datos_nuevos := to_jsonb(NEW) - 'password_hash';
          v_registro_id := (v_datos_nuevos->>'id')::INTEGER;
          v_accion := 'INSERT_' || UPPER(TG_TABLE_NAME);
        ELSIF TG_OP = 'UPDATE' THEN
          v_datos_anteriores := to_jsonb(OLD) - 'password_hash';
          v_datos_nuevos := to_jsonb(NEW) - 'password_hash';
          v_registro_id := (v_datos_nuevos->>'id')::INTEGER;
          v_accion := 'UPDATE_' || UPPER(TG_TABLE_NAME);
        ELSIF TG_OP = 'DELETE' THEN
          v_datos_anteriores := to_jsonb(OLD) - 'password_hash';
          v_registro_id := (v_datos_anteriores->>'id')::INTEGER;
          v_accion := 'DELETE_' || UPPER(TG_TABLE_NAME);
        END IF;

        -- Inferir autoría desde las columnas de la fila si no existe variable de sesión activa
        IF v_usuario_id IS NULL AND v_datos_nuevos IS NOT NULL THEN
          v_usuario_id := COALESCE(
            (v_datos_nuevos->>'anulado_por_id')::INTEGER,
            (v_datos_nuevos->>'revisado_por_id')::INTEGER,
            (v_datos_nuevos->>'aprobado_por_id')::INTEGER,
            (v_datos_nuevos->>'usuario_id')::INTEGER,
            (v_datos_nuevos->>'creado_por_id')::INTEGER,
            (v_datos_nuevos->>'tramitado_por_id')::INTEGER,
            (v_datos_nuevos->>'responsable_id')::INTEGER
          );
        END IF;

        INSERT INTO audit_logs (
          usuario_id,
          accion,
          tabla_afectada,
          registro_id,
          datos_anteriores,
          datos_nuevos,
          direccion_ip,
          creado_en
        ) VALUES (
          v_usuario_id,
          v_accion,
          TG_TABLE_NAME,
          COALESCE(v_registro_id, 0),
          v_datos_anteriores,
          v_datos_nuevos,
          v_ip,
          NOW()
        );

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
`

const CABECERA_AUDITORIA = `
      CREATE OR REPLACE FUNCTION fn_auditar_cambios()
      RETURNS TRIGGER AS $$
      DECLARE
        v_usuario_id INTEGER;
        v_ip VARCHAR(45);
        v_datos_anteriores JSONB := NULL;
        v_datos_nuevos JSONB := NULL;
        v_registro_id INTEGER;
        v_accion VARCHAR(50);
      BEGIN
`

/**
 * Bypass que existía en la migración 1794100000009. Solo se usa en down() para
 * restaurar la función anterior (ADR 0007).
 */
const BYPASS_ANTERIOR = `
        -- Permitir que controladores con auditoría de dominio explícita eviten duplicidad
        IF current_setting('app.skip_auto_audit', true) = 'true' THEN
          RETURN COALESCE(NEW, OLD);
        END IF;
`

export default class extends BaseSchema {
  /**
   * Recrea la auditoría automática sin bypass (ADR 0007) y bloquea TRUNCATE en las
   * tablas inmutables con un trigger de sentencia (ADR 0008).
   */
  async up() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    // 1. Auditoría forense sin la variable de sesión app.skip_auto_audit
    this.schema.raw(CABECERA_AUDITORIA + CUERPO_AUDITORIA)

    // 2. Función que rechaza cualquier TRUNCATE (los triggers de fila no lo detectan)
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_bloquear_truncate()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Violación de Inmutabilidad Financiera: No está permitido truncar la tabla %.', TG_TABLE_NAME;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3. Triggers BEFORE TRUNCATE por sentencia en audit_logs y tablas financieras
    for (const tabla of TABLAS_SIN_TRUNCATE) {
      this.schema.raw(`
        DROP TRIGGER IF EXISTS trg_no_truncate_${tabla} ON ${tabla};
        CREATE TRIGGER trg_no_truncate_${tabla}
        BEFORE TRUNCATE ON ${tabla}
        FOR EACH STATEMENT EXECUTE FUNCTION fn_bloquear_truncate();
      `)
    }
  }

  /**
   * Quita el bloqueo de TRUNCATE y restaura fn_auditar_cambios() con el bypass, tal como
   * la dejó la migración 1794100000009.
   */
  async down() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    for (const tabla of TABLAS_SIN_TRUNCATE) {
      this.schema.raw(`DROP TRIGGER IF EXISTS trg_no_truncate_${tabla} ON ${tabla};`)
    }

    this.schema.raw(`DROP FUNCTION IF EXISTS fn_bloquear_truncate();`)

    this.schema.raw(CABECERA_AUDITORIA + BYPASS_ANTERIOR + CUERPO_AUDITORIA)
  }
}
