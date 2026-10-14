import React from 'react';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './toast';
import { StoreProvider, useStore } from './store';
import { LoginScreen } from './screens/LoginScreen';
import { MainScreen } from './screens/MainScreen';

function Root() {
  const { currentUser, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  return currentUser ? <MainScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </ToastProvider>
  );
}
