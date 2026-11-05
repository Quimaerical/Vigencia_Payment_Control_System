import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Persona from '#models/persona'
import Proyecto from '#models/proyecto'
import GrupoPago from '#models/grupo_pago'
import Deuda from '#models/deuda'

export default class extends BaseSeeder {
  async run() {
    const persona = await Persona.create({
      identificacion: 'V-12345678',
      nombres: 'Edgar',
      apellidos: 'Prueba',
      correo: 'edgar@example.com',
      estaActivo: true,
    })

    const proyecto = await Proyecto.create({
      codigo: 'PROY-01',
      nombre: 'Proyecto Test',
      estaActivo: true,
    })

    const grupoPago = await GrupoPago.create({
      nombre: 'Grupo Test',
      estaActivo: true,
    })

    // Insertamos dos deudas para probar el FIFO
    await Deuda.createMany([
      {
        personaId: persona.id,
        proyectoId: proyecto.id,
        grupoPagoId: grupoPago.id,
        montoOriginal: 50.00,
        saldoPendiente: 50.00,
        fechaVencimiento: DateTime.now().minus({ days: 30 }), // Vencida hace 30 días (prioridad 1)
        estado: 'pendiente',
      },
      {
        personaId: persona.id,
        proyectoId: proyecto.id,
        grupoPagoId: grupoPago.id,
        montoOriginal: 100.00,
        saldoPendiente: 100.00,
        fechaVencimiento: DateTime.now().plus({ days: 15 }), // Vence en 15 días (prioridad 2)
        estado: 'pendiente',
      }
    ])
  }
}
