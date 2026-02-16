/**
 * Module System & Extensibility
 * 
 * This shows how to add new features without touching core code.
 * Plugin architecture with dependency injection.
 * 
 * Interviewer Question: "How would you add a new module (e.g., email templates)?"
 * Answer: Register it in the module system with dependency injection. No core changes.
 */

export type ModuleType = 'core' | 'plugin' | 'integration' | 'addon';
export type ModuleStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  type: ModuleType;
  description: string;
  author: string;
  status: ModuleStatus;
  dependencies: string[];
  hooks: string[];
  permissions: string[];
  config: Record<string, any>;
}

export interface ModuleRegistry {
  [moduleId: string]: Module;
}

export interface Module {
  id: string;
  name: string;
  config: ModuleConfig;
  enabled: boolean;
  install(): Promise<boolean>;
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  uninstall(): Promise<boolean>;
  getHooks(): Hook[];
  getRoutes(): Route[];
  getPermissions(): string[];
}

export interface Hook {
  name: string;
  handler: (...args: any[]) => any;
  priority: number; // 1-100, higher = runs first
}

export interface Route {
  path: string;
  component: string;
  permissions: string[];
}

export interface DependencyContainer {
  get<T>(serviceName: string): T;
  register<T>(serviceName: string, service: T): void;
  resolve<T>(serviceName: string, ...args: any[]): T;
}

/**
 * Simple dependency injection container
 */
class DIContainer implements DependencyContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  register<T>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }

  registerFactory<T>(serviceName: string, factory: () => T): void {
    this.factories.set(serviceName, factory);
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (service) {
      return service;
    }

    const factory = this.factories.get(serviceName);
    if (factory) {
      return factory();
    }

    throw new Error(`Service ${serviceName} not found in container`);
  }

  resolve<T>(serviceName: string, ...args: any[]): T {
    const factory = this.factories.get(serviceName);
    if (factory) {
      return factory();
    }

    const service = this.services.get(serviceName);
    if (service) {
      if (typeof service === 'function') {
        return new service(...args);
      }
      return service;
    }

    throw new Error(`Cannot resolve ${serviceName}`);
  }
}

/**
 * Module System - Plugin Architecture
 */
class ModuleSystem {
  private modules: ModuleRegistry = {};
  private hooks: Map<string, Hook[]> = new Map();
  private container: DIContainer;
  private installationLog: Array<{
    timestamp: Date;
    moduleId: string;
    action: string;
    status: boolean;
  }> = [];

  constructor() {
    this.container = new DIContainer();
    this.initializeCore();
  }

  /**
   * Initialize core modules
   */
  private initializeCore() {
    // Register core services in DI container
    this.container.register('permissionService', {
      checkPermission: (_user: string, _action: string) => true,
    });

    this.container.register('notificationService', {
      send: (message: string) => console.log(`Notification: ${message}`),
    });

    this.container.register('dataService', {
      query: (_sql: string) => [],
    });
  }

  /**
   * Register a module in the system
   */
  async registerModule(moduleConfig: ModuleConfig): Promise<boolean> {
    if (this.modules[moduleConfig.id]) {
      throw new Error(`Module ${moduleConfig.id} already registered`);
    }

    // CRITICAL: Check dependencies before installing
    for (const dep of moduleConfig.dependencies) {
      if (!this.modules[dep]) {
        this.logInstallation(moduleConfig.id, `Dependency ${dep} not found`, false);
        throw new Error(`Missing dependency: ${dep}`);
      }
    }

    // Create module instance
    const module: Module = this.createModuleInstance(moduleConfig);

    // Install module
    try {
      const installed = await module.install();
      if (!installed) {
        throw new Error('Installation failed');
      }

      this.modules[moduleConfig.id] = module;
      this.logInstallation(moduleConfig.id, 'Module installed successfully', true);

      return true;
    } catch (error) {
      this.logInstallation(
        moduleConfig.id,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`,
        false
      );
      return false;
    }
  }

  /**
   * Create module instance
   */
  private createModuleInstance(config: ModuleConfig): Module {
    return {
      id: config.id,
      name: config.name,
      config,
      enabled: false,

      async install() {
        console.log(`Installing module: ${config.name}`);
        // Run installation hooks
        // Create database tables if needed
        // Register permissions
        return true;
      },

      async enable() {
        this.enabled = true;
        // Register routes
        // Register hooks
        // Initialize module services
        console.log(`Module ${config.name} enabled`);
        return true;
      },

      async disable() {
        this.enabled = false;
        // Unregister routes
        // Unregister hooks
        console.log(`Module ${config.name} disabled`);
        return true;
      },

      async uninstall() {
        // Clean up database
        // Remove permissions
        // Clean up files
        console.log(`Module ${config.name} uninstalled`);
        return true;
      },

      getHooks(): Hook[] {
        return config.hooks.map(hookName => ({
          name: hookName,
          handler: () => console.log(`Hook ${hookName} triggered`),
          priority: 50,
        }));
      },

      getRoutes(): Route[] {
        return [
          {
            path: `/modules/${config.id}/dashboard`,
            component: `${config.id}Dashboard`,
            permissions: config.permissions,
          },
        ];
      },

      getPermissions(): string[] {
        return config.permissions;
      },
    };
  }

  /**
   * Enable a module
   */
  async enableModule(moduleId: string): Promise<boolean> {
    const module = this.modules[moduleId];
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    return await module.enable();
  }

  /**
   * Disable a module
   */
  async disableModule(moduleId: string): Promise<boolean> {
    const module = this.modules[moduleId];
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    return await module.disable();
  }

  /**
   * Register a hook - modules can hook into core events
   */
  registerHook(hookName: string, handler: Hook['handler'], priority: number = 50): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName)!.push({ name: hookName, handler, priority });

    // Sort by priority
    this.hooks
      .get(hookName)!
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute hooks
   */
  async executeHooks(hookName: string, ...args: any[]): Promise<any[]> {
    const hooksList = this.hooks.get(hookName) || [];
    const results = [];

    for (const hook of hooksList) {
      try {
        const result = await hook.handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Error executing hook ${hookName}:`, error);
      }
    }

