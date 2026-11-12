import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
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
  EstadoCajaChica,
  EstadoValeCaja,
  MetodoPago,
} from '@app/shared'

test.group('Modelo de Datos, Triggers PostgreSQL y Compatibilidad FIFO', () => {
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
    await assert.rejects(async () => {
      await SolicitudPago.create({
        codigo: `SOL-ILEGAL-${sufijo}`,
        proyectoId: proyecto.id,
        periodoInicio: DateTime.now().minus({ days: 15 }),
        periodoFin: DateTime.now(),
        montoTotal: 100,
        estado: EstadoSolicitud.CREACION,
        creadoPorId: admin.id,
      })
    }, /Violación de Segregación de Funciones: El rol Administrador no tiene autorización para operar transacciones financieras/)

    // 2. Intentar aprobar una SolicitudPago con revisado_por_id = Generador debe fallar por Trigger RBAC
    await assert.rejects(async () => {
      await SolicitudPago.create({
        codigo: `SOL-ROL-ERR-${sufijo}`,
        proyectoId: proyecto.id,
        periodoInicio: DateTime.now().minus({ days: 15 }),
        periodoFin: DateTime.now(),
        montoTotal: 100,
        estado: EstadoSolicitud.APROBACION,
        creadoPorId: generador.id,
        revisadoPorId: generador.id,
      })
    }, /Violación RBAC: Solo un usuario con rol receptor puede revisar, aprobar o rechazar solicitudes de pago/)

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

    await assert.rejects(async () => {
      await solicitudValida.delete()
    }, /Violación de Inmutabilidad Financiera: No está permitido eliminar físicamente registros de la tabla solicitudes_pago/)

    // 4. Verificar que UPDATE o DELETE en audit_logs está bloqueado
    const log = await AuditLog.query().firstOrFail()
    await assert.rejects(async () => {
      await db.from('audit_logs').where('id', log.id).update({ accion: 'ALTERADO' })
    }, /Violación de Inmutabilidad Financiera: Los registros de la tabla audit_logs son estrictamente inmutables/)
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
      estado: 'pendiente',
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
      estado: 'pendiente',
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
    const body = response.body()
    assert.equal(body.montoAplicado, 80)
    assert.equal(body.deudasAmortizadas, 2)

    await deudaAntigua.refresh()
    await deudaReciente.refresh()

    assert.equal(Number(deudaAntigua.saldoPendiente), 0)
    assert.equal(deudaAntigua.estado, 'liquidada')
    assert.equal(Number(deudaReciente.saldoPendiente), 70)
    assert.equal(deudaReciente.estado, 'pendiente')

    const pagoRegistrado = await Pago.findOrFail(body.pagoId)
    assert.equal(pagoRegistrado.solicitudId, solicitud.id)
  })
})
