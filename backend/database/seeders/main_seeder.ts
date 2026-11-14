import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import env from '#start/env'
import Persona from '#models/persona'
import Proyecto from '#models/proyecto'
import GrupoPago from '#models/grupo_pago'
import Deuda from '#models/deuda'
import Usuario from '#models/usuario'
import Asignacion from '#models/asignacion'
import SolicitudPago from '#models/solicitud_pago'
import CajaChica from '#models/caja_chica'
import ValeCaja from '#models/vale_caja'
import {
  RolUsuario,
  AreaProyecto,
  AmbitoProyecto,
  PeriodicidadGrupoPago,
  EstadoSolicitud,
  EstadoCajaChica,
  EstadoValeCaja,
} from '@app/shared'

export default class extends BaseSeeder {
  async run() {
    const passwordSegura = env.get('SEED_DEFAULT_PASSWORD', 'Vigencia$2026!SecureKey#99')

    // 1. Usuarios de los 3 roles con segregación de funciones
    await Usuario.firstOrCreate(
      { username: 'admin_sistema' },
      {
        username: 'admin_sistema',
        passwordHash: passwordSegura,
        rol: RolUsuario.ADMINISTRADOR,
        estaActivo: true,
      }
    )

    const generador = await Usuario.firstOrCreate(
      { username: 'coordinador_generador' },
      {
        username: 'coordinador_generador',
        passwordHash: passwordSegura,
        rol: RolUsuario.GENERADOR,
        estaActivo: true,
      }
    )

    const receptor = await Usuario.firstOrCreate(
      { username: 'operador_receptor' },
      {
        username: 'operador_receptor',
        passwordHash: passwordSegura,
        rol: RolUsuario.RECEPTOR,
        estaActivo: true,
      }
    )

    // 2. Beneficiario de prueba (sin usuario en el sistema)
    const persona = await Persona.firstOrCreate(
      { identificacion: 'V-12345678' },
      {
        identificacion: 'V-12345678',
        nombres: 'Edgar',
        apellidos: 'Prueba',
        correo: 'edgar@example.com',
        estaActivo: true,
      }
    )

    // 3. Proyecto con área, ámbito y vigencia
    const proyecto = await Proyecto.updateOrCreate(
      { codigo: 'PROY-01' },
      {
        codigo: 'PROY-01',
        nombre: 'Proyecto Test',
        descripcion: 'Proyecto de investigación en física experimental',
        area: AreaProyecto.FISICA,
        ambito: AmbitoProyecto.INTERNO,
        fechaInicio: DateTime.now().minus({ months: 3 }),
        fechaFin: DateTime.now().plus({ months: 9 }),
        estaActivo: true,
      }
    )

    // 4. Grupo de Pago con periodicidad y fechas de corte
    const grupoPago = await GrupoPago.updateOrCreate(
      { nombre: 'Grupo Test' },
      {
        nombre: 'Grupo Test',
        descripcion: 'Grupo de pago quincenal con cortes los días 15 y 30',
        periodicidad: PeriodicidadGrupoPago.QUINCENAL,
        diaCorte1: 15,
        diaCorte2: 30,
        configuracionCorte: { dias: [15, 30], ajusteFinDeMes: true },
        estaActivo: true,
      }
    )

    // 5. Asignación activa (cruce Persona + Proyecto + Grupo de Pago)
    const asignacion = await Asignacion.firstOrCreate(
      {
        personaId: persona.id,
        proyectoId: proyecto.id,
        grupoPagoId: grupoPago.id,
      },
      {
        personaId: persona.id,
        proyectoId: proyecto.id,
        grupoPagoId: grupoPago.id,
        creadoPorId: generador.id,
        montoPeriodo: 100.0,
        fechaInicio: DateTime.now().minus({ days: 45 }),
        fechaFin: null,
        estaActivo: true,
      }
    )

    // 6. Solicitud de Pago aprobada vinculada al proyecto
    const solicitud = await SolicitudPago.firstOrCreate(
      { codigo: 'SOL-2026-0001' },
      {
        codigo: 'SOL-2026-0001',
        proyectoId: proyecto.id,
        grupoPagoId: grupoPago.id,
        periodoInicio: DateTime.now().minus({ days: 45 }),
        periodoFin: DateTime.now().plus({ days: 15 }),
        montoTotal: 150.0,
        estado: EstadoSolicitud.APROBACION,
        creadoPorId: generador.id,
        revisadoPorId: receptor.id,
        fechaEnvio: DateTime.now().minus({ days: 2 }),
        fechaRevision: DateTime.now().minus({ days: 1 }),
      }
    )

    // 7. Deudas / Causaciones iniciales para pruebas de amortización FIFO
    const deudasExistentes = await Deuda.query()
      .where('persona_id', persona.id)
      .where('proyecto_id', proyecto.id)

    if (deudasExistentes.length === 0) {
      await Deuda.createMany([
        {
          personaId: persona.id,
          proyectoId: proyecto.id,
          grupoPagoId: grupoPago.id,
          asignacionId: asignacion.id,
          solicitudId: solicitud.id,
          creadoPorId: generador.id,
          montoOriginal: 50.0,
          saldoPendiente: 50.0,
          fechaVencimiento: DateTime.now().minus({ days: 30 }), // Vencida hace 30 días (prioridad 1 FIFO)
          periodoInicio: DateTime.now().minus({ days: 45 }),
          periodoFin: DateTime.now().minus({ days: 30 }),
          diasActivos: 8,
          diasPeriodo: 15,
          estado: 'pendiente',
        },
        {
          personaId: persona.id,
          proyectoId: proyecto.id,
          grupoPagoId: grupoPago.id,
          asignacionId: asignacion.id,
          solicitudId: solicitud.id,
          creadoPorId: generador.id,
          montoOriginal: 100.0,
          saldoPendiente: 100.0,
          fechaVencimiento: DateTime.now().plus({ days: 15 }), // Vence en 15 días (prioridad 2 FIFO)
          periodoInicio: DateTime.now().minus({ days: 15 }),
          periodoFin: DateTime.now(),
          diasActivos: 15,
          diasPeriodo: 15,
          estado: 'pendiente',
        },
      ])
    }

    // 8. Caja Chica y Vale de Caja de ejemplo
    const ahora = DateTime.now()
    const cajaChica = await CajaChica.firstOrCreate(
      { codigo: 'CC-PROY01-2026-11' },
      {
        codigo: 'CC-PROY01-2026-11',
        nombre: 'Caja Chica Laboratorio Física Principal',
        proyectoId: proyecto.id,
        cajaOrigenId: null,
        responsableId: generador.id,
        anio: ahora.year,
        mes: ahora.month,
        saldoInicial: 0.0,
        montoAsignado: 500.0,
        saldoActual: 500.0,
        estado: EstadoCajaChica.ABIERTA,
        fechaApertura: ahora,
      }
    )

    const valesExistentes = await ValeCaja.query().where('caja_chica_id', cajaChica.id)
    if (valesExistentes.length === 0) {
      await ValeCaja.create({
        cajaChicaId: cajaChica.id,
        solicitantePersonaId: persona.id,
        tramitadoPorId: generador.id,
        aprobadoPorId: receptor.id,
        montoSolicitado: 45.0,
        montoRendido: null,
        concepto: 'Reactivos y consumibles menores de laboratorio',
        estado: EstadoValeCaja.APROBADO,
        fechaSolicitud: ahora.minus({ hours: 4 }),
        fechaAprobacion: ahora.minus({ hours: 1 }),
      })
    }
  }
}
