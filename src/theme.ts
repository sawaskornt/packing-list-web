import { Status } from './types';

export const colors = {
  primary: '#4F46E5', // indigo-600
  primaryLight: '#EEF2FF', // indigo-50
  primaryDark: '#3730A3',
  success: '#059669', // emerald-600
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
};

export const statusColor = (status: Status): { bg: string; fg: string } => {
  switch (status) {
    case 'Cleaned':
      return { bg: '#D1FAE5', fg: '#059669' };
    case 'Packed':
      return { bg: '#E0E7FF', fg: '#4F46E5' };
    case 'Used':
      return { bg: '#FEF3C7', fg: '#D97706' };
    default:
      return { bg: '#F3F4F6', fg: '#6B7280' };
  }
};

export const STATUSES: Status[] = ['Ready to pack', 'Packed', 'Used', 'Cleaned'];
