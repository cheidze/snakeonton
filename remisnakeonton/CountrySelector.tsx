
import React, { useState } from 'react';
import { PLAYER_COUNTRIES } from '../constants';
import { audioService } from '../services/audioService';

interface Props {
  currentFlag: string;
  onSelect: (flag: string) => void;
  onClose: () => void;
}

const CountrySelector: React.FC<Props> = ({ currentFlag, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredCountries = PLAYER_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.15)] max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-2xl font-black italic text-white tracking-wider">SELECT REGION</h2>
            <p className="text-xs text-neon-blue uppercase tracking-widest">Represent your country</p>
          </div>
          <button 
            onClick={() => { audioService.playClick(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all hover:rotate-90"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-5 pb-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 group-focus-within:text-neon-blue transition-colors">🔍</span>
            </div>
            <input 
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon-blue focus:bg-black/70 transition-all shadow-inner"
              autoFocus
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 md:grid-cols-3 gap-3 custom-scrollbar">
          {filteredCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                audioService.playClick();
                onSelect(c.code);
                onClose();
              }}
              className={`group relative flex flex-row items-center justify-start p-3 rounded-xl border transition-all duration-200 hover:-translate-y-1 ${
                currentFlag === c.code 
                  ? 'bg-neon-blue/10 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
              }`}
            >
              {/* Flag Image */}
              <div className="w-10 h-7 mr-3 shrink-0 rounded overflow-hidden bg-black/30 shadow-sm">
                 {c.code === 'WW' ? (
                    <span className="flex items-center justify-center h-full text-xl">🌐</span>
                 ) : (
                    <img 
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} 
                        alt={c.name} 
                        className="w-full h-full object-cover"
                    />
                 )}
              </div>
              
              <span className={`text-xs uppercase font-bold tracking-wider truncate text-left ${
                currentFlag === c.code ? 'text-neon-blue' : 'text-gray-400 group-hover:text-white'
              }`}>
                {c.name}
              </span>
              
              {currentFlag === c.code && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-neon-green rounded-full shadow-[0_0_5px_#00ff00]"></div>
              )}
            </button>
          ))}
          
          {filteredCountries.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500 flex flex-col items-center">
              <span className="text-4xl mb-2 opacity-50">🗺️</span>
              <span>No countries found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
