import { useEffect, useState, useRef } from 'react';

function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailingPosition, setTrailingPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      // Set trailing position to match cursor on first move
      if (trailingPosition.x === 0 && trailingPosition.y === 0) {
        setTrailingPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    // Animation loop for trailing effect
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaX = position.x - trailingPosition.x;
        const deltaY = position.y - trailingPosition.y;
        
        setTrailingPosition(prev => ({
          x: prev.x + deltaX * 0.1,
          y: prev.y + deltaY * 0.1
        }));
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Add hover detection for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => setIsHovering(true));
      element.addEventListener('mouseleave', () => setIsHovering(false));
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(requestRef.current);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', () => setIsHovering(true));
        element.removeEventListener('mouseleave', () => setIsHovering(false));
      });
    };
  }, [position, trailingPosition]);

  return (
    <>
      <div
        className="cursor-dot cursor-dot--leading"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      />
      <div
        className={`cursor-dot cursor-dot--trailing ${isHovering ? 'hover' : ''}`}
        style={{
          position: 'fixed',
          left: `${trailingPosition.x}px`,
          top: `${trailingPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </>
  );
}

export default CustomCursor; 