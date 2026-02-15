/**
 * Design System Tokens - Notification Machinery
 * Colors, animations, spacing, timing
 * Creates the "premium, calm confidence" feel
 */

export const notificationTokens = {
  // ============================================================================
  // COLORS
  // ============================================================================
  colors: {
    // Success states
    success: {
      light: '#D1FAE5',    // Very light green background
      main: '#10B981',     // Primary green
      dark: '#065F46',     // Dark green for text
      border: '#6EE7B7',   // Light green border
    },

    // Error states
    error: {
      light: '#FEE2E2',    // Very light red background
      main: '#EF4444',     // Primary red
      dark: '#7F1D1D',     // Dark red for text
      border: '#FCA5A5',   // Light red border
    },

    // Warning states
    warning: {
      light: '#FEF3C7',    // Very light yellow background
      main: '#F59E0B',     // Primary amber
      dark: '#78350F',     // Dark amber for text
      border: '#FCD34D',   // Light amber border
    },

    // Info states
    info: {
      light: '#DBEAFE',    // Very light blue background
      main: '#3B82F6',     // Primary blue
      dark: '#1E3A8A',     // Dark blue for text
      border: '#93C5FD',   // Light blue border
    },

    // Neutral (notifications center, alerts)
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Accent colors for UI elements
    accent: {
      purple: '#A78BFA',   // For mentions/activity
      blue: '#3B82F6',     // For primary actions
      cyan: '#06B6D4',     // For real-time indicators
    },
  },

  // ============================================================================
  // SHADOWS
  // ============================================================================
  shadows: {
    // Subtle shadows for premium feel
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

    // Notification-specific
    notification: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    toast: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // ============================================================================
  // RADIUS (soft radius for premium feel)
  // ============================================================================
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  // ============================================================================
  // SPACING (notification-specific margins & padding)
  // ============================================================================
  spacing: {
    // Notification center
    notificationPadding: '12px 16px',
    notificationMargin: '8px 0',
    notificationGap: '8px',

    // Toast messages
    toastPadding: '16px 20px',
    toastMargin: '12px',
    toastGap: '12px',

    // Modal padding
    modalPadding: '24px',
    modalGap: '16px',

    // Alert banner
    alertPadding: '16px 20px',
    alertMargin: '16px 0',

    // Micro spacing
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },

  // ============================================================================
  // ANIMATIONS & TRANSITIONS
  // ============================================================================
  animations: {
    // Entrance animations
    slideInRight: {
      duration: '300ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring easing
      keyframes: `
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `,
    },

    slideInUp: {
      duration: '300ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      keyframes: `
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `,
    },

    fadeIn: {
      duration: '200ms',
      easing: 'ease-in-out',
      keyframes: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
    },

    // Exit animations
    slideOutRight: {
      duration: '200ms',
      easing: 'ease-in',
      keyframes: `
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `,
    },

    slideOutDown: {
      duration: '200ms',
      easing: 'ease-in',
      keyframes: `
        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(20px);
            opacity: 0;
          }
        }
      `,
    },

    // Attention animations
    pulse: {
      duration: '2s',
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      keyframes: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
    },

    shake: {
      duration: '300ms',
      easing: 'ease-in-out',
      keyframes: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `,
    },

    // Loading animation
    spin: {
      duration: '1s',
      easing: 'linear',
      keyframes: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
    },

    // Notification badge pulse
    badgePulse: {
      duration: '2s',
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      keyframes: `
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `,
    },
  },

  // ============================================================================
  // TIMING
  // ============================================================================
  timing: {
    // Toast display durations (in milliseconds)
    toastSuccess: 3000,     // Success messages fade after 3s
    toastError: 5000,       // Errors persist longer (5s)
    toastWarning: 4000,     // Warnings (4s)
    toastInfo: 3000,        // Info (3s)
    toastSticky: null,      // null = don't auto-dismiss

    // Alert display
    alertSticky: null,       // Smart alerts are persistent until action

    // Transition timings
    transitionFast: '100ms',
    transitionBase: '200ms',
    transitionSlow: '300ms',

    // Debounce/throttle timings
    debounceTyping: 300,
    debounceMark: 200,
    throttleScroll: 100,

    // Animation delays
    delayStagger: 50,        // For staggered animations
    delayModal: 150,         // Modal entrance delay

    // Reconnection attempts
    reconnectInterval: 3000, // 3 seconds between reconnection attempts
    maxReconnectAttempts: 5,
  },

  // ============================================================================
  // NOTIFICATION CENTER SPECIFIC
  // ============================================================================
  notificationCenter: {
    maxWidth: '400px',
    maxHeight: 'calc(100vh - 100px)',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    panelPadding: '12px',

    // Notification item
    itemPadding: '12px',
    itemMargin: '4px 0',
    itemBorderRadius: '8px',
    itemHoverBg: '#F9FAFB',
    itemReadOpacity: 0.6,
    itemUnreadBg: '#F0F9FF',

    // Unread indicator
    unreadDotSize: '8px',
    unreadDotColor: '#3B82F6',

    // Time grouping
    timeSectionSpacing: '16px',
    timeLabelColor: '#6B7280',
    timeLabelSize: '12px',

    // Avatar
    avatarSize: '32px',
    avatarBg: '#E5E7EB',
  },

  // ============================================================================
  // TOAST SPECIFIC
  // ============================================================================
  toast: {
    minWidth: '300px',
    maxWidth: '500px',
    padding: '16px 20px',
    gap: '12px',
    borderRadius: '8px',
    zIndex: 9999,

    // Position offsets
    positionOffset: '20px',

    // Close button
    closeButtonSize: '20px',
    closeButtonColor: '#6B7280',
  },

  // ============================================================================
  // MODAL SPECIFIC
  // ============================================================================
  modal: {
    overlayBg: 'rgba(0, 0, 0, 0.5)',
    overlayBlur: 'blur(4px)',
    maxWidth: '500px',
    borderRadius: '12px',
    padding: '24px',
    zIndex: 10000,

    // Buttons
    confirmButtonBg: '#EF4444',
    cancelButtonBg: '#E5E7EB',
    confirmButtonText: '#FFFFFF',
    cancelButtonText: '#1F2937',
  },

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  typography: {
    // Notification center
    notificationTitle: {
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '1.4',
      color: '#1F2937',
    },

    notificationMessage: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '1.4',
      color: '#4B5563',
    },

    notificationTime: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '1.4',
      color: '#9CA3AF',
    },

    // Toast
    toastTitle: {
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '1.4',
      color: '#1F2937',
    },

    toastMessage: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '1.5',
      color: '#4B5563',
    },

    // Alert
    alertTitle: {
      fontSize: '15px',
      fontWeight: 600,
      lineHeight: '1.4',
      color: '#1F2937',
    },

    alertMessage: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '1.5',
      color: '#4B5563',
    },
  },

  // ============================================================================
  // Z-INDICES (Stacking order)
  // ============================================================================
  zIndex: {
    connectionBadge: 1000,
    notification: 1100,
    toast: 1200,
    confirmation: 1300,
    backdrop: 1301,
  },

  // ============================================================================
  // MICRO-INTERACTION CONSTANTS
  // ============================================================================
  microInteractions: {
    // Optimistic updates
    optimisticUpdateDelay: 100,

    // Skeleton loaders
    skeletonAnimationDuration: '1.5s',
    skeletonShimmer: `
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
    `,

    // Notification badge animation
    badgeAnimationDuration: '0.5s',

    // Real-time indicator
    realtimeIndicatorBreathe: '1.5s',

    // Drawer transition
    drawerTransitionDuration: '300ms',

    // Confirmation modal shake (on error)
    shakeIntensity: '4px',
    shakeDuration: '300ms',
  },
};

