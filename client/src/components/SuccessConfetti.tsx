
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export function SuccessConfetti() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative animate-scale-in">
        <CheckCircle className="w-24 h-24 text-primary animate-pulse-glow" strokeWidth={2} />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full animate-float"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-40px)`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
