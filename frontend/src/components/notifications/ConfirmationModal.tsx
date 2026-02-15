/**
 * Confirmation Modal Component
 * For destructive or costly actions
 * Shows impact, recovery info, requires confirmation
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { ConfirmationModal as ConfirmationModalType } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

interface ConfirmationModalProps {
  modal: ConfirmationModalType | null;
  onClose: () => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${notificationTokens.modal.overlayBg};
  backdrop-filter: ${notificationTokens.modal.overlayBlur};
  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 200ms ease-in-out;
  z-index: ${notificationTokens.zIndex.backdrop};
`;

const ModalContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: ${props =>
    props.isOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)'};
  width: ${notificationTokens.modal.maxWidth};
  max-height: 90vh;
  background-color: white;
  border-radius: ${notificationTokens.modal.borderRadius};
  box-shadow: ${notificationTokens.shadows.modal};
  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
  pointer-events: ${props => (props.isOpen ? 'auto' : 'none')};
  overflow: hidden;
  z-index: ${notificationTokens.zIndex.confirmation};
  display: flex;
  flex-direction: column;

  @keyframes shake {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    10%, 30%, 50%, 70%, 90% { transform: translate(calc(-50% - 4px), -50%) scale(1); }
    20%, 40%, 60%, 80% { transform: translate(calc(-50% + 4px), -50%) scale(1); }
  }

  &.shake {
    animation: shake 300ms ease-in-out;
  }
`;

const Header = styled.div`
  padding: ${notificationTokens.modal.padding};
  border-bottom: 1px solid ${notificationTokens.colors.neutral[200]};
  display: flex;
  align-items: flex-start;
  gap: ${notificationTokens.spacing.lg};
`;

const IconContainer = styled.div<{ severity: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;

  ${props => {
    switch (props.severity) {
      case 'critical':
        return `
          background-color: ${notificationTokens.colors.error.light};
          color: ${notificationTokens.colors.error.dark};
        `;
      case 'high':
        return `
          background-color: ${notificationTokens.colors.warning.light};
          color: ${notificationTokens.colors.warning.dark};
        `;
      default:
        return `
          background-color: ${notificationTokens.colors.info.light};
          color: ${notificationTokens.colors.info.dark};
        `;
    }
  }}
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${notificationTokens.colors.neutral[900]};
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: ${notificationTokens.colors.neutral[500]};
  margin: 0;
`;

const Content = styled.div`
  padding: ${notificationTokens.modal.padding};
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.modal.gap};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.md};
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: ${notificationTokens.colors.neutral[600]};
  letter-spacing: 0.5px;
`;

const ImpactContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.md};
  background-color: ${notificationTokens.colors.neutral[50]};
  border-radius: ${notificationTokens.radius.md};
  border-left: 3px solid ${props => props.color || notificationTokens.colors.warning.main};
`;

const ImpactTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${notificationTokens.colors.neutral[900]};
`;

const ImpactList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ImpactItem = styled.li`
  font-size: 13px;
  color: ${notificationTokens.colors.neutral[700]};
  display: flex;
  gap: ${notificationTokens.spacing.sm};
  align-items: flex-start;

  &:before {
    content: '•';
    color: ${notificationTokens.colors.error.main};
    font-weight: 700;
    flex-shrink: 0;
  }
`;

const RecoveryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
  padding: ${notificationTokens.spacing.md};
  background-color: ${notificationTokens.colors.success.light};
  border-radius: ${notificationTokens.radius.md};
  border-left: 3px solid ${notificationTokens.colors.success.main};
`;

const RecoveryTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${notificationTokens.colors.success.dark};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RecoveryText = styled.div`
  font-size: 13px;
  color: ${notificationTokens.colors.success.dark};
`;

const ConfirmationInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
`;

const ConfirmationLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${notificationTokens.colors.neutral[900]};
`;

const ConfirmationInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${notificationTokens.colors.neutral[300]};
  border-radius: ${notificationTokens.radius.md};
  font-size: 13px;
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: ${notificationTokens.colors.info.main};
    box-shadow: 0 0 0 3px ${notificationTokens.colors.info.light};
  }
`;

const ConfirmationHint = styled.div`
  font-size: 12px;
  color: ${notificationTokens.colors.neutral[500]};
  background-color: ${notificationTokens.colors.info.light};
  padding: ${notificationTokens.spacing.sm};
  border-radius: ${notificationTokens.radius.sm};
  border-left: 2px solid ${notificationTokens.colors.info.main};
`;

const Footer = styled.div`
  padding: ${notificationTokens.modal.padding};
  border-top: 1px solid ${notificationTokens.colors.neutral[200]};
  display: flex;
  gap: ${notificationTokens.spacing.md};
  flex-direction: row-reverse;
`;

const Button = styled.button<{ variant?: 'danger' | 'warning' | 'default'; isLoading?: boolean }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: ${notificationTokens.radius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${notificationTokens.spacing.sm};

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background-color: ${notificationTokens.colors.error.main};
          color: white;

          &:hover:not(:disabled) {
            background-color: ${notificationTokens.colors.error.dark};
            box-shadow: 0 4px 12px ${notificationTokens.colors.error.main}40;
          }

          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        `;
      case 'warning':
        return `
          background-color: ${notificationTokens.colors.warning.main};
          color: white;

          &:hover:not(:disabled) {
            background-color: ${notificationTokens.colors.warning.dark};
          }
        `;
      default:
        return `
          background-color: ${notificationTokens.colors.neutral[200]};
          color: ${notificationTokens.colors.neutral[900]};

          &:hover:not(:disabled) {
            background-color: ${notificationTokens.colors.neutral[300]};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 400ms linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

const severityConfig = {
  low: { icon: '⚠️', color: notificationTokens.colors.info.main },
  medium: { icon: '⚠️', color: notificationTokens.colors.warning.main },
  high: { icon: '⚠️', color: notificationTokens.colors.warning.main },
  critical: { icon: '🛑', color: notificationTokens.colors.error.main },
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ modal, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  if (!modal) return null;

  const isConfirmDisabled =
    isLoading || (modal.requireInput && inputValue !== modal.requireInput.expectedValue);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await modal.onConfirm();
      onClose();
    } catch (error) {
      // Shake animation on error
      if (modalRef.current) {
        modalRef.current.classList.add('shake');
        setTimeout(() => {
          modalRef.current?.classList.remove('shake');
        }, 300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const severity = modal.impact?.severity || 'medium';
  const { icon, color } = severityConfig[severity] || severityConfig.medium;

  return (
    <>
      <Backdrop isOpen={!!modal} onClick={onClose} />

      <ModalContainer isOpen={!!modal} ref={modalRef}>
        <Header>
          <IconContainer severity={severity}>{icon}</IconContainer>
          <HeaderContent>
            <Title>{modal.title}</Title>
            {modal.description && <Subtitle>{modal.description}</Subtitle>}
          </HeaderContent>
        </Header>

        <Content>
          {modal.impact && (
            <Section>
              <SectionLabel>Impact</SectionLabel>
              <ImpactContainer color={color}>
                <ImpactTitle>{modal.impact.title}</ImpactTitle>
                <ImpactList>
                  {modal.impact.items.map((item, idx) => (
                    <ImpactItem key={idx}>{item}</ImpactItem>
                  ))}
                </ImpactList>
              </ImpactContainer>
            </Section>
          )}

          {modal.recovery && (
            <Section>
              <SectionLabel>Recovery</SectionLabel>
              <RecoveryContainer>
                <RecoveryTitle>Undo available</RecoveryTitle>
                <RecoveryText>
                  {modal.recovery.instruction}
                  {modal.recovery.window && ` (${modal.recovery.window} minutes)`}
                </RecoveryText>
              </RecoveryContainer>
            </Section>
          )}

          {modal.requireInput && (
            <Section>
              <ConfirmationInputContainer>
                <ConfirmationLabel>{modal.requireInput.label}</ConfirmationLabel>
                <ConfirmationInput
                  type="text"
                  placeholder={modal.requireInput.placeholder}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  autoFocus
                />
                <ConfirmationHint>
                  Type "{modal.requireInput.expectedValue}" to confirm
                </ConfirmationHint>
              </ConfirmationInputContainer>
            </Section>
          )}

          <div>{modal.message}</div>
        </Content>

        <Footer>
          <Button
            variant={modal.confirmVariant || 'danger'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading && <Spinner />}
            {modal.loadingLabel && isLoading ? modal.loadingLabel : modal.confirmLabel}
          </Button>
          <Button onClick={onClose} disabled={isLoading}>
            {modal.cancelLabel || 'Cancel'}
          </Button>
        </Footer>
      </ModalContainer>
    </>
  );
};
