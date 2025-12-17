import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Item, Stats, Character } from '../types/game';
import { Plus, Trash2, Battery, Coins, Edit2, Shield, Sword, Cpu, AlertTriangle, Undo } from 'lucide-react';
import clsx from 'clsx';
import { translations } from '../i18n/translations';
import { v4 as uuidv4 } from 'uuid';

export default function OverviewPage() {
  const { characters, addCharacter, removeCharacter, sharedInventory, configs, language, transferToPersonal, transferToShared, moveEquippedToShared, addItemToShared, removeFromSharedInventory, updateCharacter } = useGameStore();
  const t = translations[language || 'en'];
  
  // Character Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '', origin: '', 
    baseStats: { PHY: 5, AGI: 5, MND: 5, SYN: 5 },
    hp: { current: 10, max: 10 },
    erosion: 0,
    credits: 0, battery: 100
  });

  // Shared Inventory Add Item Modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemCount, setItemCount] = useState(1);

  // Character Detail Modal
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  
  // Item Description Modal
  const [viewingItem, setViewingItem] = useState<{item: Item, source: 'shared' | 'personal' | 'equipped', charId?: string, slot?: string} | null>(null);

  // Handlers
  const handleCreate = () => {
    if (!newChar.name) return;
    addCharacter({
      name: newChar.name!,
      origin: newChar.origin || '未知',
      baseStats: newChar.baseStats as Stats,
      hp: { current: newChar.baseStats!.PHY * 2, max: newChar.baseStats!.PHY * 2 },
      erosion: 0,
      inventory: [],
      equipment: { weapon: null, armor: null, acCore: null },
      credits: 0,
      battery: 100,
      state: 'Idle',
      activeStatusEffects: [],
      learnedSkills: [] 
    });
    setIsCreating(false);
    setNewChar({ name: '', origin: '', baseStats: { PHY: 5, AGI: 5, MND: 5, SYN: 5 } });
  };

  const handleAddItemToShared = () => {
    if (!selectedItemId) return;
    const template = configs.customItems.find(i => i.id === selectedItemId);
    if (!template) return;

    const newItems = Array.from({ length: itemCount }, () => ({
        ...template,
        id: uuidv4()
    }));
    
    // Add to shared inventory directly via store action (need to expose updateSharedInventory or similar, 
    // but since we only have updateConfig/addCharacter etc, we might need to modify store or just use what we have.
    // The store definition wasn't fully shown but typically we need a setter.
    // Assuming useGameStore has a generic set method or we need to add one. 
    // Let's assume we can update the store state directly for this prototype or use a hypothetical action.
    // Since I cannot change the store interface easily without seeing it all, I'll rely on a hypothetical 'updateSharedInventory' or similar if it exists,
    // otherwise I'll just use what I have. Wait, I can see `sharedInventory` in destructured props. 
    // I need to add an action to `gameStore` to update shared inventory.
    // For now, let's implement the UI and I will add the action in next step if needed.
    // Actually I can just update the store state if I had a setter.
    // Let's implement a quick action in the store first or use a workaround? 
    // I'll add `addItemToShared` to store in the next step. For now let's write the call.
    addItemToShared(newItems);
    setIsAddingItem(false);
    setItemCount(1);
  };

  // Shared Inventory Drop Handler
  const handleDropToShared = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const sourceCharId = e.dataTransfer.getData('sourceCharId');
    const sourceType = e.dataTransfer.getData('sourceType');
    const slotName = e.dataTransfer.getData('slotName');
    
    // Transfer from Personal Inventory
    if (sourceType === 'personal' && sourceCharId && itemId) {
        transferToShared(sourceCharId, itemId);
    } 
    // Transfer from Equipped
    else if (sourceType === 'equipped' && sourceCharId && slotName) {
        moveEquippedToShared(sourceCharId, slotName as any);
    }
    // If it's already in shared, do nothing (or reorder if implemented)
  };

  const handleDeleteItem = () => {
    if (!viewingItem) return;
    const { item, source, charId, slot } = viewingItem;

    if (source === 'shared') {
       removeFromSharedInventory(item.id);
    } else if (source === 'personal' && charId) {
       const char = characters.find(c => c.id === charId);
       if (char) {
          updateCharacter(charId, { inventory: char.inventory.filter(i => i.id !== item.id) });
       }
    } else if (source === 'equipped' && charId && slot) {
       const char = characters.find(c => c.id === charId);
       if (char) {
          updateCharacter(charId, { equipment: { ...char.equipment, [slot]: null } });
       }
    }
    setViewingItem(null);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t.overview.title}</h2>
        <div className="bg-yellow-900/50 px-4 py-2 rounded border border-yellow-700 text-yellow-200 flex items-center gap-2">
           <Coins size={16} /> {t.overview.teamFunds}: {characters.reduce((acc, c) => acc + c.credits, 0)} C
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {characters.map(char => (
          <CharacterCard 
             key={char.id} 
             char={char} 
             remove={removeCharacter} 
             onEdit={() => setEditingCharId(char.id)} 
             onViewItem={(item, source, slot) => setViewingItem({ item, source, charId: char.id, slot })} 
             onDropItem={(itemId) => transferToPersonal(char.id, itemId)}
          />
        ))}

        {characters.length < 4 && (
          <div className="border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center p-8 min-h-[400px] hover:border-gray-500 transition cursor-pointer"
               onClick={() => setIsCreating(true)}>
            {!isCreating ? (
              <>
                <Plus size={48} className="text-gray-600 mb-4" />
                <span className="text-gray-500">{t.overview.recruitDiver}</span>
              </>
            ) : (
              <div className="w-full space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">{t.overview.newDiver}</h3>
                <input className="w-full bg-gray-800 p-2 rounded" placeholder="姓名" value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} />
                <input className="w-full bg-gray-800 p-2 rounded" placeholder="出身" value={newChar.origin} onChange={e => setNewChar({...newChar, origin: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(newChar.baseStats!) as Array<keyof Stats>).map(stat => (
                    <div key={stat}>
                      <label className="text-xs text-gray-400">{t.common[stat.toLowerCase() as keyof typeof t.common]}</label>
                      <input type="number" className="w-full bg-gray-800 p-1 rounded" value={newChar.baseStats![stat]} 
                             onChange={e => setNewChar({...newChar, baseStats: { ...newChar.baseStats!, [stat]: parseInt(e.target.value) }})} />
                    </div>
                  ))}
                </div>
                {/* Removed AC Attribute Selection */}
                <div className="flex gap-2">
                  <button onClick={handleCreate} className="flex-1 bg-green-600 p-2 rounded">{t.overview.recruit}</button>
                  <button onClick={() => setIsCreating(false)} className="flex-1 bg-gray-700 p-2 rounded">{t.overview.cancel}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shared Inventory */}
      <div 
        className="bg-gray-800 p-6 rounded-lg border border-gray-700"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToShared}
      >
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-xl font-semibold text-blue-400">{t.overview.sharedInventory}</h3>
           <button onClick={() => setIsAddingItem(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1">
             <Plus size={14} /> 添加物品
           </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[100px] bg-gray-900/50 p-4 rounded">
          {sharedInventory.length === 0 ? <span className="text-gray-500 italic">{t.overview.emptyContainer}</span> : 
            sharedInventory.map(item => (
              <div 
                key={item.id} 
                draggable
                onDragStart={(e) => {
                   e.dataTransfer.setData('itemId', item.id);
                   e.dataTransfer.setData('sourceType', 'shared');
                   e.dataTransfer.effectAllowed = 'move';
                }}
                className="bg-gray-700 px-3 py-1 rounded text-sm flex items-center gap-2 border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-600 select-none" 
                title={item.description}
                onClick={() => setViewingItem({ item, source: 'shared' })}
              >
                 {item.name} <span className="text-xs text-gray-400">x{item.weight}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Crafting Simulator (Moved from Manager) */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-yellow-400">{t.manager.craftingTitle || 'Alchemy of Edge'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <label className="block text-sm text-gray-400">{t.manager.selectRecipe || 'Select Recipe'}</label>
              <select className="w-full bg-gray-700 p-2 rounded">
                 <option>{t.manager.recipes?.inhibitor || 'Red Moss Inhibitor'}</option>
                 <option>{t.manager.recipes?.converter || 'AC Attribute Converter'}</option>
                 <option>{t.manager.recipes?.armor || 'Composite Armor'}</option>
                 <option>{t.manager.recipes?.battery || 'Overload Battery'}</option>
              </select>
              
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="synthesis" defaultChecked />
                    <span>{t.manager.stableSynth || 'Stable Synthesis'}</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer text-purple-400">
                    <input type="radio" name="synthesis" />
                    <span>{t.manager.erosionSynth || 'Erosion Synthesis'}</span>
                 </label>
              </div>

              <button className="w-full bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold">
                 {t.manager.synthesize || 'Synthesize'}
              </button>
           </div>
           
           <div className="bg-black p-4 rounded font-mono text-sm text-green-500">
              <p>{t.manager.awaitingInput || '> Awaiting input...'}</p>
              <p className="text-gray-500">{t.manager.awaitingInputDesc || '> Select a recipe and mode to begin simulation.'}</p>
           </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96 space-y-4 border border-gray-600">
            <h3 className="text-xl font-bold">添加物品到公共箱</h3>
            <select className="w-full bg-gray-700 p-2 rounded" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
              <option value="">-- 选择物品 --</option>
              {configs.customItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.type})</option>)}
            </select>
            <input type="number" min="1" className="w-full bg-gray-700 p-2 rounded" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value))} />
            <div className="flex gap-2">
              <button onClick={handleAddItemToShared} className="flex-1 bg-blue-600 p-2 rounded">确认添加</button>
              <button onClick={() => setIsAddingItem(false)} className="flex-1 bg-gray-600 p-2 rounded">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Viewer Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setViewingItem(null)}>
           <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-600 space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white">{viewingItem.item.name}</h3>
              <div className="text-sm text-blue-400">{viewingItem.item.type} - {viewingItem.item.rarity}</div>
              <p className="text-gray-300">{viewingItem.item.description || "暂无描述"}</p>
              {viewingItem.item.stats && (
                 <div className="bg-gray-900 p-2 rounded text-xs space-y-1">
                    {viewingItem.item.stats.damage && <div>伤害: {viewingItem.item.stats.damage}</div>}
                    {viewingItem.item.stats.defense && <div>防御 (AV): {viewingItem.item.stats.defense}</div>}
                    {viewingItem.item.stats.shielding && <div>屏蔽 (SR): {viewingItem.item.stats.shielding}%</div>}
                    {viewingItem.item.stats.modifiers && <div>属性修正: {JSON.stringify(viewingItem.item.stats.modifiers)}</div>}
                 </div>
              )}
              <button onClick={handleDeleteItem} className="w-full bg-red-900/50 hover:bg-red-800 p-2 rounded text-red-200 mt-2 flex items-center justify-center gap-2">
                 <Trash2 size={16} /> 删除物品
              </button>
              <button onClick={() => setViewingItem(null)} className="w-full bg-gray-700 p-2 rounded hover:bg-gray-600">关闭</button>
           </div>
        </div>
      )}

      {/* Character Detail Editor Modal */}
      {editingCharId && <CharacterEditor charId={editingCharId} onClose={() => setEditingCharId(null)} />}
    </div>
  );
}

