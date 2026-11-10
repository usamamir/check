(() => {
  'use strict';

  const MAX_HABITS = 24;
  const PAGE_SIZE = 6;
  const PAGE_COUNT = 4;

  const ICONS = [
    '💧', '🚶', '📚', '🦷', '🧘', '🏃', '🥗', '💊', '😴', '✍️',
    '🎸', '🧠', '☀️', '🚭', '☕', '📱', '🧹', '🛏️', '🗣️', '💪',
    '🍎', '🌊', '🎯', '🪴', '🚴', '🎹', '📝', '🧺', '🧴', '🧊',
  ];

  const COLORS = [
    '#ff6b4a', '#3db8ff', '#4fd18b', '#b57bff', '#f0c14b',
    '#ff6b9d', '#4de0c2', '#ff8a3d', '#6b8cff', '#e05cff',
    '#7ed957', '#ff5d6c', '#48c6ef', '#f7b267',
  ];

  const THEMES = [
    { id: 'coral', name: 'Coral', preview: 'linear-gradient(135deg,#ff6b4a,#1c1412)' },
    { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(135deg,#3db8ff,#0d1720)' },
    { id: 'forest', name: 'Forest', preview: 'linear-gradient(135deg,#4fd18b,#101812)' },
    { id: 'violet', name: 'Violet', preview: 'linear-gradient(135deg,#b57bff,#15101f)' },
    { id: 'gold', name: 'Gold', preview: 'linear-gradient(135deg,#f0c14b,#1a160e)' },
    { id: 'slate', name: 'Slate', preview: 'linear-gradient(135deg,#8ea2b8,#12151a)' },
    { id: 'rose', name: 'Rose', preview: 'linear-gradient(135deg,#ff6b9d,#1a1014)' },
    { id: 'mint', name: 'Mint', preview: 'linear-gradient(135deg,#4de0c2,#0e1817)' },
  ];

  const SUGGESTIONS = [
    { name: 'Drink water', icon: '💧', color: '#3db8ff', type: 'positive' },
    { name: 'Walk', icon: '🚶', color: '#4fd18b', type: 'positive' },
    { name: 'Read', icon: '📚', color: '#b57bff', type: 'positive' },
    { name: 'Floss', icon: '🦷', color: '#48c6ef', type: 'positive' },
    { name: 'Meditate', icon: '🧘', color: '#4de0c2', type: 'timed', duration: 5 },
    { name: 'No smoking', icon: '🚭', color: '#ff5d6c', type: 'negative' },
    { name: 'Less coffee', icon: '☕', color: '#f0c14b', type: 'negative' },
    { name: 'Brush teeth', icon: '🧴', color: '#ff6b9d', type: 'timed', duration: 2 },
  ];

  /** @type {{habits: any[], completions: Record<string, Record<string, boolean>>, notes: Record<string, Record<string, string>>, settings: any}} */
  let state = {
    habits: [],
    completions: {},
    notes: {},
    settings: { theme: 'coral', remindersEnabled: true, compact: false, startPage: 0 },
  };

  let currentPage = 0;
  let editingHabitId = null;
  let detailHabitId = null;
  let selectedIcon = ICONS[0];
  let selectedColor = COLORS[0];
  let selectedType = 'positive';
  let selectedDays = [1, 2, 3, 4, 5];
  let timerInterval = null;
  let timerRemaining = 0;
  let timerRunning = false;
  let saveTimer = null;
  let remindedToday = new Set();

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function todayKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function uid() {
    return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  async function loadState() {
    if (window.streakly) {
      const data = await window.streakly.getAll();
      state = {
        habits: data.habits || [],
        completions: data.completions || {},
        notes: data.notes || {},
        settings: { theme: 'coral', remindersEnabled: true, compact: false, startPage: 0, ...(data.settings || {}) },
      };
    } else {
      try {
        const raw = localStorage.getItem('streakly-data');
        if (raw) state = { ...state, ...JSON.parse(raw) };
      } catch (_) { /* ignore */ }
    }
    if (!state.habits.length) seedDefaults();
  }

  function seedDefaults() {
    state.habits = SUGGESTIONS.slice(0, 4).map((s, i) => ({
      id: uid(),
      name: s.name,
      icon: s.icon,
      color: s.color,
      type: s.type,
      duration: s.duration || 3,
      schedule: 'daily',
      days: [0, 1, 2, 3, 4, 5, 6],
      timesPerWeek: 3,
      reminder: '',
      page: 0,
      slot: i,
      createdAt: Date.now(),
    }));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 200);
  }

  async function persist() {
    if (window.streakly) {
      await window.streakly.saveAll(state);
    } else {
      localStorage.setItem('streakly-data', JSON.stringify(state));
    }
  }

  function isScheduledOn(habit, date) {
    const dow = date.getDay();
    switch (habit.schedule) {
      case 'daily':
        return true;
      case 'weekdays':
        return dow >= 1 && dow <= 5;
      case 'weekends':
        return dow === 0 || dow === 6;
      case 'custom':
        return (habit.days || []).includes(dow);
      case 'times_per_week':
        return true;
      default:
        return true;
    }
  }

  function weekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function completionsInWeek(habit, date) {
    const start = weekStart(date);
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (isCompleted(habit.id, todayKey(d))) count++;
    }
    return count;
  }

  function isCompleted(habitId, day = todayKey()) {
    return !!(state.completions[habitId] && state.completions[habitId][day]);
  }

  function isDoneForToday(habit, day = todayKey()) {
    if (habit.schedule === 'times_per_week') {
      const needed = habit.timesPerWeek || 3;
      return completionsInWeek(habit, parseKey(day)) >= needed;
    }
    return isCompleted(habit.id, day);
  }

  function setCompleted(habitId, day, value) {
    if (!state.completions[habitId]) state.completions[habitId] = {};
    if (value) state.completions[habitId][day] = true;
    else delete state.completions[habitId][day];
    scheduleSave();
  }

  function getNote(habitId, day = todayKey()) {
    return (state.notes[habitId] && state.notes[habitId][day]) || '';
  }

  function setNote(habitId, day, text) {
    if (!state.notes[habitId]) state.notes[habitId] = {};
    if (text.trim()) state.notes[habitId][day] = text;
    else delete state.notes[habitId][day];
    scheduleSave();
  }

  /** Current streak: consecutive scheduled days ending today (or yesterday if today incomplete). */
  function currentStreak(habit) {
    if (habit.schedule === 'times_per_week') {
      // Count consecutive weeks meeting the quota, including current week progress
      let streak = 0;
      const today = new Date();
      // If current week already meets quota, count it
      let cursor = weekStart(today);
      for (let w = 0; w < 520; w++) {
        const weekDate = new Date(cursor);
        const count = completionsInWeek(habit, weekDate);
        const needed = habit.timesPerWeek || 3;
        const isCurrent = weekStart(today).getTime() === weekDate.getTime();
        if (count >= needed) {
          streak++;
          cursor.setDate(cursor.getDate() - 7);
        } else if (isCurrent) {
          // current week in progress — don't break yet, look at previous
          cursor.setDate(cursor.getDate() - 7);
        } else {
          break;
        }
      }
      return streak;
    }

    let streak = 0;
    const today = new Date();
    let cursor = new Date(today);
    // If today is scheduled and not done, start from yesterday
    if (isScheduledOn(habit, today) && !isCompleted(habit.id, todayKey(today))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    for (let i = 0; i < 2000; i++) {
      if (!isScheduledOn(habit, cursor)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      if (isCompleted(habit.id, todayKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function bestStreak(habit) {
    if (habit.schedule === 'times_per_week') {
      // Approximate: scan weeks from creation
      let best = 0;
      let run = 0;
      const start = new Date(habit.createdAt || Date.now() - 86400000 * 90);
      let cursor = weekStart(start);
      const end = weekStart(new Date());
      while (cursor <= end) {
        const count = completionsInWeek(habit, cursor);
        if (count >= (habit.timesPerWeek || 3)) {
          run++;
          best = Math.max(best, run);
        } else if (cursor.getTime() !== end.getTime()) {
          run = 0;
        }
        cursor.setDate(cursor.getDate() + 7);
      }
      return Math.max(best, currentStreak(habit));
    }

    let best = 0;
    let run = 0;
    const start = new Date(habit.createdAt || Date.now() - 86400000 * 365);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    const cursor = new Date(start);
    while (cursor <= end) {
      if (isScheduledOn(habit, cursor)) {
        if (isCompleted(habit.id, todayKey(cursor))) {
          run++;
          best = Math.max(best, run);
        } else if (todayKey(cursor) !== todayKey(end) || isCompleted(habit.id, todayKey(cursor))) {
          // incomplete past scheduled day breaks streak
          if (!(todayKey(cursor) === todayKey(end) && !isCompleted(habit.id, todayKey(cursor)))) {
            run = 0;
          }
        } else {
          // today incomplete — don't break best calc for past
          // leave run as is for past days only
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    // Recalculate properly
    best = 0;
    run = 0;
    cursor.setTime(start.getTime());
    while (cursor <= end) {
      if (!isScheduledOn(habit, cursor)) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      const key = todayKey(cursor);
      const isToday = key === todayKey(end);
      if (isCompleted(habit.id, key)) {
        run++;
        best = Math.max(best, run);
      } else if (!isToday) {
        run = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return Math.max(best, currentStreak(habit));
  }

  function completionRate(habit, days = 30) {
    let scheduled = 0;
    let done = 0;
    const cursor = new Date();
    for (let i = 0; i < days; i++) {
      if (habit.schedule === 'times_per_week') {
        // handled differently — count days completed vs expected
      }
      if (isScheduledOn(habit, cursor) && habit.schedule !== 'times_per_week') {
        scheduled++;
        if (isCompleted(habit.id, todayKey(cursor))) done++;
      } else if (habit.schedule === 'times_per_week' && isCompleted(habit.id, todayKey(cursor))) {
        done++;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    if (habit.schedule === 'times_per_week') {
      const weeks = Math.max(1, Math.ceil(days / 7));
      const expected = weeks * (habit.timesPerWeek || 3);
      return Math.min(100, Math.round((done / expected) * 100));
    }
    if (!scheduled) return 0;
    return Math.round((done / scheduled) * 100);
  }

  function habitsOnPage(page) {
    return state.habits
      .filter((h) => (h.page ?? 0) === page)
      .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  }

  function nextSlot(page) {
    const used = new Set(habitsOnPage(page).map((h) => h.slot));
    for (let i = 0; i < PAGE_SIZE; i++) if (!used.has(i)) return i;
    return -1;
  }

  function nextAvailablePageSlot() {
    for (let p = 0; p < PAGE_COUNT; p++) {
      const slot = nextSlot(p);
      if (slot >= 0) return { page: p, slot };
    }
    return null;
  }

  function applyTheme() {
    $('#app').dataset.theme = state.settings.theme || 'coral';
    document.body.classList.toggle('compact', !!state.settings.compact);
  }

  function updateDateLabel() {
    const opts = { weekday: 'long', month: 'long', day: 'numeric' };
    $('#dateLabel').textContent = new Date().toLocaleDateString(undefined, opts);
  }

  function renderGrid() {
    const grid = $('#habitGrid');
    grid.innerHTML = '';
    const pageHabits = habitsOnPage(currentPage);
    const bySlot = {};
    pageHabits.forEach((h) => { bySlot[h.slot] = h; });

    for (let i = 0; i < PAGE_SIZE; i++) {
      const slot = document.createElement('div');
      slot.className = 'habit-slot';
      const habit = bySlot[i];
      if (!habit) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'habit-btn empty';
        btn.innerHTML = '<span class="plus">+</span>';
        btn.addEventListener('click', () => openHabitModal(null, currentPage, i));
        slot.appendChild(btn);
      } else {
        slot.appendChild(createHabitButton(habit));
      }
      grid.appendChild(slot);
    }

    const dots = $('#pageDots');
    dots.innerHTML = '';
    for (let p = 0; p < PAGE_COUNT; p++) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = `dot${p === currentPage ? ' active' : ''}`;
      d.setAttribute('aria-label', `Page ${p + 1}`);
      d.addEventListener('click', () => {
        currentPage = p;
        state.settings.startPage = p;
        scheduleSave();
        renderGrid();
      });
      dots.appendChild(d);
    }
    $('#pageHint').textContent = `Page ${currentPage + 1} of ${PAGE_COUNT} · ${state.habits.length}/${MAX_HABITS} habits`;
  }

  function createHabitButton(habit) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'habit-btn';
    btn.style.setProperty('--habit-color', habit.color);
    if (habit.type === 'negative') btn.classList.add('negative');

    const scheduled = isScheduledOn(habit, new Date());
    const done = isDoneForToday(habit);
    if (done) btn.classList.add('done');
    if (!scheduled && habit.schedule !== 'times_per_week') {
      btn.style.opacity = '0.45';
    }

    const progress = done ? 0 : 283;
    const streak = currentStreak(habit);

    btn.innerHTML = `
      <div class="habit-ring" aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <circle class="track" cx="50" cy="50" r="45"></circle>
          <circle class="progress" cx="50" cy="50" r="45" style="stroke-dashoffset:${progress}"></circle>
        </svg>
      </div>
      <div class="habit-core">
        <span class="habit-icon">${habit.icon}</span>
        <span class="habit-name">${escapeHtml(habit.name)}</span>
      </div>
      <span class="habit-streak">${streak}🔥</span>
    `;

    let pressTimer = null;
    let longPressed = false;

    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      longPressed = false;
      pressTimer = setTimeout(() => {
        longPressed = true;
        openDetail(habit.id);
      }, 450);
    });
    btn.addEventListener('pointerup', () => {
      clearTimeout(pressTimer);
      if (!longPressed) toggleHabitQuick(habit);
    });
    btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openDetail(habit.id);
    });

    return btn;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function toggleHabitQuick(habit) {
    if (habit.schedule !== 'times_per_week' && !isScheduledOn(habit, new Date())) {
      toast('Not scheduled today');
      return;
    }
    if (habit.type === 'timed' && !isCompleted(habit.id)) {
      openDetail(habit.id);
      return;
    }

    const day = todayKey();
    if (habit.schedule === 'times_per_week') {
      if (isCompleted(habit.id, day)) {
        setCompleted(habit.id, day, false);
        toast(`Undid ${habit.name}`);
      } else {
        setCompleted(habit.id, day, true);
        const c = completionsInWeek(habit, new Date());
        const need = habit.timesPerWeek || 3;
        toast(c >= need ? `${habit.name} week complete!` : `${habit.name} ${c}/${need} this week`);
      }
    } else if (habit.type === 'negative') {
      // Negative: marking means you successfully avoided it
      const next = !isCompleted(habit.id, day);
      setCompleted(habit.id, day, next);
      toast(next ? `Avoided — streak continues` : `Unchecked`);
    } else {
      const next = !isCompleted(habit.id, day);
      setCompleted(habit.id, day, next);
      if (next) {
        const s = currentStreak(habit);
        toast(`${habit.name} · ${s} day streak`);
        celebrateIfAllDone();
      }
    }
    renderGrid();
    if (!$('#statsPanel').classList.contains('hidden')) renderStats();
  }

  function celebrateIfAllDone() {
    const due = state.habits.filter((h) => {
      if (h.schedule === 'times_per_week') return true;
      return isScheduledOn(h, new Date());
    });
    if (!due.length) return;
    if (due.every((h) => isDoneForToday(h))) {
      toast('All habits done today ✨');
      if (window.streakly) {
        window.streakly.notify({ title: 'Streakly', body: 'You completed every habit today!' });
      }
    }
  }

  function openHabitModal(habitId = null, page = currentPage, slot = null) {
    editingHabitId = habitId;
    const modal = $('#habitModal');
    modal.classList.remove('hidden');
    const habit = habitId ? state.habits.find((h) => h.id === habitId) : null;

    $('#habitModalTitle').textContent = habit ? 'Edit habit' : 'Add habit';
    $('#habitId').value = habit?.id || '';
    $('#habitName').value = habit?.name || '';
    $('#habitDuration').value = habit?.duration || 3;
    $('#habitSchedule').value = habit?.schedule || 'daily';
    $('#habitTimesPerWeek').value = habit?.timesPerWeek || 3;
    $('#habitReminder').value = habit?.reminder || '';
    selectedType = habit?.type || 'positive';
    selectedIcon = habit?.icon || ICONS[Math.floor(Math.random() * ICONS.length)];
    selectedColor = habit?.color || COLORS[Math.floor(Math.random() * COLORS.length)];
    selectedDays = habit?.days ? [...habit.days] : [1, 2, 3, 4, 5];
    openHabitModal._page = habit?.page ?? page;
    openHabitModal._slot = habit?.slot ?? slot ?? nextSlot(page);

    $$('#habitTypeSeg .seg').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === selectedType);
    });
    updateTypeFields();
    updateScheduleFields();
    renderIconPicker();
    renderColorPicker();
    $('#deleteHabitBtn').classList.toggle('hidden', !habit);
    setTimeout(() => $('#habitName').focus(), 50);
  }

  function updateTypeFields() {
    $('#timerField').classList.toggle('hidden', selectedType !== 'timed');
  }

  function updateScheduleFields() {
    const s = $('#habitSchedule').value;
    $('#customDaysField').classList.toggle('hidden', s !== 'custom');
    $('#timesWeekField').classList.toggle('hidden', s !== 'times_per_week');
    $$('#dayPills .day-pill').forEach((p) => {
      p.classList.toggle('active', selectedDays.includes(Number(p.dataset.day)));
    });
  }

  function renderIconPicker() {
    const box = $('#iconPicker');
    box.innerHTML = '';
    ICONS.forEach((icon) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `icon-opt${icon === selectedIcon ? ' active' : ''}`;
      b.textContent = icon;
      b.addEventListener('click', () => {
        selectedIcon = icon;
        renderIconPicker();
      });
      box.appendChild(b);
    });
  }

  function renderColorPicker() {
    const box = $('#colorPicker');
    box.innerHTML = '';
    COLORS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `color-opt${c === selectedColor ? ' active' : ''}`;
      b.style.background = c;
      b.addEventListener('click', () => {
        selectedColor = c;
        renderColorPicker();
      });
      box.appendChild(b);
    });
  }

  function closeHabitModal() {
    $('#habitModal').classList.add('hidden');
    editingHabitId = null;
  }

  function saveHabit(e) {
    e.preventDefault();
    const name = $('#habitName').value.trim();
    if (!name) return;

    if (editingHabitId) {
      const h = state.habits.find((x) => x.id === editingHabitId);
      if (!h) return;
      Object.assign(h, {
        name,
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
        duration: Number($('#habitDuration').value) || 3,
        schedule: $('#habitSchedule').value,
        days: [...selectedDays],
        timesPerWeek: Number($('#habitTimesPerWeek').value) || 3,
        reminder: $('#habitReminder').value || '',
      });
      toast('Habit updated');
    } else {
      if (state.habits.length >= MAX_HABITS) {
        toast('Maximum 24 habits');
        return;
      }
      let page = openHabitModal._page;
      let slot = openHabitModal._slot;
      if (slot < 0 || habitsOnPage(page).some((h) => h.slot === slot)) {
        const next = nextAvailablePageSlot();
        if (!next) {
          toast('No free slots');
          return;
        }
        page = next.page;
        slot = next.slot;
      }
      state.habits.push({
        id: uid(),
        name,
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
        duration: Number($('#habitDuration').value) || 3,
        schedule: $('#habitSchedule').value,
        days: [...selectedDays],
        timesPerWeek: Number($('#habitTimesPerWeek').value) || 3,
        reminder: $('#habitReminder').value || '',
        page,
        slot,
        createdAt: Date.now(),
      });
      currentPage = page;
      toast('Habit added');
    }
    scheduleSave();
    closeHabitModal();
    renderGrid();
  }

  function deleteHabit() {
    if (!editingHabitId) return;
    if (!confirm('Delete this habit and its history?')) return;
    const id = editingHabitId;
    state.habits = state.habits.filter((h) => h.id !== id);
    delete state.completions[id];
    delete state.notes[id];
    scheduleSave();
    closeHabitModal();
    closeDetail();
    renderGrid();
    toast('Habit deleted');
  }

  function openDetail(habitId) {
    detailHabitId = habitId;
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return;
    $('#detailModal').classList.remove('hidden');
    $('#detailTitle').textContent = `${habit.icon} ${habit.name}`;
    const streak = currentStreak(habit);
    const best = bestStreak(habit);
    $('#detailStreak').innerHTML = `
      <div class="big">${streak}</div>
      <div class="sub">current streak · best ${best}${habit.schedule === 'times_per_week' ? ' weeks' : ' days'}</div>
    `;
    renderDetailCalendar(habit);
    $('#detailNote').value = getNote(habit.id);
    const done = isDoneForToday(habit);
    const toggle = $('#toggleCompleteBtn');
    toggle.textContent = done ? 'Mark undone' : (habit.type === 'negative' ? 'Mark avoided' : 'Mark done');
    toggle.style.setProperty('--habit-color', habit.color);

    const timed = habit.type === 'timed';
    $('#timerBlock').classList.toggle('hidden', !timed);
    if (timed) {
      stopTimer();
      timerRemaining = (habit.duration || 3) * 60;
      updateTimerDisplay();
    }
  }

  function renderDetailCalendar(habit) {
    const cal = $('#detailCalendar');
    cal.innerHTML = '';
    cal.style.setProperty('--habit-color', habit.color);
    const today = new Date();
    // Show last 28 days
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = todayKey(d);
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      cell.textContent = String(d.getDate());
      const scheduled = habit.schedule === 'times_per_week' || isScheduledOn(habit, d);
      if (!scheduled) cell.classList.add('off');
      if (isCompleted(habit.id, key)) cell.classList.add('done');
      if (key === todayKey()) cell.classList.add('today');
      cell.title = key;
      cell.addEventListener('click', () => {
        if (!scheduled && habit.schedule !== 'times_per_week') return;
        setCompleted(habit.id, key, !isCompleted(habit.id, key));
        renderDetailCalendar(habit);
        openDetail(habit.id);
        renderGrid();
      });
      cal.appendChild(cell);
    }
  }

  function closeDetail() {
    stopTimer();
    if (detailHabitId) {
      setNote(detailHabitId, todayKey(), $('#detailNote').value);
    }
    detailHabitId = null;
    $('#detailModal').classList.add('hidden');
  }

  function updateTimerDisplay() {
    const m = Math.floor(timerRemaining / 60);
    const s = timerRemaining % 60;
    $('#timerDisplay').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    $('#timerStartBtn').textContent = 'Start';
  }

  function startTimer() {
    const habit = state.habits.find((h) => h.id === detailHabitId);
    if (!habit) return;
    if (timerRunning) {
      stopTimer();
      return;
    }
    if (timerRemaining <= 0) timerRemaining = (habit.duration || 3) * 60;
    timerRunning = true;
    $('#timerStartBtn').textContent = 'Pause';
    timerInterval = setInterval(() => {
      timerRemaining -= 1;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        stopTimer();
        setCompleted(habit.id, todayKey(), true);
        toast(`${habit.name} complete!`);
        if (window.streakly) {
          window.streakly.notify({ title: 'Timer done', body: `${habit.name} finished` });
        }
        openDetail(habit.id);
        renderGrid();
        celebrateIfAllDone();
      }
    }, 1000);
  }

  function renderStats() {
    const habits = state.habits;
    const due = habits.filter((h) => h.schedule === 'times_per_week' || isScheduledOn(h, new Date()));
    const doneToday = due.filter((h) => isDoneForToday(h)).length;
    const bestOverall = habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
    const avgRate = habits.length
      ? Math.round(habits.reduce((s, h) => s + completionRate(h), 0) / habits.length)
      : 0;

    $('#statsSummary').innerHTML = `
      <div class="stat-card"><div class="value">${doneToday}/${due.length || 0}</div><div class="label">Today</div></div>
      <div class="stat-card"><div class="value">${bestOverall}</div><div class="label">Best streak</div></div>
      <div class="stat-card"><div class="value">${avgRate}%</div><div class="label">30-day rate</div></div>
    `;

    const list = $('#statsList');
    list.innerHTML = '';
    if (!habits.length) {
      list.innerHTML = '<p class="settings-note">Add habits to see statistics.</p>';
      return;
    }
    [...habits]
      .sort((a, b) => currentStreak(b) - currentStreak(a))
      .forEach((h) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'stats-item';
        item.innerHTML = `
          <div class="ico" style="--c:${h.color}">${h.icon}</div>
          <div class="meta">
            <div class="name">${escapeHtml(h.name)}</div>
            <div class="sub">${completionRate(h)}% · best ${bestStreak(h)}</div>
          </div>
          <div class="nums">${currentStreak(h)}🔥</div>
        `;
        item.addEventListener('click', () => {
          hidePanels();
          openDetail(h.id);
        });
        list.appendChild(item);
      });
  }

  function renderThemes() {
    const grid = $('#themeGrid');
    grid.innerHTML = '';
    THEMES.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `theme-swatch${state.settings.theme === t.id ? ' active' : ''}`;
      b.style.background = t.preview;
      b.innerHTML = `<span class="tname">${t.name}</span>`;
      b.addEventListener('click', () => {
        state.settings.theme = t.id;
        scheduleSave();
        applyTheme();
        renderThemes();
        toast(`${t.name} theme`);
      });
      grid.appendChild(b);
    });
  }

  function hidePanels() {
    $$('.panel').forEach((p) => p.classList.add('hidden'));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === 'today'));
  }

  function showPanel(id) {
    hidePanels();
    $(`#${id}`).classList.remove('hidden');
    if (id === 'statsPanel') {
      $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === 'stats'));
      renderStats();
    }
  }

  async function checkReminders() {
    if (!state.settings.remindersEnabled) return;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = todayKey();
    for (const h of state.habits) {
      if (!h.reminder) continue;
      if (h.reminder !== hhmm) continue;
      const key = `${h.id}:${day}:${hhmm}`;
      if (remindedToday.has(key)) continue;
      if (isDoneForToday(h)) continue;
      if (h.schedule !== 'times_per_week' && !isScheduledOn(h, now)) continue;
      remindedToday.add(key);
      if (window.streakly) {
        await window.streakly.notify({
          title: 'Streakly reminder',
          body: `Don't break the chain — ${h.name}`,
        });
      }
      toast(`Reminder: ${h.name}`);
    }
  }

  function bindEvents() {
    $('#addHabitBtn').addEventListener('click', () => {
      if (state.habits.length >= MAX_HABITS) {
        toast('Maximum 24 habits');
        return;
      }
      const next = nextAvailablePageSlot();
      if (!next) {
        toast('No free slots');
        return;
      }
      openHabitModal(null, next.page, next.slot);
    });

    $('#closeHabitModal').addEventListener('click', closeHabitModal);
    $('#cancelHabitBtn').addEventListener('click', closeHabitModal);
    $('#habitForm').addEventListener('submit', saveHabit);
    $('#deleteHabitBtn').addEventListener('click', deleteHabit);

    $$('#habitTypeSeg .seg').forEach((b) => {
      b.addEventListener('click', () => {
        selectedType = b.dataset.type;
        $$('#habitTypeSeg .seg').forEach((x) => x.classList.toggle('active', x === b));
        updateTypeFields();
      });
    });

    $('#habitSchedule').addEventListener('change', updateScheduleFields);
    $$('#dayPills .day-pill').forEach((p) => {
      p.addEventListener('click', () => {
        const d = Number(p.dataset.day);
        if (selectedDays.includes(d)) selectedDays = selectedDays.filter((x) => x !== d);
        else selectedDays.push(d);
        updateScheduleFields();
      });
    });

    $('#closeDetailModal').addEventListener('click', closeDetail);
    $('#editFromDetailBtn').addEventListener('click', () => {
      const id = detailHabitId;
      closeDetail();
      openHabitModal(id);
    });
    $('#toggleCompleteBtn').addEventListener('click', () => {
      const habit = state.habits.find((h) => h.id === detailHabitId);
      if (!habit) return;
      toggleHabitQuick(habit);
      openDetail(habit.id);
    });
    $('#detailNote').addEventListener('change', () => {
      if (detailHabitId) setNote(detailHabitId, todayKey(), $('#detailNote').value);
    });
    $('#timerStartBtn').addEventListener('click', startTimer);
    $('#timerResetBtn').addEventListener('click', () => {
      const habit = state.habits.find((h) => h.id === detailHabitId);
      stopTimer();
      timerRemaining = ((habit && habit.duration) || 3) * 60;
      updateTimerDisplay();
    });

    $('#statsBtn').addEventListener('click', () => showPanel('statsPanel'));
    $('#themesBtn').addEventListener('click', () => {
      showPanel('themesPanel');
      renderThemes();
    });
    $('#settingsBtn').addEventListener('click', () => {
      showPanel('settingsPanel');
      $('#remindersToggle').checked = !!state.settings.remindersEnabled;
      $('#compactToggle').checked = !!state.settings.compact;
    });

    $$('.close-panel').forEach((b) => {
      b.addEventListener('click', () => {
        hidePanels();
      });
    });

    $('#navToday').addEventListener('click', () => hidePanels());
    $('#navStats').addEventListener('click', () => showPanel('statsPanel'));

    $('#remindersToggle').addEventListener('change', (e) => {
      state.settings.remindersEnabled = e.target.checked;
      scheduleSave();
    });
    $('#compactToggle').addEventListener('change', (e) => {
      state.settings.compact = e.target.checked;
      scheduleSave();
      applyTheme();
    });
    $('#resetDataBtn').addEventListener('click', () => {
      if (!confirm('Erase all habits and history?')) return;
      state = {
        habits: [],
        completions: {},
        notes: {},
        settings: { theme: state.settings.theme, remindersEnabled: true, compact: false, startPage: 0 },
      };
      seedDefaults();
      scheduleSave();
      hidePanels();
      renderGrid();
      toast('Data reset');
    });

    // Swipe pages
    let touchX = null;
    const page = $('#habitsPage');
    page.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].screenX; }, { passive: true });
    page.addEventListener('touchend', (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].screenX - touchX;
      touchX = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && currentPage < PAGE_COUNT - 1) currentPage++;
      else if (dx > 0 && currentPage > 0) currentPage--;
      else return;
      state.settings.startPage = currentPage;
      scheduleSave();
      renderGrid();
    }, { passive: true });

    // Keyboard page nav
    window.addEventListener('keydown', (e) => {
      if (!$('#habitModal').classList.contains('hidden') || !$('#detailModal').classList.contains('hidden')) return;
      if (e.key === 'ArrowRight' && currentPage < PAGE_COUNT - 1) {
        currentPage++;
        renderGrid();
      } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        currentPage--;
        renderGrid();
      }
    });

    // Close modals on backdrop click
    $('#habitModal').addEventListener('click', (e) => {
      if (e.target === $('#habitModal')) closeHabitModal();
    });
    $('#detailModal').addEventListener('click', (e) => {
      if (e.target === $('#detailModal')) closeDetail();
    });

    if (window.streakly?.onCheckReminders) {
      window.streakly.onCheckReminders(checkReminders);
    }
    setInterval(checkReminders, 30000);
  }

  async function init() {
    await loadState();
    currentPage = Math.min(PAGE_COUNT - 1, Math.max(0, state.settings.startPage || 0));
    applyTheme();
    updateDateLabel();
    bindEvents();
    renderGrid();
    // Midnight rollover
    setInterval(() => {
      updateDateLabel();
      renderGrid();
    }, 60_000);
  }

  init();
})();
