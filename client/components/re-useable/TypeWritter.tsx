import React, { useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect/dist/core';

interface TypeWritterProps {
    strings: string[];
    loop?: boolean;
    autoStart?: boolean;
    delay?: number;
    onComplete?: () => void;
    className?: string;
}

const TypeWritter: React.FC<TypeWritterProps> = ({
    strings,
    loop = true,
    autoStart = true,
    delay = 75,
    onComplete,
    className,
}) => {
    const typewriterRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (typewriterRef.current) {
            const typewriter = new Typewriter(typewriterRef.current, {
                loop,
                delay,
                autoStart,
                strings,
                onComplete,
            });

            // Start typing if autoStart is true
            if (autoStart) {
                typewriter.start();
            }

            return () => {
                typewriter.stop();
            };
        }
    }, [strings, loop, autoStart, delay, onComplete]);

    return <span ref={typewriterRef} className={className} />;
};

export default TypeWritter;