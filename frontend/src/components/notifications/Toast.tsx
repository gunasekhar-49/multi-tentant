/**
 * Toast Component - Non-blocking corner notifications
 * Success / Error / Warning / Info messages
 * Auto-dismiss or sticky
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Toast as ToastType } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

const toastColors = {
  success: notificationTokens.colors.success,
  error: notificationTokens.colors.error,
  warning: notificationTokens.colors.warning,
  info: notificationTokens.colors.info,
};

const toastIcons = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const StyledToastItem = styled.div<{ type: ToastType['type']; isClosing?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.toastPadding};
  background-color: ${props => toastColors[props.type].light};
  border: 1px solid ${props => toastColors[props.type].border};
  border-radius: ${notificationTokens.radius.md};
  box-shadow: ${notificationTokens.shadows.toast};
  animation: ${props => (props.isClosing ? 'slideOutDown' : 'slideInUp')} ${notificationTokens.animations.slideInUp.duration} ${notificationTokens.animations.slideInUp.easing} forwards;
  max-width: ${notificationTokens.toast.maxWidth};
  backdrop-filter: blur(8px);

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
`;

const IconContainer = styled.div<{ type: ToastType['type'] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${notificationTokens.radius.full};
  background-color: ${props => toastColors[props.type].main};
  color: white;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.div`
  font-size: ${notificationTokens.typography.toastTitle.fontSize};
  font-weight: ${notificationTokens.typography.toastTitle.fontWeight};
  line-height: ${notificationTokens.typography.toastTitle.lineHeight};
  color: ${notificationTokens.typography.toastTitle.color};
`;

const ToastMessage = styled.div`
  font-size: ${notificationTokens.typography.toastMessage.fontSize};
  font-weight: ${notificationTokens.typography.toastMessage.fontWeight};
  line-height: ${notificationTokens.typography.toastMessage.lineHeight};
  color: ${notificationTokens.typography.toastMessage.color};
  word-break: break-word;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px 8px;
  margin-left: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color || notificationTokens.colors.info.main};
  cursor: pointer;
  border-radius: ${notificationTokens.radius.sm};
  transition: background-color 100ms ease-in-out;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${notificationTokens.colors.neutral[400]};
  font-size: 16px;
  transition: color 100ms ease-in-out;
  flex-shrink: 0;

  &:hover {
    color: ${notificationTokens.colors.neutral[600]};
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: currentColor;
  width: ${props => props.progress * 100}%;
  opacity: 0.5;
  transition: width 100ms linear;
`;

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(1);

  // Handle auto-dismiss with progress bar
  useEffect(() => {
    if (!toast.duration) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (toast.duration - elapsed) / toast.duration);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match slideOutDown animation
  };

  return (
    <StyledToastItem type={toast.type} isClosing={isClosing} role="alert">
      <IconContainer type={toast.type}>
        {toastIcons[toast.type]}
      </IconContainer>

      <ContentContainer>
        {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
        <ToastMessage>{toast.message}</ToastMessage>
      </ContentContainer>

      {toast.action && (
        <ActionButton
          onClick={() => {
            toast.action!.onClick();
            handleClose();
          }}
          color={toastColors[toast.type].main}
        >
          {toast.action.label}
        </ActionButton>
      )}

      <CloseButton onClick={handleClose} aria-label="Close notification">
        ✕
      </CloseButton>

      {toast.duration && <ProgressBar progress={progress} />}
    </StyledToastItem>
  );
};

// ============================================================================
// TOAST CONTAINER (Manages all toasts)
// ============================================================================

const ToastStackContainer = styled.div<{ position: string }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.toastMargin};
  pointer-events: none;
  z-index: ${notificationTokens.zIndex.toast};
  ${({ position }) => {
    const [vertical, horizontal] = position.split('-');
    return `
      ${vertical}: ${notificationTokens.toast.positionOffset};
      ${horizontal}: ${notificationTokens.toast.positionOffset};
    `;
  }}

  > * {
    pointer-events: auto;
  }
`;

interface ToastContainerProps {
  toasts: ToastType[];
  onRemoveToast: (toastId: string) => void;
  position?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
  position = 'top-right',
}) => {
  return (
    <ToastStackContainer position={position} role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </ToastStackContainer>
  );
};
