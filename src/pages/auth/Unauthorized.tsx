import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Unauthorized() {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-center text-white">
      <h1 className="mb-4 text-4xl font-bold">403 - Unauthorized</h1>
      <p className="mb-6 text-lg text-gray-300">
        Sorry, you do not have permission to access this page.
      </p>
      <div className="space-x-4">
        <Link 
          to={from} 
          replace
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go Back
        </Link>
        <Link 
          to="/" 
          replace
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
} 