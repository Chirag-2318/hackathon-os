import React from 'react';
import { 
  Calendar as CalendarIcon, Grid, Folder, Settings, User, Plus, 
  Search, Maximize2, ChevronDown, CheckSquare, Clock
} from 'lucide-react';

export function CalendarDashboard() {
  return (
    <div className="min-h-screen bg-[#1F2123] text-white flex font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-[80px] bg-[#121315] flex flex-col items-center py-8 border-r border-[#2A2B2D] shrink-0 h-screen overflow-y-auto hidden-scrollbar">
        {/* Logo */}
        <div className="w-10 h-10 mb-12 flex flex-wrap gap-1 items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-white rounded-full opacity-50"></div>
          <div className="w-2.5 h-2.5 bg-white rounded-full opacity-50"></div>
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
        </div>

        {/* Icons */}
        <div className="flex flex-col gap-8 mb-auto text-gray-500">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <Grid className="w-5 h-5 mx-auto hover:text-white cursor-pointer transition-colors" />
          <Folder className="w-5 h-5 mx-auto hover:text-white cursor-pointer transition-colors" />
          <Settings className="w-5 h-5 mx-auto hover:text-white cursor-pointer transition-colors" />
          <User className="w-5 h-5 mx-auto hover:text-white cursor-pointer transition-colors" />
        </div>

        {/* Avatars */}
        <div className="flex flex-col gap-3 mt-12 mb-6">
          <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full border border-gray-700" alt="" />
          <img src="https://i.pravatar.cc/100?img=44" className="w-8 h-8 rounded-full border border-gray-700" alt="" />
          <img src="https://i.pravatar.cc/100?img=55" className="w-8 h-8 rounded-full border border-gray-700" alt="" />
        </div>

        <button className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center hover:bg-pink-400 transition-colors">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-screen overflow-y-auto">
        
        {/* LEFT COLUMN (Calendar & Action cards) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Calendar Widget */}
          <div className="bg-[#2C2D31] rounded-[32px] p-6 shadow-lg flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Calendar</h3>
                  <p className="text-xs text-gray-400">Working days</p>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto hidden-scrollbar mb-6">
              <button className="px-4 py-2 bg-[#F9F5EE] text-black text-xs font-bold rounded-full whitespace-nowrap">Yours</button>
              <button className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-full whitespace-nowrap border border-white/10">Henky</button>
              <button className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-full whitespace-nowrap border border-white/10">Albert</button>
              <button className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-full whitespace-nowrap border border-white/10">Richard</button>
            </div>

            <div className="flex-1 bg-[#F9F5EE] rounded-[24px] p-5 text-black flex flex-col">
              <div className="grid grid-cols-7 text-center mb-4 text-xs font-bold opacity-40">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-xs font-bold flex-1">
                {/* Mocking the calendar days */}
                <div className="w-8 h-8 mx-auto rounded-full border border-dashed border-gray-400 flex items-center justify-center opacity-50"></div>
                <div className="w-8 h-8 mx-auto rounded-full border border-dashed border-gray-400 flex items-center justify-center opacity-50"></div>
                <div className="w-8 h-8 mx-auto rounded-full border border-dashed border-gray-400 flex items-center justify-center opacity-50"></div>
                <div className="w-8 h-8 mx-auto rounded-full border border-dashed border-gray-400 flex items-center justify-center opacity-50"></div>
                <div className="w-8 h-8 mx-auto rounded-full border border-dashed border-gray-400 flex items-center justify-center opacity-50"></div>
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center bg-[#E5D7B7]">1</div>
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center bg-white shadow-sm">2</div>
                
                {[3,4,5,6,7,8,9, 10,11,12,13,14,15,16, 17,18,19,20,21,22,23, 24,25,26,27,28,29,30].map(day => (
                  <div key={day} className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${day === 13 ? 'bg-orange-500 text-white' : 'bg-white shadow-sm'}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4">
                <button><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                <span className="font-bold text-sm">June 2025</span>
                <button><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Meeting Card */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[32px] p-6 text-black flex flex-col relative overflow-hidden h-[280px]">
              <div className="flex justify-between items-start mb-auto relative z-10">
                <span className="font-bold text-sm">12.00 - 15.30</span>
                <span className="bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 48 min
                </span>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h2 className="text-2xl font-bold leading-tight mb-6">Meet Nadhim at Gramedia today</h2>
                <div className="flex gap-2">
                  <button className="bg-[#E95B30] text-white px-4 py-2 rounded-full text-xs font-bold">Details</button>
                  <button className="bg-black/10 px-4 py-2 rounded-full text-xs font-bold">Dismiss</button>
                </div>
              </div>

              {/* Decorative Book SVG Mock */}
              <div className="absolute -bottom-4 -right-4 w-40 h-40 opacity-80 pointer-events-none transform rotate-[-10deg]">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 80 C 20 80, 50 90, 80 80 L 80 20 C 80 20, 50 30, 20 20 Z" fill="#F472B6" stroke="#000" strokeWidth="4" />
                  <path d="M50 25 L 50 85" stroke="#000" strokeWidth="4" />
                  <rect x="65" y="35" width="20" height="15" fill="#FCD34D" stroke="#000" strokeWidth="2" transform="rotate(10 65 35)" />
                </svg>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[#2C2D31] rounded-[32px] p-6 flex flex-col h-[280px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Categories</h3>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex-1 overflow-y-auto hidden-scrollbar space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-gray-600 group-hover:border-white transition-colors"></div>
                  <span className="text-sm text-gray-300">Urgent</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white">Daily Task</span>
                  <span className="ml-auto w-5 h-5 rounded-full bg-pink-500 text-[10px] font-bold flex items-center justify-center">5</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-gray-600 group-hover:border-white transition-colors"></div>
                  <span className="text-sm text-gray-300">Task</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border border-gray-600 group-hover:border-white transition-colors"></div>
                  <span className="text-sm text-gray-300">Reminders</span>
                  <span className="ml-auto w-5 h-5 rounded-full bg-pink-500 text-[10px] font-bold flex items-center justify-center">9</span>
                </label>
              </div>

              <button className="flex items-center gap-2 text-gray-400 text-sm mt-4 hover:text-white transition-colors font-bold">
                <Plus className="w-4 h-4" /> Add other
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Schedule & Analytics) */}
        <div className="lg:col-span-7 bg-white text-black rounded-[32px] p-8 flex flex-col h-[calc(100vh-4rem)]">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-2">
              June, 2025 <ChevronDown className="w-6 h-6 text-gray-400" />
            </h1>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search event, task, or meeting..." 
                className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-12 mb-6 border-b border-gray-100 pb-4">
            <Maximize2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-2xl font-bold flex items-baseline gap-1">13<span className="text-base font-normal text-gray-400">/Mon</span></h2>
            <h2 className="text-2xl font-bold flex items-baseline gap-1 opacity-50">14<span className="text-base font-normal text-gray-400">/Tue</span></h2>
          </div>

          <div className="flex-1 relative overflow-y-auto hidden-scrollbar">
            {/* Timeline background lines */}
            <div className="absolute inset-0 z-0">
              {[10, 11, 12, 13, 14, 15].map((hour) => (
                <div key={hour} className="flex h-24 border-b border-gray-100 last:border-0 relative group">
                  <div className="w-16 text-xs text-gray-400 font-bold translate-y-[-50%] absolute top-0">{hour}.00</div>
                  <div className="flex-1 border-t border-dashed border-gray-200 absolute top-0 w-full left-16 z-0"></div>
                </div>
              ))}
            </div>

            {/* Schedule Blocks (absolute positioning to match timeline) */}
            <div className="relative z-10 ml-16 h-[600px]">
              
              {/* Event 1 (10:00 to 14:00) */}
              <div className="absolute top-0 left-0 w-1/2 pr-4 h-[384px]">
                <div className="w-full h-full rounded-[24px] p-5 flex flex-col justify-end text-white relative overflow-hidden" 
                     style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
                  
                  {/* Mock fluid background */}
                  <div className="absolute inset-0 opacity-50" 
                       style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}></div>
                  
                  <div className="relative z-10">
                    <p className="text-xs font-semibold opacity-80 mb-1">Packaging</p>
                    <h3 className="text-xl font-bold leading-tight mb-4">Product design revision</h3>
                    <div className="flex -space-x-2">
                      <img src="https://i.pravatar.cc/100?img=11" className="w-8 h-8 rounded-full border-2 border-orange-500" alt="" />
                      <img src="https://i.pravatar.cc/100?img=22" className="w-8 h-8 rounded-full border-2 border-orange-500" alt="" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event 2 (13:00 to 15:00) */}
              <div className="absolute top-[288px] left-1/2 w-1/2 pr-4 h-[192px]">
                <div className="w-full h-full rounded-[24px] bg-purple-300 p-5 flex flex-col text-purple-900 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold opacity-70">Project</p>
                    <span className="text-[10px] font-bold bg-purple-400/30 px-2 py-1 rounded-md text-purple-800">Deadline: 20 June</span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight mb-3">Maverick</h3>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold opacity-80">Research</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-purple-400/50"></div>
                      <span className="text-xs font-bold opacity-60">Wireframe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
