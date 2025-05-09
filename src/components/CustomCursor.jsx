import { useEffect, useState, useRef } from 'react';

function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailingPosition, setTrailingPosition] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoverElement, setHoverElement] = useState(null);
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

    const handleMouseEnter = (e) => {
      setIsHovering(true);
      setHoverElement(e.target);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setHoverElement(null);
    };

    // Animation loop for trailing effect
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        if (isHovering && hoverElement) {
          // Get element's position and dimensions
          const rect = hoverElement.getBoundingClientRect();
          const margin = 8; // Margin around the element
          
          // Calculate target position (center of the element)
          const targetX = rect.left + rect.width / 2;
          const targetY = rect.top + rect.height / 2;
          
          // Calculate target size (element size + margin)
          const targetWidth = rect.width + margin * 2;
          const targetHeight = rect.height + margin * 2;
          
          // Update trailing position to match element center
          setTrailingPosition({
            x: targetX,
            y: targetY
          });
          
          // Update the trailing cursor style
          const trailingCursor = document.querySelector('.cursor-dot--trailing');
          if (trailingCursor) {
            trailingCursor.style.width = `${targetWidth}px`;
            trailingCursor.style.height = `${targetHeight}px`;
            trailingCursor.style.borderRadius = '4px';
          }
        } else {
          // Normal cursor movement when not hovering
          const deltaX = position.x - trailingPosition.x;
          const deltaY = position.y - trailingPosition.y;
          
          // Spring physics constants
          const stiffness = 0.07;
          const damping = 0.7;
          
          // Calculate spring force
          const forceX = deltaX * stiffness;
          const forceY = deltaY * stiffness;
          
          // Update velocity with force and damping
          setVelocity(prev => ({
            x: (prev.x + forceX) * damping,
            y: (prev.y + forceY) * damping
          }));
          
          // Update position with velocity
          setTrailingPosition(prev => ({
            x: prev.x + velocity.x,
            y: prev.y + velocity.y
          }));
          
          // Reset trailing cursor style
          const trailingCursor = document.querySelector('.cursor-dot--trailing');
          if (trailingCursor) {
            trailingCursor.style.width = '20px';
            trailingCursor.style.height = '20px';
            trailingCursor.style.borderRadius = '50%';
          }
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    
    // Add hover detection for interactive elements
    const interactiveElements = document.querySelectorAll('a:not(.card), button:not(.card), [role="button"]:not(.card), input:not(.card), textarea:not(.card), select:not(.card)');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });

    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [position, trailingPosition, velocity, isHovering, hoverElement]);

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
          width: '8px',
          height: '8px',
          backgroundColor: 'rgb(255, 165, 0)',
          borderRadius: '50%',
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
          width: '20px',
          height: '20px',
          backgroundColor: 'rgba(147, 51, 234, 0.2)',
          border: '1px solid rgb(147, 51, 234)',
          borderRadius: '50%',
          transition: 'width 0.2s, height 0.2s, border-radius 0.2s, background-color 0.2s',
        }}
      />
    </>
  );
}

export default CustomCursor; 