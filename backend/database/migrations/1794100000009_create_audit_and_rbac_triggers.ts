import { BaseSchema } from '@adonisjs/lucid/schema'

const TABLAS_AUDITABLES = [
  'usuarios',
  'personas',
  'proyectos',
  'grupos_pagos',
  'asignaciones',
  'solicitudes_pago',
  'deudas',
  'pagos',
  'prorrateos',
  'cajas_chicas',
  'vales_caja',
]

const TABLAS_FINANCIERAS_INMUTABLES_DELETE = [
  'solicitudes_pago',
  'deudas',
  'pagos',
  'prorrateos',
  'cajas_chicas',
  'vales_caja',
  'audit_logs',
]

const TABLAS_FINANCIERAS_RBAC = [
  'solicitudes_pago',
  'deudas',
  'pagos',
  'cajas_chicas',
  'vales_caja',
]

export default class extends BaseSchema {
  async up() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    // 1. Función de Auditoría Forense Automática (JSONB)
    this.schema.raw(`
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
        -- Permitir que controladores con auditoría de dominio explícita eviten duplicidad
        IF current_setting('app.skip_auto_audit', true) = 'true' THEN
          RETURN COALESCE(NEW, OLD);
        END IF;

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
    `)

    // 2. Función de Inmutabilidad Financiera (Bloqueo de DELETE físico y UPDATE en logs/prorrateos)
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_bloquear_mutacion_ilegal()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          RAISE EXCEPTION 'Violación de Inmutabilidad Financiera: No está permitido eliminar físicamente registros de la tabla %. Utilice el procedimiento de anulación justificada.', TG_TABLE_NAME;
        ELSIF TG_OP = 'UPDATE' THEN
          RAISE EXCEPTION 'Violación de Inmutabilidad Financiera: Los registros de la tabla % son estrictamente inmutables y no admiten modificaciones.', TG_TABLE_NAME;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3. Función de Segregación de Funciones RBAC a Nivel de Datos
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_validar_segregacion_rbac()
      RETURNS TRIGGER AS $$
      DECLARE
        v_ctx_user_id INTEGER;
        v_rol TEXT;
        v_new_json JSONB;
        v_uid INTEGER;
        v_col TEXT;
      BEGIN
        v_new_json := to_jsonb(NEW);

        -- 3.1 Validar usuario en contexto de sesión (si fue establecido por la capa de aplicación)
        v_ctx_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
        IF v_ctx_user_id IS NOT NULL THEN
          SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = v_ctx_user_id;
          IF v_rol = 'administrador' THEN
            RAISE EXCEPTION 'Violación de Segregación de Funciones: El rol Administrador no tiene autorización para operar transacciones financieras';
          END IF;
        END IF;

        -- 3.2 Validar que ningún campo de autoría financiera referencie a un usuario 'administrador'
        FOREACH v_col IN ARRAY ARRAY[
          'creado_por_id',
          'revisado_por_id',
          'usuario_id',
          'responsable_id',
          'tramitado_por_id',
          'aprobado_por_id',
          'anulado_por_id'
        ] LOOP
          IF (v_new_json->>v_col) IS NOT NULL THEN
            v_uid := (v_new_json->>v_col)::INTEGER;
            SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = v_uid;
            IF v_rol = 'administrador' THEN
              RAISE EXCEPTION 'Violación de Segregación de Funciones: El rol Administrador no tiene autorización para operar transacciones financieras';
            END IF;
          END IF;
        END LOOP;

        -- 3.3 Reglas específicas por tabla según matriz RBAC del documento técnico
        IF TG_TABLE_NAME = 'solicitudes_pago' THEN
          SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = NEW.creado_por_id;
          IF v_rol IS DISTINCT FROM 'generador' THEN
            RAISE EXCEPTION 'Violación RBAC: Solo un usuario con rol generador puede crear solicitudes de pago';
          END IF;

