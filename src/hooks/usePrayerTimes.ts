import { useMemo } from 'react';

interface PrayerTime {
  name: string;
  nameAr: string;
  time: Date;
  duration: number; // minutes
}

// Approximate prayer time calculation for Riyadh (24.7136, 46.6753)
// This uses simplified formulas — in production, use an API like Aladhan
function calculatePrayerTimes(date: Date): PrayerTime[] {
  const month = date.getMonth(); // 0-indexed

  // Approximate Riyadh prayer times by month (hour:minute in 24h)
  const schedules: Record<number, number[][]> = {
    0:  [[5,15], [6,40], [12,10], [15,20], [17,40], [19,10]], // Jan
    1:  [[5,5],  [6,30], [12,15], [15,35], [18,0],  [19,30]], // Feb
    2:  [[4,50], [6,10], [12,10], [15,40], [18,15], [19,45]], // Mar
    3:  [[4,25], [5,50], [12,5],  [15,40], [18,30], [20,0]],  // Apr
    4:  [[4,5],  [5,30], [12,5],  [15,40], [18,45], [20,15]], // May
    5:  [[3,50], [5,20], [12,5],  [15,40], [18,55], [20,25]], // Jun
    6:  [[4,0],  [5,25], [12,10], [15,45], [18,55], [20,25]], // Jul
    7:  [[4,15], [5,40], [12,10], [15,40], [18,40], [20,10]], // Aug
    8:  [[4,30], [5,50], [12,5],  [15,25], [18,15], [19,45]], // Sep
    9:  [[4,40], [6,5],  [12,0],  [15,5],  [17,50], [19,20]], // Oct
    10: [[4,55], [6,20], [12,0],  [14,55], [17,35], [19,5]],  // Nov
    11: [[5,10], [6,35], [12,5],  [14,55], [17,30], [19,0]],  // Dec
  };

  const times = schedules[month] || schedules[0];
  const names = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const namesAr = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
  const durations = [25, 15, 20, 20, 15, 25]; // minutes

  return times.map(([h, m], i) => {
    const t = new Date(date);
    t.setHours(h, m, 0, 0);
    return { name: names[i], nameAr: namesAr[i], time: t, duration: durations[i] };
  });
}

export function usePrayerTimes() {
  const today = new Date();

  const prayers = useMemo(() => calculatePrayerTimes(today), [today.toDateString()]);

  const currentPrayer = useMemo(() => {
    const now = Date.now();
    return prayers.find(p => {
      const start = p.time.getTime();
      const end = start + p.duration * 60 * 1000;
      return now >= start && now <= end;
    }) || null;
  }, [prayers]);

  const nextPrayer = useMemo(() => {
    const now = Date.now();
    return prayers.find(p => p.time.getTime() > now) || null;
  }, [prayers]);

  // Add estimated delay to delivery if prayer is upcoming within 30 min
  const getDeliveryAdjustment = useMemo(() => {
    const now = Date.now();
    const upcoming = prayers.find(p => {
      const diff = p.time.getTime() - now;
      return diff > 0 && diff < 30 * 60 * 1000;
    });
    if (upcoming) return { prayer: upcoming, delayMinutes: upcoming.duration };
    if (currentPrayer) {
      const remaining = Math.ceil((currentPrayer.time.getTime() + currentPrayer.duration * 60 * 1000 - now) / 60000);
      return { prayer: currentPrayer, delayMinutes: remaining };
    }
    return null;
  }, [prayers, currentPrayer]);

  return { prayers, currentPrayer, nextPrayer, getDeliveryAdjustment };
}
