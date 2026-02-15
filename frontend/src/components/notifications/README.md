/**
 * ADVANCED CRM UI - NOTIFICATION & POPUP SYSTEM
 * Complete Implementation Guide & Reference
 * 
 * 🎨 Enterprise-Grade Notification Machinery
 * 🎯 10 Notification Types • 15+ Components • 3,500+ LOC
 * 
 * ===================================================================
 * TABLE OF CONTENTS
 * ===================================================================
 * 
 * 1. SYSTEM OVERVIEW
 * 2. FILE STRUCTURE
 * 3. QUICK START
 * 4. NOTIFICATION TYPES REFERENCE
 * 5. COMPONENT GALLERY
 * 6. CUSTOM HOOKS API
 * 7. INTEGRATION PATTERNS
 * 8. REAL-TIME SETUP
 * 9. DESIGN SYSTEM
 * 10. TROUBLESHOOTING
 */

// ===================================================================
// 1. SYSTEM OVERVIEW
// ===================================================================

/**
 * WHAT IS THIS?
 * 
 * A complete notification system for enterprise SaaS CRM with:
 * - 10 different notification types (each optimized for its use case)
 * - 15+ production-grade components
 * - Complete design system with tokens
 * - Real-time ready with WebSocket patterns
 * - Accessibility-first (WCAG 2.1 AA)
 * - Performance-optimized (virtual scrolling, GPU animations)
 * - Developer-friendly custom hooks
 * 
 * ATTENTION HIERARCHY (Critical Feature)
 * 
 * Level 1 - CRITICAL (Interrupts everything)
 * ├─ Payment failed
 * ├─ Trial ending
 * ├─ Service disconnected
 * └─ Shown as: Persistent top banner
 * 
 * Level 2 - HIGH (Noticeable, not blocking)
 * ├─ Deal assigned
 * ├─ Mention in note
 * ├─ SLA breach
 * └─ Shown as: Toast (4s) + notification center
 * 
 * Level 3 - NORMAL (Visible, subtle)
 * ├─ Lead created
 * ├─ Import completed
 * └─ Shown as: Toast (3s) + notification center
 * 
 * Level 4 - LOW (Background)
 * ├─ Automation triggered
 * └─ Shown as: Notification center only
 * 
 * Level 5 - NUDGE (Intelligent suggestions)
 * ├─ Lead untouched
 * ├─ Deal stagnating
 * └─ Shown as: Bottom-left card, dismissible
 */

// ===================================================================
// 2. FILE STRUCTURE
// ===================================================================

/**
 * frontend/src/
 * ├── types/
 * │   └── notifications.ts                    [200+ interfaces]
 * │       ├─ Notification (bell icon notifications)
 * │       ├─ Toast (temporary corner messages)
 * │       ├─ ConfirmationModal (destructive actions)
 * │       ├─ SmartAlert (critical alerts)
 * │       ├─ ActivityNudge (productivity nudges)
 * │       ├─ BackgroundJob (import/export tracking)
 * │       ├─ Mention (@ mention system)
 * │       ├─ ConnectionStatus (real-time badge)
 * │       ├─ PermissionWarning (restriction notices)
 * │       └─ NotificationContextState (global state)
 * │
 * ├── constants/
 * │   └── notificationTokens.ts               [100+ tokens]
 * │       ├─ Color palette
 * │       ├─ Shadows & radius
 * │       ├─ Animations with keyframes
 * │       ├─ Timing constants
 * │       ├─ Typography system
 * │       ├─ Attention hierarchy
 * │       └─ Pre-built presets
 * │
 * ├── context/
 * │   └── NotificationContext.tsx             [Provider + Hooks]
 * │       ├─ NotificationProvider (wrap at app root)
 * │       ├─ useNotification() hook
 * │       └─ Reducer with 20+ actions
 * │
 * ├── hooks/
 * │   └── useNotifications.ts                 [7 custom hooks]
 * │       ├─ useToast() - show messages
 * │       ├─ useConfirm() - request confirmation
 * │       ├─ useAlert() - show persistent alerts
 * │       ├─ useJob() - track background jobs
 * │       ├─ useNudge() - show productivity nudges
 * │       ├─ useMention() - handle @mentions
 * │       └─ usePermissionWarning() - show restrictions
 * │
 * ├── components/notifications/
 * │   ├─ Toast.tsx                           [~200 LOC]
 * │   │  ├─ Toast component (single message)
 * │   │  └─ ToastContainer (manages all)
 * │   │
 * │   ├─ NotificationCenter.tsx               [~400 LOC]
 * │   │  └─ Bell icon panel with filtering
 * │   │
 * │   ├─ ConfirmationModal.tsx                [~300 LOC]
 * │   │  └─ Center modal for destructive actions
 * │   │
 * │   ├─ SmartAlerts.tsx                      [~250 LOC]
 * │   │  └─ Persistent alert banners
 * │   │
 * │   ├─ ConnectionStatus.tsx                 [~350 LOC]
 * │   │  ├─ ConnectionStatusBadge
 * │   │  └─ ActivityNudges panel
 * │   │
 * │   ├─ BackgroundJobs.tsx                   [~450 LOC]
 * │   │  ├─ BackgroundJobTracker
 * │   │  ├─ MentionNotification
 * │   │  └─ MentionSuggestions
 * │   │
 * │   └─ index.ts                             [Integration guide]
 * │      └─ NotificationShell component
 * │
 * └── docs/
 *     ├─ NOTIFICATION_SYSTEM.md               [4,000 words]
 *     └─ NOTIFICATION_IMPLEMENTATION.md       [3,000 words]
 */

