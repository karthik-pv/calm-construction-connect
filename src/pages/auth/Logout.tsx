import { useEffect } from 'react';

export default function Logout() {
  useEffect(() => {
    // Immediately redirect to the standalone force-logout page
    window.location.href = '/force-logout.html';
  }, []);

  // Just render a simple loading state while the redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center">
        <div className="mindful-loader mb-4"></div>
        <p className="text-foreground">Redirecting to logout page...</p>
      </div>
    </div>
  );
} 