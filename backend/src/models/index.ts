import { Model } from 'objection';

export class Tenant extends Model {
  static tableName = 'tenants';

  id!: string;
  slug!: string;
  name!: string;
  plan!: 'free' | 'pro' | 'enterprise';
  status!: 'active' | 'suspended' | 'cancelled';
  settings?: Record<string, any>;
  logo?: string;
  website?: string;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;

  static relationMappings = () => ({
    users: {
      relation: Model.HasManyRelation,
      modelClass: User,
      join: {
        from: 'tenants.id',
        to: 'users.tenantId',
      },
    },
    roles: {
      relation: Model.HasManyRelation,
      modelClass: Role,
      join: {
        from: 'tenants.id',
        to: 'roles.tenantId',
      },
    },
    leads: {
      relation: Model.HasManyRelation,
      modelClass: Lead,
      join: {
        from: 'tenants.id',
        to: 'leads.tenantId',
      },
    },
  });
}

export class User extends Model {
  static tableName = 'users';

  id!: string;
  tenantId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  password!: string; // hashed
  roleId!: string;
  avatar?: string;
  phone?: string;
  status!: 'active' | 'inactive' | 'invited';
  lastLogin?: Date;
  lastLoginIp?: string;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;

  static relationMappings = () => ({
    tenant: {
      relation: Model.BelongsToOneRelation,
      modelClass: Tenant,
      join: {
        from: 'users.tenantId',
        to: 'tenants.id',
      },
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: {
        from: 'users.roleId',
        to: 'roles.id',
      },
    },
  });
}

export class Role extends Model {
  static tableName = 'roles';

  id!: string;
  tenantId!: string;
  name!: string;
  description?: string;
  permissions!: string[]; // JSON array
  isSystem!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;

  static relationMappings = () => ({
    tenant: {
      relation: Model.BelongsToOneRelation,
      modelClass: Tenant,
      join: {
        from: 'roles.tenantId',
        to: 'tenants.id',
      },
    },
  });
}

export class Lead extends Model {
  static tableName = 'leads';

  id!: string;
  tenantId!: string;
  firstName!: string;
  lastName!: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  status!: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source!: string;
  assignedTo?: string;
  score?: number;
  notes?: string;
  customFields?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Contact extends Model {
  static tableName = 'contacts';

  id!: string;
  tenantId!: string;
  firstName!: string;
  lastName!: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  accountId?: string;
  notes?: string;
  customFields?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Account extends Model {
  static tableName = 'accounts';

  id!: string;
  tenantId!: string;
  name!: string;
  industry?: string;
  website?: string;
  employees?: number;
  annualRevenue?: number;
  status!: 'prospect' | 'customer' | 'partner';
  notes?: string;
  customFields?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Deal extends Model {
  static tableName = 'deals';

  id!: string;
  tenantId!: string;
  name!: string;
  accountId?: string;
  value?: number;
  currency!: string;
  stage!: string; // pipeline stage
  probability?: number;
  expectedCloseDate?: Date;
  closedDate?: Date;
  lostReason?: string;
  assignedTo?: string;
  notes?: string;
  customFields?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Task extends Model {
  static tableName = 'tasks';

  id!: string;
  tenantId!: string;
  title!: string;
  description?: string;
  type!: 'call' | 'email' | 'meeting' | 'todo';
  status!: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority!: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  relatedTo?: {
    type: 'lead' | 'contact' | 'deal' | 'account';
    id: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Activity extends Model {
  static tableName = 'activities';

  id!: string;
  tenantId!: string;
  type!: 'call' | 'email' | 'meeting' | 'note' | 'task_completed';
  subject?: string;
  description?: string;
  duration?: number; // in minutes
  result?: string;
  relatedTo?: {
    type: 'lead' | 'contact' | 'deal' | 'account';
    id: string;
  };
  participants?: string[];
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}

export class Ticket extends Model {
  static tableName = 'tickets';

  id!: string;
  tenantId!: string;
  subject!: string;
  description!: string;
  priority!: 'low' | 'medium' | 'high' | 'urgent';
  status!: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category?: string;
  assignedTo?: string;
  contactId?: string;
  resolvedDate?: Date;
  sla?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: string;
  updatedBy!: string;
}
