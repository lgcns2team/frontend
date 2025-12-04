import { useState, useEffect, useRef } from 'react';
import { getEraForYear } from '../../../shared/config/era-theme';

export const useEraTransition = (currentYear: number) => {
    const [isCloudTransitionActive, setIsCloudTransitionActive] = useState(false);
    const prevEraId = useRef<string>(getEraForYear(currentYear).id);

    useEffect(() => {
        const newEraId = getEraForYear(currentYear).id;
        if (newEraId !== prevEraId.current) {
            setIsCloudTransitionActive(true);
            prevEraId.current = newEraId;
        }
    }, [currentYear]);

    const handleTransitionComplete = () => {
        setIsCloudTransitionActive(false);
    };

    return {
        isCloudTransitionActive,
        handleTransitionComplete
    };
};
