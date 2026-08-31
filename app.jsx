const { useState, useRef, useEffect } = React;

/* ---------- 内联图标（替代 lucide-react，便于离线打包） ---------- */
function Icon({ children, size = 16, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}
const ChevronLeft = (p) => <Icon {...p}><polyline points="15 18 9 12 15 6" /></Icon>;
const ChevronRight = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6" /></Icon>;
const Plus = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>;
const X = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>;
const Trash2 = (p) => <Icon {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Icon>;
const CalendarDays = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></Icon>;
const CalendarRange = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M17 14h-6M13 18H7" /></Icon>;
const ListChecks = (p) => <Icon {...p}><path d="M3 6l1.5 1.5L7 5" /><path d="M3 12l1.5 1.5L7 11" /><path d="M3 18l1.5 1.5L7 16" /><line x1="11" y1="6" x2="21" y2="6" /><line x1="11" y1="12" x2="21" y2="12" /><line x1="11" y1="18" x2="21" y2="18" /></Icon>;
const Flame = (p) => <Icon {...p}><path d="M12 2s-6 5.5-6 10.5A6 6 0 0 0 12 22a6 6 0 0 0 6-9.5C16 10 14 9 14 6c0 2-1 3-2 3-1.5 0-2-2-2-4z" /></Icon>;

/* ---------- 颜色与常量 ---------- */
const COLORS = {
  paper: "#F6F4EE",
  card: "#FFFFFE",
  ink: "#2A2823",
  inkSoft: "#7A756B",
  line: "#DEDACD",
  lineSoft: "#EAE7DC",
  teal: "#3E6259",
  tealSoft: "#DDE8E3",
  ochre: "#BD8636",
  brick: "#A15C51",
  plum: "#78628C",
  slate: "#4C6C86",
  weekendBg: "#ECEFF4",
};

const PRESET_COLORS = [COLORS.teal, COLORS.ochre, COLORS.brick, COLORS.plum, COLORS.slate];

const DAY_SLOTS = [
  { key: "s1", ratio: 3 },
  { key: "s2", ratio: 1 },
  { key: "s3", ratio: 3 },
  { key: "s4", ratio: 3 },
];

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const MONTH_LABELS_SHORT = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getMonday(base) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

let idCounter = 1;
function nextId() {
  return `id${idCounter++}_${Date.now().toString(36)}`;
}

/* ---------- 本地持久化 ---------- */
const STORAGE_KEY = "lindsey-planner-v1";
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* storage full or unavailable — ignore */
  }
}

const navBtnStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: `1px solid ${COLORS.line}`,
  background: COLORS.card,
  color: COLORS.ink,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

function ColorSwatches({ value, onChange }) {
  const isCustom = !PRESET_COLORS.includes(value);
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label="预设颜色"
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: c,
            border: value === c ? `2px solid ${COLORS.ink}` : "2px solid transparent",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        />
      ))}
      <label
        style={{
          position: "relative",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
          border: isCustom ? `2px solid ${COLORS.ink}` : "2px solid transparent",
          cursor: "pointer",
          display: "inline-block",
          flexShrink: 0,
        }}
      >
        <input
          type="color"
          value={isCustom ? value : "#888888"}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", padding: 0, border: "none" }}
        />
      </label>
    </div>
  );
}

