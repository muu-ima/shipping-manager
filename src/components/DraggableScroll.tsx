'use client';

import React, { useRef, useState } from "react";

export default function DraggableScroll({ children}: { children: React.ReactNode} ) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
    };

    const onMouseLeave = () => setIsDragging(false);
    const onMouseUp = () => setIsDragging(false);

    const onMouseMove = (e: React.MouseEvent) => {
        if(!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.pageX -ref.current.offsetLeft;
        const walk = (x - startX) * 1;
        ref.current.scrollLeft = scrollLeft - walk;
    }

    return (
        <div 
            ref={ref}
            className="overflow-x-auto cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}>
                {children}
            </div>
    );
}