'use clinent'

import React from "react";

export default function LoadingOverlay({ show, message = "処理中です。しばらくお待ちください…"}: { show:boolean; message?: string }) {
    if(!show) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2 mb-4">
        <span className="h-3 w-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-3 w-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-3 w-3 rounded-full bg-indigo-500 animate-bounce"></span>
        </div>
        <p className="text-sm font-medium text-zinc-700">{message}</p>
      </div>
    );
}