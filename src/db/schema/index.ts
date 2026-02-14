import { pgTable, uuid, varchar, text, timestamp,boolean,
  jsonb, serial, integer, date } from 'drizzle-orm/pg-core';

// src\db\schema\index.ts
export const fieldUsers = pgTable('field_users', {
  id: uuid('id').defaultRandom().primaryKey(),

  login: varchar('login', { length: 100 }).notNull().unique(),

  // As per requirement: unhashed
  // (You can switch to bcrypt later without schema change)
  pwd: text('pwd').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  lastLogin: timestamp('last_login'),
});
export const communities = pgTable('communities', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  isDeleted: boolean('is_deleted').default(false),
});

export const communityUnits = pgTable('community_units', {
  id: serial('id').primaryKey(),

  communityId: integer('community_id').notNull(),

  unitNumber: varchar('unit_number', { length: 50 }).notNull(),

  meters: jsonb('meters').notNull(), // JSONB array with meter_id, amr_id, meter_type

  isDeleted: boolean('is_deleted').default(false),
});


export const currentReadings = pgTable('current_readings', {
  id: serial('id').primaryKey(),

  meterId: varchar('meter_id', { length: 100 }).notNull(),

  amrId: varchar('amr_id', { length: 100 }),

  readings: text('readings'),

  readingDate: date('reading_date').notNull(),

  inputType: varchar('input_type', { length: 20 }),

});

export const meters = pgTable('meters', {
  id: serial('id').primaryKey(),

  meterId: varchar('meter_id', { length: 100 }).notNull().unique(),

  amrId: varchar('amr_id', { length: 100 }),

  meterType: varchar('meter_type', { length: 50 }).notNull(),

  communityId: integer('community_id').notNull(),

  unitId: integer('unit_id'),

  fieldSortOrder: integer('field_sort_order').default(0),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at'),
});
