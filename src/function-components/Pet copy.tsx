import React, { useState, useRef, useEffect } from 'react';

function Pet() {
  const [position, setPosition] = useState({ x: 0, y: 0, direction: '' });
  const [runState, setRunState] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLImageElement>(null);
  const petInitialLeft = useRef<number>(0);

  useEffect(() => {
    if (petRef.current) {
      petInitialLeft.current = petRef.current.offsetLeft;
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastRunStateChangeTime = 0;

    const animatePet = () => {
      if (!petRef.current || !footerRef.current || !isMoving) return;

      const petRect = petRef.current.getBoundingClientRect();
      const footerRect = footerRef.current.getBoundingClientRect();

      const maxLeft = footerRect.left;
      const maxRight = footerRect.right - petRect.width;

      const targetX = Math.max(maxLeft, Math.min(position.x + footerRect.left, maxRight));

      const currentX = petRect.left + petRect.width / 2;
      const dx = targetX - currentX;

      const distance = Math.abs(dx);
      const speed = 1;

      if (distance > 5) {
        const moveX = (dx > 0 ? 1 : -1) * speed;

        let newLeft = petRect.left + moveX;

        newLeft = Math.max(maxLeft, Math.min(newLeft, maxRight));

        petRef.current.style.left = `${newLeft}px`;

        const currentTime = Date.now();
        if (currentTime - lastRunStateChangeTime >= 250) {
          setRunState((prev) => (prev === 1 ? 2 : 1));
          lastRunStateChangeTime = currentTime;
        }

        animationFrameId = requestAnimationFrame(animatePet);
      } else {
        setIsMoving(false);
      }
    };

    if (isMoving) {
      animationFrameId = requestAnimationFrame(animatePet);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMoving, position]);

  const handleMouseMove = (event: MouseEvent) => {
    if (!footerRef.current) return;

    const footerRect = footerRef.current.getBoundingClientRect();
    const x = event.clientX - footerRect.left;
    const y = event.clientY - footerRect.top;

    let direction = '';

    const horizontalMidpoint = footerRect.width / 3;
    const horizontalThird = (footerRect.width * 2) / 3;
    const verticalMidpoint = footerRect.height / 3;
    const verticalThird = footerRect.height * 2 / 3;

    if (x < horizontalMidpoint) {
        direction = 'w';
        setIsMoving(true);
    } else if (x > horizontalThird) {
        direction = 'e';
        setIsMoving(true);
    } else {
        setIsMoving(false);
        if (y < verticalMidpoint) {
            direction = 'n';
        } else if (y > verticalThird) {
            direction = 's';
        } else if (x >= horizontalMidpoint && x <= horizontalThird) {
            if (y < footerRect.height / 2) direction = 'n';
            else direction = 's';
        }
    }


    if (direction === 'n' || direction === 's') {
        if (x < footerRect.width / 2) {
            direction += 'w';
        } else {
            direction += 'e';
        }
    }

    setPosition({ x, y, direction });
  };

  useEffect(() => {
    if (footerRef.current) {
      footerRef.current.addEventListener('mousemove', handleMouseMove);
      return () => {
        footerRef.current?.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div
      ref={footerRef}
      style={{
        width: '100vw',
        height: '100%',
        position: 'absolute',
        top: '-50%',
        left: '0',
        zIndex: 1,
      }}>
      <span>{position.direction}</span>
      <img
        ref={petRef}
        src={`/assets/pet/meow/${position.direction}run${runState}.gif`}
        alt="Pet"
        style={{
          position: 'absolute',
          left: petInitialLeft.current,
          bottom: '50%',
        }}
      />
    </div>
  );
}

export default Pet;