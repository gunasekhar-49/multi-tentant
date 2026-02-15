/**
 * Custom Fields System
 * Allows admins to create dynamic fields on leads, contacts, deals
 * 
 * Features:
 * - Field types: text, number, date, dropdown, checkbox, textarea
 * - Field validation rules
 * - Field visibility control
 * - Field reordering
 * - Field deletion with data preservation
 */

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'textarea' | 'email' | 'phone';
export type FieldResource = 'lead' | 'contact' | 'deal';

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  resource: FieldResource;
  required: boolean;
  visible: boolean;
  searchable: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[]; // For dropdown/checkbox fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}

export interface FieldValue {
  fieldId: string;
  recordId: string;
  resource: FieldResource;
  value: any;
  createdAt: number;
  updatedAt: number;
}

export class CustomFieldsService {
  private fields: CustomField[] = [];
  private fieldValues: FieldValue[] = [];
  private nextFieldId: number = 1;

  constructor() {
    this.loadDefaultFields();
  }

  /**
   * Create a new custom field
   */
  createField(
    field: Omit<CustomField, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>,
    createdBy: string
  ): CustomField {
    // Validate field name
    if (this.fields.some(f => f.name === field.name && f.resource === field.resource)) {
      throw new Error(`Field "${field.name}" already exists for ${field.resource}`);
    }

    const newField: CustomField = {
      ...field,
      id: `field-${this.nextFieldId++}`,
      createdAt: Date.now(),
      createdBy,
      updatedAt: Date.now(),
    };

    this.fields.push(newField);
    return newField;
  }

  /**
   * Update a custom field
   */
  updateField(fieldId: string, updates: Partial<CustomField>): CustomField | null {
    const field = this.fields.find(f => f.id === fieldId);
    if (!field) return null;

    const updated = { ...field, ...updates, updatedAt: Date.now() };
    const index = this.fields.indexOf(field);
    this.fields[index] = updated;

    return updated;
  }

  /**
   * Delete a custom field
   */
  deleteField(fieldId: string): boolean {
    const index = this.fields.findIndex(f => f.id === fieldId);
    if (index === -1) return false;

    this.fields.splice(index, 1);
    // Note: Field values are preserved for data integrity
    return true;
  }