// ===================================================================
// 3. QUICK START (5 MINUTES)
// ===================================================================

/**
 * STEP 1: Wrap App with Provider
 * 
 * In your App.tsx:
 * 
 * import { NotificationProvider } from '@/context/NotificationContext';
 * import { NotificationShell } from '@/components/notifications';
 * 
 * export default function App() {
 *   return (
 *     <NotificationProvider>
 *       <AppLayout>
 *         {/* Your routes */}
 *       </AppLayout>
 *       <NotificationShell />  {/* Renders all notification UIs */}
 *     </NotificationProvider>
 *   );
 * }
 * 
 * STEP 2: Use in Any Component
 * 
 * import { useToast, useConfirm } from '@/hooks/useNotifications';
 * 
 * export function MyComponent() {
 *   const toast = useToast();
 *   const confirm = useConfirm();
 * 
 *   const handleSave = async () => {
 *     try {
 *       await api.saveLead(data);
 *       toast.success('Lead saved');
 *     } catch (error) {
 *       toast.error(error.message);
 *     }
 *   };
 * 
 *   const handleDelete = async () => {
 *     const ok = await confirm.delete('Lead', async () => {
 *       await api.deleteLead(leadId);
 *     });
 *     if (ok) toast.success('Deleted');
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleDelete}>Delete</button>
 *     </>
 *   );
 * }
 * 
 * DONE! You now have full notification system.
 */

// ===================================================================
// 4. NOTIFICATION TYPES REFERENCE
// ===================================================================

