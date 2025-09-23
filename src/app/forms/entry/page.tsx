'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FormEntryPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === process.env.NEXT_PUBLIC_FORM_SECRET) {
      localStorage.setItem('form_pass', code);
      router.push('/forms/new');
    } else {
      alert('パスコードが違います');
    }
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold mb-4">発送情報フォーム認証</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="パスコードを入力"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-white"
        >
          入場
        </button>
      </form>
    </main>
  );
}
