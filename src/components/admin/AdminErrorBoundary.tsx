import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface Props {
  children?: ReactNode;
}

/**
 * Admin panel error boundary delegating to the unified ErrorBoundary component.
 */
export const AdminErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ErrorBoundary
      variant="panel"
      title="Section Execution Faulted"
      description="An unexpected runtime exception interrupted this panel. The rest of the dashboard remains active."
    >
      {children}
    </ErrorBoundary>
  );
};

export default AdminErrorBoundary;