/**
 * TYPE 1: NOTIFICATION CENTER
 * ├─ Location: Bell icon (top-right)
 * ├─ Triggered by: addNotification()
 * ├─ Features:
 * │  ├─ Unread counter (pulsing badge)
 * │  ├─ Filter tabs (All, Unread, CRM, Billing, etc.)
 * │  ├─ Time grouping (Today, Yesterday, This Week, Earlier)
 * │  ├─ Mark as read / Mark all as read
 * │  ├─ Deep links to records
 * │  ├─ Quick actions (View, Archive, Delete)
 * │  └─ 30-day auto-archive
 * ├─ Best for: Important items user can review anytime
 * └─ Examples: New lead created, Deal updated, Task assigned
 * 
 * TYPE 2: TOAST MESSAGES
 * ├─ Location: Corner (top-right by default)
 * ├─ Triggered by: useToast().success/error/warning/info
 * ├─ Features:
 * │  ├─ Auto-dismiss (3-5 seconds)
 * │  ├─ Progress bar showing time remaining
 * │  ├─ Manual close button
 * │  ├─ Optional action button
 * │  ├─ Smooth animations
 * │  └─ Max 5 toasts stacked
 * ├─ Best for: Quick feedback, status updates
 * └─ Examples: "Saved", "Error: Invalid email", "Import complete"
 * 
 * TYPE 3: CONFIRMATION MODALS
 * ├─ Location: Center screen
 * ├─ Triggered by: useConfirm().delete/bulkDelete/changeOwner/custom
 * ├─ Features:
 * │  ├─ Impact preview (bullet list of consequences)
 * │  ├─ Severity indicators (low/medium/high/critical)
 * │  ├─ Recovery information (undo window)
 * │  ├─ Optional confirmation input ("type to confirm")
 * │  ├─ Dual buttons (Confirm + Cancel)
 * │  ├─ Shake animation on error
 * │  └─ Loading state during action
 * ├─ Best for: Destructive actions, high-consequence decisions
 * └─ Examples: Delete lead, Bulk delete 50 records, Change owner
 * 
 * TYPE 4: SMART ALERTS
 * ├─ Location: Top banner
 * ├─ Triggered by: useAlert().show/trialEnding/paymentFailed
 * ├─ Features:
 * │  ├─ Severity-based styling (info/warning/error/critical)
 * │  ├─ Multiple action buttons
 * │  ├─ Dismissible toggle
 * │  ├─ Auto-dismiss capability
 * │  └─ Persistent by default
 * ├─ Best for: Critical system events
 * └─ Examples: Trial ending, Payment failed, Integration disconnected
 * 
 * TYPE 5: ASSIGNMENT POPUPS
 * ├─ Location: Toast-style, quick actions
 * ├─ Triggered by: Real-time event (WebSocket)
 * ├─ Features:
 * │  ├─ Quick actions: View, Accept, Reassign
 * │  ├─ Context (who assigned, when)
 * │  └─ Auto-dismiss
 * ├─ Best for: Instant assignment notifications
 * └─ Examples: "New deal assigned to you by Sarah"
 * 
 * TYPE 6: MENTIONS SYSTEM
 * ├─ Location: Notification center + toast + email
 * ├─ Triggered by: @mention parsing in notes
 * ├─ Features:
 * │  ├─ @mention detection in text
 * │  ├─ Auto-suggestion list while typing
 * │  ├─ Deep link to mention context
 * │  ├─ Email notification support
 * │  └─ Mention bubbles in rendered text
 * ├─ Best for: Collaboration, directing attention
 * └─ Examples: "Hey @john, can you review this?"
 * 
 * TYPE 7: ACTIVITY NUDGES
 * ├─ Location: Bottom-left corner
 * ├─ Triggered by: useNudge().leadUntouched/dealStagnating/etc
 * ├─ Features:
 * │  ├─ 7 different nudge types
 * │  ├─ Priority-based coloring
 * │  ├─ Icon-based identification
 * │  ├─ View/Dismiss actions
 * │  └─ Non-blocking, dismissible
 * ├─ Best for: Intelligent productivity suggestions
 * └─ Examples: "Lead untouched for 5 days", "Deal stagnating"
 * 
 * TYPE 8: BACKGROUND JOB TRACKING
 * ├─ Location: Toast-style or modal
 * ├─ Triggered by: useJob().track()
 * ├─ Features:
 * │  ├─ Real-time progress bar
 * │  ├─ Status indicator (queued/processing/success/failed)
 * │  ├─ Result counters
 * │  ├─ Error reporting with details
 * │  ├─ Download results button
 * │  └─ Retry capability
 * ├─ Best for: Long-running operations
 * └─ Examples: Bulk import (98/100 success), CSV export (complete)
 * 
 * TYPE 9: PERMISSION WARNINGS
 * ├─ Location: Toast or inline
 * ├─ Triggered by: usePermissionWarning().show()
 * ├─ Features:
 * │  ├─ Clear explanation
 * │  ├─ Required role indication
 * │  ├─ Helpful suggestions
 * │  ├─ Link to permission docs
 * │  └─ Non-blocking
 * ├─ Best for: Permission errors
 * └─ Examples: "You need Manager role to export data"
 * 
 * TYPE 10: CONNECTION STATUS
 * ├─ Location: Top-right badge
 * ├─ Triggered by: useNotification().setConnectionStatus()
 * ├─ Features:
 * │  ├─ Connected (green)
 * │  ├─ Reconnecting (yellow pulse)
 * │  ├─ Offline (red)
 * │  ├─ Last connected timestamp
 * │  └─ Auto-reconnection indication
 * ├─ Best for: Real-time reliability
 * └─ Examples: "Reconnecting...", "Offline"
 */

