import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ShopItem } from '../types/game';
import { Plus, Trash2, ShoppingCart, DollarSign, Settings, Sword, Shield, Coins } from 'lucide-react';
import clsx from 'clsx';

export default function ShopPage() {
  const { shops, addShop, removeShop, updateShop, shopBuyItem, shopSellItem, shopSellAllShared, characters, configs, sharedInventory } = useGameStore();
  
  // State
  const [newShopName, setNewShopName] = useState('');
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [selectedPayeeId, setSelectedPayeeId] = useState<string>('');
  
  // Edit Shop State
  const [showAddItem, setShowAddItem] = useState(false);

  // Active Shop
  const activeShop = shops.find(s => s.id === activeShopId);

  // Handlers
  const handleAddShop = () => {
      if (!newShopName) return;
      addShop(newShopName);
      setNewShopName('');
  };

  const handleAddItemToShop = (itemId: string) => {
      if (!activeShop) return;
      const item = configs.customItems.find(i => i.id === itemId);
      if (!item) return;
      // Default price = value
      const newItem: ShopItem = { itemId, price: item.value, stock: -1 };
      updateShop(activeShop.id, { inventory: [...activeShop.inventory, newItem] });
      setShowAddItem(false);
  };

  const handleUpdateShopItem = (itemId: string, updates: Partial<ShopItem>) => {
      if (!activeShop) return;
      const newInv = activeShop.inventory.map(i => i.itemId === itemId ? { ...i, ...updates } : i);
      updateShop(activeShop.id, { inventory: newInv });
  };

  const handleRemoveShopItem = (itemId: string) => {
      if (!activeShop) return;
      updateShop(activeShop.id, { inventory: activeShop.inventory.filter(i => i.itemId !== itemId) });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Shop List / Header */}
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="text-yellow-500" /> 
              {activeShop ? activeShop.name : '贸易中心'}
          </h2>
          {activeShop && (
              <button onClick={() => setActiveShopId(null)} className="text-gray-400 hover:text-white">
                  返回列表
              </button>
          )}
      </div>

      {!activeShop ? (
          // Shop List View
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shops.map(shop => (
                  <div 
                    key={shop.id} 
                    className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 cursor-pointer transition group relative"
                    onClick={() => { setActiveShopId(shop.id); setIsEditingShop(false); }}
                    onDoubleClick={() => { setActiveShopId(shop.id); setIsEditingShop(true); }}
                  >
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-yellow-100">{shop.name}</h3>
                          <ShoppingCart className="text-yellow-600 group-hover:text-yellow-400" size={32} />
                      </div>
                      <div className="text-sm text-gray-400">
                          <div>商品数量: {shop.inventory.length}</div>
                          <div>当前折扣: {shop.discount > 0 ? `-${(shop.discount * 100).toFixed(0)}%` : '无'}</div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeShop(shop.id); }}
                             className="p-2 bg-red-900/80 rounded hover:bg-red-800 text-red-200"
                           >
                               <Trash2 size={16} />
                           </button>
                      </div>
                  </div>
              ))}
              
              {/* Add Shop Card */}
              <div className="bg-gray-800/50 p-6 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-4">
                  <input 
                    className="bg-gray-900 p-2 rounded text-center w-full"
                    placeholder="新商店名称"
                    value={newShopName}
                    onChange={e => setNewShopName(e.target.value)}
                  />
                  <button 
                    onClick={handleAddShop}
                    disabled={!newShopName}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Plus size={20} /> 创建商店
                  </button>
              </div>
          </div>
      ) : (
          // Active Shop View
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
              
              {/* Left: Shop Inventory (Buy/Edit) */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                      <div className="flex gap-4">
                          <button 
                            className={clsx("px-4 py-2 rounded font-bold", !isEditingShop ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-400")}
                            onClick={() => setIsEditingShop(false)}
                          >
                              购买模式
                          </button>
                          <button 
                            className={clsx("px-4 py-2 rounded font-bold", isEditingShop ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400")}
                            onClick={() => setIsEditingShop(true)}
                          >
                              编辑模式 (GM)
                          </button>
                      </div>
                      {isEditingShop && (
                          <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">全场折扣 (0-1):</span>
                              <input 
                                type="number" step="0.1" min="0" max="1"
                                className="w-16 bg-gray-900 p-1 rounded text-right"
                                value={activeShop.discount}
                                onChange={e => updateShop(activeShop.id, { discount: parseFloat(e.target.value) })}
                              />
                          </div>
                      )}
                  </div>

                  {/* Shop Items List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {activeShop.inventory.length === 0 && <div className="text-center text-gray-500 mt-10">此商店暂无商品</div>}
                      {activeShop.inventory.map(shopItem => {
                          const itemTemplate = configs.customItems.find(i => i.id === shopItem.itemId);
                          if (!itemTemplate) return null;
                          const finalPrice = Math.floor(shopItem.price * (1 - activeShop.discount));

                          return (
                              <div key={shopItem.itemId} className="bg-gray-900 p-3 rounded flex justify-between items-center group border border-gray-800 hover:border-gray-600">
                                  <div className="flex items-center gap-3">
                                      <div className={clsx("w-10 h-10 rounded flex items-center justify-center", 
                                          itemTemplate.type === 'Weapon' ? "bg-red-900/30 text-red-400" :
                                          itemTemplate.type === 'Armor' ? "bg-blue-900/30 text-blue-400" :
                                          itemTemplate.type === 'Consumable' ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-400"
                                      )}>
                                          {itemTemplate.type === 'Weapon' ? <Sword size={20} /> : 
                                           itemTemplate.type === 'Armor' ? <Shield size={20} /> : <Settings size={20} />}
                                      </div>
                                      <div>
                                          <div className="font-bold">{itemTemplate.name}</div>
                                          <div className="text-xs text-gray-500">{itemTemplate.type} • 库存: {shopItem.stock === -1 ? '∞' : shopItem.stock}</div>
                                      </div>
                                  </div>

                                  {isEditingShop ? (
                                      <div className="flex items-center gap-2">
                                          <div className="flex flex-col items-end gap-1">
                                              <div className="flex items-center gap-1 text-xs">
                                                  <span>价格:</span>
                                                  <input 
                                                    type="number" className="w-16 bg-gray-800 p-1 rounded text-right"
                                                    value={shopItem.price}
                                                    onChange={e => handleUpdateShopItem(shopItem.itemId, { price: parseInt(e.target.value) })}
                                                  />
                                              </div>
                                              <div className="flex items-center gap-1 text-xs">
                                                  <span>库存:</span>
                                                  <input 
                                                    type="number" className="w-16 bg-gray-800 p-1 rounded text-right"
                                                    value={shopItem.stock}
                                                    onChange={e => handleUpdateShopItem(shopItem.itemId, { stock: parseInt(e.target.value) })}
                                                  />
                                              </div>
                                          </div>
                                          <button onClick={() => handleRemoveShopItem(shopItem.itemId)} className="p-2 text-red-500 hover:bg-red-900/30 rounded">
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-4">
                                          <div className="text-right">
                                              <div className="text-yellow-400 font-bold flex items-center gap-1 justify-end">
                                                  <Coins size={14} /> {finalPrice}
                                              </div>
                                              {activeShop.discount > 0 && <div className="text-xs text-gray-500 line-through">{shopItem.price}</div>}
                                          </div>
                                          <button 
                                            onClick={() => {
                                                if (selectedBuyerId) shopBuyItem(activeShop.id, shopItem.itemId, selectedBuyerId);
                                            }}
                                            disabled={!selectedBuyerId || (shopItem.stock !== -1 && shopItem.stock <= 0)}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-bold"
                                          >
                                              购买
                                          </button>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                      
                      {isEditingShop && (
                          <div className="mt-4">
                              {!showAddItem ? (
                                  <button onClick={() => setShowAddItem(true)} className="w-full py-2 border-2 border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white rounded">
                                      + 添加商品
                                  </button>
                              ) : (
                                  <div className="bg-gray-900 p-4 rounded border border-gray-700">
                                      <select 
                                        className="w-full bg-gray-800 p-2 rounded mb-2"
                                        onChange={e => handleAddItemToShop(e.target.value)}
                                        value=""
                                      >
                                          <option value="">-- 选择要上架的物品 --</option>
                                          {configs.customItems
                                              .filter(i => !activeShop.inventory.find(s => s.itemId === i.id))
                                              .map(i => <option key={i.id} value={i.id}>{i.name} ({i.value}C)</option>)}
                                      </select>
                                      <button onClick={() => setShowAddItem(false)} className="text-sm text-gray-400 hover:text-white">取消</button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>

              {/* Right: Buyer/Seller Selection */}
              <div className="flex flex-col gap-6">
                  {/* Buyer Selection (For Buy Mode) */}
                  {!isEditingShop && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h3 className="font-bold mb-3 text-green-400 flex items-center gap-2"><DollarSign size={18} /> 购买结算</h3>
                          <label className="text-xs text-gray-400 block mb-2">选择买家 (扣除金钱)</label>
                          <select 
                            className="w-full bg-gray-900 p-2 rounded mb-4"
                            value={selectedBuyerId}
                            onChange={e => setSelectedBuyerId(e.target.value)}
                          >
                              <option value="">-- 选择角色 --</option>
                              {characters.map(c => <option key={c.id} value={c.id}>{c.name} (Cr: {c.credits})</option>)}
                          </select>
                          
                          {selectedBuyerId && (
                              <div className="bg-black/30 p-2 rounded text-sm space-y-1">
                                  <div className="flex justify-between text-gray-400"><span>当前余额:</span> <span className="text-white">{characters.find(c => c.id === selectedBuyerId)?.credits}</span></div>
                                  <div className="flex justify-between text-gray-400"><span>背包负重:</span> 
                                      <span className={clsx(
                                          (characters.find(c => c.id === selectedBuyerId)?.inventory.reduce((a,b)=>a+b.weight,0) || 0) > (5 + (characters.find(c => c.id === selectedBuyerId)?.baseStats.PHY || 0)*2) ? "text-red-500" : "text-green-500"
                                      )}>
                                          {characters.find(c => c.id === selectedBuyerId)?.inventory.reduce((a,b)=>a+b.weight,0)} / {5 + (characters.find(c => c.id === selectedBuyerId)?.baseStats.PHY || 0)*2}
                                      </span>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Sell Section */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex-1 flex flex-col">
                      <h3 className="font-bold mb-3 text-blue-400 flex items-center gap-2"><DollarSign size={18} /> 出售物品</h3>
                      <label className="text-xs text-gray-400 block mb-2">收款人</label>
                      <select 
                        className="w-full bg-gray-900 p-2 rounded mb-4"
                        value={selectedPayeeId}
                        onChange={e => setSelectedPayeeId(e.target.value)}
                      >
                          <option value="">-- 选择收款角色 --</option>
                          {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>

                      <div className="mb-4">
                          <button 
                             onClick={() => selectedPayeeId && shopSellAllShared(activeShop.id, selectedPayeeId)}
                             disabled={!selectedPayeeId || sharedInventory.length === 0}
                             className="w-full bg-blue-900/50 hover:bg-blue-800 disabled:bg-gray-800 disabled:cursor-not-allowed p-2 rounded border border-blue-700 text-sm flex items-center justify-center gap-2"
                          >
                              <Trash2 size={14} /> 一键出售公共箱 ({sharedInventory.reduce((a,b) => a + (b.value || 0), 0)} Cr)
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-gray-900/50 p-2 rounded">
                          <div className="text-xs text-gray-500 mb-2 text-center">点击公共箱物品出售</div>
                          <div className="space-y-1">
                              {sharedInventory.map(item => (
                                  <div 
                                    key={item.id} 
                                    className="flex justify-between items-center bg-gray-800 p-2 rounded cursor-pointer hover:bg-red-900/30 group"
                                    onClick={() => selectedPayeeId && shopSellItem(activeShop.id, selectedPayeeId, item, true)}
                                  >
                                      <span className="text-xs truncate w-24">{item.name}</span>
                                      <span className="text-xs text-yellow-500 font-mono">{item.value} Cr</span>
                                  </div>
                              ))}
                              {sharedInventory.length === 0 && <div className="text-center text-xs text-gray-600 mt-4">公共箱为空</div>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