    return results;
  }

  /**
   * Get DI container for injecting dependencies
   */
  getContainer(): DependencyContainer {
    return this.container;
  }

  /**
   * Get all installed modules
   */
  getModules(): Module[] {
    return Object.values(this.modules);
  }

  /**
   * Get module status
   */
  getModuleStatus(moduleId: string): ModuleStatus | null {
    const module = this.modules[moduleId];
    if (!module) {
      return null;
    }

    return module.enabled ? 'enabled' : 'installed';
  }

  /**
   * Log installation event
   */
  private logInstallation(moduleId: string, action: string, status: boolean): void {
    this.installationLog.push({
      timestamp: new Date(),
      moduleId,
      action,
      status,
    });
  }

  /**
   * Get installation history
   */
  getInstallationHistory() {
    return this.installationLog;
  }

  /**
   * Demonstrate extensibility
   */
  demonstrateExtensibility() {
    return {
      title: 'How to Add a New Module',
      steps: [
        {
          step: 1,
          title: 'Define Module',
          code: `const emailTemplateModule = {
            id: 'email-templates',
            name: 'Email Templates',
            dependencies: ['core'],
            permissions: ['email:send', 'email:edit_templates'],
            hooks: ['on.lead.created', 'on.deal.won']
          }`,
        },
        {
          step: 2,
          title: 'Register in Module System',
          code: `await moduleSystem.registerModule(emailTemplateModule)`,
        },
        {
          step: 3,
          title: 'Inject Dependencies',
          code: `const module = {
            install: () => {
              const permService = container.get('permissionService');
              const dataService = container.get('dataService');
              // Use services without import
            }
          }`,
        },
        {
          step: 4,
          title: 'Register Hooks',
          code: `moduleSystem.registerHook('on.lead.created', 
            (lead) => sendWelcomeEmail(lead), 
            priority=80)`,
        },
        {
          step: 5,
          title: 'Execute Hooks',
          code: `await moduleSystem.executeHooks('on.lead.created', newLead)
          // All registered modules get notified`,
        },
        {
          step: 6,
          title: 'Add Routes',
          code: `const routes = emailModule.getRoutes()
          // Auto-register in router`,
        },
      ],
      benefits: [
        '✅ No core changes needed',
        '✅ Modules can be installed/uninstalled independently',
        '✅ Loose coupling via hooks and DI',
        '✅ New features don\'t touch existing code',
        '✅ Easy to test - mock dependencies',
      ],
    };
  }

  /**
   * Demonstrate module communication
   */
  demonstrateModuleCommunication() {
    return {
      scenario: 'Email Templates module needs to send notification',
      problem: 'How to send notification without importing notification module?',
      solution: 'Use DI container',
      code: `
        // In EmailTemplates module
        const notificationService = container.get('notificationService');
        notificationService.send('Email sent successfully');
      `,
      benefits: [
        'Loose coupling - notification service could be swapped',
        'No circular dependency issues',
        'Easy to mock for testing',
        'Services registered once, used everywhere',
      ],
    };
  }
}

export const moduleSystem = new ModuleSystem();