/* 
  TaskCard 同时支持：
  - 桌面端原生 HTML5 拖拽（draggable + onDragStart）
  - 触屏端“点选后点目标放置”（onClick 切换选中态，由父级容器的 onClick 完成落位）
*/
function TaskCard({ task, onToggle, onDelete, onDragStart, onPick, isDragging, isPicked, compact }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={(e) => {
        if (e.target.closest("[data-no-pick]")) return;
        onPick && onPick(task.id);
      }}
      style={{
        background: hexToRgba(task.color, isPicked ? 0.32 : 0.16),
        borderLeft: `3px solid ${task.color}`,
        outline: isPicked ? `2px dashed ${task.color}` : "none",
        outlineOffset: "1px",
        borderRadius: compact ? "3px" : "6px",
        padding: compact ? "2px 5px" : "7px 9px",
        marginBottom: compact ? "3px" : "6px",
        display: "flex",
        alignItems: "center",
        gap: compact ? "4px" : "8px",
        cursor: "grab",
        opacity: isDragging ? 0.35 : task.done ? 0.55 : 1,
      }}
    >
      {!compact && (
        <button
          data-no-pick
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          aria-label="完成"
          style={{
            width: "16px",
            height: "16px",
            minWidth: "16px",
            borderRadius: "50%",
            border: `1.5px solid ${task.done ? task.color : COLORS.inkSoft}`,
            background: task.done ? task.color : "transparent",
            cursor: "pointer",
            padding: 0,
          }}
        />
      )}
      <span
        style={{
          fontSize: compact ? "10px" : "13px",
          color: COLORS.ink,
          textDecoration: task.done ? "line-through" : "none",
          flex: 1,
          minWidth: 0,
          whiteSpace: compact ? "nowrap" : "normal",
          overflow: compact ? "hidden" : "visible",
          textOverflow: compact ? "ellipsis" : "clip",
          wordBreak: compact ? "normal" : "break-word",
        }}
      >
        {task.text}
      </span>
      {!compact && (
        <button
          data-no-pick
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          aria-label="删除"
          style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, padding: "2px", display: "flex" }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function useTaskActions(setTodos) {
  function moveTask(id, dayKey, slot = null) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, day: dayKey, slot } : t)));
  }
  function toggleTask(id) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function deleteTask(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }
  function addTask(text, color) {
    setTodos((prev) => [...prev, { id: nextId(), text, color, day: null, done: false }]);
  }
  return { moveTask, toggleTask, deleteTask, addTask };
}

