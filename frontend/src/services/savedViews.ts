/**
 * Saved Views & Smart Filters
 * Allow users to create and save custom filtered views
 * 
 * Features:
 * - Preset views (My Hot Leads, Closing This Week, etc.)
 * - Custom view creation with filters
 * - Save/load/update views
 * - Quick access from toolbar
 * - Filter conditions with AND/OR logic
 */

export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'date_before' | 'date_after' | 'in_list';
export type FilterLogic = 'AND' | 'OR';
export type ViewType = 'lead' | 'contact' | 'deal';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  type: ViewType;
  filters: FilterCondition[];
  logic: FilterLogic;
  isDefault: boolean;
  isPinned: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  userId: string; // Owner
}

export class SavedViewsService {
  private views: SavedView[] = [];
  private nextId: number = 1;

  constructor() {
    this.loadDefaultViews();
  }

  /**
   * Create a new saved view
   */
  createView(
    name: string,
    description: string,
    type: ViewType,
    filters: FilterCondition[],
    userId: string,
    isPublic: boolean = false
  ): SavedView {
    if (this.views.some(v => v.name === name && v.userId === userId)) {
      throw new Error(`View "${name}" already exists`);
    }

    const view: SavedView = {
      id: `view-${this.nextId++}`,
      name,
      description,
      type,
      filters,
      logic: 'AND',
      isDefault: false,
      isPinned: false,
      isPublic,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId,
    };

    this.views.push(view);
    return view;
  }

  /**
   * Update a saved view
   */
  updateView(viewId: string, updates: Partial<SavedView>): SavedView | null {
    const view = this.views.find(v => v.id === viewId);
    if (!view) return null;

    const updated = { ...view, ...updates, updatedAt: Date.now() };
    const index = this.views.indexOf(view);
    this.views[index] = updated;

    return updated;
  }

  /**
   * Delete a saved view
   */
  deleteView(viewId: string): boolean {
    const index = this.views.findIndex(v => v.id === viewId);
    if (index === -1) return false;

    this.views.splice(index, 1);
    return true;
  }

  /**
   * Get all views for a user
   */
  getUserViews(userId: string): SavedView[] {
    return this.views.filter(v => v.userId === userId).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Get views by type and user
   */
  getViewsByType(userId: string, type: ViewType): SavedView[] {
    return this.getUserViews(userId).filter(v => v.type === type);
  }

  /**
   * Get a single view
   */
  getView(viewId: string): SavedView | undefined {
    return this.views.find(v => v.id === viewId);
  }

  /**
   * Toggle pin status
   */
  togglePin(viewId: string): SavedView | null {
    const view = this.getView(viewId);
    if (!view) return null;

    return this.updateView(viewId, { isPinned: !view.isPinned });
  }

  /**
   * Set as default view
   */
  setAsDefault(userId: string, viewId: string, type: ViewType): void {
    // Clear previous default
    this.getViewsByType(userId, type).forEach(v => {
      if (v.isDefault) {
        this.updateView(v.id, { isDefault: false });
      }
    });

    // Set new default
    this.updateView(viewId, { isDefault: true });
  }

  /**
   * Add a filter to a view
   */
  addFilter(viewId: string, condition: Omit<FilterCondition, 'id'>): SavedView | null {
    const view = this.getView(viewId);
    if (!view) return null;

    const newCondition: FilterCondition = {
      ...condition,
      id: `filter-${Date.now()}`,
    };

    const updated = [...view.filters, newCondition];
    return this.updateView(viewId, { filters: updated });
  }

  /**
   * Remove a filter from a view
   */
  removeFilter(viewId: string, filterId: string): SavedView | null {
    const view = this.getView(viewId);
    if (!view) return null;

    const updated = view.filters.filter(f => f.id !== filterId);
    return this.updateView(viewId, { filters: updated });
  }

  /**
   * Apply filters to a dataset
   */
  applyFilters<T extends Record<string, any>>(
    data: T[],
    view: SavedView
  ): T[] {
    if (view.filters.length === 0) return data;

    return data.filter(item => {
      const conditionResults = view.filters.map(filter =>
        this.evaluateCondition(item, filter)
      );

      return view.logic === 'AND'
        ? conditionResults.every(r => r)
        : conditionResults.some(r => r);
    });
  }

  /**
   * Evaluate a single filter condition
   */
  private evaluateCondition<T extends Record<string, any>>(
    item: T,
    condition: FilterCondition
  ): boolean {
    const value = item[condition.field];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'date_before':
        return new Date(value) < new Date(condition.value);
      case 'date_after':
        return new Date(value) > new Date(condition.value);
      case 'in_list':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return true;
    }
  }

  /**
   * Get statistics
   */
  getStats(userId: string): {
    total: number;
    pinned: number;
    byType: Record<ViewType, number>;
  } {
    const userViews = this.getUserViews(userId);
    const byType: Record<ViewType, number> = { lead: 0, contact: 0, deal: 0 };

    userViews.forEach(v => {
      byType[v.type]++;
    });

    return {
      total: userViews.length,
      pinned: userViews.filter(v => v.isPinned).length,
      byType,
    };
  }

  /**
   * Export views as JSON
   */
  exportViews(userId: string): string {
    return JSON.stringify(this.getUserViews(userId), null, 2);
  }

  /**
   * Import views from JSON
   */
  importViews(json: string, userId: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        imported.forEach(view => {
          this.views.push({ ...view, userId });
        });
      }
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Load default preset views
   */
  private loadDefaultViews(): void {
    const systemUserId = 'system';

    // Lead views
    this.createView(
      '🔥 My Hot Leads',
      'Qualified leads with high engagement',
      'lead',
      [
        {
          id: 'filter-1',
          field: 'status',
          operator: 'in_list',
          value: ['qualified', 'proposal'],
        },
        {
          id: 'filter-2',
          field: 'value',
          operator: 'greater_than',
          value: 50000,
        },
      ],
      systemUserId,
      true
    );

    this.views[this.views.length - 1].isDefault = true;
    this.views[this.views.length - 1].isPinned = true;

    this.createView(
      '📅 Closing This Week',
      'Deals expected to close within 7 days',
      'deal',
      [
        {
          id: 'filter-1',
          field: 'stage',
          operator: 'equals',
          value: 'closed-won',
        },
      ],
      systemUserId,
      true
    );

    this.views[this.views.length - 1].isPinned = true;

    this.createView(
      '💰 High Value Deals',
      'Deals worth $100k or more',
      'deal',
      [
        {
          id: 'filter-1',
          field: 'value',
          operator: 'greater_than',
          value: 100000,
        },
      ],
      systemUserId,
      true
    );

    this.createView(
      '🆕 New Leads',
      'Leads created in the last 7 days',
      'lead',
      [
        {
          id: 'filter-1',
          field: 'status',
          operator: 'equals',
          value: 'new',
        },
      ],
      systemUserId,
      true
    );

    this.views[this.views.length - 1].isPinned = true;

    this.createView(
      '⏰ Overdue Contacts',
      'Contacts not contacted in 30 days',
      'contact',
      [
        {
          id: 'filter-1',
          field: 'lastContact',
          operator: 'date_before',
          value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      systemUserId,
      true
    );
  }
}

// Singleton instance
export const savedViewsService = new SavedViewsService();
