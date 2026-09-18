'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ReportSymptomRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const animalId = searchParams.get('animal_id');
    if (animalId) {
      router.replace(`/report?animal_id=${encodeURIComponent(animalId)}`);
    } else {
      router.replace('/report');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4">
      <div className="p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-md flex items-center gap-3 text-center">
        <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
        <div className="text-left">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>पशुधन कवच १९६२ तक्रार कक्षाकडे पुनर्निर्देशित करत आहे...</span>
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Redirecting to unified 1962 zero-login reporting portal...
          </p>
        </div>
      </div>
    </div>
  );
}

