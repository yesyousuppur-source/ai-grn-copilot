import { Metadata } from 'next';
import SignupForm from '@/components/shared/SignupForm';

export const metadata: Metadata = { title: 'Sign Up' };

export default function SignupPage() {
  return <SignupForm />;
}