// ============================================================================
// CSS HELPER: All animations injected globally
// ============================================================================
export const notificationAnimationStyles = `
  ${notificationTokens.animations.slideInRight.keyframes}
  ${notificationTokens.animations.slideInUp.keyframes}
  ${notificationTokens.animations.fadeIn.keyframes}
  ${notificationTokens.animations.slideOutRight.keyframes}
  ${notificationTokens.animations.slideOutDown.keyframes}
  ${notificationTokens.animations.pulse.keyframes}
  ${notificationTokens.animations.shake.keyframes}
  ${notificationTokens.animations.spin.keyframes}
  ${notificationTokens.animations.badgePulse.keyframes}
  ${notificationTokens.microInteractions.skeletonShimmer}
`;

// ============================================================================
// ATTENTION HIERARCHY (What gets interrupted, what doesn't)
// ============================================================================
export const attentionHierarchy = {
  critical: {
    // These interrupt everything
    types: ['sla_breach', 'payment_failed', 'trial_ending', 'billing_event'],
    showAs: 'banner',
    position: 'top',
    sound: true,
    vibration: true,
    duration: null, // Persistent
  },

  high: {
    // Interrupting, but not as aggressive
    types: ['deal_moved', 'task_assigned', 'mention'],
    showAs: 'toast',
    position: 'top-right',
    sound: false,
    vibration: false,
    duration: 4000,
  },

  normal: {
    // Visible but not intrusive
    types: ['lead_created', 'import_complete', 'contact_added'],
    showAs: 'toast',
    position: 'bottom-right',
    sound: false,
    vibration: false,
    duration: 3000,
  },

  low: {
    // Subtle, only in notification center
    types: ['automation_triggered', 'sync_complete'],
    showAs: 'notification_center',
    duration: null,
  },

  nudge: {
    // Intelligent but non-blocking
    types: ['lead_untouched', 'deal_stagnating', 'task_overdue'],
    showAs: 'nudge_panel',
    position: 'bottom-left',
    dismissible: true,
    duration: null,
  },
};

// ============================================================================
// EXPORT NOTIFICATION PRESETS (Ready-to-use configurations)
// ============================================================================
export const notificationPresets = {
  success: {
    backgroundColor: notificationTokens.colors.success.light,
    borderColor: notificationTokens.colors.success.border,
    textColor: notificationTokens.colors.success.dark,
    icon: '✓',
    duration: notificationTokens.timing.toastSuccess,
  },

  error: {
    backgroundColor: notificationTokens.colors.error.light,
    borderColor: notificationTokens.colors.error.border,
    textColor: notificationTokens.colors.error.dark,
    icon: '✕',
    duration: notificationTokens.timing.toastError,
  },

  warning: {
    backgroundColor: notificationTokens.colors.warning.light,
    borderColor: notificationTokens.colors.warning.border,
    textColor: notificationTokens.colors.warning.dark,
    icon: '!',
    duration: notificationTokens.timing.toastWarning,
  },

  info: {
    backgroundColor: notificationTokens.colors.info.light,
    borderColor: notificationTokens.colors.info.border,
    textColor: notificationTokens.colors.info.dark,
    icon: 'i',
    duration: notificationTokens.timing.toastInfo,
  },
};
