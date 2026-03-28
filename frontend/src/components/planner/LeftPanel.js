import { useState } from 'react';
import { Settings, MessageSquare } from 'lucide-react';
import TripParametersPanel from './TripParametersPanel';
import AIAssistant from './AIAssistant';

export default function LeftPanel({
  itinerary,
  activities,
  accommodations,
  onActionExecuted,
  onAddAccommodation,
  onParametersChanged,
  isRegenerating,
}) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-platinum-200 bg-platinum-50">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-coral-600 border-b-2 border-coral-400 bg-white'
              : 'text-platinum-500 hover:text-charcoal-500'
          }`}
        >
          <Settings size={14} />
          Trip Settings
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-coral-600 border-b-2 border-coral-400 bg-white'
              : 'text-platinum-500 hover:text-charcoal-500'
          }`}
        >
          <MessageSquare size={14} />
          AI Chat
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'settings' ? (
          <TripParametersPanel
            itinerary={itinerary}
            onParametersChanged={onParametersChanged}
            isRegenerating={isRegenerating}
          />
        ) : (
          <AIAssistant
            itinerary={itinerary}
            activities={activities}
            accommodations={accommodations}
            onActionExecuted={onActionExecuted}
            onAddAccommodation={onAddAccommodation}
          />
        )}
      </div>
    </div>
  );
}
