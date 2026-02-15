import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary();
    table.string('slug').unique().notNullable();
    table.string('name').notNullable();
    table.enum('plan', ['free', 'pro', 'enterprise']).defaultTo('free');
    table.enum('status', ['active', 'suspended', 'cancelled']).defaultTo('active');
    table.json('settings');
    table.string('logo');
    table.string('website');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.index(['slug']);
    table.index(['status']);
  });

  // Roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.json('permissions');
    table.boolean('isSystem').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.unique(['tenantId', 'name']);
    table.index(['tenantId']);
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('email').notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('password').notNullable();
    table.uuid('roleId').notNullable();
    table.string('avatar');
    table.string('phone');
    table.enum('status', ['active', 'inactive', 'invited']).defaultTo('active');
    table.timestamp('lastLogin');
    table.string('lastLoginIp');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.foreign('roleId').references('roles.id').onDelete('RESTRICT');
    table.unique(['tenantId', 'email']);
    table.index(['tenantId']);
    table.index(['status']);
    table.index(['lastLogin']);
  });

  // Leads table
  await knex.schema.createTable('leads', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('email');
    table.string('phone');
    table.string('company');
    table.string('industry');
    table.enum('status', ['new', 'contacted', 'qualified', 'converted', 'lost']).defaultTo('new');
    table.string('source').notNullable();
    table.uuid('assignedTo');
    table.integer('score').defaultTo(0);
    table.text('notes');
    table.json('customFields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.foreign('assignedTo').references('users.id').onDelete('SET NULL');
    table.index(['tenantId']);
    table.index(['status']);
    table.index(['source']);
    table.index(['createdAt']);
  });

  // Contacts table
  await knex.schema.createTable('contacts', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.string('email');
    table.string('phone');
    table.string('title');
    table.string('company');
    table.uuid('accountId');
    table.text('notes');
    table.json('customFields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.index(['tenantId']);
    table.index(['createdAt']);
  });

  // Accounts table
  await knex.schema.createTable('accounts', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('name').notNullable();
    table.string('industry');
    table.string('website');
    table.integer('employees');
    table.decimal('annualRevenue', 15, 2);
    table.enum('status', ['prospect', 'customer', 'partner']).defaultTo('prospect');
    table.text('notes');
    table.json('customFields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.index(['tenantId']);
    table.index(['status']);
  });

  // Deals table
  await knex.schema.createTable('deals', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('name').notNullable();
    table.uuid('accountId');
    table.decimal('value', 15, 2);
    table.string('currency').defaultTo('USD');
    table.string('stage').notNullable();
    table.integer('probability');
    table.timestamp('expectedCloseDate');
    table.timestamp('closedDate');
    table.string('lostReason');
    table.uuid('assignedTo');
    table.text('notes');
    table.json('customFields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.foreign('accountId').references('accounts.id').onDelete('SET NULL');
    table.foreign('assignedTo').references('users.id').onDelete('SET NULL');
    table.index(['tenantId']);
    table.index(['stage']);
    table.index(['createdAt']);
  });

  // Tasks table
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.enum('type', ['call', 'email', 'meeting', 'todo']).notNullable();
    table.enum('status', ['open', 'in_progress', 'completed', 'cancelled']).defaultTo('open');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.timestamp('dueDate');
    table.timestamp('completedDate');
    table.uuid('assignedTo');
    table.json('relatedTo');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.foreign('assignedTo').references('users.id').onDelete('SET NULL');
    table.index(['tenantId']);
    table.index(['status']);
    table.index(['dueDate']);
    table.index(['createdAt']);
  });

  // Activities table
  await knex.schema.createTable('activities', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.enum('type', ['call', 'email', 'meeting', 'note', 'task_completed']).notNullable();
    table.string('subject');
    table.text('description');
    table.integer('duration');
    table.string('result');
    table.json('relatedTo');
    table.json('participants');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.index(['tenantId']);
    table.index(['type']);
    table.index(['createdAt']);
  });

  // Tickets table
  await knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary();
    table.uuid('tenantId').notNullable();
    table.string('subject').notNullable();
    table.text('description').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.enum('status', ['open', 'in_progress', 'waiting', 'resolved', 'closed']).defaultTo('open');
    table.string('category');
    table.uuid('assignedTo');
    table.uuid('contactId');
    table.timestamp('resolvedDate');
    table.timestamp('sla');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.uuid('createdBy').notNullable();
    table.uuid('updatedBy').notNullable();
    table.foreign('tenantId').references('tenants.id').onDelete('CASCADE');
    table.foreign('assignedTo').references('users.id').onDelete('SET NULL');
    table.foreign('contactId').references('contacts.id').onDelete('SET NULL');
    table.index(['tenantId']);
    table.index(['status']);
    table.index(['createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('activities');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('deals');
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('contacts');
  await knex.schema.dropTableIfExists('leads');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('tenants');
}
