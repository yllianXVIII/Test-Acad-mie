import React from 'react';
import { GmailLoginScreen } from './GmailLoginScreen';

// Backward-compatibility wrapper pointing to Gmail authentication
export const DiscordLoginScreen: React.FC = () => {
  return <GmailLoginScreen />;
};