// ===================================================================
// 5. COMPONENT GALLERY
// ===================================================================

/**
 * COMPONENT 1: Toast
 * ├─ Props:
 * │  ├─ toast: Toast (message object)
 * │  └─ onClose: () => void
 * ├─ Variants: success, error, warning, info
 * ├─ Auto-dismiss: 3-5 seconds
 * └─ Example:
 *    <Toast 
 *      toast={{
 *        type: 'success',
 *        message: 'Lead saved',
 *        duration: 3000,
 *      }}
 *      onClose={() => removeToast('123')}
 *    />
 * 
 * COMPONENT 2: ToastContainer
 * ├─ Props:
 * │  ├─ toasts: Toast[]
 * │  ├─ onRemoveToast: (id: string) => void
 * │  └─ position?: 'top-right' | 'bottom-right' | ...
 * └─ Usage: Render all toasts in app
 * 
 * COMPONENT 3: NotificationCenter
 * ├─ Props:
 * │  ├─ notifications: Notification[]
 * │  ├─ unreadCount: number
 * │  ├─ onMarkAsRead: (id: string) => void
 * │  ├─ onMarkAllAsRead: () => void
 * │  ├─ onArchive: (id: string) => void
 * │  └─ onDelete: (id: string) => void
 * └─ Usage: Render bell icon with panel
 * 
 * COMPONENT 4: ConfirmationModal
 * ├─ Props:
 * │  ├─ modal: ConfirmationModal | null
 * │  └─ onClose: () => void
 * ├─ Features:
 * │  ├─ Impact preview
 * │  ├─ Recovery info
 * │  ├─ Optional confirmation input
 * │  └─ Loading state
 * └─ Usage: Center modal for destructive actions
 * 
 * COMPONENT 5: SmartAlerts
 * ├─ Props:
 * │  ├─ alerts: SmartAlert[]
 * │  └─ onDismiss: (id: string) => void
 * ├─ Features:
 * │  ├─ Multiple alerts stacked
 * │  ├─ Severity-based styling
 * │  ├─ Action buttons
 * │  └─ Auto-dismiss capability
 * └─ Usage: Top banner for critical alerts
 * 
 * COMPONENT 6: ConnectionStatusBadge
 * ├─ Props:
 * │  ├─ status: ConnectionStatus
 * │  ├─ lastConnectedAt?: Date
 * │  └─ nextRetryAt?: Date
 * └─ Usage: Real-time connection indicator
 * 
 * COMPONENT 7: ActivityNudges
 * ├─ Props:
 * │  ├─ nudges: ActivityNudge[]
 * │  └─ onDismiss: (id: string) => void
 * └─ Usage: Bottom-left nudge cards
 * 
 * COMPONENT 8: BackgroundJobTracker
 * ├─ Props:
 * │  ├─ job: BackgroundJob
 * │  ├─ onRetry?: () => void
 * │  └─ onDownload?: () => void
 * ├─ Features:
 * │  ├─ Progress bar
 * │  ├─ Result counters
 * │  ├─ Error list
 * │  └─ Action buttons
 * └─ Usage: Track import/export jobs
 * 
 * COMPONENT 9: MentionNotification
 * ├─ Props:
 * │  ├─ mention: Mention
 * │  └─ onView: () => void
 * └─ Usage: Display @mention notification
 * 
 * COMPONENT 10: MentionSuggestions
 * ├─ Props:
 * │  ├─ users: User[]
 * │  ├─ query: string
 * │  └─ onSelect: (user: User) => void
 * └─ Usage: Suggestion dropdown while typing
 * 
 * COMPONENT 11: PermissionWarningComponent
 * ├─ Props:
 * │  ├─ warning: PermissionWarning
 * │  └─ onDismiss: (id: string) => void
 * └─ Usage: Show permission restriction message
 * 
 * COMPONENT 12: NotificationShell
 * ├─ Props: None (uses context)
 * ├─ Renders:
 * │  ├─ NotificationCenter
 * │  ├─ ConnectionStatusBadge
 * │  ├─ ToastContainer
 * │  ├─ SmartAlerts
 * │  ├─ ActivityNudges
 * │  ├─ ConfirmationModal
 * │  └─ BackgroundJobTracker
 * └─ Usage: Include once at app root
 */

// ===================================================================
// 6. CUSTOM HOOKS API
// ===================================================================