function TaskTray({ inbox, dragId, setDragId, pickedId, onPick, isOver, onDragOver, onDragLeave, onDrop, onClickDrop, toggleTask, deleteTask, addTask }) {
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const inputRef = useRef(null);

  function submit() {
    const t = newText.trim();
    if (!t) return;
    addTask(t, newColor);
    setNewText("");
    inputRef.current?.focus();
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => pickedId && onClickDrop && onClickDrop()}
      style={{
        flex: "1 1 34%",
        minWidth: "220px",
        background: isOver ? COLORS.tealSoft : COLORS.card,
        border: `1px solid ${COLORS.lineSoft}`,
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.12s",
      }}
    >
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${COLORS.lineSoft}` }} data-no-pick>
        <div style={{ fontSize: "13px", fontWeight: 500, color: COLORS.ink, marginBottom: "10px" }}>任务清单</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            ref={inputRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="新增一项任务"
            style={{
              flex: 1,
              fontSize: "13px",
              padding: "6px 8px",
              borderRadius: "6px",
              border: `1px solid ${COLORS.line}`,
              background: COLORS.paper,
              color: COLORS.ink,
              outline: "none",
              minWidth: 0,
            }}
          />
          <button
            onClick={submit}
            aria-label="添加"
            style={{ background: COLORS.teal, border: "none", borderRadius: "6px", width: "30px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Plus size={15} />
          </button>
        </div>
        <div style={{ marginTop: "8px" }}>
          <ColorSwatches value={newColor} onChange={setNewColor} />
        </div>
      </div>
      <div style={{ padding: "10px 14px", flex: 1, overflowY: "auto" }}>
        {inbox.length === 0 && (
          <div style={{ fontSize: "12px", color: COLORS.inkSoft, textAlign: "center", marginTop: "20px" }}>任务已全部安排</div>
        )}
        {inbox.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onPick={onPick}
            isPicked={pickedId === t.id}
            onDragStart={(e, id) => {
              e.dataTransfer.setData("text/plain", id);
              setDragId(id);
            }}
            isDragging={dragId === t.id}
          />
        ))}
      </div>
    </div>
  );
}

function WeekPlanner({ todos, setTodos, viewDate, setViewDate }) {
  const [dragId, setDragId] = useState(null);
  const [overTarget, setOverTarget] = useState(null);
  const [pickedId, setPickedId] = useState(null);
  const { moveTask, toggleTask, deleteTask, addTask } = useTaskActions(setTodos);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = getMonday(viewDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const rangeLabel = `${monday.getMonth() + 1}月${monday.getDate()}日 – ${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日`;
  const isCurrentWeek = toKey(monday) === toKey(getMonday(today));

  function handlePick(id) {
    setPickedId((cur) => (cur === id ? null : id));
  }
  function placePicked(dayKey, slotKey) {
    if (!pickedId) return;
    moveTask(pickedId, dayKey, slotKey);
    setPickedId(null);
  }

  function handleDrop(e, target) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveTask(id, target);
    setOverTarget(null);
    setDragId(null);
  }

  function handleSlotDrop(e, dayKey, slotKey) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveTask(id, dayKey, slotKey);
    setOverTarget(null);
    setDragId(null);
  }

  const inbox = todos.filter((t) => t.day === null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "20px 24px 14px", flexWrap: "wrap", gap: "8px" }}>
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "26px", fontWeight: 500, color: COLORS.ink, margin: 0 }}>本周计划</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setViewDate((d) => addDays(d, -7))} style={navBtnStyle} aria-label="上一周"><ChevronLeft size={16} /></button>
          <span style={{ fontSize: "13px", color: COLORS.inkSoft, minWidth: "130px", textAlign: "center" }}>{rangeLabel}</span>
          <button onClick={() => setViewDate((d) => addDays(d, 7))} style={navBtnStyle} aria-label="下一周"><ChevronRight size={16} /></button>
          {!isCurrentWeek && (
            <button onClick={() => setViewDate(new Date())} style={{ ...navBtnStyle, width: "auto", padding: "0 10px", fontSize: "12px" }}>本周</button>
          )}
        </div>
      </div>

      {pickedId && (
        <div style={{ margin: "0 24px 10px", fontSize: "12px", color: COLORS.teal, background: COLORS.tealSoft, borderRadius: "6px", padding: "6px 10px" }}>
          已选中任务，点击任意时段放入；再次点击原任务可取消选中
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0, padding: "0 24px 24px", gap: "18px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 62%", display: "flex", gap: "10px", minWidth: 0, overflowX: "auto" }}>
          {weekDates.map((date, i) => {
            const key = toKey(date);
            const isToday = toKey(today) === key;
            const weekend = isWeekend(date);
            const dayTasks = todos.filter((t) => t.day === key);

            return (
              <div
                key={key}
                style={{
                  flex: "1 1 0",
                  minWidth: "120px",
                  background: weekend ? COLORS.weekendBg : COLORS.card,
                  border: `1px solid ${isToday ? COLORS.teal : COLORS.lineSoft}`,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "background 0.12s",
                }}
              >
                <div style={{ padding: "10px 8px 8px", borderBottom: `1px solid ${COLORS.lineSoft}`, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "11px", color: isToday ? COLORS.teal : COLORS.inkSoft }}>周{DAY_LABELS[i]}</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: isToday ? COLORS.teal : COLORS.ink, marginTop: "2px" }}>{date.getDate()}</div>
                </div>

                <div style={{ flex: 1, minHeight: "220px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                  {DAY_SLOTS.map((slot, si) => {
                    const slotId = `${key}__${slot.key}`;
                    const slotTasks = dayTasks.filter((t) => (t.slot || DAY_SLOTS[0].key) === slot.key);
                    const isSlotOver = overTarget === slotId;
                    return (
                      <div
                        key={slot.key}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverTarget(slotId); }}
                        onDragLeave={(e) => { e.stopPropagation(); setOverTarget((o) => (o === slotId ? null : o)); }}
                        onDrop={(e) => handleSlotDrop(e, key, slot.key)}
                        onClick={() => placePicked(key, slot.key)}
                        style={{
                          flex: slot.ratio,
                          minHeight: 0,
                          padding: "5px 6px",
                          overflowY: "auto",
                          background: isSlotOver ? COLORS.tealSoft : "transparent",
                          borderTop: si === 0 ? "none" : `1px solid ${hexToRgba(COLORS.line, 0.45)}`,
                          transition: "background 0.12s",
                        }}
                      >
                        {slotTasks.map((t) => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onPick={handlePick}
                            isPicked={pickedId === t.id}
                            onDragStart={(e, id) => { e.dataTransfer.setData("text/plain", id); setDragId(id); }}
                            isDragging={dragId === t.id}
                            compact
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <TaskTray
          inbox={inbox}
          dragId={dragId}
          setDragId={setDragId}
          pickedId={pickedId}
          onPick={handlePick}
          isOver={overTarget === "inbox"}
          onDragOver={(e) => { e.preventDefault(); setOverTarget("inbox"); }}
          onDragLeave={() => setOverTarget((o) => (o === "inbox" ? null : o))}
          onDrop={(e) => handleDrop(e, null)}
          onClickDrop={() => { moveTask(pickedId, null); setPickedId(null); }}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          addTask={addTask}
        />
      </div>
    </div>
  );
}

function MonthPlanner({ todos, setTodos, viewDate, setViewDate }) {
  const [dragId, setDragId] = useState(null);
  const [overTarget, setOverTarget] = useState(null);
  const [pickedId, setPickedId] = useState(null);
  const { moveTask, toggleTask, deleteTask, addTask } = useTaskActions(setTodos);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalCells = Math.ceil((leading + numDays) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - leading + 1;
    return dayNum >= 1 && dayNum <= numDays ? new Date(year, month, dayNum) : null;
  });

  function handlePick(id) {
    setPickedId((cur) => (cur === id ? null : id));
  }
  function placePicked(dayKey) {
    if (!pickedId) return;
    moveTask(pickedId, dayKey);
    setPickedId(null);
  }

  function handleDrop(e, target) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveTask(id, target);
    setOverTarget(null);
    setDragId(null);
  }

  const inbox = todos.filter((t) => t.day === null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "20px 24px 14px", flexWrap: "wrap", gap: "8px" }}>
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "26px", fontWeight: 500, color: COLORS.ink, margin: 0 }}>月计划</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={navBtnStyle} aria-label="上一月"><ChevronLeft size={16} /></button>
          <span style={{ fontSize: "13px", color: COLORS.inkSoft, minWidth: "90px", textAlign: "center" }}>{year}年{month + 1}月</span>
          <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={navBtnStyle} aria-label="下一月"><ChevronRight size={16} /></button>
          {!(year === today.getFullYear() && month === today.getMonth()) && (
            <button onClick={() => setViewDate(new Date())} style={{ ...navBtnStyle, width: "auto", padding: "0 10px", fontSize: "12px" }}>本月</button>
          )}
        </div>
      </div>

      {pickedId && (
        <div style={{ margin: "0 24px 10px", fontSize: "12px", color: COLORS.teal, background: COLORS.tealSoft, borderRadius: "6px", padding: "6px 10px" }}>
          已选中任务，点击任意日期放入；再次点击原任务可取消选中
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0, padding: "0 24px 24px", gap: "18px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 66%", minWidth: "280px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "6px" }}>
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", color: COLORS.inkSoft, padding: "2px 0" }}>周{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "minmax(78px,1fr)", gap: "5px", flex: 1, overflowY: "auto" }}>
            {cells.map((date, i) => {
              if (!date) return <div key={`b${i}`} />;
              const key = toKey(date);
              const isToday = key === toKey(today);
              const weekend = isWeekend(date);
              const dayTasks = todos.filter((t) => t.day === key);
              const isOver = overTarget === key;
              const shown = dayTasks.slice(0, 3);
              const overflow = dayTasks.length - shown.length;
              return (
                <div
                  key={key}
                  onDragOver={(e) => { e.preventDefault(); setOverTarget(key); }}
                  onDragLeave={() => setOverTarget((o) => (o === key ? null : o))}
                  onDrop={(e) => handleDrop(e, key)}
                  onClick={() => placePicked(key)}
                  style={{
                    borderRadius: "6px",
                    border: `1px solid ${isToday ? COLORS.teal : COLORS.lineSoft}`,
                    background: isOver ? COLORS.tealSoft : weekend ? COLORS.weekendBg : COLORS.card,
                    padding: "4px 5px",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ fontSize: "11px", color: isToday ? COLORS.teal : COLORS.inkSoft, fontWeight: isToday ? 600 : 400, marginBottom: "2px" }}>{date.getDate()}</div>
                  {shown.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      compact
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onPick={handlePick}
                      isPicked={pickedId === t.id}
                      onDragStart={(e, id) => { e.dataTransfer.setData("text/plain", id); setDragId(id); }}
                      isDragging={dragId === t.id}
                    />
                  ))}
                  {overflow > 0 && <div style={{ fontSize: "10px", color: COLORS.inkSoft }}>还有 {overflow} 项</div>}
                </div>
              );
            })}
          </div>
        </div>

        <TaskTray
          inbox={inbox}
          dragId={dragId}
          setDragId={setDragId}
          pickedId={pickedId}
          onPick={handlePick}
          isOver={overTarget === "inbox"}
          onDragOver={(e) => { e.preventDefault(); setOverTarget("inbox"); }}
          onDragLeave={() => setOverTarget((o) => (o === "inbox" ? null : o))}
          onDrop={(e) => handleDrop(e, null)}
          onClickDrop={() => { moveTask(pickedId, null); setPickedId(null); }}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          addTask={addTask}
        />
      </div>
    </div>
  );
}

function MiniMonth({ year, month, habit, checkins, today }) {
  const numDays = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [...Array(leading).fill(null), ...Array.from({ length: numDays }, (_, i) => new Date(year, month, i + 1))];
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.lineSoft}`, borderRadius: "8px", padding: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: 500, color: COLORS.ink, marginBottom: "6px", textAlign: "center" }}>{MONTH_LABELS_SHORT[month]}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "3px" }}>
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "9px", color: COLORS.inkSoft }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} />;
          const isToday = toKey(date) === toKey(today);
          const checked = habit && checkins[`${habit.id}_${toKey(date)}`];
          return (
            <div
              key={toKey(date)}
              title={toKey(date)}
              style={{
                aspectRatio: "1",
                borderRadius: "50%",
                border: isToday ? `1.5px solid ${COLORS.ink}` : "1px solid transparent",
                background: checked ? habit.color : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "9px", color: checked ? "#fff" : COLORS.inkSoft, fontWeight: isToday ? 600 : 400 }}>{date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearCalendar({ habit, checkins, yearOffset, setYearOffset }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear() + yearOffset;
  const count = habit ? Object.keys(checkins).filter((k) => k.startsWith(`${habit.id}_${year}-`)).length : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
        <button onClick={() => setYearOffset((y) => y - 1)} style={navBtnStyle} aria-label="上一年"><ChevronLeft size={16} /></button>
        <span style={{ fontSize: "14px", color: COLORS.ink, minWidth: "60px", textAlign: "center", fontWeight: 500 }}>{year}年</span>
        <button onClick={() => setYearOffset((y) => y + 1)} style={navBtnStyle} aria-label="下一年"><ChevronRight size={16} /></button>
      </div>
      {habit ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 12 }, (_, m) => (
            <MiniMonth key={m} year={year} month={m} habit={habit} checkins={checkins} today={today} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: "13px" }}>先选择一个习惯</div>
      )}
      {habit && <div style={{ fontSize: "12px", color: COLORS.inkSoft, marginTop: "14px", textAlign: "center" }}>{year}年共打卡 {count} 次</div>}
    </div>
  );
}

