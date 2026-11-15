import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Usuario from '#models/usuario'
import Persona from '#models/persona'
import Proyecto from '#models/proyecto'
import GrupoPago from '#models/grupo_pago'
import Asignacion from '#models/asignacion'
import SolicitudPago from '#models/solicitud_pago'
import Deuda from '#models/deuda'
import Pago from '#models/pago'
import CajaChica from '#models/caja_chica'
import ValeCaja from '#models/vale_caja'
import AuditLog from '#models/audit_log'
import {
  RolUsuario,
  AreaProyecto,
  AmbitoProyecto,
  PeriodicidadGrupoPago,
  EstadoSolicitud,
  EstadoDeuda,
  EstadoCajaChica,
  EstadoValeCaja,
  MetodoPago,
} from '@app/shared'

/**
 * Ejecuta una escritura que se espera rechazada por PostgreSQL dentro de un punto de
 * guardado (SAVEPOINT). Con la transacción global de la prueba, un error SQL fuera de un
 * punto de guardado deja la transacción abortada y todas las consultas siguientes fallan.
 * La acción debe usar el `trx` recibido para que su sentencia quede dentro del punto.
 */
async function enPuntoDeGuardado(
  accion: (trx: TransactionClientContract) => Promise<unknown>
): Promise<void> {
  await db.transaction(async (trx) => {
    await accion(trx)
  })
}