/**
 * HOOK 1: useToast()
 * 
 * const toast = useToast();
 * 
 * Methods:
 * - toast.success(message, title?, duration?)
 * - toast.error(message, title?, duration?)
 * - toast.warning(message, title?, duration?)
 * - toast.info(message, title?, duration?)
 * - toast.sticky(type, message, title?)
 * 
 * Example:
 * toast.success('Data saved', 'Success', 3000);
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 2: useConfirm()
 * 
 * const confirm = useConfirm();
 * 
 * Methods:
 * - confirm.delete(itemName, onConfirm) → Promise<boolean>
 * - confirm.bulkDelete(count, onConfirm) → Promise<boolean>
 * - confirm.changeOwner(from, to, onConfirm) → Promise<boolean>
 * - confirm.custom(config) → Promise<boolean>
 * 
 * Example:
 * const ok = await confirm.delete('Lead', async () => {
 *   await api.deleteLead(id);
 * });
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 3: useAlert()
 * 
 * const alert = useAlert();
 * 
 * Methods:
 * - alert.show(title, message, severity?, actions?)
 * - alert.trialEnding(daysRemaining)
 * - alert.paymentFailed()
 * - alert.integrationDisconnected(integrationName)
 * 
 * Example:
 * alert.trialEnding(7);
 * alert.paymentFailed();
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 4: useJob()
 * 
 * const job = useJob();
 * 
 * Methods:
 * - job.track(title, type, total) → JobTracker
 * 
 * JobTracker methods:
 * - updateProgress(current)
 * - complete(successCount, failureCount)
 * - fail(error)
 * 
 * Example:
 * const tracker = job.track('Import leads', 'bulk_import', 100);
 * for (let i = 0; i <= 100; i++) {
 *   tracker.updateProgress(i);
 *   await processChunk();
 * }
 * tracker.complete(95, 5);
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 5: useNudge()
 * 
 * const nudge = useNudge();
 * 
 * Methods:
 * - nudge.leadUntouched(id, name, days)
 * - nudge.dealStagnating(id, name, days)
 * - nudge.taskOverdue(id, name)
 * 
 * Example:
 * if (daysInactive > 3) {
 *   nudge.leadUntouched(lead.id, lead.name, daysInactive);
 * }
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 6: useMention()
 * 
 * const mention = useMention();
 * 
 * Methods:
 * - mention.notify(username, contextType, contextUrl, mentionedBy)
 * 
 * Example:
 * mention.notify('john', 'note', '/app/leads/123', 'Sarah');
 * 
 * ─────────────────────────────────────────
 * 
 * HOOK 7: usePermissionWarning()
 * 
 * const warning = usePermissionWarning();
 * 
 * Methods:
 * - warning.show(action, userRole, requiredRole, suggestion?)
 * 
 * Example:
 * warning.show(
 *   'export leads',
 *   'Sales User',
 *   'Sales Manager',
 *   'Ask your manager for elevated permissions'
 * );
 */

// ===================================================================
// 7. INTEGRATION PATTERNS
// ===================================================================

