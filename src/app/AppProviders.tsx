import type { ReactNode } from 'react';
import { FeedbackProvider } from '../shared/feedback/FeedbackProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return <FeedbackProvider>{children}</FeedbackProvider>;
}
