'use client';
import React, { useEffect } from "react";

export default function Modal({
    open,
    onClose,
    children,
    title,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-center justify-center"
        >
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* panel */}
            <div className="relative z-10 w-[560px] max-w-[92vw] rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">{title ?? '入力'}</h2>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}