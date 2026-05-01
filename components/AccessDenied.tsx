'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-12 text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Lock className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-6">
          This page is only available to super administrators.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </Card>
    </div>
  );
}
