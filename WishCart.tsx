"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, CircleHelp, PackagePlus, Pencil, Plus, Search, ShoppingBasket, ShoppingBag, Trash2, X } from "lucide-react";
import appIcon from "./assets/wishcart-empty-illustration.png";
import emptyIllustration from "./assets/wishcart-empty-illustration-transparent.png";
import styles from "./WishCart.module.css";

type CartId = "market" | "home" | "abroad";
type Item = { id: string; name: string; quantity: number; note: string; checked: boolean };
type CartData = Record<CartId, Item[]>;

const STORAGE_KEY = "tuntun-wish-cart-v1";
const carts: { id: CartId; name: string; tab: string; emoji: string; icon: "basket" | "home" | "abroad" }[] = [
  { id: "market", name: "超市购物车", tab: "超市", emoji: "🥯", icon: "basket" },
  { id: "home", name: "回国购物车", tab: "回国", emoji: "🛒", icon: "home" },
  { id: "abroad", name: "海外购物车", tab: "海外", emoji: "🌐", icon: "abroad" },
];

const emptyData = (): CartData => ({ market: [], home: [], abroad: [] });

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readSavedData(value: string | null): CartData {
  if (!value) return emptyData();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return emptyData();
    const source = parsed as Record<string, unknown>;
    const cleanList = (key: CartId): Item[] => {
      if (!Array.isArray(source[key])) return [];
      return source[key].flatMap((raw): Item[] => {
        if (!raw || typeof raw !== "object") return [];
        const item = raw as Partial<Item>;
        if (typeof item.name !== "string" || !item.name.trim()) return [];
        return [{
          id: typeof item.id === "string" ? item.id : createItemId(),
          name: item.name.trim().slice(0, 100),
          quantity: Number.isFinite(item.quantity) ? Math.max(1, Math.min(999, Number(item.quantity))) : 1,
          note: typeof item.note === "string" ? item.note.slice(0, 240) : "",
          checked: item.checked === true,
        }];
      });
    };
    return { market: cleanList("market"), home: cleanList("home"), abroad: cleanList("abroad") };
  } catch {
    return emptyData();
  }
}

function CartIcon({ kind }: { kind: "basket" | "home" | "abroad" }) {
  if (kind === "basket") return <ShoppingBasket aria-hidden="true" />;
  if (kind === "home") return <ShoppingBag aria-hidden="true" />;
  return <PackagePlus aria-hidden="true" />;
}