          IF NEW.revisado_por_id IS NOT NULL THEN
            SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = NEW.revisado_por_id;
            IF v_rol IS DISTINCT FROM 'receptor' THEN
              RAISE EXCEPTION 'Violación RBAC: Solo un usuario con rol receptor puede revisar, aprobar o rechazar solicitudes de pago';
            END IF;
          END IF;
        ELSIF TG_TABLE_NAME = 'pagos' THEN
          IF NEW.usuario_id IS NOT NULL THEN
            SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = NEW.usuario_id;
            IF v_rol IS DISTINCT FROM 'receptor' THEN
              RAISE EXCEPTION 'Violación RBAC: Solo un usuario con rol receptor puede registrar entregas de fondos (pagos)';
            END IF;
          END IF;
        ELSIF TG_TABLE_NAME = 'vales_caja' THEN
          IF NEW.aprobado_por_id IS NOT NULL THEN
            SELECT rol::TEXT INTO v_rol FROM usuarios WHERE id = NEW.aprobado_por_id;
            IF v_rol IS DISTINCT FROM 'receptor' THEN
              RAISE EXCEPTION 'Violación RBAC: Solo un usuario con rol receptor puede aprobar vales de caja chica';
            END IF;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 4. Adjuntar Triggers de Auditoría Forense
    for (const tabla of TABLAS_AUDITABLES) {
      this.schema.raw(`
        DROP TRIGGER IF EXISTS trg_audit_${tabla} ON ${tabla};
        CREATE TRIGGER trg_audit_${tabla}
        AFTER INSERT OR UPDATE OR DELETE ON ${tabla}
        FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();
      `)
    }

    // 5. Adjuntar Triggers de Inmutabilidad (Bloqueo de DELETE en tablas financieras y audit_logs)
    for (const tabla of TABLAS_FINANCIERAS_INMUTABLES_DELETE) {
      this.schema.raw(`
        DROP TRIGGER IF EXISTS trg_no_delete_${tabla} ON ${tabla};
        CREATE TRIGGER trg_no_delete_${tabla}
        BEFORE DELETE ON ${tabla}
        FOR EACH ROW EXECUTE FUNCTION fn_bloquear_mutacion_ilegal();
      `)
    }

    // Bloqueo adicional de UPDATE en audit_logs y prorrateos
    for (const tabla of ['audit_logs', 'prorrateos']) {
      this.schema.raw(`
        DROP TRIGGER IF EXISTS trg_no_update_${tabla} ON ${tabla};
        CREATE TRIGGER trg_no_update_${tabla}
        BEFORE UPDATE ON ${tabla}
        FOR EACH ROW EXECUTE FUNCTION fn_bloquear_mutacion_ilegal();
      `)
    }

    // 6. Adjuntar Triggers de Segregación RBAC en tablas financieras
    for (const tabla of TABLAS_FINANCIERAS_RBAC) {
      this.schema.raw(`
        DROP TRIGGER IF EXISTS trg_rbac_${tabla} ON ${tabla};
        CREATE TRIGGER trg_rbac_${tabla}
        BEFORE INSERT OR UPDATE ON ${tabla}
        FOR EACH ROW EXECUTE FUNCTION fn_validar_segregacion_rbac();
      `)
    }
  }

  async down() {
    if (this.db.dialect.name !== 'postgres') {
      return
    }

    for (const tabla of TABLAS_AUDITABLES) {
      this.schema.raw(`DROP TRIGGER IF EXISTS trg_audit_${tabla} ON ${tabla};`)
    }

    for (const tabla of TABLAS_FINANCIERAS_INMUTABLES_DELETE) {
      this.schema.raw(`DROP TRIGGER IF EXISTS trg_no_delete_${tabla} ON ${tabla};`)
    }

    for (const tabla of ['audit_logs', 'prorrateos']) {
      this.schema.raw(`DROP TRIGGER IF EXISTS trg_no_update_${tabla} ON ${tabla};`)
    }

    for (const tabla of TABLAS_FINANCIERAS_RBAC) {
      this.schema.raw(`DROP TRIGGER IF EXISTS trg_rbac_${tabla} ON ${tabla};`)
    }

    this.schema.raw(`DROP FUNCTION IF EXISTS fn_validar_segregacion_rbac() CASCADE;`)
    this.schema.raw(`DROP FUNCTION IF EXISTS fn_bloquear_mutacion_ilegal() CASCADE;`)
    this.schema.raw(`DROP FUNCTION IF EXISTS fn_auditar_cambios() CASCADE;`)
  }
}
