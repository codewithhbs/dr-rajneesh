import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768; // px

export function useMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        // Prevent SSR issues
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    return isMobile;
}