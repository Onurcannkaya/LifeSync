/**
 * LifeSync - Calendar Renderer
 */

import { store } from '../utils/store.js';
import { storage } from '../utils/storage.js';

let currentDate = new Date();
let currentView = 'month';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function renderCalendar() {
  const container = $('#tab-calendar .calendar-container');
  if (!container) return;

  const events = store.getState().events || [];

  renderCalendarHeader(container, events);
  renderCalendarGrid(container, events);
}

function renderCalendarHeader(container, events) {
  const header = container.querySelector('.calendar-header');
  if (!header) return;

  const title = header.querySelector('.calendar-title');
  if (title) {
    title.textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  const navBtns = header.querySelectorAll('.mini-nav-btn, .calendar-nav button');
  navBtns.forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.action;
      if (action === 'prev') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      } else if (action === 'next') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (action === 'today') {
        currentDate = new Date();
      }
      renderCalendar();
    };
  });
}

function renderCalendarGrid(container, events) {
  const grid = container.querySelector('.calendar-grid');
  if (!grid) return;

  const weekdays = grid.querySelector('.calendar-weekdays');
  if (weekdays) {
    weekdays.innerHTML = WEEKDAYS.map(day => `<span>${day}</span>`).join('');
  }

  const daysContainer = grid.querySelector('.calendar-days');
  if (!daysContainer) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const today = new Date();

  let html = '';

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

    let eventsHtml = '';
    if (dayEvents.length > 0) {
      const displayEvents = dayEvents.slice(0, 2);
      eventsHtml = `<div class="day-events">
        ${displayEvents.map(e => `<div class="day-event ${e.category || 'work'}">${e.title}</div>`).join('')}
        ${dayEvents.length > 2 ? `<div class="more-events">+${dayEvents.length - 2} daha</div>` : ''}
      </div>`;
    }

    html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${year}-${month + 1}-${day}">
      <span class="day-number">${day}</span>
      ${eventsHtml}
    </div>`;
  }

  // Next month days
  const remainingDays = 42 - (startDay + totalDays);
  for (let day = 1; day <= remainingDays; day++) {
    html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
  }

  daysContainer.innerHTML = html;

  // Add click handlers
  daysContainer.querySelectorAll('.calendar-day').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      const date = dayEl.dataset.date;
      if (date) {
        if (window.openEventModal) window.openEventModal(null, date);
      }
    });
  });
}

// Export for use in app.js
export function refreshCalendar() {
  renderCalendar();
}
