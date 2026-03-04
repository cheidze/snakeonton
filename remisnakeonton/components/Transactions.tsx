import React from 'react';
import { TransactionRecord } from '../types';
import { audioService } from '../services/audioService';

interface Props {
    transactions: TransactionRecord[];
    onBack: () => void;
    themeColor?: string;
}

const Transactions: React.FC<Props> = ({ transactions, onBack, themeColor = '#00f3ff' }) => {
    // Sort descending by date
    const sorted = [...transactions].sort((a, b) => b.date - a.date);

    return (
        <div className="w-full h-full p-4 md:p-8 flex flex-col pt-16">

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    TRANSACTIONS
                </h2>
                <button
                    onClick={() => { audioService.playClick(); onBack(); }}
                    className="px-4 py-2 border border-white/20 rounded-lg text-white font-bold hover:bg-white/10 uppercase text-xs"
                >
                    Back
                </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto space-y-3 custom-scrollbar pr-2">
                {sorted.length === 0 ? (
                    <div className="text-center p-10 bg-black/40 rounded-xl border border-white/10">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No transaction history found</p>
                    </div>
                ) : (
                    sorted.map((tx) => (
                        <div
                            key={tx.id}
                            className="bg-black/40 p-4 rounded-xl border-l-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:scale-[1.01]"
                            style={{ borderLeftColor: tx.type === 'buy_skin' ? themeColor : '#3b82f6', borderTopColor: 'rgba(255,255,255,0.05)', borderRightColor: 'rgba(255,255,255,0.05)', borderBottomColor: 'rgba(255,255,255,0.05)' }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'buy_skin' ? 'bg-white/10' : 'bg-blue-500/20'}`}>
                                    <span className="text-lg">{tx.type === 'buy_skin' ? '🎨' : '💸'}</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">
                                        {tx.type === 'buy_skin' ? `Purchased Skin: ${tx.itemName}` : 'Requested Withdrawal'}
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(tx.date).toLocaleString()} • ID: <span className="font-mono text-[10px]">{tx.id.slice(0, 8)}...</span>
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`font-mono font-bold text-lg ${tx.type === 'buy_skin' ? 'text-red-400' : 'text-green-400'}`}>
                                    {tx.type === 'buy_skin' ? '-' : '+'}{tx.amount} {tx.currency}
                                </span>
                                {tx.type === 'withdraw' && (
                                    <p className="text-yellow-500 text-[10px] font-bold uppercase mt-1 text-right">Processing</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default Transactions;
