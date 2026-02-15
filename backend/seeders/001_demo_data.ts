import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('activities').del();
  await knex('tickets').del();
  await knex('tasks').del();
  await knex('deals').del();
  await knex('accounts').del();
  await knex('contacts').del();
  await knex('leads').del();
  await knex('users').del();
  await knex('roles').del();
  await knex('tenants').del();

  // Create demo tenant
  const tenantId = uuidv4();
  await knex('tenants').insert({
    id: tenantId,
    slug: 'demo',
    name: 'Demo Company',
    plan: 'pro',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
  });

  // Create roles
  const adminRoleId = uuidv4();
  const managerRoleId = uuidv4();
  const salesRoleId = uuidv4();

  await knex('roles').insert([
    {
      id: adminRoleId,
      tenantId,
      name: 'Tenant Admin',
      description: 'Full access to tenant',
      permissions: ['*'],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      id: managerRoleId,
      tenantId,
      name: 'Manager',
      description: 'Can manage team and reports',
      permissions: ['leads:*', 'contacts:*', 'deals:*', 'tasks:*', 'reports:read'],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      id: salesRoleId,
      tenantId,
      name: 'Sales User',
      description: 'Can manage sales pipeline',
      permissions: ['leads:*', 'contacts:*', 'deals:*', 'tasks:*', 'activities:*'],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
  ]);

  // Create demo users
  const adminUserId = uuidv4();
  const managerUserId = uuidv4();
  const salesUserId = uuidv4();

  const hashedPassword = await bcryptjs.hash('password123', 10);

  await knex('users').insert([
    {
      id: adminUserId,
      tenantId,
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      roleId: adminRoleId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      id: managerUserId,
      tenantId,
      email: 'manager@demo.com',
      firstName: 'Manager',
      lastName: 'User',
      password: hashedPassword,
      roleId: managerRoleId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      id: salesUserId,
      tenantId,
      email: 'sales@demo.com',
      firstName: 'Sales',
      lastName: 'User',
      password: hashedPassword,
      roleId: salesRoleId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
  ]);

  // Create sample leads
  const leads = [
    {
      id: uuidv4(),
      tenantId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Tech Corp',
      industry: 'Technology',
      status: 'qualified',
      source: 'linkedin',
      assignedTo: salesUserId,
      score: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminUserId,
      updatedBy: adminUserId,
    },
    {
      id: uuidv4(),
      tenantId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      company: 'Innovation Inc',
      industry: 'Finance',
      status: 'new',
      source: 'website',
      assignedTo: salesUserId,
      score: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adminUserId,
      updatedBy: adminUserId,
    },
  ];

  await knex('leads').insert(leads);

  // Create sample accounts
  const accountId = uuidv4();
  await knex('accounts').insert({
    id: accountId,
    tenantId,
    name: 'Enterprise Corp',
    industry: 'Technology',
    website: 'https://enterprise-corp.com',
    employees: 500,
    annualRevenue: 50000000,
    status: 'customer',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  // Create sample contacts
  await knex('contacts').insert({
    id: uuidv4(),
    tenantId,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@enterprise-corp.com',
    phone: '+1111111111',
    title: 'VP of Sales',
    company: 'Enterprise Corp',
    accountId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  // Create sample deals
  await knex('deals').insert({
    id: uuidv4(),
    tenantId,
    name: 'Enterprise CRM Implementation',
    accountId,
    value: 500000,
    currency: 'USD',
    stage: 'negotiation',
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    assignedTo: salesUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  console.log('✅ Seed completed successfully');
}
