/**
 * NotificationContext Provider
 * Centralized state management for all notification machinery
 * - Notifications center
 * - Toasts
 * - Confirmations
 * - Alerts
 * - Nudges
 * - Background jobs
 * - Connection status
 */

import React, { createContext, useCallback, useReducer, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  NotificationContextState,
  NotificationContextActions,
  Toast,
  ConfirmationModal,
  SmartAlert,
  ActivityNudge,
  BackgroundJob,
  NotificationFilter,
  NotificationPreferences,
  ConnectionStatus,
} from '../types/notifications';

export const NotificationContext = createContext<
  (NotificationContextState & NotificationContextActions) | null
>(null);

type Action =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'createdAt'> }
  | { type: 'MARK_NOTIFICATION_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'ARCHIVE_NOTIFICATION'; payload: string }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'FILTER_NOTIFICATIONS'; payload: NotificationFilter }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' }
  | { type: 'SHOW_CONFIRMATION'; payload: Omit<ConfirmationModal, 'id'> }
  | { type: 'HIDE_CONFIRMATION' }
  | { type: 'ADD_ALERT'; payload: Omit<SmartAlert, 'id'> }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'ADD_NUDGE'; payload: Omit<ActivityNudge, 'id'> }
  | { type: 'DISMISS_NUDGE'; payload: string }
  | { type: 'TRACK_JOB'; payload: Omit<BackgroundJob, 'id' | 'createdAt'> }
  | { type: 'UPDATE_JOB_PROGRESS'; payload: { jobId: string; progress: BackgroundJob['progress'] } }
  | { type: 'COMPLETE_JOB'; payload: { jobId: string; result: BackgroundJob['result'] } }
  | { type: 'FAIL_JOB'; payload: { jobId: string; error: string } }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_PREFERENCES'; payload: NotificationPreferences }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: NotificationContextState = {
  notifications: [],
  unreadCount: 0,
  notificationFilter: {},
  toasts: [],
  confirmationModal: null,
  smartAlerts: [],
  nudges: [],
  backgroundJobs: [],
  connectionStatus: 'connected',
  preferences: null,
  isLoading: false,
  error: null,
};

