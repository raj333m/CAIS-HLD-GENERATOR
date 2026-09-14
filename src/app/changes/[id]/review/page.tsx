'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewChangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/document?changeId=${id}&mode=review`);
    }
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-sm font-semibold text-slate-300">
        Redirecting to Consolidated HLD document review...
      </div>
    </div>
  );
}
