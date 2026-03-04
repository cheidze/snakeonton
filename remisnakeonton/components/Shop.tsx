
import React, { useState } from 'react';
import { DEFAULT_SKINS, DEFAULT_COLLECTIBLES } from '../services/constants';
import { SnakeSkin, Collectible } from '../types';
import { audioService } from '../services/audioService';
import { economyService } from '../services/economyService';
import { tonService } from '../services/tonService';

interface Props {
    gold: number;
    unlockedSkins: string[];
    selectedSkinId: string;
    unlockedCollectibles: string[];
    selectedCollectibleId: string | null;
    themeColor?: string; // New prop for UI theming
    onBuySkin: (skin: SnakeSkin) => boolean;
    onEquipSkin: (skinId: string) => void;
    onBuyCollectible: (item: Collectible) => boolean;
    onEquipCollectible: (itemId: string) => void;
    onUnlockSkin: (skinId: string) => void;
    onRecordTransaction: (tx: import('../types').TransactionRecord) => void;
    onClose: () => void;
    tonAddress?: string | null;
}

const Shop: React.FC<Props> = ({
    gold,
    unlockedSkins,
    selectedSkinId,
    unlockedCollectibles,
    selectedCollectibleId,
    themeColor = '#00f3ff', // Default Neon Blue
    onBuySkin,
    onEquipSkin,
    onUnlockSkin,
    onBuyCollectible,
    onEquipCollectible,
    onRecordTransaction,
    onClose,
    tonAddress
}) => {
    const [activeTab, setActiveTab] = useState<'skins' | 'particles' | 'themes' | 'withdraw'>('skins');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // State for skin preview interaction (Store preview mode per skin ID if needed, 
    // but simpler to just have a generic hover state or local state map)
    const [previewModes, setPreviewModes] = useState<Record<string, string | 'gradient'>>({});

    const handleBuySkin = (skin: SnakeSkin) => {
        const success = onBuySkin(skin);
        if (success) {
            audioService.playClick();
            setErrorMsg(null);
        } else {
            setErrorMsg("Not enough gold!");
            setTimeout(() => setErrorMsg(null), 2000);
        }
    };

    const handleBuyCollectible = (item: Collectible) => {
        const success = onBuyCollectible(item);
        if (success) {
            audioService.playClick();
            setErrorMsg(null);
        } else {
            setErrorMsg("Not enough gold!");
            setTimeout(() => setErrorMsg(null), 2000);
        }
    };

    const handleBuyWithTon = async (skin: SnakeSkin) => {
        if (!skin.tonPrice) return;
        if (!tonAddress) {
            setErrorMsg("Please connect TON wallet in Main Menu first!");
            setTimeout(() => setErrorMsg(null), 3000);
            return;
        }

        try {
            const amountNanoTon = tonService.tonToNano(skin.tonPrice);
            const treasuryAddress = "EQCJvI7GevbB_iS5HlHntk8x1zD1lH8H_-Rz-L3D3vB2R-7W";

            const success = await tonService.sendTransaction({
                toAddress: treasuryAddress,
                amountNanoTon,
                comment: `Buy Skin: ${skin.name}`
            });

            if (success) {
                audioService.playClick();
                onUnlockSkin(skin.id);

                // Record transaction locally
                onRecordTransaction({
                    id: Math.random().toString(36).substring(2, 10),
                    type: 'buy_skin',
                    amount: skin.tonPrice,
                    currency: 'TON',
                    date: Date.now(),
                    itemName: skin.name
                });

                setErrorMsg("Skin purchased successfully!");
                setTimeout(() => setErrorMsg(null), 3000);
            } else {
                throw new Error("Transaction cancelled or failed");
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Purchase failed");
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const setSkinPreview = (skinId: string, mode: string | 'gradient') => {
        setPreviewModes(prev => ({ ...prev, [skinId]: mode }));
    };

    const particles = DEFAULT_COLLECTIBLES.filter(c => c.type === 'particle');
    const themes = DEFAULT_COLLECTIBLES.filter(c => c.type === 'theme');

    const handleWithdraw = async () => {
        if (!tonAddress) {
            setErrorMsg("Please connect TON wallet in Main Menu first!");
            setTimeout(() => setErrorMsg(null), 3000);
            return;
        }

        if (!economyService.canWithdraw(gold)) {
            setErrorMsg(`Minimum withdraw is ${economyService.getMinWithdrawGold()} gold!`);
            setTimeout(() => setErrorMsg(null), 3000);
            return;
        }

        setIsWithdrawing(true);
        try {
            const tonAmount = economyService.goldToTon(gold);
            // For Demo: we send a 0 TON transaction to the backend/smart contract wallet with a comment
            // In production, the backend would sign sending TON *to* the user. This flow here is just a proof-of-work signature for claiming.
            const success = await tonService.sendTransaction({
                toAddress: "EQCJvI7GevbB_iS5HlHntk8x1zD1lH8H_-Rz-L3D3vB2R-7W", // Replace with your treasury address
                amountNanoTon: "10000000", // 0.01 TON fee for claim
                comment: `Withdraw ${tonAmount} TON for ${gold} gold`
            });

            if (success) {
                audioService.playClick();

                // Record local withdraw transaction
                onRecordTransaction({
                    id: Math.random().toString(36).substring(2, 10),
                    type: 'withdraw',
                    amount: tonAmount,
                    currency: 'TON',
                    date: Date.now()
                });

                setErrorMsg("Withdraw requested successfully!"); // In reality, update DB
                setTimeout(() => setErrorMsg(null), 3000);
            } else {
                throw new Error("Transaction cancelled or failed");
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Withdraw failed");
            setTimeout(() => setErrorMsg(null), 3000);
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="glass-panel w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden relative transition-colors duration-500"
                style={{ borderColor: `${themeColor}40`, boxShadow: `0 0 50px ${themeColor}20` }}
            >

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-white/5 gap-4">
                    <div className="flex flex-col">
                        <h2
                            className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400"
                            style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #ffffff)` }}
                        >
                            MARKETPLACE
                        </h2>
                        <div className="flex gap-4 mt-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
                            {(['skins', 'particles', 'themes', 'withdraw'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { audioService.playClick(); setActiveTab(tab); }}
                                    className={`text-sm font-bold uppercase tracking-widest border-b-2 px-2 pb-1 transition-all flex-shrink-0 ${activeTab === tab
                                        ? 'text-white border-opacity-100 scale-105'
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                        }`}
                                    style={{ borderColor: activeTab === tab ? themeColor : 'transparent' }}
                                >
                                    {tab === 'withdraw' ? '💸 WITHDRAW' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-black/40 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                            <span className="text-xl">💰</span>
                            <span className="font-mono font-bold text-neon-yellow text-xl">{gold}</span>
                        </div>
                        <button
                            onClick={() => { audioService.playClick(); onClose(); }}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition-colors font-bold text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-bounce z-50">
                        {errorMsg}
                    </div>
                )}

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">

                    {/* SKINS TAB */}
                    {activeTab === 'skins' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DEFAULT_SKINS.map(skin => {
                                const isUnlocked = unlockedSkins.includes(skin.id);
                                const isEquipped = selectedSkinId === skin.id;
                                const previewMode = previewModes[skin.id] || 'gradient';

                                return (
                                    <div
                                        key={skin.id}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${isEquipped
                                            ? 'bg-white/10'
                                            : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        style={{ borderColor: isEquipped ? themeColor : undefined }}
                                    >
                                        {/* Skin Preview Box */}
                                        <div
                                            className="h-32 rounded-lg bg-black/40 mb-4 flex flex-col items-center justify-center relative overflow-hidden transition-all"
                                        >
                                            {/* Active Preview Layer */}
                                            <div
                                                className="absolute inset-0 transition-colors duration-300"
                                                style={{
                                                    background: previewMode === 'gradient'
                                                        ? `linear-gradient(45deg, ${skin.colors[0]}, ${skin.colors[1] || skin.colors[0]})`
                                                        : previewMode
                                                }}
                                            />

                                            {/* Overlay for depth */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>

                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
                                                    <span className="text-3xl">🔒</span>
                                                </div>
                                            )}

                                            {/* Visual Indicator of what is selected */}
                                            <span className="relative z-10 font-mono text-xs font-bold bg-black/50 px-2 py-1 rounded text-white border border-white/10">
                                                {previewMode === 'gradient' ? 'GRADIENT' : 'SOLID COLOR'}
                                            </span>
                                        </div>

                                        {/* Color Pickers / Gradient Selector */}
                                        <div className="flex gap-2 justify-center mb-4">
                                            {/* Gradient Option */}
                                            <button
                                                onClick={() => setSkinPreview(skin.id, 'gradient')}
                                                className={`w-6 h-6 rounded-full border-2 shadow-lg transition-transform hover:scale-110 ${previewMode === 'gradient' ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                style={{ background: `linear-gradient(135deg, ${skin.colors[0]}, ${skin.colors[1] || skin.colors[0]})` }}
                                                title="Preview Gradient"
                                            />
                                            {/* Individual Colors */}
                                            {skin.colors.map((c, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSkinPreview(skin.id, c)}
                                                    className={`w-6 h-6 rounded-full border-2 shadow-lg transition-transform hover:scale-110 ${previewMode === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                    style={{ backgroundColor: c }}
                                                    title={`Preview Color ${i + 1}`}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center mb-4 border-t border-white/10 pt-2">
                                            <h3 className="font-bold text-lg text-white">{skin.name}</h3>
                                        </div>

                                        {isUnlocked ? (
                                            <button
                                                onClick={() => { audioService.playClick(); onEquipSkin(skin.id); }}
                                                disabled={isEquipped}
                                                className={`w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${isEquipped ? 'bg-white/20 text-white cursor-default' : 'bg-white/10 hover:text-black text-white'
                                                    }`}
                                                style={{
                                                    backgroundColor: isEquipped ? `${themeColor}40` : undefined,
                                                    color: isEquipped ? themeColor : undefined
                                                }}
                                                onMouseEnter={(e) => { if (!isEquipped) e.currentTarget.style.backgroundColor = themeColor; }}
                                                onMouseLeave={(e) => { if (!isEquipped) e.currentTarget.style.backgroundColor = ''; }}
                                            >
                                                {isEquipped ? 'Equipped' : 'Equip'}
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleBuySkin(skin)}
                                                    className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                                >
                                                    <span>Buy with Gold</span>
                                                    <span className="bg-black/20 px-2 rounded text-xs">{skin.price} 💰</span>
                                                </button>

                                                {skin.tonPrice && (
                                                    <button
                                                        onClick={() => handleBuyWithTon(skin)}
                                                        className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                                    >
                                                        <span>Buy with TON</span>
                                                        <span className="bg-white/20 px-2 rounded text-xs font-mono">{skin.tonPrice} TON</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PARTICLES TAB */}
                    {activeTab === 'particles' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {particles.map(item => {
                                const isUnlocked = unlockedCollectibles.includes(item.id);
                                const isEquipped = selectedCollectibleId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${isEquipped ? 'bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        style={{ borderColor: isEquipped ? themeColor : undefined }}
                                    >
                                        <div className="h-32 rounded-lg bg-black/40 mb-4 flex flex-col items-center justify-center relative overflow-hidden text-center p-2">
                                            <div className="absolute w-full h-full opacity-20" style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}></div>
                                            <div className="text-5xl mb-2 relative z-10 drop-shadow-lg transform group-hover:scale-110 transition-transform animate-bounce">{item.icon}</div>
                                            <p className="text-xs text-gray-400 relative z-10 italic">{item.description}</p>

                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                                    <span className="text-3xl">🔒</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg text-white">{item.name}</h3>
                                        </div>

                                        {isUnlocked ? (
                                            <button
                                                onClick={() => { audioService.playClick(); onEquipCollectible(item.id); }}
                                                disabled={isEquipped}
                                                className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all text-white"
                                                style={{
                                                    backgroundColor: isEquipped ? `${themeColor}40` : 'rgba(255,255,255,0.1)',
                                                    color: isEquipped ? themeColor : 'white'
                                                }}
                                            >
                                                {isEquipped ? 'Active' : 'Activate'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBuyCollectible(item)}
                                                className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                            >
                                                <span>Buy</span>
                                                <span className="bg-black/20 px-2 rounded text-xs">{item.price} 💰</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* THEMES TAB */}
                    {activeTab === 'themes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {themes.map(item => {
                                const isUnlocked = unlockedCollectibles.includes(item.id);
                                const isEquipped = selectedCollectibleId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${isEquipped ? 'bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        style={{ borderColor: isEquipped ? themeColor : undefined }}
                                    >
                                        {/* Theme Preview */}
                                        <div
                                            className="h-32 rounded-lg mb-4 flex flex-col items-center justify-center relative overflow-hidden border-2 border-white/10"
                                            style={{ backgroundColor: item.id === 'theme_dark' ? '#000' : '#2a2a2a' }}
                                        >
                                            {/* Mock UI Elements */}
                                            <div className="absolute top-2 left-2 right-2 h-4 rounded bg-white/10 flex items-center px-2 gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ background: item.color }}></div>
                                                <div className="w-10 h-1 bg-white/20 rounded"></div>
                                            </div>
                                            <div
                                                className="w-16 h-8 rounded flex items-center justify-center font-bold text-xs shadow-lg"
                                                style={{ border: `1px solid ${item.color}`, color: item.color, background: `${item.color}20` }}
                                            >
                                                UI
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 italic">{item.description}</p>

                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                                    <span className="text-3xl">🔒</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg text-white">{item.name}</h3>
                                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: item.color }}></div>
                                        </div>

                                        {isUnlocked ? (
                                            <button
                                                onClick={() => { audioService.playClick(); onEquipCollectible(item.id); }}
                                                disabled={isEquipped}
                                                className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all text-white"
                                                style={{
                                                    backgroundColor: isEquipped ? `${item.color}40` : 'rgba(255,255,255,0.1)',
                                                    color: isEquipped ? item.color : 'white',
                                                    borderColor: isEquipped ? item.color : 'transparent'
                                                }}
                                            >
                                                {isEquipped ? 'Active' : 'Activate'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBuyCollectible(item)}
                                                className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                            >
                                                <span>Buy</span>
                                                <span className="bg-black/20 px-2 rounded text-xs">{item.price} 💰</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* WITHDRAW TAB */}
                    {activeTab === 'withdraw' && (
                        <div className="flex flex-col items-center justify-center py-10 max-w-lg mx-auto text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-2">
                                <span className="text-4xl text-white">💎</span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Convert Gold to TON</h3>
                                <p className="text-gray-400 text-sm">Play games, gather gold, and convert your hard-earned stash directly into real TON to your connected wallet.</p>
                            </div>

                            <div className="w-full bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Your Balance</span>
                                    <span className="font-mono font-bold text-neon-yellow text-xl">{gold.toLocaleString()} 💰</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Estimated TON</span>
                                    <span className="font-mono font-bold text-blue-400 text-xl">{economyService.goldToTon(gold).toFixed(3)} TON</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Connected Wallet</span>
                                    {tonAddress ? (
                                        <span className="font-mono font-bold text-green-400 text-sm">{tonService.formatAddress(tonAddress)}</span>
                                    ) : (
                                        <span className="font-bold text-red-500 text-sm">Not Connected</span>
                                    )}
                                </div>
                            </div>

                            <div className="w-full space-y-3 pt-4">
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing || gold === 0}
                                    className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isWithdrawing ? "Processing..." : "CONFIRM WITHDRAW"}
                                </button>

                                {!economyService.canWithdraw(gold) && (
                                    <p className="text-red-400 text-xs font-bold uppercase">
                                        Minimum withdraw: {economyService.getMinWithdrawGold().toLocaleString()} 💰
                                    </p>
                                )}
                                {!tonAddress && (
                                    <p className="text-yellow-400 text-xs font-bold uppercase">
                                        Connect TON Space in Main Menu to withdraw
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Shop;