export default function WishCart() {
  const [data, setData] = useState<CartData>(emptyData);
  const [ready, setReady] = useState(false);
  const [activeCart, setActiveCart] = useState<CartId>("market");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editNote, setEditNote] = useState("");
  const [toast, setToast] = useState("");
  const [english, setEnglish] = useState(false);
  const text = english ? {
    app: "Wish Cart", help: "Help", market: "Grocery Cart", home: "Home Cart", abroad: "Abroad Cart",
    subtitle: "Save what you want to buy for when you’re ready.", pending: "to buy", add: "Add an item", hint: "Name, quantity, and optional note", name: "Item name", qty: "Qty", note: "Note", all: "All", open: "To buy", done: "Bought", search: "Search items", loading: "Loading your list…", empty: "Your list is empty", noMatch: "No items found", first: "Add your first item to get started.", try: "Try another search or add a new item.", local: "Your lists are saved in this browser", switch: "Switch cart", bought: "Bought", cancel: "Unmark", delete: "Delete", edit: "Edit", save: "Save", close: "Close", invalid: "Please enter an item name.", added: "Added to your list!", required: "Item name is required", saved: "Changes saved", removed: "Removed from your list", stored: "Your lists are saved in this browser."
  } : null;

  useEffect(() => {
    queueMicrotask(() => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be disabled by the browser. */ }
      setData(readSavedData(saved));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Keep the app usable when storage is unavailable. */ }
  }, [data, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const active = carts.find((cart) => cart.id === activeCart)!;
  const items = data[activeCart];
  const openCount = items.filter((item) => !item.checked).length;
  const doneCount = items.length - openCount;
  const shownItems = useMemo(() => items.filter((item) => {
    const matchesSearch = `${item.name} ${item.note}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (filter === "all" || (filter === "open" ? !item.checked : item.checked));
  }), [filter, items, search]);

  function selectCart(id: CartId) {
    setActiveCart(id);
    setSearch("");
    setFilter("all");
    setEditingId(null);
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setToast(english ? text!.invalid : "先写下想买什么吧！"); return; }
    const parsedQuantity = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
    setData((current) => ({ ...current, [activeCart]: [{ id: createItemId(), name: cleanName.slice(0, 100), quantity: parsedQuantity, note: note.trim().slice(0, 240), checked: false }, ...current[activeCart]] }));
    setName(""); setQuantity("1"); setNote(""); setToast(english ? text!.added : "已经放进清单啦！");
  }

  function toggleItem(id: string) {
    setData((current) => ({ ...current, [activeCart]: current[activeCart].map((item) => item.id === id ? { ...item, checked: !item.checked } : item) }));
  }

  function beginEdit(item: Item) {
    setEditingId(item.id); setEditName(item.name); setEditQuantity(String(item.quantity)); setEditNote(item.note);
  }

  function saveEdit(id: string) {
    const cleanName = editName.trim();
    if (!cleanName) { setToast(english ? text!.required : "物品名称不能为空哦"); return; }
    setData((current) => ({ ...current, [activeCart]: current[activeCart].map((item) => item.id === id ? { ...item, name: cleanName.slice(0, 100), quantity: Math.max(1, Math.min(999, Math.floor(Number(editQuantity) || 1))), note: editNote.trim().slice(0, 240) } : item) }));
    setEditingId(null); setToast(english ? text!.saved : "修改已保存");
  }

  function deleteItem(id: string) {
    setData((current) => ({ ...current, [activeCart]: current[activeCart].filter((item) => item.id !== id) }));
    if (editingId === id) setEditingId(null);
    setToast(english ? text!.removed : "已从清单移除");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandAvatar}><Image src={appIcon} alt="购物车图标" priority /></span>
          <span className={styles.brandName}>{english ? text!.app : "购物车"}</span>
        </div>
        <div className={styles.headerActions}><button type="button" className={styles.languageButton} onClick={() => setEnglish(!english)} aria-label="Switch language">{english ? "中文" : "EN"}</button><button className={styles.helpButton} type="button" onClick={() => setToast(english ? text!.stored : "清单保存在这台设备的浏览器里，随时回来继续整理。")} aria-label={english ? text!.help : "查看使用提示"}><CircleHelp size={19} /></button></div>
      </header>

      <div className={styles.container}>
        <section className={styles.heading} aria-labelledby="list-heading">
          <div>
            <p className={styles.kicker}>MY SHOPPING LIST</p>
            <h1 id="list-heading"><span className={styles.headingEmoji} aria-hidden="true">{active.emoji}</span>{english ? text![activeCart] : active.name}</h1>
            <p className={styles.subtitle}>{english ? text!.subtitle : "记下想买的东西，准备好时再去采购。"}</p>
          </div>
          <div className={styles.summary} aria-label={`${openCount} ${english ? text!.pending : "件待买"}`}>
            <strong>{openCount}</strong><span>{english ? text!.pending : "件待买"}</span>
          </div>
        </section>

        <form className={styles.addForm} onSubmit={addItem}>
          <div className={styles.formHeading}><span className={styles.plusBadge}><Plus size={17} /></span><div><strong>{english ? text!.add : "添加物品"}</strong><span>{english ? text!.hint : "写下名称、数量和可选备注"}</span></div></div>
          <div className={styles.formFields}>
            <label className={styles.nameField}><span className={styles.srOnly}>{english ? text!.name : "物品名称"}</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={english ? text!.name : "物品名称"} /></label>
            <label className={`${styles.quantityField} ${quantity ? styles.quantityFilled : ""}`}><span aria-hidden="true">{english ? text!.qty : "数量"}</span><input type="number" min="1" max="999" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-label={english ? text!.qty : "数量"} /></label>
            <label className={styles.noteField}><span className={styles.srOnly}>{english ? text!.note : "备注（可选）"}</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder={english ? text!.note : "备注"} /></label>
            <button className={styles.addButton} type="submit"><Plus size={17} /><span>{english ? "Add" : "添加"}</span></button>
          </div>
        </form>

        <div className={styles.listToolbar}>
          <div className={styles.filterTabs} role="group" aria-label={english ? text!.all : "筛选清单"}>
            <button type="button" onClick={() => setFilter("all")} className={filter === "all" ? styles.activeFilter : ""}>{english ? text!.all : "全部"} <span>{items.length}</span></button>
            <button type="button" onClick={() => setFilter("open")} className={filter === "open" ? styles.activeFilter : ""}>{english ? text!.open : "待买"} <span>{openCount}</span></button>
            <button type="button" onClick={() => setFilter("done")} className={filter === "done" ? styles.activeFilter : ""}>{english ? text!.done : "已买"} <span>{doneCount}</span></button>
          </div>
          <label className={styles.searchBox}><Search size={16} /><span className={styles.srOnly}>{english ? text!.search : "搜索清单"}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={english ? text!.search : "搜索物品"} /></label>
        </div>

        <div className={styles.itemsList} aria-live="polite">
          {!ready ? <div className={styles.loadingRow}>{english ? text!.loading : "正在加载清单…"}</div> : shownItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Image src={emptyIllustration} alt="购物车图标" width={108} height={108} /></div>
              <h2>{items.length === 0 ? (english ? text!.empty : "清单还是空的") : (english ? text!.noMatch : "没有找到物品")}</h2>
              <p>{items.length === 0 ? (english ? text!.first : "添加第一件想买的东西吧。") : (english ? text!.try : "试试换个筛选词，或添加一件新物品。")}</p>
            </div>
          ) : shownItems.map((item) => <article className={`${styles.itemRow} ${item.checked ? styles.completed : ""}`} key={item.id}>
            <button type="button" className={styles.checkButton} onClick={() => toggleItem(item.id)} aria-label={item.checked ? `取消标记${item.name}为已购买` : `标记${item.name}为已购买`} aria-pressed={item.checked}>{item.checked && <Check size={15} strokeWidth={3} />}</button>
            {editingId === item.id ? <div className={styles.editFields}><input aria-label="编辑物品名称" value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={100} autoFocus /><input aria-label="编辑数量" type="number" min="1" max="999" value={editQuantity} onChange={(event) => setEditQuantity(event.target.value)} /><input aria-label="编辑备注" value={editNote} onChange={(event) => setEditNote(event.target.value)} maxLength={240} placeholder="备注（可选）" /><button type="button" className={styles.iconAction} onClick={() => saveEdit(item.id)} aria-label="保存修改"><Check size={17} /></button><button type="button" className={styles.iconAction} onClick={() => setEditingId(null)} aria-label="取消编辑"><X size={17} /></button></div> : <>
              <div className={styles.itemText}><span className={styles.itemName}>{item.name}</span>{item.note && <span className={styles.itemNote}>{item.note}</span>}</div>
              <span className={styles.quantityBadge}>× {item.quantity}</span>
              <div className={styles.itemActions}><button type="button" className={styles.iconAction} onClick={() => beginEdit(item)} aria-label={`编辑${item.name}`}><Pencil size={16} /></button><button type="button" className={`${styles.iconAction} ${styles.deleteAction}`} onClick={() => deleteItem(item.id)} aria-label={`删除${item.name}`}><Trash2 size={16} /></button></div>
            </>}
          </article>)}
        </div>
        <p className={styles.storageNote}>{english ? text!.local : "你的清单只保存在当前浏览器中"}</p>
      </div>

      <nav className={styles.bottomNav} aria-label={english ? text!.switch : "切换购物车"}>
        {carts.map((cart) => {
          const count = data[cart.id].filter((item) => !item.checked).length;
          const selected = activeCart === cart.id;
          const cartName = english ? text![cart.id] : cart.name;
          const tabName = english ? (cart.id === "market" ? "Grocery" : cart.id === "home" ? "Home" : "Abroad") : cart.tab;
          return <button type="button" key={cart.id} onClick={() => selectCart(cart.id)} className={`${styles.navItem} ${selected ? styles.navItemActive : ""}`} aria-current={selected ? "page" : undefined} aria-label={`${cartName}, ${count} ${english ? text!.pending : "件待买"}`}>
            <span className={styles.navIcon}><CartIcon kind={cart.icon} /></span>
            <span className={styles.navLabel}>{tabName}</span>
            {count > 0 && <span className={styles.navCount}>{count}</span>}
          </button>;
        })}
      </nav>

      {toast && <div className={styles.toast} role="status"><span>{toast}</span><button type="button" aria-label="关闭提示" onClick={() => setToast("")}><X size={14} /></button></div>}
    </main>
  );
}