function notificationReducer(state: NotificationContextState, action: Action): NotificationContextState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const notification: Notification = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date(),
      };
      const newNotifications = [notification, ...state.notifications];
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    }

    case 'MARK_NOTIFICATION_AS_READ': {
      const newNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, isRead: true } : n
      );
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    }

    case 'MARK_ALL_AS_READ': {
      const newNotifications = state.notifications.map(n => ({ ...n, isRead: true }));
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: 0,
      };
    }

    case 'ARCHIVE_NOTIFICATION': {
      const newNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, isArchived: true } : n
      );
      const newUnreadCount = newNotifications.filter(n => !n.isRead && !n.isArchived).length;
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    }

    case 'DELETE_NOTIFICATION': {
      const newNotifications = state.notifications.filter(n => n.id !== action.payload);
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    }

    case 'FILTER_NOTIFICATIONS': {
      return {
        ...state,
        notificationFilter: action.payload,
      };
    }

    case 'ADD_TOAST': {
      const toast: Toast = {
        ...action.payload,
        id: uuidv4(),
      };
      
      // Auto-dismiss toast if duration is set
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          // This would need to be handled by the provider's effect
        }, toast.duration);
      }
      
      return {
        ...state,
        toasts: [...state.toasts, toast],
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
    }

    case 'CLEAR_ALL_TOASTS': {
      return {
        ...state,
        toasts: [],
      };
    }

    case 'SHOW_CONFIRMATION': {
      const confirmation: ConfirmationModal = {
        ...action.payload,
        id: uuidv4(),
      };
      
      return {
        ...state,
        confirmationModal: confirmation,
      };
    }

    case 'HIDE_CONFIRMATION': {
      return {
        ...state,
        confirmationModal: null,
      };
    }

    case 'ADD_ALERT': {
      const alert: SmartAlert = {
        ...action.payload,
        id: uuidv4(),
      };
      
      return {
        ...state,
        smartAlerts: [...state.smartAlerts, alert],
      };
    }

    case 'DISMISS_ALERT': {
      return {
        ...state,
        smartAlerts: state.smartAlerts.filter(a => a.id !== action.payload),
      };
    }

    case 'ADD_NUDGE': {
      const nudge: ActivityNudge = {
        ...action.payload,
        id: uuidv4(),
      };
      
      return {
        ...state,
        nudges: [...state.nudges, nudge],
      };
    }

    case 'DISMISS_NUDGE': {
      return {
        ...state,
        nudges: state.nudges.filter(n => n.id !== action.payload),
      };
    }

    case 'TRACK_JOB': {
      const job: BackgroundJob = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date(),
      };
      
      return {
        ...state,
        backgroundJobs: [...state.backgroundJobs, job],
      };
    }

    case 'UPDATE_JOB_PROGRESS': {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.map(job =>
          job.id === action.payload.jobId
            ? { ...job, progress: action.payload.progress }
            : job
        ),
      };
    }

    case 'COMPLETE_JOB': {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.map(job =>
          job.id === action.payload.jobId
            ? { ...job, status: 'success', result: action.payload.result, completedAt: new Date() }
            : job
        ),
      };
    }

    case 'FAIL_JOB': {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.map(job =>
          job.id === action.payload.jobId
            ? { ...job, status: 'failed', completedAt: new Date() }
            : job
        ),
      };
    }

    case 'SET_CONNECTION_STATUS': {
      return {
        ...state,
        connectionStatus: action.payload,
      };
    }

    case 'SET_PREFERENCES': {
      return {
        ...state,
        preferences: action.payload,
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
      };
    }

    default:
      return state;
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const toastTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Handle toast auto-dismiss
  useEffect(() => {
    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        if (!toastTimersRef.current.has(toast.id)) {
          const timer = setTimeout(() => {
            dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
            toastTimersRef.current.delete(toast.id);
          }, toast.duration);
          
          toastTimersRef.current.set(toast.id, timer);
        }
      }
    });

    return () => {
      toastTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [state.toasts]);

  // Actions
  const actions: NotificationContextActions = {
    addNotification: useCallback((notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }, []),

    markNotificationAsRead: useCallback((notificationId) => {
      dispatch({ type: 'MARK_NOTIFICATION_AS_READ', payload: notificationId });
    }, []),

    markAllAsRead: useCallback(() => {
      dispatch({ type: 'MARK_ALL_AS_READ' });
    }, []),

    archiveNotification: useCallback((notificationId) => {
      dispatch({ type: 'ARCHIVE_NOTIFICATION', payload: notificationId });
    }, []),

    deleteNotification: useCallback((notificationId) => {
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    }, []),

    filterNotifications: useCallback((filter) => {
      dispatch({ type: 'FILTER_NOTIFICATIONS', payload: filter });
    }, []),

    showToast: useCallback((toast) => {
      dispatch({ type: 'ADD_TOAST', payload: toast });
    }, []),

    hideToast: useCallback((toastId) => {
      dispatch({ type: 'REMOVE_TOAST', payload: toastId });
      toastTimersRef.current.delete(toastId);
    }, []),

    clearAllToasts: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL_TOASTS' });
      toastTimersRef.current.clear();
    }, []),

    showConfirmation: useCallback((confirmation) => {
      dispatch({ type: 'SHOW_CONFIRMATION', payload: confirmation });
    }, []),

    hideConfirmation: useCallback(() => {
      dispatch({ type: 'HIDE_CONFIRMATION' });
    }, []),

    showAlert: useCallback((alert) => {
      dispatch({ type: 'ADD_ALERT', payload: alert });
    }, []),

    dismissAlert: useCallback((alertId) => {
      dispatch({ type: 'DISMISS_ALERT', payload: alertId });
    }, []),

    addNudge: useCallback((nudge) => {
      dispatch({ type: 'ADD_NUDGE', payload: nudge });
    }, []),

    dismissNudge: useCallback((nudgeId) => {
      dispatch({ type: 'DISMISS_NUDGE', payload: nudgeId });
    }, []),

    trackJob: useCallback((job) => {
      dispatch({ type: 'TRACK_JOB', payload: job });
    }, []),

    updateJobProgress: useCallback((jobId, progress) => {
      dispatch({ type: 'UPDATE_JOB_PROGRESS', payload: { jobId, progress } });
    }, []),

    completeJob: useCallback((jobId, result) => {
      dispatch({ type: 'COMPLETE_JOB', payload: { jobId, result } });
    }, []),

    failJob: useCallback((jobId, error) => {
      dispatch({ type: 'FAIL_JOB', payload: { jobId, error } });
    }, []),

    setConnectionStatus: useCallback((status) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
    }, []),

    updatePreferences: useCallback((preferences) => {
      if (state.preferences) {
        const updated = { ...state.preferences, ...preferences };
        dispatch({ type: 'SET_PREFERENCES', payload: updated });
      }
    }, [state.preferences]),

    loadPreferences: useCallback(async () => {
      // TODO: Load from API
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // const prefs = await fetchNotificationPreferences();
        // dispatch({ type: 'SET_PREFERENCES', payload: prefs });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),
  };

  const value: NotificationContextState & NotificationContextActions = {
    ...state,
    ...actions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
