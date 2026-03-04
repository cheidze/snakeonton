
import React, { useEffect, useState } from 'react';
import { GameEngine } from '../services/gameEngine';
import { Snake, PlayerData } from '../types';
import XPBar from './XPBar';

interface Props {
    engine: GameEngine;
    playerData: PlayerData;
    themeColor?: string;
}

interface LocalStats {
    length: number;
    rank: number;
    name: string;
    country: string;
}

const HUD: React.FC<Props> = ({ engine, playerData, themeColor = '#00f3ff' }) => {
    const [leaderboard, setLeaderboard] = useState<Snake[]>([]);
    const [myStats, setMyStats] = useState<LocalStats>({ length: 0, rank: 0, name: '', country: 'WW' });

    useEffect(() => {
        const interval = setInterval(() => {
            const snakes: Snake[] = Array.from(engine.state.snakes.values());
            snakes.sort((a, b) => b.score - a.score);
            
            const top10 = snakes.slice(0, 10);
            setLeaderboard(top10);

            const mySnake = engine.getMySnake();
            if (mySnake) {
                const rank = snakes.findIndex(s => s.id === mySnake.id) + 1;
                setMyStats({
                    length: Math.floor(mySnake.score),
                    rank,
                    name: mySnake.name,
                    country: mySnake.country || 'WW'
                });
            }
        }, 500); 

        return () => clearInterval(interval);
    }, [engine]);

    const renderFlag = (code: string) => {
        if (!code || code === 'WW' || code === '🌐') return <span className="text-base leading-none">🌐</span>;
        return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={code} className="w-4 h-2.5 object-cover rounded-[1px]" />;
    };

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Top Right: Compact Leaderboard */}
            <div className="absolute top-2 right-2 w-32 md:w-40">
                <div 
                    className="glass-panel rounded-lg p-1.5 animate-in fade-in slide-in-from-right-10 duration-500 border-l-2"
                    style={{ borderLeftColor: themeColor }}
                >
                    <h3 className="text-[9px] font-bold text-gray-400 mb-1.5 tracking-widest uppercase border-b border-white/10 pb-0.5">Leaderboard</h3>
                    <ul className="space-y-0.5">
                        {leaderboard.map((snake, idx) => (
                            <li key={snake.id} className={`flex justify-between text-[10px] items-center ${snake.id === engine.state.myId ? 'font-bold bg-white/5 rounded px-1 -mx-1' : 'text-gray-300'}`}
                                style={{ color: snake.id === engine.state.myId ? themeColor : undefined }}
                            >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-gray-500 w-2.5 text-right">{idx + 1}.</span>
                                    <div className="shrink-0 flex items-center">
                                        {renderFlag(snake.country)}
                                    </div>
                                    <span className="truncate max-w-[50px] md:max-w-[70px]">{snake.name}</span>
                                </div>
                                <span className="font-mono opacity-80">{Math.floor(snake.score)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Bottom Left: Compact Stats */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
                <div 
                    className="glass-panel rounded-lg px-3 py-2 flex flex-col min-w-[130px] animate-in fade-in slide-in-from-left-10 duration-500 border-l-2 scale-95 origin-bottom-left"
                    style={{ borderLeftColor: themeColor }}
                >
                    {myStats.name && (
                        <div className="flex items-center gap-2 mb-1.5 border-b border-white/10 pb-1.5">
                            <div className="shrink-0 w-5 h-3.5">
                                {myStats.country === 'WW' || myStats.country === '🌐' ? (
                                    <span className="text-lg leading-none">🌐</span>
                                ) : (
                                    <img 
                                        src={`https://flagcdn.com/w40/${myStats.country.toLowerCase()}.png`} 
                                        alt={myStats.country} 
                                        className="w-full h-full object-cover rounded shadow-sm"
                                    />
                                )}
                            </div>
                            <span className="font-bold text-white text-xs truncate max-w-[80px]">
                                {myStats.name}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col mb-1.5">
                        <span className="text-gray-400 text-[9px] uppercase tracking-wider">Score</span>
                        <span className="text-xl font-black text-white font-mono text-shadow-neon leading-none">{myStats.length}</span>
                        <span className="text-[10px] font-bold mt-0.5" style={{ color: themeColor }}>Rank #{myStats.rank}</span>
                    </div>
                    
                    <div className="mt-1 pt-1 border-t border-white/10">
                        <XPBar level={playerData.level} xp={playerData.xp} xpToNext={playerData.xpToNext} compact />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HUD;
