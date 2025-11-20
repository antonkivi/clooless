'use client';

import { MessageCircle, Users, Bell } from 'lucide-react';

export default function DiscordContainer() {
  return (
    <div className="min-w-lg p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
          <MessageCircle className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h3 className="font-medium text-lg mb-2 text-black">Discord</h3>
        <p className="text-sm text-gray-500 mb-6">Connect your Discord account</p>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-black">Server Status</p>
              <p className="text-xs text-gray-500">View your servers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-black">Notifications</p>
              <p className="text-xs text-gray-500">Check recent messages</p>
            </div>
          </div>
        </div>

        <button className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors">
          Connect Discord
        </button>
      </div>
    </div>
  );
}