function HabitCalendar({ habits, setHabits, checkins, setCheckins }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [viewMode, setViewMode] = useState("month");
  const [selectedHabit, setSelectedHabit] = useState(habits[0]?.id ?? null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState(PRESET_COLORS[0]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthLabel = `${year}年${month + 1}月`;
  const numDays = new Date(year, month + 1, 0).getDate();
  const leadingBlank = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [...Array(leadingBlank).fill(null), ...Array.from({ length: numDays }, (_, i) => new Date(year, month, i + 1))];

  function toggleCheckin(dateObj) {
    if (!selectedHabit) return;
    const key = `${selectedHabit}_${toKey(dateObj)}`;
    setCheckins((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  function addHabit() {
    const name = newHabitName.trim();
    if (!name) return;
    const id = nextId();
    setHabits((prev) => [...prev, { id, name, color: newHabitColor }]);
    setSelectedHabit(id);
    setNewHabitName("");
    setShowAddHabit(false);
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCheckins((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => { if (!k.startsWith(`${id}_`)) next[k] = prev[k]; });
      return next;
    });
    if (selectedHabit === id) {
      const remaining = habits.filter((h) => h.id !== id);
      setSelectedHabit(remaining[0]?.id ?? null);
    }
  }

  let streak = 0;
  if (selectedHabit) {
    let cursor = new Date(today);
    while (checkins[`${selectedHabit}_${toKey(cursor)}`]) { streak++; cursor = addDays(cursor, -1); }
  }
  const activeHabit = habits.find((h) => h.id === selectedHabit);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 24px 6px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "26px", fontWeight: 500, color: COLORS.ink, margin: 0 }}>打卡日历</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {activeHabit && viewMode === "month" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: COLORS.inkSoft }}>
                <Flame size={14} color={streak > 0 ? COLORS.brick : COLORS.inkSoft} />
                连续 {streak} 天
              </div>
            )}
            <div style={{ display: "flex", border: `1px solid ${COLORS.line}`, borderRadius: "8px", overflow: "hidden" }}>
              <button
                onClick={() => setViewMode("month")}
                style={{ padding: "5px 12px", fontSize: "12px", border: "none", cursor: "pointer", background: viewMode === "month" ? COLORS.teal : COLORS.card, color: viewMode === "month" ? "#fff" : COLORS.ink }}
              >月视图</button>
              <button
                onClick={() => setViewMode("year")}
                style={{ padding: "5px 12px", fontSize: "12px", border: "none", cursor: "pointer", background: viewMode === "year" ? COLORS.teal : COLORS.card, color: viewMode === "year" ? "#fff" : COLORS.ink }}
              >全年视图</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0 4px" }}>
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabit(h.id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "16px",
                border: `1px solid ${selectedHabit === h.id ? h.color : COLORS.line}`,
                background: selectedHabit === h.id ? hexToRgba(h.color, 0.14) : COLORS.card,
                cursor: "pointer", fontSize: "13px", color: COLORS.ink,
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: h.color, display: "inline-block" }} />
              {h.name}
              {selectedHabit === h.id && (
                <X size={12} onClick={(e) => { e.stopPropagation(); deleteHabit(h.id); }} style={{ marginLeft: "2px" }} />
              )}
            </button>
          ))}
          <button
            onClick={() => setShowAddHabit((s) => !s)}
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "16px", border: `1px dashed ${COLORS.line}`, background: "transparent", cursor: "pointer", fontSize: "13px", color: COLORS.inkSoft }}
          >
            <Plus size={13} /> 新习惯
          </button>
        </div>

        {showAddHabit && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0 4px", flexWrap: "wrap" }}>
            <input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              placeholder="习惯名称，如：喝水"
              style={{ fontSize: "13px", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${COLORS.line}`, background: COLORS.paper, color: COLORS.ink, outline: "none" }}
            />
            <ColorSwatches value={newHabitColor} onChange={setNewHabitColor} />
            <button onClick={addHabit} style={{ background: COLORS.teal, border: "none", borderRadius: "6px", padding: "6px 12px", color: "#fff", fontSize: "12px", cursor: "pointer" }}>添加</button>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 24px 24px", flex: 1, minHeight: 0, overflowY: "auto" }}>
        {viewMode === "month" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
              <button onClick={() => setMonthOffset((m) => m - 1)} style={navBtnStyle} aria-label="上一月"><ChevronLeft size={16} /></button>
              <span style={{ fontSize: "14px", color: COLORS.ink, minWidth: "90px", textAlign: "center", fontWeight: 500 }}>{monthLabel}</span>
              <button onClick={() => setMonthOffset((m) => m + 1)} style={navBtnStyle} aria-label="下一月"><ChevronRight size={16} /></button>
            </div>
            <div style={{ maxWidth: "480px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "6px" }}>
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: "11px", color: COLORS.inkSoft, padding: "4px 0" }}>周{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={`b${i}`} />;
                  const isToday = toKey(date) === toKey(today);
                  const checked = selectedHabit && checkins[`${selectedHabit}_${toKey(date)}`];
                  return (
                    <button
                      key={toKey(date)}
                      onClick={() => toggleCheckin(date)}
                      disabled={!selectedHabit}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "50%",
                        border: isToday ? `1.5px solid ${COLORS.ink}` : `1px solid ${COLORS.lineSoft}`,
                        background: checked ? activeHabit.color : COLORS.card,
                        cursor: selectedHabit ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: checked ? "#fff" : COLORS.ink, fontWeight: isToday ? 600 : 400 }}>{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {!selectedHabit && <div style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: "13px", marginTop: "24px" }}>先添加一个习惯，再来打卡</div>}
          </>
        ) : (
          <YearCalendar habit={activeHabit} checkins={checkins} yearOffset={yearOffset} setYearOffset={setYearOffset} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const persisted = loadState();

  const [tab, setTab] = useState("week");
  const [viewDate, setViewDate] = useState(() => new Date());

  const [todos, setTodos] = useState(() => {
    if (persisted?.todos?.length) return persisted.todos;
    const monday = getMonday(new Date());
    return [
      { id: nextId(), text: "整理项目周报", color: COLORS.teal, day: null, done: false },
      { id: nextId(), text: "回复客户邮件", color: COLORS.slate, day: null, done: false },
      { id: nextId(), text: "健身 40 分钟", color: COLORS.brick, day: toKey(addDays(monday, 1)), slot: "s3", done: false },
      { id: nextId(), text: "买菜", color: COLORS.ochre, day: toKey(addDays(monday, 3)), slot: "s1", done: true },
    ];
  });
  const [habits, setHabits] = useState(() => {
    if (persisted?.habits?.length) return persisted.habits;
    return [
      { id: nextId(), name: "喝水 2L", color: COLORS.teal },
      { id: nextId(), name: "阅读", color: COLORS.plum },
    ];
  });
  const [checkins, setCheckins] = useState(() => persisted?.checkins || {});

  useEffect(() => {
    saveState({ todos, habits, checkins });
  }, [todos, habits, checkins]);

  const tabs = [
    { key: "week", label: "周计划", icon: ListChecks },
    { key: "month", label: "月计划", icon: CalendarRange },
    { key: "habit", label: "打卡", icon: CalendarDays },
  ];

  return (
    <div style={{ display: "flex", height: "100%", background: COLORS.paper, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div style={{ width: "76px", background: COLORS.paper, borderRight: `1px solid ${COLORS.lineSoft}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "22px", gap: "6px", flexShrink: 0 }}>
        {tabs.map(({ key, label, icon: TIcon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              width: "58px", padding: "10px 0 8px", borderRadius: "10px", border: "none",
              background: tab === key ? COLORS.tealSoft : "transparent",
              color: tab === key ? COLORS.teal : COLORS.inkSoft,
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            }}
          >
            <TIcon size={20} />
            <span style={{ fontSize: "10px" }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {tab === "week" && <WeekPlanner todos={todos} setTodos={setTodos} viewDate={viewDate} setViewDate={setViewDate} />}
        {tab === "month" && <MonthPlanner todos={todos} setTodos={setTodos} viewDate={viewDate} setViewDate={setViewDate} />}
        {tab === "habit" && <HabitCalendar habits={habits} setHabits={setHabits} checkins={checkins} setCheckins={setCheckins} />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
