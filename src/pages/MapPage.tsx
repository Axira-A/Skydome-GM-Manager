import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { MapNode, Stats } from '../types/game';
import { Map as MapIcon, Compass, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { translations } from '../i18n/translations';

export default function MapPage() {
  const { currentLayer, setCurrentLayer, characters, addLog, language, configs, updateConfig, totalNodesVisited } = useGameStore();
  const t = translations[language || 'en'];
  const [currentNode, setCurrentNode] = useState<MapNode | null>(null);
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [rollResult, setRollResult] = useState<{ successes: number, rolls: number[], isCrit: boolean } | null>(null);

  const generateNode = () => {
    // 1. Get nodes from registry that match current layer (or all? Rules usually imply separate lists or tags. For now, we filter by type or use weight logic if layer specified in node? NodeContent doesn't have layer. Let's assume all nodes available but weighted by layer preferences)
    // Actually, user wants "adjust weights of node types per layer".
    // We can use a simple local state for weights or store it in configs if we want persistence. 
    // The previous implementation hardcoded weights.
    // Let's use the nodeRegistry to pick SPECIFIC node content if available, after picking TYPE.
    
    // Default weights if not in config
    const defaultWeights: Record<string, Record<MapNode['type'], number>> = {
      'Shallows': { 'Combat': 0.3, 'Resource': 0.4, 'Event': 0.2, 'Safe': 0.1 },
      'RedForest': { 'Combat': 0.5, 'Resource': 0.2, 'Event': 0.2, 'Safe': 0.1 },
      'DeepSky': { 'Combat': 0.6, 'Resource': 0.1, 'Event': 0.3, 'Safe': 0.0 }
    };
    
    // Use stored weights or default
    const layerWeights = (configs.nodeWeights as any)?.[currentLayer] || defaultWeights[currentLayer];

    const rand = Math.random();
    let cumulative = 0;
    let type: MapNode['type'] = 'Combat';
    
    // Normalize weights to 1 just in case
    const totalWeight = Object.values(layerWeights).reduce((a, b) => (a as number) + (b as number), 0) as number;
    
    for (const [t, w] of Object.entries(layerWeights)) {
      cumulative += (w as number) / totalWeight;
      if (rand < cumulative) {
        type = t as MapNode['type'];
        break;
      }
    }
    
    // Now pick a specific node content from registry matching this type
    const possibleNodes = (configs.nodeRegistry || []).filter(n => n.type === type);
    let selectedContent: any = null;
    
    if (possibleNodes.length > 0) {
        // Weighted random pick from registry
        const totalNodeWeight = possibleNodes.reduce((sum, n) => sum + (n.weight || 10), 0);
        let nodeRand = Math.random() * totalNodeWeight;
        for (const n of possibleNodes) {
            nodeRand -= (n.weight || 10);
            if (nodeRand <= 0) {
                selectedContent = n;
                break;
            }
        }
    }

    // Translation helpers
    const layerName = currentLayer === 'Shallows' ? '浅层' : currentLayer === 'RedForest' ? '红森林' : '深空';
    const radLevel = currentLayer === 'Shallows' ? '低' : currentLayer === 'RedForest' ? '中' : '高';
    const typeName = type === 'Combat' ? '战斗' : type === 'Resource' ? '资源' : type === 'Event' ? '事件' : '安全';

    // Resolve enemies/loot from pools
    let enemies: any[] = [];
    let loot: any[] = [];
    
    if (selectedContent) {
        if (selectedContent.enemyPool && selectedContent.enemyPool.length > 0) {
            // Pick 1-3 enemies? Or just one random from pool?
            // Let's pick 1 random for now
            const eid = selectedContent.enemyPool[Math.floor(Math.random() * selectedContent.enemyPool.length)];
            const enemyTemplate = configs.customEnemies.find(e => e.id === eid);
            if (enemyTemplate) enemies.push({ ...enemyTemplate, id: uuidv4() }); // Instance
        }
        if (selectedContent.itemPool && selectedContent.itemPool.length > 0) {
             const iid = selectedContent.itemPool[Math.floor(Math.random() * selectedContent.itemPool.length)];
             const itemTemplate = configs.customItems.find(i => i.id === iid);
             if (itemTemplate) loot.push({ ...itemTemplate, id: uuidv4() });
        }
    }

    const node: MapNode = {
      id: uuidv4(),
      type,
      layer: currentLayer,
      description: selectedContent ? selectedContent.description : `位于 ${layerName} 的 ${typeName} 节点。 (辐射等级: ${radLevel})`,
      resolved: false,
      enemies: enemies.length > 0 ? enemies : undefined,
      loot: loot.length > 0 ? loot : undefined
    };
    
    setCurrentNode(node);
    setRollResult(null);
    setSelectedCharId(null);
    addLog('System', `探索了新节点: ${typeName} - ${layerName}`);
    
    // Track visited count (needs store support or just local if not persisted, user asked to track it)
    // We'll update a counter in configs for now or just log it?
    // User asked "Map page should also record number of nodes visited".
    // We added totalNodesVisited to store.
    useGameStore.setState(s => ({ totalNodesVisited: (s.totalNodesVisited || 0) + 1 }));
  };

  const handleRoll = (attribute: keyof Stats | 'AC') => {
    if (!selectedCharId) return;
    const char = characters.find(c => c.id === selectedCharId);
    if (!char) return;

    // Use baseStats + modifiers if possible. 
    // Since we don't have a centralized helper imported here easily without duplication or extracting to utils, 
    // let's do a quick lookup of AC modifiers.
    const acStats = char.equipment.acCore?.stats?.modifiers || {};
    let diceCount = 0;
    
    if (attribute === 'AC') {
      // AC check usually uses SYN + AC modifiers? Or just SYN? Let's use SYN + Mod.
      diceCount = char.baseStats.SYN + (acStats.SYN || 0);
    } else {
      const attr = attribute as keyof Stats;
      diceCount = char.baseStats[attr] + (acStats[attr] || 0);
    }

    const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 10) + 1);
    const successes = rolls.filter(r => r >= 6).length;
    const tens = rolls.filter(r => r === 10).length;
    const isCrit = tens >= 2;

    const statMap: Record<string, string> = { 'PHY': '体魄', 'AGI': '机动', 'MND': '精神', 'SYN': '同步', 'AC': 'AC同步率' };
    const statName = statMap[attribute] || attribute;

    setRollResult({ successes, rolls, isCrit });
    addLog('System', `${char.name} 掷骰 ${statName}: [${rolls.join(', ')}] -> ${successes} 成功 ${isCrit ? '(大成功!)' : ''}`);
  };

  const statDisplayMap: Record<string, string> = { 'PHY': '体魄', 'AGI': '机动', 'MND': '精神', 'SYN': '同步' };

  return (
    <div className="space-y-8">
      {/* Layer Selection & Config */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div className="flex gap-4">
          {['Shallows', 'RedForest', 'DeepSky'].map(layer => (
            <button
              key={layer}
              onClick={() => setCurrentLayer(layer as any)}
              className={`px-4 py-2 rounded font-bold transition ${currentLayer === layer ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {layer === 'Shallows' ? t.map.shallows : layer === 'RedForest' ? t.map.redForest : t.map.deepSky}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
           <span className="text-gray-400 text-sm">已探索: {totalNodesVisited || 0}</span>
           <button onClick={() => setShowWeightConfig(!showWeightConfig)} className="bg-gray-700 p-2 rounded hover:bg-gray-600 text-sm">
              配置生成权重
           </button>
        </div>
      </div>
      
      {showWeightConfig && (
         <div className="bg-gray-800 p-4 rounded border border-gray-700 mb-4">
             <h4 className="font-bold mb-2">调整 [{currentLayer}] 节点生成权重</h4>
             <div className="grid grid-cols-4 gap-4">
                {['Combat', 'Resource', 'Event', 'Safe'].map(type => {
                    const currentWeights = (configs.nodeWeights as any)?.[currentLayer] || { 'Combat': 0.3, 'Resource': 0.3, 'Event': 0.3, 'Safe': 0.1 };
                    return (
                        <div key={type}>
                           <label className="text-xs text-gray-400 block mb-1">{type}</label>
                           <input 
                             type="number" step="0.1" max="1" min="0"
                             className="bg-gray-700 p-1 rounded w-full"
                             value={currentWeights[type] || 0}
                             onChange={e => {
                                 const val = parseFloat(e.target.value);
                                 const newWeights = { ...currentWeights, [type]: val };
                                 updateConfig({ nodeWeights: { ...configs.nodeWeights, [currentLayer]: newWeights } });
                             }}
                           />
                        </div>
                    );
                })}
             </div>
         </div>
      )}

      {/* Main Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Node View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 min-h-[300px] flex flex-col items-center justify-center text-center">
            {currentNode ? (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-gray-900 rounded-full mb-4">
                  {currentNode.type === 'Combat' && <Target size={48} className="text-red-500" />}
                  {currentNode.type === 'Resource' && <Compass size={48} className="text-blue-500" />}
                  {currentNode.type === 'Event' && <AlertTriangle size={48} className="text-yellow-500" />}
                  {currentNode.type === 'Safe' && <ShieldCheck size={48} className="text-green-500" />}
                </div>
                <h2 className="text-3xl font-bold">{currentNode.type} Node</h2>
                <p className="text-gray-400 text-lg">{currentNode.description}</p>
                
                {currentNode.type === 'Combat' && (
                  <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold mt-4">
                    {t.map.enterCombat}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                <MapIcon size={64} className="mx-auto mb-4 opacity-50" />
                <p>{t.map.noActiveNode}</p>
              </div>
            )}
          </div>
          
          <button onClick={generateNode} className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded text-xl font-bold flex items-center justify-center gap-2">
            <Compass /> {t.map.exploreNext}
          </button>
        </div>

        {/* Action / Check Panel */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4">{t.map.skillCheck}</h3>
          
          <div className="space-y-4">
            <label className="block text-sm text-gray-400">Select Character</label>
            <select 
              className="w-full bg-gray-700 p-3 rounded"
              value={selectedCharId || ''}
              onChange={e => { setSelectedCharId(e.target.value); setRollResult(null); }}
            >
              <option value="">{t.map.selectChar}</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name} (HP: {c.hp.current})</option>)}
            </select>

            {selectedCharId && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {['PHY', 'AGI', 'MND', 'SYN'].map(stat => (
                  <button 
                    key={stat}
                    onClick={() => handleRoll(stat as any)}
                    className="bg-gray-700 hover:bg-gray-600 p-3 rounded font-mono text-sm"
                  >
                    {t.map.roll} {statDisplayMap[stat]}
                  </button>
                ))}
              </div>
            )}

            {rollResult && (
              <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-600">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-white">{rollResult.successes} {t.map.hits}</div>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {rollResult.rolls.map((r, i) => (
                      <span key={i} className={`w-8 h-8 flex items-center justify-center rounded ${r >= 6 ? 'bg-green-800 text-green-100' : 'bg-gray-800 text-gray-500'} ${r === 10 ? 'border border-yellow-500' : ''}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                  {rollResult.isCrit && <div className="text-yellow-400 font-bold mt-2 animate-pulse">{t.map.criticalSuccess}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