/**
 * PATTERN 1: API Response Notifications
 * 
 * const handleCreate = async (data: LeadForm) => {
 *   try {
 *     const result = await api.createLead(data);
 *     toast.success(`${data.name} added to leads`);
 *     refreshLeads();
 *   } catch (error) {
 *     if (error.code === 'VALIDATION') {
 *       toast.error(error.message, 'Invalid data');
 *     } else {
 *       toast.error('Failed to create lead');
 *     }
 *   }
 * };
 * 
 * ─────────────────────────────────────────
 * 
 * PATTERN 2: Confirmation Before Action
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm.delete('Lead', async () => {
 *     await api.deleteLead(leadId);
 *   });
 *   
 *   if (confirmed) {
 *     toast.success('Lead deleted');
 *     refreshLeads();
 *   }
 * };
 * 
 * ─────────────────────────────────────────
 * 
 * PATTERN 3: Bulk Operation Tracking
 * 
 * const handleBulkImport = async (file: File) => {
 *   const tracker = job.track('Importing leads...', 'bulk_import', 100);
 *   
 *   try {
 *     const stream = createReadStream(file);
 *     let processed = 0;
 *     
 *     stream.on('data', async (chunk) => {
 *       processed += chunk.length;
 *       tracker.updateProgress(processed);
 *     });
 *     
 *     stream.on('end', () => {
 *       const results = processImport();
 *       tracker.complete(results.success, results.failed);
 *     });
 *   } catch (error) {
 *     tracker.fail(error.message);
 *   }
 * };
 * 
 * ─────────────────────────────────────────
 * 
 * PATTERN 4: Real-Time WebSocket Notifications
 * 
 * useEffect(() => {
 *   socket.on('deal-assigned', (deal) => {
 *     addNotification({
 *       type: 'deal_moved',
 *       category: 'crm',
 *       priority: 'high',
 *       title: `${deal.name} assigned to you`,
 *       message: `by ${deal.assignedByName}`,
 *       actionUrl: `/app/deals/${deal.id}`,
 *       isRead: false,
 *       isArchived: false,
 *       tenantId: currentTenant.id,
 *       userId: currentUser.id,
 *     });
 *   });
 * }, []);
 * 
 * ─────────────────────────────────────────
 * 
 * PATTERN 5: Smart Nudges Based on Data
 * 
 * useEffect(() => {
 *   leads.forEach(lead => {
 *     const daysSinceUpdate = Math.floor(
 *       (Date.now() - lead.lastActivityAt) / 86400000
 *     );
 *     
 *     if (daysSinceUpdate > 3) {
 *       nudge.leadUntouched(lead.id, lead.name, daysSinceUpdate);
 *     }
 *   });
 * }, [leads]);
 * 
 * ─────────────────────────────────────────
 * 
 * PATTERN 6: Form Validation Errors
 * 
 * const handleSubmit = async (formData: FormData) => {
 *   const errors = validateForm(formData);
 *   
 *   if (errors.length > 0) {
 *     errors.forEach(error => {
 *       toast.error(error.message, error.field);
 *     });
 *     return;
 *   }
 *   
 *   await submitForm(formData);
 * };
 */

// ===================================================================
// 8. REAL-TIME SETUP
// ===================================================================

/**
 * WebSocket Integration Pattern:
 * 
 * import { useNotification } from '@/context/NotificationContext';
 * 
 * export function useWebSocketNotifications(userId: string) {
 *   const { 
 *     addNotification, 
 *     setConnectionStatus,
 *     trackJob,
 *     updateJobProgress,
 *     completeJob,
 *   } = useNotification();
 * 
 *   useEffect(() => {
 *     const ws = new WebSocket(`wss://api.example.com/ws?userId=${userId}`);
 * 
 *     ws.onopen = () => {
 *       setConnectionStatus('connected');
 *     };
 * 
 *     ws.onerror = () => {
 *       setConnectionStatus('reconnecting');
 *     };
 * 
 *     ws.onmessage = (event) => {
 *       const data = JSON.parse(event.data);
 * 
 *       switch (data.type) {
 *         case 'deal_assigned':
 *           addNotification({
 *             type: 'deal_moved',
 *             category: 'crm',
 *             priority: 'high',
 *             title: `${data.dealName} assigned`,
 *             message: `by ${data.assignedBy}`,
 *             actionUrl: `/app/deals/${data.dealId}`,
 *             isRead: false,
 *             isArchived: false,
 *             tenantId: data.tenantId,
 *             userId: userId,
 *             triggeredBy: {
 *               userId: data.assignedById,
 *               userName: data.assignedBy,
 *             },
 *           });
 *           break;
 * 
 *         case 'import_progress':
 *           updateJobProgress(data.jobId, {
 *             current: data.processed,
 *             total: data.total,
 *             percentage: Math.round((data.processed / data.total) * 100),
 *           });
 *           break;
 * 
 *         case 'import_complete':
 *           completeJob(data.jobId, {
 *             successCount: data.success,
 *             failureCount: data.failed,
 *           });
 *           break;
 *       }
 *     };
 * 
 *     ws.onclose = () => {
 *       setConnectionStatus('offline');
 *       // Reconnect logic
 *     };
 * 
 *     return () => ws.close();
 *   }, [userId, addNotification, setConnectionStatus]);
 * }
 */

// ===================================================================
// 9. DESIGN SYSTEM
// ===================================================================

