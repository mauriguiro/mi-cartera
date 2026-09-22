'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
      <h2 className="text-xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal.</h2>
      <div className="p-4 bg-white border border-red-200 rounded text-sm text-red-800 break-all w-full max-w-md">
        {error.message || 'Error desconocido'}
      </div>
      <button
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded font-bold"
        onClick={() => reset()}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
