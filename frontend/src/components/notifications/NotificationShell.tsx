import styled from 'styled-components'
import { useNotification } from '../../context/NotificationContext'
import { ToastContainer } from './Toast'

const ShellContainer = styled.div``

export function NotificationShell() {
  const { toasts, hideToast } = useNotification()

  return (
    <ShellContainer>
      <ToastContainer toasts={toasts} onRemoveToast={hideToast} />
    </ShellContainer>
  )
}
