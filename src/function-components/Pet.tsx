import React, { useState, useEffect, useRef } from 'react';

function Pet() {
  const petStates = {
    still: ['still', 'alert', 'itch1', 'itch2', 'yawn', 'sleep1', 'sleep2', ],
    active: [
      'nrun1', 'nrun2', 'nerun1', 'nerun2', 'erun1', 'erun2', 
      'serun1', 'serun2', 'srun1', 'srun2', 'swrun1', 'swrun2', 
      'wrun1', 'wrun2', 'nwrun1', 'nwrun2'
    ],
  };

  const debug = false;
  const randomPercent = 50;
  const defaultDirection = 'still'; // Default direction when none is available
  const defaultStillState = 'sleep1'; // Default still state before any clicks
  const elementRef = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, direction: '' });
  const [petPosition, setPetPosition] = useState({ left: `${randomPercent}%` });
  const [clickCount, setClickCount] = useState(0);
  const [currentPetState, setCurrentPetState] = useState('still'); // 'still' or 'active'
  const [currentAnimation, setCurrentAnimation] = useState(defaultStillState); // Default to 'sleep1'
  const [stillIndex, setStillIndex] = useState(0); // Index for cycling through "still" states
  const [isCycling, setIsCycling] = useState(false); // Control animation cycling
  
  // Handle mouse movement (for "active" state)
  const handleMouseMove = (event: MouseEvent): void => {
    if (!elementRef.current || currentPetState !== "active") return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = event.clientX - centerX; // Mouse x relative to element center
    const y = event.clientY - centerY; // Mouse y relative to element center

    const horizontalMargin = rect.width / 3; // 1/3 of width for horizontal regions
    const verticalMargin = rect.height / 3; // 1/3 of height for vertical regions

    let direction = "";

    // Vertical regions
    if (y < -verticalMargin) direction += "n";
    else if (y > verticalMargin) direction += "s";

    // Horizontal regions
    if (x < -horizontalMargin) direction += "w";
    else if (x > horizontalMargin) direction += "e";

    setPosition({ x, y, direction });

    // Move pet towards mouse for W or E directions
    if (direction.endsWith('w') || direction.endsWith('e')) {
      const petX = event.clientX;
      const range = 200;
      const inRange = (x >= -range && x <= range && y >= -range && y <= range);
      if (inRange && direction !== 'w' || inRange && direction !== 'e') {
          setPetPosition({ left: `${petX}px` });
          //todo: update setAnimation to running when in range.
      } else if (direction === 'w' ||  direction === 'e'){
          setPetPosition({ left: `${petX}px` });
      }
    }
    
  };

  const playSound = (sound: string) => {
    if (sound === 'meow') {
      const meows = ['meow-1', 'meow-2', 'meow-3', 'meow-4', 'meow-5', 'meow-6', 'meow-7'];
      sound = meows[Math.floor(Math.random() * meows.length)];
    }
    const audio = new Audio(`/assets/pet/meow/sounds/${sound}.m4a`);
    audio.play();
  }

  // Attach mousemove event to the window
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentPetState]);

  // Handle click events
  const handleClick = () => {
    setClickCount((prev) => prev + 1);

    if (clickCount === 0) {
      // First click: Start cycling through "still" states
      setIsCycling(true);
      playSound('meow');
    } else if (clickCount === 1) {
      // Second click: Switch to "active" state
      setIsCycling(false);
      setCurrentPetState('active');
      playSound('meow');
    } else if (clickCount > 1) {
      // Second click: Switch to "active" state
      setIsCycling(false);
      setCurrentPetState('still');
      setClickCount(0)
    }
  };

  // Cycle through "still" states
  useEffect(() => {
    if (isCycling && currentPetState === 'still') {
      const interval = setInterval(() => {
        setStillIndex((prevIndex) => (prevIndex + 1) % petStates.still.length);
      }, 1000); // Change animation every second
      return () => clearInterval(interval);
    }
  }, [isCycling, currentPetState]);

  // Update current animation frame based on state
  useEffect(() => {
    if (clickCount === 0) {
      // Default to 'sleep1' before any clicks
      setCurrentAnimation(defaultStillState);
    } else if (currentPetState === 'still') {
      // Cycle through still states after the first click
      setCurrentAnimation(petStates.still[stillIndex]);
    } else if (currentPetState === 'active') {
      // Use directional animation in active state
      setCurrentAnimation(position.direction ? `${position.direction}run1` : defaultDirection);
    }
  }, [clickCount, currentPetState, stillIndex, position]);

  return (
    <div
      style={{
        width: '100%',
        height: '1px',
        background: 'rgba(255, 255, 255, .2)',
        position: 'relative',
      }}
    >
      <style>{`a.cat:hover { cursor: pointer; }`}</style>
      <span style={{display: debug ? 'block': 'none'}}>
        <p>You clicked {clickCount} times</p>
        <p>Mouse Position: ({position.x}, {position.y})</p>
        <p>Pet Position: {petPosition.left}</p>
        <p>Direction: {position.direction || defaultDirection}</p>
        <p>Pet State: {currentPetState}</p>
      </span>
      <a
        onClick={handleClick}
        ref={elementRef}
        className='cat'
        style={{ 
          position: 'absolute', 
          transition: 'left 0.5s cubic-bezier(.44,.37,.55,1.21)',
          left: petPosition.left,
          top: '-28px',
          transform: "translateX(-50%)",
        }}
      >
        <img src={`/assets/pet/meow/${currentAnimation}.gif`} />
      </a>
    </div>
  );
}

export default Pet;
