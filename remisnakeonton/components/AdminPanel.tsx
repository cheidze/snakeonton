
import React, { useState, useEffect } from 'react';
import { authService, StoredUser } from '../services/authService';
import { loadPlayerData } from '../services/playerService';
import { PlayerData, GameSettings, BotDifficulty } from '../types';

interface Props {
    onLogout: () => void;
    settings: GameSettings;
    onUpdateSettings: (s: Partial<GameSettings>) => void;
}

interface EnrichedUser extends StoredUser {
    playerData: PlayerData;
}

const AdminPanel: React.FC<Props> = ({ onLogout, settings, onUpdateSettings }) => {
    const [users, setUsers] = useState<EnrichedUser[]>([]);
    const [filter, setFilter] = useState('');

    const refreshData = () => {
        const allUsers = authService.getUsers();
        // Enrich with Player Data (Levels, Gold, etc)
        const enriched = allUsers.map(u => ({
            ...u,
            playerData: loadPlayerData(u.id)
        }));
        setUsers(enriched);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const handleBanToggle = (id: string) => {
        const newStatus = authService.toggleBan(id);
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned: newStatus } : u));
    };

    const filteredUsers = users.filter(u => 
        (u.username?.toLowerCase().includes(filter.toLowerCase()) || '') ||
        (u.email?.toLowerCase().includes(filter.toLowerCase()) || '') ||
        (u.ip?.includes(filter) || '')
    );

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-mono overflow-auto custom-scrollbar">
            {/* Admin Header */}
            <div className="flex justify-between items-center mb-8 border-b border-red-500/30 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_#ff0000]">
                        ⚡
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-red-500 tracking-widest uppercase text-shadow-neon">God Mode</h1>
                        <p className="text-xs text-gray-400">BLUE ORIGIN ADMINISTRATION</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded uppercase font-bold"
                >
                    Exit System
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded">
                    <p className="text-gray-500 text-xs uppercase">Total Users</p>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded">
                    <p className="text-gray-500 text-xs uppercase">Banned Users</p>
                    <p className="text-2xl font-bold text-red-500">{users.filter(u => u.isBanned).length}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded">
                    <p className="text-gray-500 text-xs uppercase">Total Gold Circulation</p>
                    <p className="text-2xl font-bold text-yellow-400">{users.reduce((acc, u) => acc + u.playerData.gold, 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded">
                    <p className="text-gray-500 text-xs uppercase">Active (Last 24h)</p>
                    <p className="text-2xl font-bold text-green-400">
                        {users.filter(u => u.lastLogin && (Date.now() - u.lastLogin < 86400000)).length}
                    </p>
                </div>
            </div>

            {/* Game Configuration Panel */}
            <div className="bg-gray-900/50 border border-neon-blue/30 p-6 rounded-lg mb-8 shadow-[0_0_20px_rgba(0,243,255,0.05)]">
                 <h2 className="text-xl font-bold text-neon-blue mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span>🎮</span> Game Configuration
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     
                     {/* Bot Count Control */}
                     <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <label className="text-gray-300 font-bold uppercase text-sm">Active Bots</label>
                             <span className="text-neon-blue font-mono text-xl font-bold">{settings.botCount}</span>
                         </div>
                         <input 
                             type="range" 
                             min="0" 
                             max="200" 
                             step="1"
                             value={settings.botCount}
                             onChange={(e) => onUpdateSettings({ botCount: parseInt(e.target.value) })}
                             className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
                             style={{ accentColor: '#00f3ff' }}
                         />
                         <p className="text-xs text-gray-500">Adjust the density of AI opponents in real-time.</p>
                     </div>

                     {/* Bot Difficulty Control */}
                     <div className="space-y-2">
                         <label className="text-gray-300 font-bold uppercase text-sm block">Global AI Difficulty</label>
                         <div className="grid grid-cols-4 gap-2">
                             {(['easy', 'medium', 'hard', 'nightmare'] as BotDifficulty[]).map(diff => (
                                 <button
                                     key={diff}
                                     onClick={() => onUpdateSettings({ botDifficulty: diff })}
                                     className={`py-2 rounded text-xs font-bold uppercase border transition-all ${
                                         settings.botDifficulty === diff
                                         ? 'bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                                         : 'bg-black/40 text-gray-500 border-gray-700 hover:bg-white/5'
                                     }`}
                                 >
                                     {diff}
                                 </button>
                             ))}
                         </div>
                         <p className="text-xs text-gray-500">Determines speed, turn rate and aggression of bots.</p>
                     </div>
                 </div>
            </div>

            {/* Controls */}
            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Search by Username, Email or IP..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full md:w-1/3 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded focus:border-red-500 focus:outline-none"
                />
            </div>

            {/* Main Table */}
            <div className="w-full overflow-x-auto bg-gray-900 border border-gray-800 rounded-lg shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 border-b border-gray-700">User</th>
                            <th className="p-4 border-b border-gray-700">Personal Info</th>
                            <th className="p-4 border-b border-gray-700">Location / IP</th>
                            <th className="p-4 border-b border-gray-700">Device</th>
                            <th className="p-4 border-b border-gray-700">Activity</th>
                            <th className="p-4 border-b border-gray-700">Game Stats</th>
                            <th className="p-4 border-b border-gray-700">Status</th>
                            <th className="p-4 border-b border-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {user.picture ? (
                                            <img src={user.picture} alt="" className="w-8 h-8 rounded-full bg-black object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">👤</div>
                                        )}
                                        <div>
                                            <div className="font-bold text-white text-sm">{user.username || 'Incomplete'}</div>
                                            <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-300">{user.email}</div>
                                    <div className="text-xs text-gray-600 font-mono mt-1">
                                        Pass: {user.password || '<GoogleAuth>'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        DOB: {user.dob ? `${user.dob.day}/${user.dob.month}/${user.dob.year}` : 'N/A'} • {user.gender || '?'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {user.country && user.country !== 'WW' && (
                                            <img src={`https://flagcdn.com/w20/${user.country.toLowerCase()}.png`} alt="" />
                                        )}
                                        <span className="text-sm font-mono text-cyan-400">{user.ip || 'Unknown'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{user.city}, {user.country}</div>
                                </td>
                                <td className="p-4 max-w-[150px]">
                                    <div className="truncate text-xs text-gray-400 cursor-help" title={user.device}>
                                        {user.device || 'Unknown Device'}
                                    </div>
                                </td>
                                <td className="p-4 text-sm">
                                    <div className="text-gray-400">
                                        <span className="text-xs text-gray-600 block">Last Login:</span>
                                        {formatDate(user.lastLogin)}
                                    </div>
                                    <div className="text-gray-400 mt-2">
                                        <span className="text-xs text-gray-600 block">Joined:</span>
                                        {formatDate(user.createdAt)}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">Terms: <span className="text-green-500">Agreed</span></div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-neon-purple font-bold">Lvl {user.playerData.level}</span>
                                        <span className="text-gray-600">|</span>
                                        <span className="text-yellow-500">{user.playerData.gold} G</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        XP: {user.playerData.xp}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.isBanned ? (
                                        <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/30 uppercase">
                                            BANNED
                                        </span>
                                    ) : (
                                        <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/30 uppercase">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleBanToggle(user.id)}
                                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
                                            user.isBanned 
                                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                            : 'bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white'
                                        }`}
                                    >
                                        {user.isBanned ? 'Unban' : 'Ban User'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-8 text-center text-gray-600 text-xs">
                SECURE CONNECTION • BLUE ORIGIN ADMIN SYSTEM v4.0.2
            </div>
        </div>
    );
};

export default AdminPanel;
