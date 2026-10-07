import React from 'react';
import { MoreHorizontal, Flag, Plus, Search, Calendar, Folder, Settings, MousePointer2 } from 'lucide-react';

export function SocialDashboard() {
  return (
    <div className="min-h-screen bg-[#DDE1EE] p-8 font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-0.5">
                  <div className="w-full h-full rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=1" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">@samanthawilliam_</h3>
                  <p className="text-xs text-gray-400">Instagram</p>
                </div>
              </div>
              <button className="text-gray-400"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-6">
              <h1 className="text-4xl font-bold flex items-baseline gap-2">
                278,534 <span className="text-xs text-gray-400 font-normal">Followers</span>
              </h1>
            </div>

            <div className="bg-gray-100 rounded-full p-1 flex mb-6">
              <button className="flex-1 bg-white shadow-sm rounded-full py-2 text-xs font-semibold">Top Locations</button>
              <button className="flex-1 text-gray-500 py-2 text-xs font-semibold">Age Range</button>
              <button className="flex-1 text-gray-500 py-2 text-xs font-semibold">Gender</button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>United States</span>
                  <span>197,520</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[70%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Brazil</span>
                  <span>32,985</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[20%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Switzerland</span>
                  <span>10,254</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[10%]"></div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-sm mb-1">Profile Views Period</h3>
              <p className="text-xs text-gray-400 mb-6">The time when your followers visit your profile page.</p>
              
              <div className="relative h-32 w-full flex items-end">
                {/* Minimal mockup of line chart */}
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,30 L20,35 L40,15 L60,30 L80,25 L100,10" fill="none" stroke="#10B981" strokeWidth="1" />
                  <path d="M0,30 L20,35 L40,15 L60,30 L80,25 L100,10 L100,40 L0,40 Z" fill="#10B981" fillOpacity="0.1" />
                  <circle cx="40" cy="15" r="1.5" fill="white" stroke="#10B981" strokeWidth="0.5" />
                </svg>
                <div className="absolute left-[40%] bottom-[65%] -translate-x-1/2 -translate-y-full bg-black text-white text-[10px] py-1 px-2 rounded font-semibold whitespace-nowrap">
                  125.2K views
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
                <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                  <span>1 PM</span><span>2 PM</span><span>3 PM</span><span>4 PM</span><span>5 PM</span><span>6 PM</span><span>7 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Accounts */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-sm">Your Accounts</h3>
                <p className="text-xs text-gray-400">You have 2 accounts</p>
              </div>
              <button className="flex items-center gap-1 border border-blue-200 text-blue-500 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Plus className="w-3 h-3" /> Add Account
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <h4 className="font-bold text-xs">@samanthawilliam_</h4>
                    <p className="text-[10px] text-gray-400">Instagram • 278,534 Followers</p>
                  </div>
                </div>
                <span className="bg-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <h4 className="font-bold text-xs">@samanthawilliam_</h4>
                    <p className="text-[10px] text-gray-400">Twitter / X • 48,150 Followers</p>
                  </div>
                </div>
                <button className="text-gray-400"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Post Activity */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-sm">Post Activity</h3>
                <p className="text-xs text-gray-400">From 15 Feb - 15 May, 2024</p>
              </div>
              <button className="border border-blue-200 text-blue-500 px-3 py-1.5 rounded-full text-xs font-semibold">
                Change Period
              </button>
            </div>

            <div className="flex justify-between mb-8">
              <div>
                <div className="text-3xl font-bold">687</div>
                <div className="text-xs text-gray-400">Stories</div>
              </div>
              <div>
                <div className="text-3xl font-bold">189</div>
                <div className="text-xs text-gray-400">Posts</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24</div>
                <div className="text-xs text-gray-400">Reels</div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-xs font-bold text-gray-300">{d}</div>
              ))}
              
              {/* Heatmap bubbles mock */}
              {[
                {v:2, c:'bg-purple-100 text-purple-400'}, {v:9, c:'bg-purple-200 text-purple-500'}, {v:35, c:'bg-blue-600 text-white'}, {v:7, c:'bg-purple-200 text-purple-500'}, {v:9, c:'bg-purple-200 text-purple-500'}, {v:6, c:'bg-purple-300 text-purple-600'}, {v:1, c:'bg-purple-50 text-purple-300'},
                {v:1, c:'bg-purple-50 text-purple-300'}, {v:7, c:'bg-purple-200 text-purple-500'}, {v:18, c:'bg-blue-500 text-white'}, {v:24, c:'bg-blue-600 text-white'}, {v:18, c:'bg-blue-500 text-white'}, {v:9, c:'bg-purple-200 text-purple-500'}, {v:24, c:'bg-blue-600 text-white'},
                {v:6, c:'bg-purple-300 text-purple-600'}, {v:18, c:'bg-blue-500 text-white'}, {v:9, c:'bg-purple-200 text-purple-500'}, {v:8, c:'bg-purple-200 text-purple-500'}, {v:24, c:'bg-blue-600 text-white'}, {v:24, c:'bg-blue-600 text-white'}, {v:8, c:'bg-purple-200 text-purple-500'},
                {v:32, c:'bg-blue-600 text-white'}, {v:8, c:'bg-purple-200 text-purple-500'}, {v:24, c:'bg-blue-600 text-white'}, {v:2, c:'bg-purple-100 text-purple-400'}, {v:9, c:'bg-purple-200 text-purple-500'}, null, null
              ].map((b, i) => (
                <div key={i} className="flex justify-center items-center h-8">
                  {b && (
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${b.c}`}>
                      {b.v}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Detected */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-sm">Anomaly Detected</h3>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <Flag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Your followers are increasing beyond our predictions. It could be because someone shared one of your posts.
            </p>

            <div className="flex items-end gap-2 h-24 mb-6 border-b border-gray-100 pb-2 relative">
              {[40, 30, 20, 60, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-teal-100 rounded-t-sm opacity-50" style={{ height: `${h}%` }}></div>
              ))}
              <div className="flex-1 bg-teal-500 rounded-t-sm relative" style={{ height: '90%', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)' }}>
                <div className="absolute bottom-[40%] left-full ml-2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                  +1,092 Followers
                </div>
              </div>
              {[30, 40, 20, 30].map((h, i) => (
                <div key={i} className="flex-1 bg-teal-100 rounded-t-sm opacity-50" style={{ height: `${h}%` }}></div>
              ))}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-4xl font-bold mb-1">98,2%</div>
                <div className="text-xs text-gray-400">Prediction 45%</div>
              </div>
              <button className="border border-blue-200 text-blue-500 px-4 py-2 rounded-full text-xs font-semibold">
                See Details
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Post Schedule */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="font-bold text-sm">Post Schedule</h3>
                <p className="text-xs text-gray-400">25 posts scheduled</p>
              </div>
              <button className="flex items-center gap-1 border border-blue-200 text-blue-500 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Plus className="w-3 h-3" /> Add Post
              </button>
            </div>

            <div className="relative space-y-6 pt-4 text-xs font-semibold text-gray-400 border-l-2 border-dashed border-gray-100 ml-8 pl-4">
              <div className="relative"><span className="absolute -left-14 top-0">09:00</span></div>
              
              <div className="relative">
                <span className="absolute -left-14 top-0">10:00</span>
                <div className="absolute -top-4 left-0 w-[120%] bg-purple-100 rounded-lg p-3 z-10 -ml-2">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold bg-white px-2 py-0.5 rounded text-[10px]">09:15</span>
                    <p className="text-[10px] text-gray-700 font-normal leading-relaxed flex-1">
                      Sometimes we forgot about the most important things in...
                    </p>
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" className="w-6 h-6 rounded" alt="" />
                  </div>
                </div>
              </div>
              
              <div className="relative"><span className="absolute -left-14 top-0">11:00</span></div>
              <div className="relative"><span className="absolute -left-14 top-0">12:00</span></div>
              
              <div className="relative">
                <span className="absolute -left-14 top-0">13:00</span>
                <div className="absolute -top-2 left-0 w-[120%] bg-pink-100 rounded-lg p-3 z-10 -ml-2 border-t-2 border-pink-400">
                  <div className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold bg-white px-2 py-0.5 rounded text-[10px]">12:30</span>
                    <p className="text-[10px] text-gray-700 font-normal leading-relaxed flex-1">
                      Quick reminder to having proper lunch and you can back to...
                    </p>
                    <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50&h=50&fit=crop" className="w-6 h-6 rounded" alt="" />
                  </div>
                </div>
              </div>
              
              <div className="relative pt-4"><span className="absolute -left-14 top-4">14:00</span></div>
              <div className="relative"><span className="absolute -left-14 top-0">15:00</span></div>
            </div>
          </div>

          {/* Post Insights */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex-1">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-sm">Post Insights</h3>
                <p className="text-[10px] text-gray-400 mt-1">Posted on May 10, 2024 - 6:10pm</p>
              </div>
              <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=100&h=60&fit=crop" className="w-16 h-10 rounded-lg object-cover" alt="" />
            </div>

            <div className="mb-6">
              <h4 className="text-[10px] font-semibold text-gray-500 mb-1">Accounts reached</h4>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">5,192,879</div>
                <div className="flex items-end gap-1 h-8">
                  {[40, 60, 30, 80, 50, 100].map((h, i) => (
                    <div key={i} className="w-1.5 bg-blue-500 rounded-full" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[10px] font-semibold text-gray-500 mb-1">Followers</h4>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">+2,953</div>
                <div className="flex items-end gap-1 h-8">
                  {[20, 30, 40, 50, 30, 80].map((h, i) => (
                    <div key={i} className="w-1.5 bg-purple-500 rounded-full" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 relative overflow-hidden">
              <h4 className="text-xs font-bold mb-2">Unique Finding</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed mb-4 max-w-[70%]">
                You have gained more reach and followers when the post is related to workspace or productivity. Keep it up!
              </p>
              <button className="border border-blue-200 text-blue-500 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-white">
                Subscribe for another finding
              </button>
              
              {/* Illustration mockup */}
              <div className="absolute right-2 bottom-2 w-16 h-16 opacity-80">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-orange-400">
                  <circle cx="50" cy="30" r="15" />
                  <rect x="30" y="50" width="40" height="50" rx="10" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
