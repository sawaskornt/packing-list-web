import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useStore } from '../store';
import { Field, Input, PrimaryButton } from '../components/ui';

export function LoginScreen() {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const err = await login(username, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm">
        <div className="w-15 h-15 rounded-[18px] bg-[#4F46E5] flex items-center justify-center mx-auto mb-5 shadow-[0_6px_16px_rgba(79,70,229,0.3)]">
          <Package size={28} color="white" />
        </div>
        <h1 className="text-[26px] font-extrabold text-center text-[#111827] tracking-[-0.5px]">
          Inventory Management
        </h1>
        <p className="text-[14px] text-[#6B7280] text-center mt-1.5 mb-7 font-medium">
          Sign in to access item locations
        </p>

        <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] shadow-sm">
          <Field label="Username">
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
            />
          </Field>
          <Field label="Password">
            <Input
              value={password}
              onChangeText={setPassword}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              onSubmitEditing={handleLogin}
            />
          </Field>

          {error && (
            <div className="text-[#DC2626] text-[13px] font-semibold mb-3 text-center">
              {error}
            </div>
          )}

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!username || !password}
          />
        </div>

        <div className="mt-8 text-center text-xs text-[#9CA3AF]">
          Packing List Web App · Connected to Cloud Run Backend
        </div>
      </div>
    </div>
  );
}
