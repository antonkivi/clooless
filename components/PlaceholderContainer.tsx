'use client';

import { Plus } from 'lucide-react';

export default function PlaceholderContainer() {
  return (
    <div className="min-w-lg p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <Plus className="w-10 h-10 text-gray-400" />
        </div>
        
        <h3 className="font-medium text-lg mb-2 text-black">Add New Widget</h3>
        <p className="text-sm text-gray-500 mb-6">Customize your dashboard with more widgets</p>

        <div className="space-y-2 text-left max-w-xs mx-auto">
          <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
            <p className="text-sm font-medium text-black">Weather</p>
            <p className="text-xs text-gray-500">Show current weather</p>
          </div>
          
          <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
            <p className="text-sm font-medium text-black">Calendar</p>
            <p className="text-xs text-gray-500">View your schedule</p>
          </div>
          
          <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
            <p className="text-sm font-medium text-black">News</p>
            <p className="text-xs text-gray-500">Latest headlines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
