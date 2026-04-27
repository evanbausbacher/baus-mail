import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { BausMailApp } from '@/components/BausMailApp';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/api/auth/signin?callbackUrl=/');
  }

  return <BausMailApp />;
}