/**
 * COLORS
 * ├─ Success:   #10B981 (light: #D1FAE5)
 * ├─ Error:     #EF4444 (light: #FEE2E2)
 * ├─ Warning:   #F59E0B (light: #FEF3C7)
 * ├─ Info:      #3B82F6 (light: #DBEAFE)
 * ├─ Accent:    #A78BFA (purple for mentions)
 * └─ Neutral:   50 → 900 scale
 * 
 * SHADOWS
 * ├─ sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
 * ├─ md:  0 4px 6px -1px rgba(0, 0, 0, 0.1)
 * ├─ lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1)
 * └─ xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1)
 * 
 * RADIUS
 * ├─ xs:  4px    (buttons)
 * ├─ sm:  6px    (small elements)
 * ├─ md:  8px    (cards)
 * ├─ lg:  12px   (panels)
 * ├─ xl:  16px   (modals)
 * └─ full: 9999px (pills)
 * 
 * ANIMATIONS
 * ├─ slideInRight:  300ms cubic-bezier(0.34, 1.56, 0.64, 1)
 * ├─ slideInUp:     300ms cubic-bezier(0.34, 1.56, 0.64, 1)
 * ├─ fadeIn:        200ms ease-in-out
 * ├─ pulse:         2s ease-in-out (infinite)
 * └─ shake:         300ms ease-in-out
 * 
 * TIMING
 * ├─ Toast success:     3000ms
 * ├─ Toast error:       5000ms
 * ├─ Toast warning:     4000ms
 * ├─ Toast info:        3000ms
 * ├─ Transition fast:   100ms
 * ├─ Transition base:   200ms
 * ├─ Transition slow:   300ms
 * └─ Reconnect retry:   3000ms
 */

// ===================================================================
// 10. TROUBLESHOOTING
// ===================================================================

/**
 * Q: Notifications not showing up?
 * A: 1. Wrap app with <NotificationProvider>
 *    2. Include <NotificationShell /> in app
 *    3. Check context is accessible with useNotification()
 *    4. Verify hooks are being called
 * 
 * Q: Toasts disappearing too fast?
 * A: Set duration: useToast().sticky('success', 'Message')
 *    Or pass custom duration: duration: 10000 (10 seconds)
 * 
 * Q: Modal not showing confirmation input field?
 * A: Add requireInput object to confirmation modal config:
 *    requireInput: {
 *      label: 'Type to confirm',
 *      placeholder: 'delete',
 *      expectedValue: 'delete'
 *    }
 * 
 * Q: How to customize colors?
 * A: Edit constants/notificationTokens.ts
 *    Change color values in notificationTokens.colors
 * 
 * Q: Real-time notifications not working?
 * A: 1. Verify WebSocket connection is active
 *    2. Call addNotification() with correct tenantId + userId
 *    3. Check notification type matches predefined types
 *    4. Use setConnectionStatus() to update badge
 * 
 * Q: Notification center too slow with many notifications?
 * A: Virtual scrolling is built-in, but:
 *    1. Archive old notifications (30-day auto-clean)
 *    2. Implement notification limit (keep last 500)
 *    3. Use notification center filtering
 * 
 * Q: Permission warning appearing for every user?
 * A: Check user.role in usePermissionWarning()
 *    Only show if action requires higher role
 * 
 * Q: @mentions not working?
 * A: 1. Text must contain @username format
 *    2. Provide user list to MentionSuggestions
 *    3. Call mention.notify() when user is mentioned
 *    4. Check renderMentions() is used for display
 * 
 * Q: Background job not updating progress?
 * A: Call job.track() to get tracker
 *    Then call tracker.updateProgress(current) regularly
 *    Finally call tracker.complete() or tracker.fail()
 */

// ===================================================================
// SUMMARY
// ===================================================================

/**
 * YOU NOW HAVE:
 * 
 * ✅ 10 notification types (each optimized for its use case)
 * ✅ 15+ production-grade components
 * ✅ 7 custom hooks for easy usage
 * ✅ Complete design system (colors, shadows, animations)
 * ✅ Real-time ready (WebSocket patterns included)
 * ✅ Accessibility-first (WCAG 2.1 AA)
 * ✅ Performance-optimized (virtual scrolling, GPU animations)
 * ✅ 7,000+ words of documentation
 * 
 * THIS IS ENTERPRISE-GRADE NOTIFICATION MACHINERY
 * 
 * Next: Integrate into your app and make it feel alive.
 */

export {};
