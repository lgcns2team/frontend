import React, { useEffect, useState } from 'react';
import './CloudTransition.css';

interface CloudTransitionProps {
    isActive: boolean;
    onAnimationComplete?: () => void;
}

export const CloudTransition: React.FC<CloudTransitionProps> = ({ isActive, onAnimationComplete }) => {


    const [isAnimating, setIsAnimating] = useState(false);

    // Use ref to keep callback stable across re-renders
    const onCompleteRef = React.useRef(onAnimationComplete);
    useEffect(() => {
        onCompleteRef.current = onAnimationComplete;
    }, [onAnimationComplete]);

    useEffect(() => {
        if (isActive) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                }
            }, 2500); // Total animation duration matches CSS
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    if (!isAnimating) return null;

    return (
        <div className="cloud-transition-container">
            <div className="cloud-layer layer-1"></div>
            <div className="cloud-layer layer-2"></div>
            <div className="cloud-layer layer-3"></div>
        </div>
    );
};
