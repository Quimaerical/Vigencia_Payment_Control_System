import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import env from '#start/env'
import Persona from '#models/persona'
import Proyecto from '#models/proyecto'
import GrupoPago from '#models/grupo_pago'
import Deuda from '#models/deuda'
import Usuario from '#models/usuario'
import { RolUsuario } from '@app/shared'

export default class extends BaseSeeder {
  async run() {
    const passwordSegura = env.get('SEED_DEFAULT_PASSWORD', 'Vigencia$2026!SecureKey#99')

    await Usuario.firstOrCreate(
      { username: 'operador_receptor' },
      {
        username: 'operador_receptor',
        passwordHash: passwordSegura,
        rol: RolUsuario.RECEPTOR,
        estaActivo: true,
      }
    )

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

    const proyecto = await Proyecto.firstOrCreate(
      { codigo: 'PROY-01' },
      {
        codigo: 'PROY-01',
        nombre: 'Proyecto Test',
        estaActivo: true,
      }
    )

    const grupoPago = await GrupoPago.firstOrCreate(
      { nombre: 'Grupo Test' },
      {
        nombre: 'Grupo Test',
        estaActivo: true,
      }
    )

    // Validamos si ya existen deudas para asegurar idempotencia al re-ejecutar seeders
    const deudasExistentes = await Deuda.query()
      .where('persona_id', persona.id)
      .where('proyecto_id', proyecto.id)

    if (deudasExistentes.length === 0) {
      await Deuda.createMany([
        {
          personaId: persona.id,
          proyectoId: proyecto.id,
          grupoPagoId: grupoPago.id,
          montoOriginal: 50.0,
          saldoPendiente: 50.0,
          fechaVencimiento: DateTime.now().minus({ days: 30 }), // Vencida hace 30 días (prioridad 1 FIFO)
          estado: 'pendiente',
        },
        {
          personaId: persona.id,
          proyectoId: proyecto.id,
          grupoPagoId: grupoPago.id,
          montoOriginal: 100.0,
          saldoPendiente: 100.0,
          fechaVencimiento: DateTime.now().plus({ days: 15 }), // Vence en 15 días (prioridad 2 FIFO)
          estado: 'pendiente',
        },
      ])
    }
  }
}
