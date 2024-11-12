import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [activeWindow, setActiveWindow] = useState<any>(null);

  useEffect(() => {
    console.log('Dashboard: Checking electronAPI availability');
    console.log('Dashboard: window.electronAPI =', window.electronAPI);
  }, []);

  const toggleTracking = async () => {
    console.log('Dashboard: Attempting to toggle tracking');
    try {
      if (isTracking) {
        console.log('Dashboard: Stopping tracking');
        await window.electronAPI.stopTracking();
      } else {
        console.log('Dashboard: Starting tracking');
        await window.electronAPI.startTracking();
      }
      setIsTracking(!isTracking);
    } catch (error) {
      console.error('Dashboard: Error toggling tracking:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isTracking) {
        try {
          const currentWindow = await window.electronAPI.getActiveWindow();
          setActiveWindow(currentWindow);
        } catch (error) {
          console.error('Error getting active window:', error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Activity Tracker</h1>
      
      <button 
        onClick={toggleTracking}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>

      {activeWindow && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Current Active Window</h2>
          <pre className="bg-gray-100 p-4 mt-2 rounded">
            {JSON.stringify(activeWindow, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 