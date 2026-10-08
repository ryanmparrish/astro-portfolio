import React, { useState, useEffect, useRef } from 'react';

function Pet() {
  const petStates = {
    still: ['still', 'alert', 'itch1', 'itch2', 'yawn', 'sleep1', 'sleep2', 'wscratch1', 'wscratch2' ],
    active: [
      'nrun', 'nerun', 'erun', 
      'serun', 'srun', 'swrun',
      'wrun', 'nwrun',
    ],
  };

  const debug = false;
  const randomPercent = 50;
  const defaultDirection = 'still'; // Default direction when none is available
  const defaultStillState = 'sleep1'; // Default still state before any clicks
  const elementRef = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, direction: '' });
  const [petPosition, setPetPosition] = useState({ left: `${randomPercent}%` });
  const [petTop, setPetTop] = useState<string | number>('-28px');
  const [petScale, setPetScale] = useState<number>(1);
  const initialActiveTopRef = useRef<number | null>(null);
// Initialize clickCount from localStorage or default to 0
  const [clickCount, setClickCount] = useState(0);
  const [crazyCount, setCrazyCount] = useState(0);
  const [isCrazy, setIsCrazy] = useState(false);

  const [totalClicksCount, setTotalClicksCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const clicksCount = localStorage.getItem('petTotalClicksCount');
      return clicksCount ? parseInt(clicksCount, 10) : 0;
    }
    return 0;
  });
  
  const [currentPetState, setCurrentPetState] = useState('still'); // 'still' or 'active'
  const [currentAnimation, setCurrentAnimation] = useState(defaultStillState); // Default to 'sleep1'
  const [isMoving, setIsMoving] = useState(false);
  const movementTimeoutRef = useRef<number | null>(null);
  const [stillIndex, setStillIndex] = useState(0); // Index for cycling through "still" states
  const [isCycling, setIsCycling] = useState(false); // Control animation cycling
  const behaviorTimeoutsRef = useRef<number[]>([]);

  const clearBehaviorTimers = () => {
    behaviorTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    behaviorTimeoutsRef.current = [];
  };

  // (active frame cycling removed — animated GIFs handle their own frames)

  const behaviorFramesMap: Record<string, string[]> = {
    alert: ['alert'],
    itch: ['itch1', 'itch2'],
    yawn: ['yawn'],
    sleep: ['sleep1', 'sleep2'],
    still: petStates.still,
  };

  // Play a named behavior sequence. Options: repeat (number of times through frames),
  // frameDuration (ms per frame), onEnd callback.
  const playBehavior = (
    name: string,
    opts: { repeat?: number; frameDuration?: number; onEnd?: () => void } = {}
  ) => {
    clearBehaviorTimers();
  // when a behavior plays, we don't need to stop active frame intervals because
  // active animations are GIFs and don't use JS-driven frame loops

    const frames = behaviorFramesMap[name] || [name];
    const repeat = opts.repeat ?? 1;
    const frameDuration = opts.frameDuration ?? 700;
    let total = 0;
    for (let r = 0; r < repeat; r++) {
      for (let i = 0; i < frames.length; i++) {
        const t = window.setTimeout(() => {
          setCurrentAnimation(frames[i]);
        }, total * frameDuration);
        behaviorTimeoutsRef.current.push(t as unknown as number);
        total++;
      }
    }
    // schedule onEnd
    const endTimeout = window.setTimeout(() => {
      if (opts.onEnd) opts.onEnd();
      // clear timeouts array since finished
      behaviorTimeoutsRef.current = [];
    }, total * frameDuration);
    behaviorTimeoutsRef.current.push(endTimeout as unknown as number);
  };

  // refs to keep latest values for window API
  const playBehaviorRef = useRef(playBehavior);
  const currentPetStateRef = useRef(currentPetState);
  useEffect(() => {
    playBehaviorRef.current = playBehavior;
  }, [playBehavior]);
  useEffect(() => {
    currentPetStateRef.current = currentPetState;
  }, [currentPetState]);

  // Expose a small API on window.pet for manual control and testing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).pet = {
      playBehavior: (name: string, opts?: any) => playBehaviorRef.current(name, opts),
      setState: (s: string) => setCurrentPetState(s as any),
      getState: () => currentPetStateRef.current,
      clearBehaviors: () => clearBehaviorTimers(),
    };
    return () => {
      try {
        delete (window as any).pet;
      } catch (e) {
        (window as any).pet = undefined;
      }
    };
  }, []);

  // Idle scheduler: occasionally trigger idle behaviors when pet is 'still'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let idleTimer: number | null = null;
    let mounted = true;

    const schedule = () => {
      if (!mounted) return;
      const delay = 6000 + Math.floor(Math.random() * 12000); // 6-18s
      idleTimer = window.setTimeout(() => {
        // only trigger when still
        if (currentPetStateRef.current === 'still') {
          const choices = ['itch', 'yawn', 'alert', 'still'];
          const pick = choices[Math.floor(Math.random() * choices.length)];
          if (pick === 'still') {
            // briefly cycle through still animations
            setIsCycling(true);
            const stop = window.setTimeout(() => setIsCycling(false), 3500);
            behaviorTimeoutsRef.current.push(stop as unknown as number);
          } else {
            // play behavior then return to still cycling
            playBehaviorRef.current(pick, {
              repeat: 1,
              frameDuration: pick === 'yawn' ? 900 : 600,
              onEnd: () => {
                if (currentPetStateRef.current === 'still') setIsCycling(true);
              },
            });
          }
        }
        schedule();
      }, delay) as unknown as number;
    };

    schedule();
    return () => {
      mounted = false;
      if (idleTimer) window.clearTimeout(idleTimer);
    };
  }, []);

  // active animations are GIF files named like 'nerun.gif', 'srun.gif', etc.
  // no JS-driven frame cycling is necessary — the GIFs animate themselves.
  
  // Save totalClicksCount to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('petTotalClicksCount', totalClicksCount.toString());
    }
  }, [totalClicksCount]);
  
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

    const inRange = Math.abs(x) <= 200 && Math.abs(y) <= 200;
    if (movementTimeoutRef.current !== null) {
      window.clearTimeout(movementTimeoutRef.current);
    }
    if (inRange) {
      setIsMoving(true);
      movementTimeoutRef.current = window.setTimeout(() => {
        setIsMoving(false);
        movementTimeoutRef.current = null;
      }, 150);
    } else {
      setIsMoving(false);
      movementTimeoutRef.current = null;
    }

    // Move pet towards mouse for W or E directions
    if (direction.endsWith('w') || direction.endsWith('e')) {
      const petX = event.clientX - (footerRectRef.current?.left ?? 0);
      if (inRange && direction !== 'w' || inRange && direction !== 'e') {
          setPetPosition({ left: `${petX}px` });
          //todo: update setAnimation to running when in range.
      } else if (direction === 'w' ||  direction === 'e'){
          setPetPosition({ left: `${petX}px` });
      }
    }
    // vertical follow and clamp inside footer when active
    if (currentPetState === 'active') {
      const footerRect = footerRectRef.current;
      let desiredTop = footerRect ? event.clientY - footerRect.top : event.clientY;
      const maxFromInitial = initialActiveTopRef.current != null ? (initialActiveTopRef.current + 100) : null;
      if (footerRect) {
        const minTop = -100;
        const maxTop = footerRect.height - 20;
        if (desiredTop < minTop) desiredTop = minTop;
        if (desiredTop > maxTop) desiredTop = maxTop;
        if (maxFromInitial != null && desiredTop > maxFromInitial) desiredTop = maxFromInitial;
        const depth = (desiredTop - minTop) / Math.max(1, maxTop - minTop);
        const scale = 1 + Math.min(Math.max(depth, 0), 1) * 0.5;
        setPetScale(scale);
      } else {
        setPetScale(1);
      }
      setPetTop(`${Math.round(desiredTop)}px`);
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

  // track footer rect so we can clamp vertical movement and compute scale
  const footerRectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    const updateFooterRect = () => {
      const footer = document.querySelector('footer');
      footerRectRef.current = footer ? footer.getBoundingClientRect() : null;
    };
    updateFooterRect();
    window.addEventListener('resize', updateFooterRect);
    window.addEventListener('scroll', updateFooterRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateFooterRect);
      window.removeEventListener('scroll', updateFooterRect);
    };
  }, []);

  // On mount, position the pet near the footer so it starts visible at the bottom
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      const startTop = -36;
      setPetTop(`${Math.round(startTop)}px`);
      initialActiveTopRef.current = Math.round(startTop);
    } else {
      // fallback: place at 80vh
      const fallbackTop = Math.round(window.innerHeight * 0.8);
      setPetTop(`${fallbackTop}px`);
      initialActiveTopRef.current = fallbackTop;
    }
  }, []);

  // Attach mousemove event to the window
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (movementTimeoutRef.current !== null) {
        window.clearTimeout(movementTimeoutRef.current);
      }
    };
  }, [currentPetState]);

  // Handle click events
  const handleClick = (e?: React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setClickCount((prev) => prev + 1);
    setTotalClicksCount((prev) => prev + 1);

    if (clickCount === 0) {
      // First click: Start cycling through "still" states
      setIsCycling(true);
      playSound('meow');
    } else if (clickCount === 1) {
      // Second click: Switch to "active" state
  setIsCycling(false);
  setCurrentPetState('active');
      // capture the starting top when becoming active so we can clamp vertical travel
      initialActiveTopRef.current = typeof petTop === 'number' ? petTop : parseInt(String(petTop), 10) || null;
      playSound('meow');
      setCrazyCount((prev) => prev + 1);
      setIsCrazy(true);
    } else if (clickCount > 1) {
      // Second click: Switch to "active" state
      setIsCycling(false);
      setCurrentPetState('still');
      setClickCount(0)
      setIsCrazy(false);
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
      // For active state we now use single animated GIFs named 'nerun.gif', 'srun.gif', etc.
      const dir = position.direction || 's';
      // normalize diagonal direction names (e.g., 'ne' stays 'ne')
      const animName = `${dir}run`;
      setCurrentAnimation(animName);
    }
    // no JS-driven active interval to clear anymore
    return;
  }, [clickCount, currentPetState, stillIndex, position]);

  const displayedAnimation = currentPetState === 'active' && !isMoving
    ? position.direction.startsWith('n') ? 'run/nrun1' : 'still'
    : currentAnimation;

  // Position the pet within the footer without affecting its layout.
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <style>{`a.cat:hover { cursor: pointer; }`}</style>
      <span style={{display: debug ? 'block': 'none'}}>
        <p>You clicked {clickCount} times</p>
        <p>total clicks {totalClicksCount} times</p>
        <p>Mouse Position: ({position.x}, {position.y})</p>
        <p>Pet Position: {petPosition.left}</p>
        <p>Direction: {position.direction || defaultDirection}</p>
        <p>Pet State: {currentPetState}</p>
      </span>
      <a
        onClick={handleClick}
        ref={elementRef}
        className='cat'
        href='#'
        role='button'
        tabIndex={0}
        style={{ 
          position: 'absolute', 
          transition: 'left 0.5s cubic-bezier(.44,.37,.55,1.21), top 160ms ease-out, transform 160ms ease-out',
          left: petPosition.left,
          top: typeof petTop === 'number' ? `${petTop}px` : petTop,
          transform: `translateX(-50%) scale(${petScale})`,
          pointerEvents: 'auto',
        }}
        id='meow-cat'
      >
        <img className='cat-img' src={`/assets/pet/meow/${displayedAnimation}.gif`} />
        <span className='count' style={{position: 'absolute', top: '38px', fontSize: '8px', fontFamily: 'monospace', left: '50%', transform: 'translateX(-50%)', display: totalClicksCount === 0 ? 'none' : 'block'}}>{totalClicksCount}</span>
        <span className='count' style={{position: 'absolute', top: '48px', fontSize: '8px', fontFamily: 'monospace', left: '50%', transform: 'translateX(-50%)', display: (crazyCount === 0 || !isCrazy) ? 'none' : 'block'}}>CrazyCat#{crazyCount}</span>
      </a>
    </div>
  );
}

export default Pet;
