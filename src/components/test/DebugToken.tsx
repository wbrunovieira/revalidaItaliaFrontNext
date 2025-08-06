'use client';

import { useAuth } from '@/stores/auth.store';
import { decodeJWT, getAuthToken } from '@/lib/auth-utils';

export default function DebugToken() {
  const { token, user } = useAuth();
  
  // Pegar token direto do storage
  const rawToken = getAuthToken();
  const decoded = rawToken ? decodeJWT(rawToken) : null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-900 text-white rounded-lg shadow-xl max-w-md">
      <h3 className="text-sm font-bold mb-2">🔍 Debug Token</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Token exists:</strong> {rawToken ? 'Yes' : 'No'}
        </div>
        
        {decoded && (
          <div>
            <strong>JWT Payload:</strong>
            <pre className="mt-1 p-2 bg-black rounded overflow-auto max-h-40">
              {JSON.stringify(decoded, null, 2)}
            </pre>
          </div>
        )}
        
        <div>
          <strong>Store User:</strong>
          <pre className="mt-1 p-2 bg-black rounded overflow-auto max-h-40">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}