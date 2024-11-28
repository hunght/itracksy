import React, { useEffect, useState } from 'react';

interface ActivityRecord {
  timestamp: number;
  title: string;
  owner: {
    name: string;
    path: string;
  };
}

export function Dashboard() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Load initial data
    loadActivityData();
  }, []);

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(loadActivityData, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const loadActivityData = async () => {
    try {
      // Get last 24 hours of data
      const timeRange = {
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now()
      };
      const data = await window.electron.ipcRenderer.invoke('get-activity-data', timeRange);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const toggleTracking = async () => {
    try {
      if (!isTracking) {
        await window.electron.ipcRenderer.invoke('start-tracking');
        setIsTracking(true);
      } else {
        await window.electron.ipcRenderer.invoke('stop-tracking');
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
    }
  };

  const clearData = async () => {
    try {
      await window.electron.ipcRenderer.invoke('clear-activity-data');
      setActivities([]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activity Dashboard</h1>
        <div className="space-x-4">
          <button
            onClick={toggleTracking}
            className={`px-4 py-2 rounded ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
          >
            Clear Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Window Title
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 h-96 overflow-y-scroll">
              {activities.map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.owner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.title}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 