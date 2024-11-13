import React, { useState, useEffect } from 'react';

interface ActivityRecord {
  id: number;
  windowTitle: string;
  applicationName: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export default function Dashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityRecord[]>([]);
 

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Activity History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Window Title</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activityHistory.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.applicationName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.windowTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(activity.startTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(activity.endTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDuration(activity.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 