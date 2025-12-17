import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Item, Enemy, Attribute, ItemType, Skill, StatusEffect, Stats, EnemyType, NodeContent } from '../types/game';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, Download, Upload } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function ManagerPage() {
  const { configs, updateConfig, importState, resetState, language, updateNodeRegistry } = useGameStore();
  const t = translations[language || 'en'];
  
  // Item Creator State
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '', type: 'Material', weight: 1, value: 0, rarity: 'G1', description: '', stats: {}
  });

  // Enemy Creator State
  const [newEnemy, setNewEnemy] = useState<Partial<Enemy>>({
    name: '', type: 'Monster', attribute: 'Sever', stats: { hp: 10, maxHp: 10, av: 0, attack: 1, radiation: 0 }, description: '', dropTable: [], skills: [], weight: 10
  });

  // Skill Creator State
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '', type: 'Damage', cost: 0, description: '', cooldown: 0, formula: '', statusEffectId: ''
  });

  // Status Effect Creator State
  const [newStatus, setNewStatus] = useState<Partial<StatusEffect>>({
    name: '', type: 'Debuff', description: '', duration: 1, maxStacks: 1, modifiers: {}, damageOverTime: { type: 'HP', value: 0, trigger: 'EndTurn' }
  });

  // Node Content Creator State
  const [newNode, setNewNode] = useState<Partial<NodeContent>>({
    type: 'Combat', description: '', weight: 10, enemyPool: [], itemPool: []
  });

  // Handlers
  const handleAddItem = () => {
    if (!newItem.name) return;
    const item: Item = {
      ...newItem as Item,
      id: uuidv4(),
    };
    updateConfig({ customItems: [...configs.customItems, item] });
    setNewItem({ name: '', type: 'Material', weight: 1, value: 0, rarity: 'G1', description: '', stats: {} });
  };

  const handleAddEnemy = () => {
    if (!newEnemy.name) return;
    const enemy: Enemy = {
      ...newEnemy as Enemy,
      id: uuidv4(),
      dropTable: []
    };
    updateConfig({ customEnemies: [...configs.customEnemies, enemy] });
    setNewEnemy({ name: '', type: 'Monster', attribute: 'Sever', stats: { hp: 10, maxHp: 10, av: 0, attack: 1, radiation: 0 }, description: '', dropTable: [], skills: [], weight: 10 });
  };

  const handleAddSkill = () => {
    if (!newSkill.name) return;
    const skill: Skill = {
      ...newSkill as Skill,
      id: uuidv4()
    };
    updateConfig({ skills: [...configs.skills, skill] });
    setNewSkill({ name: '', type: 'Damage', cost: 0, description: '', cooldown: 0, formula: '', statusEffectId: '' });
  };

  const handleAddStatus = () => {
    if (!newStatus.name) return;
    const status: StatusEffect = {
      ...newStatus as StatusEffect,
      id: uuidv4()
    };
    updateConfig({ statusEffects: [...configs.statusEffects, status] });
    setNewStatus({ name: '', type: 'Debuff', description: '', duration: 1, maxStacks: 1, modifiers: {}, damageOverTime: { type: 'HP', value: 0, trigger: 'EndTurn' } });
  };
  
  const handleAddNode = () => {
      if (!newNode.description) return;
      const node: NodeContent = {
          ...newNode as NodeContent,
          id: uuidv4()
      };
      // Ensure configs.nodeRegistry exists or init it
      const currentNodes = configs.nodeRegistry || [];
      updateNodeRegistry([...currentNodes, node]);
      setNewNode({ type: 'Combat', description: '', weight: 10, enemyPool: [], itemPool: [] });
  };

  const handleDeleteItem = (id: string) => {
    updateConfig({ customItems: configs.customItems.filter(i => i.id !== id) });
  };

  const handleDeleteEnemy = (id: string) => {
    updateConfig({ customEnemies: configs.customEnemies.filter(e => e.id !== id) });
  };

  const handleDeleteSkill = (id: string) => {
    updateConfig({ skills: configs.skills.filter(s => s.id !== id) });
  };

  const handleDeleteStatus = (id: string) => {
    updateConfig({ statusEffects: configs.statusEffects.filter(s => s.id !== id) });
  };
  
  const handleDeleteNode = (id: string) => {
      updateNodeRegistry((configs.nodeRegistry || []).filter(n => n.id !== id));
  };

  const handleExport = () => {
    const state = useGameStore.getState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trpg_save_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target?.result as string);
        importState(state);
      } catch (err) {
        console.error('Failed to parse save file', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{t.manager.title}</h2>
        <div className="flex gap-2">
           <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
             <Download size={16} /> {t.manager.exportSave}
           </button>
           <label className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
             <Upload size={16} /> {t.manager.importSave}
             <input type="file" onChange={handleImport} className="hidden" accept=".json" />
           </label>
           <button onClick={resetState} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded hover:bg-red-700">
             <Trash2 size={16} /> {t.manager.resetAll}
           </button>
        </div>
      </div>

      {/* Item Creator */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-purple-400">{t.manager.itemRegistry}</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <input 
            className="bg-gray-700 p-2 rounded col-span-2"
            placeholder={t.manager.itemName}
            value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
          />
          <select 
            className="bg-gray-700 p-2 rounded"
            value={newItem.type}
            onChange={e => setNewItem({...newItem, type: e.target.value as ItemType})}
          >
            {[
              { val: 'Weapon', label: '武器' },
              { val: 'Armor', label: '装备' },
              { val: 'Consumable', label: '消耗品' },
              { val: 'Material', label: '素材' },
              { val: 'AC', label: 'AC核心' },
              { val: 'Misc', label: '杂物' }
            ].map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
          </select>

          {newItem.type === 'Weapon' && (
            <select
              className="bg-gray-700 p-2 rounded"
              value={newItem.stats?.weaponCategory || 'LightBlade'}
              onChange={e => setNewItem({
                ...newItem, 
                stats: { ...newItem.stats, weaponCategory: e.target.value as any }
              })}
            >
              {[
                 {val: 'LightBlade', label: '轻型刃具'},
                 {val: 'HeavyImpact', label: '重型打击'},
                 {val: 'Polearm', label: '长柄'},
                 {val: 'Ranged', label: '远程'},
                 {val: 'Sprayer', label: '喷射器'}
              ].map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          )}

          <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder={t.manager.weight}
            value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)})}
          />
          <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder={t.manager.value}
            value={newItem.value} onChange={e => setNewItem({...newItem, value: parseInt(e.target.value)})}
          />
          <input 
            className="bg-gray-700 p-2 rounded col-span-2" placeholder="描述"
            value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
          />

          {/* Item Stats */}
          {(newItem.type === 'Weapon' || newItem.type === 'Armor') && (
            <div className="col-span-2 flex gap-2">
               <input type="number" className="bg-gray-700 p-2 rounded w-1/2" placeholder="攻击/防御 (AV)" 
                 value={newItem.stats?.damage || newItem.stats?.defense || 0}
                 onChange={e => {
                   const val = parseInt(e.target.value);
                   setNewItem({
                     ...newItem,
                     stats: { ...newItem.stats, [newItem.type === 'Weapon' ? 'damage' : 'defense']: val }
                   })
                 }}
               />
               <input type="number" className="bg-gray-700 p-2 rounded w-1/2" placeholder="SR (屏蔽率%)"
                 value={newItem.stats?.shielding || 0}
                 onChange={e => setNewItem({...newItem, stats: { ...newItem.stats, shielding: parseInt(e.target.value) }})} 
               />
            </div>
          )}

          {/* AC Core Specifics */}
          {newItem.type === 'AC' && (
            <div className="col-span-6 bg-gray-900 p-2 rounded grid grid-cols-2 gap-2 mt-2">
               <div className="col-span-2 text-sm text-gray-400 font-bold">AC 核心属性设定</div>
               <select 
                 className="bg-gray-700 p-2 rounded"
                 value={newItem.stats?.attribute || 'Sever'}
                 onChange={e => setNewItem({ ...newItem, stats: { ...newItem.stats, attribute: e.target.value as Attribute }})}
               >
                 {[{v:'Sever',l:'切断'}, {v:'Stable',l:'稳定'}, {v:'Flux',l:'变化'}, {v:'Precision',l:'精准'}]
                   .map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
               </select>
               <select
                 className="bg-gray-700 p-2 rounded"
                 value={newItem.stats?.acSkillId || ''}
                 onChange={e => setNewItem({ ...newItem, stats: { ...newItem.stats, acSkillId: e.target.value }})}
               >
                 <option value="">-- 绑定技能 --</option>
                 {configs.skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <div className="col-span-2 grid grid-cols-4 gap-1">
                 {['PHY', 'AGI', 'MND', 'SYN'].map(s => (
                   <input 
                     key={s} type="number" className="bg-gray-700 p-1 rounded text-xs" placeholder={`${s} 修正`}
                     value={newItem.stats?.modifiers?.[s as keyof Stats] || 0}
                     onChange={e => setNewItem({
                        ...newItem, 
                        stats: { 
                          ...newItem.stats, 
                          modifiers: { ...newItem.stats?.modifiers, [s]: parseInt(e.target.value) }
                        }
                     })}
                   />
                 ))}
               </div>
            </div>
          )}

          <button onClick={handleAddItem} className="bg-green-600 p-2 rounded flex justify-center items-center">
            <Plus size={20} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {configs.customItems.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
              <div className="flex flex-col">
                <span>{item.name} ({item.type === 'Armor' ? '装备' : item.type}) - {item.value}C</span>
                <span className="text-xs text-gray-500">{item.description}</span>
              </div>
              <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Enemy Creator */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-red-400">{t.manager.enemyBestiary}</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <input 
            className="bg-gray-700 p-2 rounded col-span-2"
            placeholder={t.manager.enemyName}
            value={newEnemy.name}
            onChange={e => setNewEnemy({...newEnemy, name: e.target.value})}
          />
          <select 
            className="bg-gray-700 p-2 rounded"
            value={newEnemy.type}
            onChange={e => setNewEnemy({...newEnemy, type: e.target.value as EnemyType})}
          >
            <option value="Monster">怪物</option>
            <option value="Human">人类</option>
          </select>
          <select 
            className="bg-gray-700 p-2 rounded"
            value={newEnemy.attribute}
            onChange={e => setNewEnemy({...newEnemy, attribute: e.target.value as Attribute})}
          >
            {[
              { val: 'Sever', label: '切断' },
              { val: 'Stable', label: '稳定' },
              { val: 'Flux', label: '变化' },
              { val: 'Precision', label: '精准' }
            ].map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
          </select>
          <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder={t.manager.hp}
            value={newEnemy.stats?.hp} onChange={e => setNewEnemy({...newEnemy, stats: { ...newEnemy.stats!, hp: parseInt(e.target.value), maxHp: parseInt(e.target.value) }})}
          />
           <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder={t.manager.atk}
            value={newEnemy.stats?.attack} onChange={e => setNewEnemy({...newEnemy, stats: { ...newEnemy.stats!, attack: parseInt(e.target.value) }})}
          />
          <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder="辐射"
            value={newEnemy.stats?.radiation} onChange={e => setNewEnemy({...newEnemy, stats: { ...newEnemy.stats!, radiation: parseInt(e.target.value) }})}
          />
          <input 
            className="bg-gray-700 p-2 rounded col-span-2" placeholder="描述"
            value={newEnemy.description} onChange={e => setNewEnemy({...newEnemy, description: e.target.value})}
          />
          <input 
            type="number" className="bg-gray-700 p-2 rounded" placeholder="权重 (Spawn Weight)"
            value={newEnemy.weight} onChange={e => setNewEnemy({...newEnemy, weight: parseInt(e.target.value)})}
          />
          <div className="col-span-6 bg-gray-900 p-2 rounded">
             <div className="text-sm text-gray-400 mb-1">绑定技能</div>
             <div className="flex flex-wrap gap-2">
                 {configs.skills.map(skill => (
                     <label key={skill.id} className="flex items-center gap-1 text-xs cursor-pointer bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">
                         <input 
                           type="checkbox" 
                           checked={newEnemy.skills?.includes(skill.id)}
                           onChange={e => {
                               const current = newEnemy.skills || [];
                               if (e.target.checked) setNewEnemy({ ...newEnemy, skills: [...current, skill.id] });
                               else setNewEnemy({ ...newEnemy, skills: current.filter(id => id !== skill.id) });
                           }}
                         />
                         {skill.name}
                     </label>
                 ))}
             </div>
          </div>
          <button onClick={handleAddEnemy} className="bg-green-600 p-2 rounded flex justify-center items-center col-span-6">
            <Plus size={20} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {configs.customEnemies.map(enemy => (
            <div key={enemy.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
              <div className="flex flex-col">
                <span>{enemy.name} [{enemy.attribute}] ({enemy.type}) - HP: {enemy.stats.hp}</span>
                <span className="text-xs text-gray-500">{enemy.description}</span>
              </div>
              <button onClick={() => handleDeleteEnemy(enemy.id)} className="text-red-400 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Creator */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-blue-400">技能注册表</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <input className="bg-gray-700 p-2 rounded col-span-2" placeholder="技能名称" value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} />
          <select className="bg-gray-700 p-2 rounded" value={newSkill.type} onChange={e => setNewSkill({...newSkill, type: e.target.value as any})}>
            <option value="Damage">伤害类</option>
            <option value="Effect">效果类</option>
          </select>
          <input type="number" className="bg-gray-700 p-2 rounded" placeholder="消耗(ER)" value={newSkill.cost} onChange={e => setNewSkill({...newSkill, cost: parseInt(e.target.value)})} />
          <input type="number" className="bg-gray-700 p-2 rounded" placeholder="冷却(回合)" value={newSkill.cooldown} onChange={e => setNewSkill({...newSkill, cooldown: parseInt(e.target.value)})} />
          
          {newSkill.type === 'Damage' && (
            <input className="bg-gray-700 p-2 rounded col-span-3" placeholder="伤害公式 (如: 1d10 + SYN)" value={newSkill.formula} onChange={e => setNewSkill({...newSkill, formula: e.target.value})} />
          )}
          {newSkill.type === 'Effect' && (
            <select className="bg-gray-700 p-2 rounded col-span-3" value={newSkill.statusEffectId || ''} onChange={e => setNewSkill({...newSkill, statusEffectId: e.target.value})}>
                <option value="">-- 绑定异常状态 --</option>
                {configs.statusEffects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
            </select>
          )}
          <input className="bg-gray-700 p-2 rounded col-span-3" placeholder="描述" value={newSkill.description} onChange={e => setNewSkill({...newSkill, description: e.target.value})} />
          
          <button onClick={handleAddSkill} className="bg-green-600 p-2 rounded flex justify-center items-center"><Plus size={20} /></button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {configs.skills.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
              <div className="flex flex-col">
                <span className="text-white font-bold">{s.name} <span className="text-xs text-gray-400">({s.type}) - Cost: {s.cost}</span></span>
                <span className="text-xs text-gray-500">{s.description} {s.formula ? `[${s.formula}]` : ''}</span>
              </div>
              <button onClick={() => handleDeleteSkill(s.id)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Status Effect Creator */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-yellow-400">异常状态注册表</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <input className="bg-gray-700 p-2 rounded col-span-2" placeholder="状态名称" value={newStatus.name} onChange={e => setNewStatus({...newStatus, name: e.target.value})} />
          <select className="bg-gray-700 p-2 rounded" value={newStatus.type} onChange={e => setNewStatus({...newStatus, type: e.target.value as any})}>
            <option value="Buff">增益 (Buff)</option>
            <option value="Debuff">减益 (Debuff)</option>
          </select>
          <input type="number" className="bg-gray-700 p-2 rounded" placeholder="持续回合" value={newStatus.duration} onChange={e => setNewStatus({...newStatus, duration: parseInt(e.target.value)})} />
          <input type="number" className="bg-gray-700 p-2 rounded" placeholder="最大层数" value={newStatus.maxStacks} onChange={e => setNewStatus({...newStatus, maxStacks: parseInt(e.target.value)})} />
          
          <div className="col-span-6 bg-gray-900 p-2 rounded grid grid-cols-2 gap-2">
             <div className="text-sm text-gray-400">持续伤害/恢复</div>
             <div className="flex gap-2">
               <select className="bg-gray-700 p-1 rounded text-xs" value={newStatus.damageOverTime?.type} onChange={e => setNewStatus({...newStatus, damageOverTime: { ...newStatus.damageOverTime!, type: e.target.value as any }})}>
                 <option value="HP">HP</option>
                 <option value="Erosion">侵蚀度</option>
               </select>
               <input type="number" className="bg-gray-700 p-1 rounded text-xs w-20" placeholder="数值(负数为减)" value={newStatus.damageOverTime?.value} onChange={e => setNewStatus({...newStatus, damageOverTime: { ...newStatus.damageOverTime!, value: parseInt(e.target.value) }})} />
               <select className="bg-gray-700 p-1 rounded text-xs" value={newStatus.damageOverTime?.trigger} onChange={e => setNewStatus({...newStatus, damageOverTime: { ...newStatus.damageOverTime!, trigger: e.target.value as any }})}>
                 <option value="StartTurn">回合开始</option>
                 <option value="EndTurn">回合结束</option>
               </select>
             </div>
             
             <div className="text-sm text-gray-400">属性修正</div>
             <div className="grid grid-cols-4 gap-1">
                 {['PHY', 'AGI', 'MND', 'SYN'].map(s => (
                   <input 
                     key={s} type="number" className="bg-gray-700 p-1 rounded text-xs" placeholder={`${s}`}
                     value={newStatus.modifiers?.[s as keyof Stats] || 0}
                     onChange={e => setNewStatus({
                        ...newStatus, 
                        modifiers: { ...newStatus.modifiers, [s]: parseInt(e.target.value) }
                     })}
                   />
                 ))}
             </div>
          </div>
          
          <input className="bg-gray-700 p-2 rounded col-span-6" placeholder="描述" value={newStatus.description} onChange={e => setNewStatus({...newStatus, description: e.target.value})} />
          
          <button onClick={handleAddStatus} className="bg-green-600 p-2 rounded flex justify-center items-center col-span-6"><Plus size={20} /></button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {configs.statusEffects.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
              <div className="flex flex-col">
                <span className={s.type === 'Buff' ? 'text-green-400 font-bold' : 'text-purple-400 font-bold'}>{s.name} <span className="text-xs text-gray-500">({s.duration}回合 / Max {s.maxStacks})</span></span>
                <span className="text-xs text-gray-500">{s.description}</span>
              </div>
              <button onClick={() => handleDeleteStatus(s.id)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      {/* Node Content Registry */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-green-400">探索节点注册表</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <select 
            className="bg-gray-700 p-2 rounded"
            value={newNode.type}
            onChange={e => setNewNode({...newNode, type: e.target.value as any})}
          >
             {['Combat', 'Resource', 'Event', 'Safe'].map(t => <option key={t} value={t}>{t === 'Combat' ? '战斗' : t === 'Resource' ? '资源' : t === 'Event' ? '事件' : '安全'}</option>)}
          </select>
          <input 
            className="bg-gray-700 p-2 rounded col-span-4" 
            placeholder="节点描述 (例如: 废弃的医疗站)"
            value={newNode.description}
            onChange={e => setNewNode({...newNode, description: e.target.value})}
          />
          <input 
            type="number" className="bg-gray-700 p-2 rounded" 
            placeholder="权重"
            value={newNode.weight}
            onChange={e => setNewNode({...newNode, weight: parseInt(e.target.value)})}
          />
          
          {newNode.type === 'Combat' && (
             <div className="col-span-6 bg-gray-900 p-2 rounded">
                <div className="text-sm text-gray-400 mb-1">包含敌人池 (随机抽取)</div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                   {configs.customEnemies.map(e => (
                      <label key={e.id} className="flex items-center gap-1 text-xs cursor-pointer bg-gray-700 px-2 py-1 rounded">
                         <input 
                           type="checkbox"
                           checked={newNode.enemyPool?.includes(e.id)}
                           onChange={ev => {
                              const current = newNode.enemyPool || [];
                              if (ev.target.checked) setNewNode({ ...newNode, enemyPool: [...current, e.id] });
                              else setNewNode({ ...newNode, enemyPool: current.filter(id => id !== e.id) });
                           }}
                         />
                         {e.name}
                      </label>
                   ))}
                </div>
             </div>
          )}

          {newNode.type === 'Resource' && (
             <div className="col-span-6 bg-gray-900 p-2 rounded">
                <div className="text-sm text-gray-400 mb-1">包含物品池 (随机抽取)</div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                   {configs.customItems.map(i => (
                      <label key={i.id} className="flex items-center gap-1 text-xs cursor-pointer bg-gray-700 px-2 py-1 rounded">
                         <input 
                           type="checkbox"
                           checked={newNode.itemPool?.includes(i.id)}
                           onChange={ev => {
                              const current = newNode.itemPool || [];
                              if (ev.target.checked) setNewNode({ ...newNode, itemPool: [...current, i.id] });
                              else setNewNode({ ...newNode, itemPool: current.filter(id => id !== i.id) });
                           }}
                         />
                         {i.name}
                      </label>
                   ))}
                </div>
             </div>
          )}
          
          <button onClick={handleAddNode} className="bg-green-600 p-2 rounded flex justify-center items-center col-span-6">
            <Plus size={20} />
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {(configs.nodeRegistry || []).map(n => (
            <div key={n.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
               <div className="flex flex-col">
                  <span className="font-bold text-white">{n.description} <span className="text-xs text-gray-500">({n.type} - W:{n.weight})</span></span>
                  <span className="text-xs text-gray-500">
                    {n.type === 'Combat' ? `Enemies: ${n.enemyPool?.length}` : n.type === 'Resource' ? `Items: ${n.itemPool?.length}` : ''}
                  </span>
               </div>
               <button onClick={() => handleDeleteNode(n.id)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
