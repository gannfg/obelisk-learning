const INVENTORY_KEY = "obelisk_inventory_v1";

export type InventoryItem = {
  id: string;
  name: string;
  acquiredAt: string;
};

export function getInventory(): InventoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(INVENTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function addItem(name: string): InventoryItem[] {
  const items = getInventory();
  const item: InventoryItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    acquiredAt: new Date().toISOString(),
  };
  const next = [...items, item];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(next));
  }
  return next;
}