test.group('Modelo de Datos, Triggers PostgreSQL y Compatibilidad FIFO', (group) => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('verifica relaciones de modelos y auditoría forense automática en PostgreSQL', async ({
    assert,
  }) => {
    const sufijo = Date.now()

    const admin = await Usuario.create({
      username: `admin_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.ADMINISTRADOR,
      estaActivo: true,
    })

    const generador = await Usuario.create({
      username: `gen_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const receptor = await Usuario.create({
      username: `rec_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.RECEPTOR,
      estaActivo: true,
    })

    // Verificar que el trigger auditó la creación del usuario sin exponer password_hash
    const auditAdmin = await AuditLog.query()
      .where('tabla_afectada', 'usuarios')
      .where('registro_id', admin.id)
      .first()

    assert.isNotNull(auditAdmin)
    assert.equal(auditAdmin!.accion, 'INSERT_USUARIOS')
    assert.isUndefined(auditAdmin!.datosNuevos?.password_hash)

    const persona = await Persona.create({
      identificacion: `V-${sufijo}`,
      nombres: 'María',
      apellidos: 'Investigadora',
      correo: `maria_${sufijo}@uc.edu.ve`,
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: `PROY-${sufijo}`,
      nombre: 'Síntesis Orgánica Avanzada',
      descripcion: 'Proyecto de química aplicada',
      area: AreaProyecto.QUIMICA,
      ambito: AmbitoProyecto.EXTERNO,
      fechaInicio: DateTime.now().minus({ days: 30 }),
      fechaFin: DateTime.now().plus({ days: 180 }),
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: `Quincenal-${sufijo}`,
      descripcion: 'Cortes 15 y 30',
      periodicidad: PeriodicidadGrupoPago.QUINCENAL,
      diaCorte1: 15,
      diaCorte2: 30,
      configuracionCorte: { dias: [15, 30] },
      estaActivo: true,
    })

    const asignacion = await Asignacion.create({
      personaId: persona.id,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      creadoPorId: generador.id,
      montoPeriodo: 120.0,
      fechaInicio: DateTime.now().minus({ days: 15 }),
      fechaFin: null,
      estaActivo: true,
    })

    const solicitud = await SolicitudPago.create({
      codigo: `SOL-${sufijo}`,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      periodoInicio: DateTime.now().minus({ days: 15 }),
      periodoFin: DateTime.now(),
      montoTotal: 120.0,
      estado: EstadoSolicitud.APROBACION,
      creadoPorId: generador.id,
      revisadoPorId: receptor.id,
      fechaEnvio: DateTime.now().minus({ hours: 5 }),
      fechaRevision: DateTime.now().minus({ hours: 1 }),
    })

    const cajaOrigen = await CajaChica.create({
      codigo: `CC-ORIG-${sufijo}`,
      nombre: 'Caja Mes Anterior',
      proyectoId: proyecto.id,
      cajaOrigenId: null,
      responsableId: generador.id,
      anio: 2026,
      mes: 10,
      saldoInicial: 0,
      montoAsignado: 200,
      saldoActual: 35,
      estado: EstadoCajaChica.CERRADA,
      fechaApertura: DateTime.now().minus({ days: 30 }),
      fechaCierre: DateTime.now().minus({ days: 1 }),
    })

    const cajaActual = await CajaChica.create({
      codigo: `CC-ACT-${sufijo}`,
      nombre: 'Caja Mes Actual con Arrastre',
      proyectoId: proyecto.id,
      cajaOrigenId: cajaOrigen.id,
      responsableId: generador.id,
      anio: 2026,
      mes: 11,
      saldoInicial: 35,
      montoAsignado: 200,
      saldoActual: 235,
      estado: EstadoCajaChica.ABIERTA,
      fechaApertura: DateTime.now(),
    })

    const vale = await ValeCaja.create({
      cajaChicaId: cajaActual.id,
      solicitantePersonaId: persona.id,
      tramitadoPorId: generador.id,
      aprobadoPorId: receptor.id,
      montoSolicitado: 30.0,
      montoRendido: 28.5,
      concepto: 'Vidriería de precisión',
      comprobanteReferencia: `FACT-${sufijo}`,
      estado: EstadoValeCaja.RENDIDO,
      fechaSolicitud: DateTime.now().minus({ hours: 3 }),
      fechaAprobacion: DateTime.now().minus({ hours: 2 }),
      fechaDesembolso: DateTime.now().minus({ hours: 1 }),
      fechaRendicion: DateTime.now(),
    })

    await cajaActual.load('cajaOrigen')
    await cajaActual.load('vales')
    assert.equal(cajaActual.cajaOrigen.id, cajaOrigen.id)
    assert.equal(cajaActual.vales.length, 1)
    assert.equal(vale.id, cajaActual.vales[0].id)
    assert.equal(asignacion.proyectoId, proyecto.id)
    assert.equal(solicitud.creadoPorId, generador.id)
  })

  test('triggers PostgreSQL bloquean al Administrador en tablas financieras y prohíben DELETE físico', async ({
    assert,
  }) => {
    const sufijo = Date.now() + 1

    const admin = await Usuario.create({
      username: `admin_rbac_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.ADMINISTRADOR,
      estaActivo: true,
    })

    const generador = await Usuario.create({
      username: `gen_rbac_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: `PROY-RBAC-${sufijo}`,
      nombre: 'Proyecto RBAC',
      area: AreaProyecto.BIOLOGIA,
      ambito: AmbitoProyecto.INTERNO,
      estaActivo: true,
    })

    // 1. Intentar crear una SolicitudPago con creado_por_id = Administrador debe fallar por Trigger RBAC
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await SolicitudPago.create(
            {
              codigo: `SOL-ILEGAL-${sufijo}`,
              proyectoId: proyecto.id,
              periodoInicio: DateTime.now().minus({ days: 15 }),
              periodoFin: DateTime.now(),
              montoTotal: 100,
              estado: EstadoSolicitud.CREACION,
              creadoPorId: admin.id,
            },
            { client: trx }
          )
        }),
      /Violación de Segregación de Funciones: El rol Administrador no tiene autorización para operar transacciones financieras/
    )

    // 2. Intentar aprobar una SolicitudPago con revisado_por_id = Generador debe fallar por Trigger RBAC
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await SolicitudPago.create(
            {
              codigo: `SOL-ROL-ERR-${sufijo}`,
              proyectoId: proyecto.id,
              periodoInicio: DateTime.now().minus({ days: 15 }),
              periodoFin: DateTime.now(),
              montoTotal: 100,
              estado: EstadoSolicitud.APROBACION,
              creadoPorId: generador.id,
              revisadoPorId: generador.id,
            },
            { client: trx }
          )
        }),
      /Violación RBAC: Solo un usuario con rol receptor puede revisar, aprobar o rechazar solicitudes de pago/
    )

    // 3. Crear una solicitud válida y verificar que DELETE físico está bloqueado por inmutabilidad
    const solicitudValida = await SolicitudPago.create({
      codigo: `SOL-OK-${sufijo}`,
      proyectoId: proyecto.id,
      periodoInicio: DateTime.now().minus({ days: 15 }),
      periodoFin: DateTime.now(),
      montoTotal: 100,
      estado: EstadoSolicitud.CREACION,
      creadoPorId: generador.id,
    })

    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          solicitudValida.useTransaction(trx)
          await solicitudValida.delete()
        }),
      /Violación de Inmutabilidad Financiera: No está permitido eliminar físicamente registros de la tabla solicitudes_pago/
    )

    // 4. Verificar que UPDATE o DELETE en audit_logs está bloqueado
    const log = await AuditLog.query().firstOrFail()
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await trx.from('audit_logs').where('id', log.id).update({ accion: 'ALTERADO' })
        }),
      /Violación de Inmutabilidad Financiera: Los registros de la tabla audit_logs son estrictamente inmutables/
    )
  })

  test('endpoint POST /api/v1/pagos amortiza deudas con algoritmo FIFO sin regresiones', async ({
    client,
    assert,
  }) => {
    const sufijo = Date.now() + 2

    const generador = await Usuario.create({
      username: `gen_fifo_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const receptor = await Usuario.create({
      username: `rec_fifo_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.RECEPTOR,
      estaActivo: true,
    })

    const persona = await Persona.create({
      identificacion: `V-FIFO-${sufijo}`,
      nombres: 'Carlos',
      apellidos: 'Físico',
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: `PROY-FIFO-${sufijo}`,
      nombre: 'Física Cuántica',
      area: AreaProyecto.FISICA,
      ambito: AmbitoProyecto.INTERNO,
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: `Mensual-FIFO-${sufijo}`,
      periodicidad: PeriodicidadGrupoPago.MENSUAL,
      diaCorte1: 30,
      estaActivo: true,
    })

    const solicitud = await SolicitudPago.create({
      codigo: `SOL-FIFO-${sufijo}`,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      periodoInicio: DateTime.now().minus({ days: 30 }),
      periodoFin: DateTime.now(),
      montoTotal: 150,
      estado: EstadoSolicitud.APROBACION,
      creadoPorId: generador.id,
      revisadoPorId: receptor.id,
    })

    const deudaAntigua = await Deuda.create({
      personaId: persona.id,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      solicitudId: solicitud.id,
      creadoPorId: generador.id,
      montoOriginal: 50,
      saldoPendiente: 50,
      fechaVencimiento: DateTime.now().minus({ days: 20 }),
      estado: EstadoDeuda.PENDIENTE,
    })

    const deudaReciente = await Deuda.create({
      personaId: persona.id,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      solicitudId: solicitud.id,
      creadoPorId: generador.id,
      montoOriginal: 100,
      saldoPendiente: 100,
      fechaVencimiento: DateTime.now().plus({ days: 10 }),
      estado: EstadoDeuda.PENDIENTE,
    })

    const response = await client
      .post('/api/v1/pagos')
      .loginAs(receptor)
      .json({
        personaId: persona.id,
        proyectoId: proyecto.id,
        solicitudId: solicitud.id,
        montoTotal: 80,
        metodoPago: MetodoPago.TRANSFERENCIA,
        numeroReferencia: `REF-FIFO-${sufijo}`,
        fechaPago: '2026-11-12',
      })

    response.assertStatus(201)
    const body = response.body() as {
      pagoId: number
      montoAplicado: number
      deudasAmortizadas: number
    }
    assert.equal(body.montoAplicado, 80)
    assert.equal(body.deudasAmortizadas, 2)

    await deudaAntigua.refresh()
    await deudaReciente.refresh()

    assert.equal(Number(deudaAntigua.saldoPendiente), 0)
    assert.equal(deudaAntigua.estado, EstadoDeuda.LIQUIDADA)
    assert.equal(Number(deudaReciente.saldoPendiente), 70)
    assert.equal(deudaReciente.estado, EstadoDeuda.ABONADO)

    const pagoRegistrado = await Pago.findOrFail(body.pagoId)
    assert.equal(pagoRegistrado.solicitudId, solicitud.id)
  })

  test('triggers RBAC protegen asignaciones y deudas sin contexto de sesión e impiden asignaciones activas duplicadas', async ({
    assert,
  }) => {
    const sufijo = Date.now() + 3

    const admin = await Usuario.create({
      username: `admin_asig_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.ADMINISTRADOR,
      estaActivo: true,
    })

    const generador = await Usuario.create({
      username: `gen_asig_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const receptor = await Usuario.create({
      username: `rec_asig_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.RECEPTOR,
      estaActivo: true,
    })

    const persona = await Persona.create({
      identificacion: `V-ASIG-${sufijo}`,
      nombres: 'Elena',
      apellidos: 'Bióloga',
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: `PROY-ASIG-${sufijo}`,
      nombre: 'Genómica Vegetal',
      area: AreaProyecto.BIOLOGIA,
      ambito: AmbitoProyecto.INTERNO,
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: `Quincenal-ASIG-${sufijo}`,
      periodicidad: PeriodicidadGrupoPago.QUINCENAL,
      diaCorte1: 15,
      diaCorte2: 30,
      estaActivo: true,
    })

    // 1. Administrador intentando crear una Asignacion sin contexto de sesión
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await Asignacion.create(
            {
              personaId: persona.id,
              proyectoId: proyecto.id,
              grupoPagoId: grupoPago.id,
              creadoPorId: admin.id,
              montoPeriodo: 100,
              fechaInicio: DateTime.now(),
              estaActivo: true,
            },
            { client: trx }
          )
        }),
      /Violación de Segregación de Funciones: El rol Administrador no tiene autorización para operar transacciones financieras/
    )

    // 2. Receptor intentando figurar como creador de una Deuda o Asignacion
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await Deuda.create(
            {
              personaId: persona.id,
              proyectoId: proyecto.id,
              grupoPagoId: grupoPago.id,
              creadoPorId: receptor.id,
              montoOriginal: 100,
              saldoPendiente: 100,
              fechaVencimiento: DateTime.now().plus({ days: 15 }),
              estado: EstadoDeuda.PENDIENTE,
            },
            { client: trx }
          )
        }),
      /Violación RBAC: Solo un usuario con rol generador puede crear registros en deudas/
    )

    // 3. Asignación activa válida creada por Generador y bloqueo de duplicado activo (uq_asignacion_activa)
    await Asignacion.create({
      personaId: persona.id,
      proyectoId: proyecto.id,
      grupoPagoId: grupoPago.id,
      creadoPorId: generador.id,
      montoPeriodo: 100,
      fechaInicio: DateTime.now(),
      estaActivo: true,
    })

    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await Asignacion.create(
            {
              personaId: persona.id,
              proyectoId: proyecto.id,
              grupoPagoId: grupoPago.id,
              creadoPorId: generador.id,
              montoPeriodo: 150,
              fechaInicio: DateTime.now(),
              estaActivo: true,
            },
            { client: trx }
          )
        }),
      /uq_asignacion_activa/
    )
  })

  test('restricciones CHECK monetarias en PostgreSQL bloquean saldos negativos o inconsistentes', async ({
    assert,
  }) => {
    const sufijo = Date.now() + 4

    const generador = await Usuario.create({
      username: `gen_chk_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const persona = await Persona.create({
      identificacion: `V-CHK-${sufijo}`,
      nombres: 'Luis',
      apellidos: 'Químico',
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: `PROY-CHK-${sufijo}`,
      nombre: 'Catálisis',
      area: AreaProyecto.QUIMICA,
      ambito: AmbitoProyecto.EXTERNO,
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: `Mensual-CHK-${sufijo}`,
      periodicidad: PeriodicidadGrupoPago.MENSUAL,
      diaCorte1: 30,
      estaActivo: true,
    })

    // 1. Deuda con saldo_pendiente > monto_original debe fallar por chk_deudas_saldo
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await Deuda.create(
            {
              personaId: persona.id,
              proyectoId: proyecto.id,
              grupoPagoId: grupoPago.id,
              creadoPorId: generador.id,
              montoOriginal: 100,
              saldoPendiente: 150,
              fechaVencimiento: DateTime.now().plus({ days: 10 }),
              estado: EstadoDeuda.PENDIENTE,
            },
            { client: trx }
          )
        }),
      /chk_deudas_saldo/
    )

    // 2. Caja chica con saldo_actual negativo debe fallar por chk_cajas_chicas_montos
    await assert.rejects(
      () =>
        enPuntoDeGuardado(async (trx) => {
          await CajaChica.create(
            {
              codigo: `CC-ERR-${sufijo}`,
              nombre: 'Caja Inválida',
              proyectoId: proyecto.id,
              responsableId: generador.id,
              anio: 2026,
              mes: 11,
              saldoInicial: 0,
              montoAsignado: 100,
              saldoActual: -10,
              estado: EstadoCajaChica.ABIERTA,
            },
            { client: trx }
          )
        }),
      /chk_cajas_chicas_montos/
    )
  })
})

/**
 * [concurrencia] Sin transacción global (ADR 0010 §4): las peticiones paralelas deben usar
 * conexiones distintas para que el `FOR UPDATE` se bloquee de verdad. Los datos quedan en
 * `vigencia_test` (inmutables) y se descartan con el `migration:fresh` de la siguiente
 * ejecución; por eso conservan los sufijos `Date.now()`.
 */
test.group('[concurrencia] Pagos simultáneos sobre la misma solicitud', () => {
  test('endpoint POST /api/v1/pagos valida integridad de solicitudId, rechaza sobrepagos y serializa pagos concurrentes', async ({
    client,
    assert,
  }) => {
    const sufijo = Date.now() + 5

    const generador = await Usuario.create({
      username: `gen_val_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.GENERADOR,
      estaActivo: true,
    })

    const receptor = await Usuario.create({
      username: `rec_val_${sufijo}`,
      passwordHash: 'PasswordSeguro123!',
      rol: RolUsuario.RECEPTOR,
      estaActivo: true,
    })

    const persona = await Persona.create({
      identificacion: `V-VAL-${sufijo}`,
      nombres: 'Ana',
      apellidos: 'Investigadora',
      estaActivo: true,
    })

    const proyectoA = await Proyecto.create({
      codigo: `PROY-A-${sufijo}`,
      nombre: 'Proyecto A',
      area: AreaProyecto.FISICA,
      ambito: AmbitoProyecto.INTERNO,
      estaActivo: true,
    })

    const proyectoB = await Proyecto.create({
      codigo: `PROY-B-${sufijo}`,
      nombre: 'Proyecto B',
      area: AreaProyecto.QUIMICA,
      ambito: AmbitoProyecto.EXTERNO,
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: `Mensual-VAL-${sufijo}`,
      periodicidad: PeriodicidadGrupoPago.MENSUAL,
      diaCorte1: 30,
      estaActivo: true,
    })

    const solicitudOtroProyecto = await SolicitudPago.create({
      codigo: `SOL-B-${sufijo}`,
      proyectoId: proyectoB.id,
      grupoPagoId: grupoPago.id,
      periodoInicio: DateTime.now().minus({ days: 30 }),
      periodoFin: DateTime.now(),
      montoTotal: 100,
      estado: EstadoSolicitud.APROBACION,
      creadoPorId: generador.id,
      revisadoPorId: receptor.id,
    })

    const solicitudProyectoA = await SolicitudPago.create({
      codigo: `SOL-A-${sufijo}`,
      proyectoId: proyectoA.id,
      grupoPagoId: grupoPago.id,
      periodoInicio: DateTime.now().minus({ days: 30 }),
      periodoFin: DateTime.now(),
      montoTotal: 100,
      estado: EstadoSolicitud.APROBACION,
      creadoPorId: generador.id,
      revisadoPorId: receptor.id,
    })

    const deudaConcurrida = await Deuda.create({
      personaId: persona.id,
      proyectoId: proyectoA.id,
      grupoPagoId: grupoPago.id,
      solicitudId: solicitudProyectoA.id,
      creadoPorId: generador.id,
      montoOriginal: 100,
      saldoPendiente: 100,
      fechaVencimiento: DateTime.now().plus({ days: 5 }),
      estado: EstadoDeuda.PENDIENTE,
    })

    // 1. Solicitud de otro proyecto es rechazada con 422 SOLICITUD_INVALIDA
    const respSolicitudInvalida = await client.post('/api/v1/pagos').loginAs(receptor).json({
      personaId: persona.id,
      proyectoId: proyectoA.id,
      solicitudId: solicitudOtroProyecto.id,
      montoTotal: 50,
      metodoPago: MetodoPago.TRANSFERENCIA,
      fechaPago: '2026-11-13',
    })

    respSolicitudInvalida.assertStatus(422)
    assert.equal((respSolicitudInvalida.body() as { codigo: string }).codigo, 'SOLICITUD_INVALIDA')

    // 2. Sobrepago es rechazado con 422 SOBREPAGO_NO_PERMITIDO
    const respSobrepago = await client.post('/api/v1/pagos').loginAs(receptor).json({
      personaId: persona.id,
      proyectoId: proyectoA.id,
      solicitudId: solicitudProyectoA.id,
      montoTotal: 150,
      metodoPago: MetodoPago.TRANSFERENCIA,
      fechaPago: '2026-11-13',
    })

    respSobrepago.assertStatus(422)
    assert.equal((respSobrepago.body() as { codigo: string }).codigo, 'SOBREPAGO_NO_PERMITIDO')

    // 3. Dos peticiones concurrentes de 80 USD sobre una deuda de 100 USD:
    // El bloqueo pesimista FOR UPDATE garantiza que solo una tenga éxito (201) y la otra sea rechazada (422)
    const [resp1, resp2] = await Promise.all([
      client
        .post('/api/v1/pagos')
        .loginAs(receptor)
        .json({
          personaId: persona.id,
          proyectoId: proyectoA.id,
          solicitudId: solicitudProyectoA.id,
          montoTotal: 80,
          metodoPago: MetodoPago.PAGO_MOVIL,
          numeroReferencia: `CONC-1-${sufijo}`,
          fechaPago: '2026-11-13',
        }),
      client
        .post('/api/v1/pagos')
        .loginAs(receptor)
        .json({
          personaId: persona.id,
          proyectoId: proyectoA.id,
          solicitudId: solicitudProyectoA.id,
          montoTotal: 80,
          metodoPago: MetodoPago.PAGO_MOVIL,
          numeroReferencia: `CONC-2-${sufijo}`,
          fechaPago: '2026-11-13',
        }),
    ])

    const codigosEstado = [resp1.status(), resp2.status()].sort()
    assert.deepEqual(codigosEstado, [201, 422])

    await deudaConcurrida.refresh()
    assert.equal(Number(deudaConcurrida.saldoPendiente), 20)
  })
})
