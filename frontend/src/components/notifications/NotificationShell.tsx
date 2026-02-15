import React from 'react'
import styled from 'styled-components'
import { useNotification } from '../../context/NotificationContext'
import { ToastContainer } from './Toast'

const ShellContainer = styled.div``

export function NotificationShell() {
  const { toasts, removeToast } = useNotification()

  return (
    <ShellContainer>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ShellContainer>
  )
}