// Separate Component for Card
function CharacterCard({ char, remove, onEdit, onViewItem, onDropItem }: { char: Character, remove: any, onEdit: () => void, onViewItem: (i: Item, source: 'personal' | 'equipped', slot?: string) => void, onDropItem: (id: string) => void }) {
  const { language, configs, equipItem, unequipItem } = useGameStore();
  const t = translations[language || 'en'];
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Stats Calculation with Modifiers
  const acCore = char.equipment.acCore;
  const acStats = acCore?.stats?.modifiers || {};
  const acAttr = acCore?.stats?.attribute || 'Sever'; // Default to Sever if no AC
  
  // Calculate final stats
  const getStat = (key: keyof Stats) => {
    const base = char.baseStats[key];
    const mod = acStats[key] || 0;
    // Add status effect modifiers here if needed
    return { val: base + mod, mod };
  };

  const finalStats = {
    PHY: getStat('PHY'),
    AGI: getStat('AGI'),
    MND: getStat('MND'),
    SYN: getStat('SYN')
  };

  const maxLoad = 5 + finalStats.PHY.val * 2;
  const currentLoad = char.inventory.reduce((sum, i) => sum + i.weight, 0);

  // AV & SR Calculation
  const armor = char.equipment.armor;
  const av = (armor?.stats?.defense || 0); // + Buffs
  const sr = (armor?.stats?.shielding || 0); // + Buffs

  const attrMap: Record<string, string> = {
    'Sever': '切断', 'Stable': '稳定', 'Flux': '变化', 'Precision': '精准'
  };

  const attrColor = {
    'Sever': 'bg-red-900/30 border-red-900/50',
    'Stable': 'bg-blue-900/30 border-blue-900/50',
    'Flux': 'bg-purple-900/30 border-purple-900/50',
    'Precision': 'bg-green-900/30 border-green-900/50',
  }[acAttr] || 'bg-gray-800 border-gray-700';

  return (
    <div 
      className={`rounded-lg border overflow-hidden flex flex-col transition-all duration-200 ${attrColor} ${isDragOver ? 'ring-2 ring-yellow-400 scale-[1.02]' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const itemId = e.dataTransfer.getData('itemId');
        const sourceType = e.dataTransfer.getData('sourceType');
        const slotName = e.dataTransfer.getData('slotName');
        const sourceCharId = e.dataTransfer.getData('sourceCharId');

        if (sourceType === 'equipped' && slotName && sourceCharId === char.id) {
            unequipItem(char.id, slotName as any);
        } else if (itemId) {
            onDropItem(itemId);
        }
      }}
    >
      {/* Header */}
      <div className="p-3 flex justify-between items-start cursor-pointer hover:bg-white/5 transition" onDoubleClick={onEdit}>
        <div>
          <h3 className="font-bold text-lg">{char.name}</h3>
          <div className="text-xs text-gray-400">{char.origin} • {acCore ? attrMap[acAttr] : '未同步'}</div>
        </div>
        <button onClick={() => remove(char.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
      </div>

      {/* Vitals */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-700/50">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400"><span>{t.common.hp}</span> <span>{char.hp.current}/{char.hp.max}</span></div>
          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden relative group">
             <div className="bg-red-500 h-full transition-all" style={{ width: `${Math.min(100, (char.hp.current / char.hp.max) * 100)}%` }} />
             {/* Edit Button overlay */}
             <button className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-xs" onClick={onEdit}>
               <Edit2 size={10} />
             </button>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400"><span>{t.common.erosion}</span> <span>{char.erosion}%</span></div>
          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden relative group">
            <div className={clsx("h-full transition-all", char.erosion > 50 ? "bg-purple-500 animate-pulse" : "bg-purple-800")} style={{ width: `${char.erosion}%` }} />
            <button className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-xs" onClick={onEdit}>
               <Edit2 size={10} />
             </button>
          </div>
        </div>
      </div>

      {/* Derived Stats */}
      <div className="px-4 py-2 flex justify-around text-xs bg-black/20">
         <div className="flex items-center gap-1" title="Armor Value"><Shield size={12} /> AV: {av}</div>
         <div className="flex items-center gap-1" title="Shielding Rate"><AlertTriangle size={12} /> SR: {sr}%</div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-4 gap-2 text-center text-sm border-b border-gray-700/50 bg-gray-800/50">
        {(Object.keys(finalStats) as Array<keyof Stats>).map(stat => {
           const { val, mod } = finalStats[stat];
           return (
             <div key={stat} className="relative group">
               <div className="text-xs text-gray-500">{t.common[stat.toLowerCase() as keyof typeof t.common]}</div>
               <div className={clsx("font-bold", mod > 0 ? "text-green-400" : mod < 0 ? "text-red-400" : "text-white")}>
                 {val}
               </div>
               {mod !== 0 && <span className="absolute -top-1 right-0 text-[9px] text-gray-400">{mod > 0 ? '+' : ''}{mod}</span>}
             </div>
           );
        })}
      </div>

      {/* Inventory & Equipment */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
           <Slot 
             icon={<Sword size={14}/>} label="武器" item={char.equipment.weapon} 
             onClick={() => char.equipment.weapon && onViewItem(char.equipment.weapon, 'equipped', 'weapon')}
             onDrop={(itemId, source) => equipItem(char.id, itemId, 'weapon', source === 'shared')}
             onUnequip={() => unequipItem(char.id, 'weapon')}
             charId={char.id} slotName="weapon"
           />
           <Slot 
             icon={<Shield size={14}/>} label="装备" item={char.equipment.armor} 
             onClick={() => char.equipment.armor && onViewItem(char.equipment.armor, 'equipped', 'armor')}
             onDrop={(itemId, source) => equipItem(char.id, itemId, 'armor', source === 'shared')}
             onUnequip={() => unequipItem(char.id, 'armor')}
             charId={char.id} slotName="armor"
           />
           <Slot 
             icon={<Cpu size={14}/>} label="AC核心" item={char.equipment.acCore} 
             onClick={() => char.equipment.acCore && onViewItem(char.equipment.acCore, 'equipped', 'acCore')}
             onDrop={(itemId, source) => equipItem(char.id, itemId, 'acCore', source === 'shared')}
             onUnequip={() => unequipItem(char.id, 'acCore')}
             charId={char.id} slotName="acCore"
           />
        </div>

        {/* Skills Preview (Mini) */}
        <div className="flex gap-1 flex-wrap">
           {char.learnedSkills.map(sid => {
             const skill = configs.skills.find(s => s.id === sid);
             return skill ? (
               <span key={sid} className="text-[10px] bg-blue-900/50 px-1 rounded border border-blue-800" title={skill.description}>{skill.name}</span>
             ) : null;
           })}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-semibold text-gray-400">{t.overview.inventory}</span>
             <span className={clsx("text-xs", currentLoad > maxLoad ? "text-red-500" : "text-gray-500")}>{currentLoad}/{maxLoad}</span>
          </div>
          <div className="space-y-1 min-h-[60px] max-h-[150px] overflow-y-auto">
            {char.inventory.map(item => (
              <div 
                key={item.id} 
                className="bg-gray-900/80 p-1.5 rounded text-xs flex justify-between group items-center border border-gray-800 cursor-grab active:cursor-grabbing hover:bg-white/5 select-none" 
                onClick={() => onViewItem(item, 'personal')}
                draggable
                onDragStart={(e) => {
                   e.dataTransfer.setData('itemId', item.id);
                   e.dataTransfer.setData('sourceCharId', char.id);
                   e.dataTransfer.setData('sourceType', 'personal');
                   e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <span title={item.description} className="truncate max-w-[100px]">{item.name}</span>
                <span className="text-gray-500">x{item.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-900/80 flex justify-between items-center text-xs text-gray-400">
        <div className="flex gap-2 items-center">
          <Battery size={14} className={char.battery < 20 ? "text-red-500" : "text-green-500"} /> {char.battery}%
        </div>
        <div className="flex gap-2 items-center">
          <Coins size={14} className="text-yellow-500" /> {char.credits}
        </div>
      </div>
    </div>
  );
}

function Slot({ icon, label, item, onClick, onDrop, onUnequip, charId, slotName }: { icon: any, label: string, item: Item | null, onClick?: () => void, onDrop?: (id: string, source: string) => void, onUnequip?: () => void, charId?: string, slotName?: string }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className={`bg-gray-900 p-2 rounded border border-gray-700 flex flex-col items-center justify-center text-center h-16 relative group cursor-help transition-all ${isDragOver ? 'ring-2 ring-blue-400 bg-gray-800' : ''}`} 
      title={item?.description || "Empty Slot"} 
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const itemId = e.dataTransfer.getData('itemId');
        const sourceType = e.dataTransfer.getData('sourceType');
        
        // Pass info to onDrop handler
        if (itemId && onDrop) onDrop(itemId, sourceType);
      }}
    >
      <span className="text-gray-500 mb-1 flex items-center gap-1 text-[9px]">{icon} {label}</span>
      {item ? (
        <>
          <span 
            className="text-white font-bold text-[10px] leading-tight line-clamp-2 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
               if (charId && slotName) {
                   e.dataTransfer.setData('itemId', item.id);
                   e.dataTransfer.setData('sourceCharId', charId);
                   e.dataTransfer.setData('sourceType', 'equipped');
                   e.dataTransfer.setData('slotName', slotName);
                   e.dataTransfer.effectAllowed = 'move';
               }
            }}
          >{item.name}</span>
          {onUnequip && (
            <button 
              className="absolute -top-1 -right-1 bg-red-900 text-red-200 rounded-full p-0.5 hidden group-hover:block"
              onClick={(e) => { e.stopPropagation(); onUnequip(); }}
              title="Unequip"
            >
              <Trash2 size={8} />
            </button>
          )}
        </>
      ) : <span className="text-gray-700">-</span>}
    </div>
  );
}

// Editor Modal Component
function CharacterEditor({ charId, onClose }: { charId: string, onClose: () => void }) {
  const { characters, updateCharacter, configs } = useGameStore();
  const char = characters.find(c => c.id === charId);
  if (!char) return null;
  
  // Local state for edits could be complex, for now direct updates
  // History for undo
  const [lastAction, setLastAction] = useState<{type: string, val: number} | null>(null);

  const handleDiceAdjust = (type: 'HP' | 'Erosion' | 'Credits' | 'Battery', mode: 'Add' | 'Sub') => {
    // Parse dice formula (simple parser: XdY+Z)
    // For now simple random
    const [count, sides] = diceFormula.toLowerCase().split('d').map(n => parseInt(n)) || [1, 6];
    let val = 0;
    
    // Check if it's a fixed number (no 'd')
    if (!diceFormula.toLowerCase().includes('d')) {
        val = parseInt(diceFormula) || 0;
    } else {
        for(let i=0; i<(count||1); i++) val += Math.floor(Math.random() * (sides||6)) + 1;
        if (diceFormula.includes('+')) val += parseInt(diceFormula.split('+')[1]);
    }
    
    // Store for undo
    setLastAction({ type: `${type}-${mode}`, val });

    if (type === 'HP') {
      const newHp = mode === 'Add' ? Math.min(char.hp.max, char.hp.current + val) : Math.max(0, char.hp.current - val);
      updateCharacter(charId, { hp: { ...char.hp, current: newHp } });
    } else if (type === 'Erosion') {
      const newEro = mode === 'Add' ? Math.min(100, char.erosion + val) : Math.max(0, char.erosion - val);
      updateCharacter(charId, { erosion: newEro });
    } else if (type === 'Credits') {
       const newC = mode === 'Add' ? char.credits + val : Math.max(0, char.credits - val);
       updateCharacter(charId, { credits: newC });
    } else if (type === 'Battery') {
       const newB = mode === 'Add' ? Math.min(100, char.battery + val) : Math.max(0, char.battery - val);
       updateCharacter(charId, { battery: newB });
    }
  };
  
  const handleUndo = () => {
      if (!lastAction) return;
      const [type, mode] = lastAction.type.split('-');
      const val = lastAction.val;
      
      // Inverse operation
      if (type === 'HP') {
          const newHp = mode === 'Add' ? Math.max(0, char.hp.current - val) : Math.min(char.hp.max, char.hp.current + val);
          updateCharacter(charId, { hp: { ...char.hp, current: newHp } });
      } else if (type === 'Erosion') {
          const newEro = mode === 'Add' ? Math.max(0, char.erosion - val) : Math.min(100, char.erosion + val);
          updateCharacter(charId, { erosion: newEro });
      } else if (type === 'Credits') {
          const newC = mode === 'Add' ? Math.max(0, char.credits - val) : char.credits + val;
          updateCharacter(charId, { credits: newC });
      } else if (type === 'Battery') {
          const newB = mode === 'Add' ? Math.max(0, char.battery - val) : Math.min(100, char.battery + val);
          updateCharacter(charId, { battery: newB });
      }
      setLastAction(null);
  };

  // HP/Erosion Dice Roller
  const [diceFormula, setDiceFormula] = useState('1d6');

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
       <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-600 space-y-6">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">编辑角色: {char.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">关闭</button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Col: Vitals & Stats */}
            <div className="space-y-4">
               <h3 className="font-bold border-b border-gray-700 pb-2">基础数值</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">生命值 (Max)</label>
                    <input type="number" className="w-full bg-gray-700 p-2 rounded" value={char.hp.max} onChange={e => updateCharacter(charId, { hp: { ...char.hp, max: parseInt(e.target.value) } })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">当前生命</label>
                    <input type="number" className="w-full bg-gray-700 p-2 rounded" value={char.hp.current} onChange={e => updateCharacter(charId, { hp: { ...char.hp, current: parseInt(e.target.value) } })} />
                  </div>
               </div>
               
               <div className="bg-gray-900 p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                     <div className="text-sm font-bold">数值调整器 (Dice/Fix)</div>
                     {lastAction && (
                       <button onClick={handleUndo} className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400">
                         <Undo size={12} /> 撤销
                       </button>
                     )}
                  </div>
                  <div className="flex gap-2 mb-2">
                     <input className="bg-gray-700 p-1 rounded flex-1 text-center" value={diceFormula} onChange={e => setDiceFormula(e.target.value)} placeholder="1d6+1 或 5" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <button onClick={() => handleDiceAdjust('HP', 'Add')} className="bg-green-900/50 p-2 rounded hover:bg-green-800">HP +</button>
                     <button onClick={() => handleDiceAdjust('HP', 'Sub')} className="bg-red-900/50 p-2 rounded hover:bg-red-800">HP -</button>
                     <button onClick={() => handleDiceAdjust('Erosion', 'Add')} className="bg-purple-900/50 p-2 rounded hover:bg-purple-800">侵蚀 +</button>
                     <button onClick={() => handleDiceAdjust('Erosion', 'Sub')} className="bg-blue-900/50 p-2 rounded hover:bg-blue-800">侵蚀 -</button>
                     <button onClick={() => handleDiceAdjust('Credits', 'Add')} className="bg-yellow-900/50 p-2 rounded hover:bg-yellow-800">金钱 +</button>
                     <button onClick={() => handleDiceAdjust('Credits', 'Sub')} className="bg-yellow-900/30 p-2 rounded hover:bg-yellow-800/50">金钱 -</button>
                     <button onClick={() => handleDiceAdjust('Battery', 'Add')} className="bg-green-900/30 p-2 rounded hover:bg-green-800/50">电量 +</button>
                     <button onClick={() => handleDiceAdjust('Battery', 'Sub')} className="bg-red-900/30 p-2 rounded hover:bg-red-800/50">电量 -</button>
                  </div>
               </div>
               
               <h3 className="font-bold border-b border-gray-700 pb-2 mt-6">基础属性 (Base)</h3>
               <div className="grid grid-cols-4 gap-2">
                  {['PHY', 'AGI', 'MND', 'SYN'].map(s => (
                    <div key={s}>
                      <label className="text-xs text-gray-400">{s}</label>
                      <input type="number" className="w-full bg-gray-700 p-2 rounded text-center" 
                        value={char.baseStats[s as keyof Stats]} 
                        onChange={e => updateCharacter(charId, { baseStats: { ...char.baseStats, [s]: parseInt(e.target.value) } })} 
                      />
                    </div>
                  ))}
               </div>
            </div>

            {/* Right Col: Skills & Status */}
            <div className="space-y-4">
               <h3 className="font-bold border-b border-gray-700 pb-2">技能管理 (Max 5)</h3>
               <div className="space-y-2">
                 {char.learnedSkills.map(sid => {
                    const skill = configs.skills.find(s => s.id === sid);
                    return (
                      <div key={sid} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                        <span>{skill?.name || 'Unknown Skill'}</span>
                        <button onClick={() => updateCharacter(charId, { learnedSkills: char.learnedSkills.filter(id => id !== sid) })} className="text-red-400"><Trash2 size={14}/></button>
                      </div>
                    );
                 })}
                 {char.learnedSkills.length < 5 && (
                   <select 
                     className="w-full bg-gray-900 p-2 rounded border border-dashed border-gray-600 text-gray-400"
                     onChange={e => {
                        if (e.target.value) updateCharacter(charId, { learnedSkills: [...char.learnedSkills, e.target.value] });
                     }}
                     value=""
                   >
                      <option value="">+ 添加技能</option>
                      {configs.skills.filter(s => !char.learnedSkills.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.cost} ER)</option>)}
                   </select>
                 )}
               </div>

               <h3 className="font-bold border-b border-gray-700 pb-2 mt-6">异常状态</h3>
               <div className="space-y-2">
                  {char.activeStatusEffects.map(status => {
                     const template = configs.statusEffects.find(s => s.id === status.effectId);
                     return (
                       <div key={status.effectId} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                         <span>{template?.name} <span className="text-xs text-gray-400">({status.stacks}层, {status.durationLeft}T)</span></span>
                         <button onClick={() => updateCharacter(charId, { activeStatusEffects: char.activeStatusEffects.filter(s => s.effectId !== status.effectId) })} className="text-red-400"><Trash2 size={14}/></button>
                       </div>
                     );
                  })}
                  <select 
                     className="w-full bg-gray-900 p-2 rounded border border-dashed border-gray-600 text-gray-400"
                     onChange={e => {
                        if (e.target.value) updateCharacter(charId, { activeStatusEffects: [...char.activeStatusEffects, { effectId: e.target.value, stacks: 1, durationLeft: 3 }] }); // Default 3 turns
                     }}
                     value=""
                   >
                      <option value="">+ 添加状态</option>
                      {configs.statusEffects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
               </div>
            </div>
          </div>
       </div>
    </div>
  );
}