  /**
   * Get all fields for a resource
   */
  getFieldsByResource(resource: FieldResource): CustomField[] {
    return this.fields
      .filter(f => f.resource === resource && f.visible)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all custom fields (including hidden)
   */
  getAllFields(): CustomField[] {
    return this.fields.sort((a, b) => a.order - b.order);
  }

  /**
   * Get a single field
   */
  getField(fieldId: string): CustomField | undefined {
    return this.fields.find(f => f.id === fieldId);
  }

  /**
   * Reorder fields
   */
  reorderFields(resourceType: FieldResource, fieldIds: string[]): CustomField[] {
    const resourceFields = this.fields.filter(f => f.resource === resourceType);

    fieldIds.forEach((id, index) => {
      const field = resourceFields.find(f => f.id === id);
      if (field) {
        field.order = index;
      }
    });

    return this.getFieldsByResource(resourceType);
  }

  /**
   * Set field value for a record
   */
  setFieldValue(fieldId: string, recordId: string, resource: FieldResource, value: any): FieldValue | null {
    const field = this.getField(fieldId);
    if (!field || field.resource !== resource) return null;

    // Validate field type
    if (!this.validateValue(value, field)) {
      throw new Error(`Invalid value for field "${field.label}"`);
    }

    // Check if value already exists
    const existing = this.fieldValues.find(fv => fv.fieldId === fieldId && fv.recordId === recordId);

    if (existing) {
      existing.value = value;
      existing.updatedAt = Date.now();
      return existing;
    } else {
      const newValue: FieldValue = {
        fieldId,
        recordId,
        resource,
        value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.fieldValues.push(newValue);
      return newValue;
    }
  }

  /**
   * Get field values for a record
   */
  getRecordValues(recordId: string, resource: FieldResource): Record<string, any> {
    const result: Record<string, any> = {};

    this.fieldValues
      .filter(fv => fv.recordId === recordId && fv.resource === resource)
      .forEach(fv => {
        result[fv.fieldId] = fv.value;
      });

    return result;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalFields: number;
    byResource: Record<FieldResource, number>;
    byType: Record<FieldType, number>;
    totalValues: number;
  } {
    const byResource: Record<FieldResource, number> = {
      lead: 0,
      contact: 0,
      deal: 0,
    };

    const byType: Record<FieldType, number> = {
      text: 0,
      number: 0,
      date: 0,
      dropdown: 0,
      checkbox: 0,
      textarea: 0,
      email: 0,
      phone: 0,
    };

    this.fields.forEach(field => {
      byResource[field.resource]++;
      byType[field.type]++;
    });

    return {
      totalFields: this.fields.length,
      byResource,
      byType,
      totalValues: this.fieldValues.length,
    };
  }

  /**
   * Validate a value against field rules
   */
  private validateValue(value: any, field: CustomField): boolean {
    if (!value && !field.required) return true;
    if (!value && field.required) return false;

    switch (field.type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\d{10,}$/.test(String(value).replace(/\D/g, ''));
      case 'number':
        const num = Number(value);
        if (field.validation?.min !== undefined && num < field.validation.min) return false;
        if (field.validation?.max !== undefined && num > field.validation.max) return false;
        return !isNaN(num);
      case 'date':
        return !isNaN(Date.parse(value));
      case 'text':
      case 'textarea':
        if (field.validation?.minLength && String(value).length < field.validation.minLength) return false;
        if (field.validation?.maxLength && String(value).length > field.validation.maxLength) return false;
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) return false;
        return true;
      case 'dropdown':
      case 'checkbox':
        return field.options?.some(opt => opt.value === value) || false;
      default:
        return true;
    }
  }

  /**
   * Get field usage stats
   */
  getFieldUsage(fieldId: string): {
    totalRecords: number;
    recordsWithValue: number;
    usagePercentage: number;
  } {
    const field = this.getField(fieldId);
    if (!field) return { totalRecords: 0, recordsWithValue: 0, usagePercentage: 0 };

    const withValue = this.fieldValues.filter(fv => fv.fieldId === fieldId).length;

    // Estimate total records (in real app, would be from database)
    const estimatedTotal = Math.max(withValue * 5, 10);

    return {
      totalRecords: estimatedTotal,
      recordsWithValue: withValue,
      usagePercentage: (withValue / estimatedTotal) * 100,
    };
  }

  /**
   * Export fields configuration
   */
  exportFields(): string {
    return JSON.stringify(this.fields, null, 2);
  }

  /**
   * Import fields configuration
   */
  importFields(json: string): void {
    try {
      const imported = JSON.parse(json);
      this.fields = Array.isArray(imported) ? imported : [];
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Load default fields
   */
  private loadDefaultFields(): void {
    // Lead fields
    this.createField(
      {
        name: 'lead_source',
        label: 'Lead Source',
        type: 'dropdown',
        resource: 'lead',
        required: true,
        visible: true,
        searchable: true,
        order: 1,
        options: [
          { value: 'organic', label: 'Organic Search' },
          { value: 'paid_ads', label: 'Paid Ads' },
          { value: 'referral', label: 'Referral' },
          { value: 'cold_outreach', label: 'Cold Outreach' },
          { value: 'event', label: 'Event' },
        ],
      },
      'system'
    );

    this.createField(
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        resource: 'lead',
        required: false,
        visible: true,
        searchable: true,
        order: 2,
        placeholder: 'e.g., Technology, Healthcare',
      },
      'system'
    );

    this.createField(
      {
        name: 'company_size',
        label: 'Company Size',
        type: 'dropdown',
        resource: 'lead',
        required: false,
        visible: true,
        searchable: true,
        order: 3,
        options: [
          { value: 'startup', label: '1-10 employees' },
          { value: 'small', label: '11-50 employees' },
          { value: 'medium', label: '51-200 employees' },
          { value: 'large', label: '200+ employees' },
        ],
      },
      'system'
    );

    // Contact fields
    this.createField(
      {
        name: 'department',
        label: 'Department',
        type: 'text',
        resource: 'contact',
        required: false,
        visible: true,
        searchable: true,
        order: 1,
        placeholder: 'e.g., Engineering, Sales, Marketing',
      },
      'system'
    );

    this.createField(
      {
        name: 'direct_phone',
        label: 'Direct Phone',
        type: 'phone',
        resource: 'contact',
        required: false,
        visible: true,
        searchable: true,
        order: 2,
      },
      'system'
    );

    // Deal fields
    this.createField(
      {
        name: 'expected_close_date',
        label: 'Expected Close Date',
        type: 'date',
        resource: 'deal',
        required: true,
        visible: true,
        searchable: false,
        order: 1,
      },
      'system'
    );

    this.createField(
      {
        name: 'is_qualified',
        label: 'Qualified Deal',
        type: 'checkbox',
        resource: 'deal',
        required: false,
        visible: true,
        searchable: true,
        order: 2,
      },
      'system'
    );
  }
}

// Singleton instance
export const customFieldsService = new CustomFieldsService();
