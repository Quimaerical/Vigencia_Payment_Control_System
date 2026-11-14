import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  types: {
    jsonb: {
      tsType: 'Record<string, unknown>',
      decorators: [{ name: '@column' }],
    },
  },
} satisfies SchemaRules
