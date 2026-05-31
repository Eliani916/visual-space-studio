const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function getSettings() {
  const openingHour = (await prisma.systemSetting.findUnique({where:{key:'OPENING_HOUR'}})).value;
  const closingHour = (await prisma.systemSetting.findUnique({where:{key:'CLOSING_HOUR'}})).value;
  return { data: { openingHour, closingHour } };
}
function addMinutesToTime(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + mins);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
function checkTimeOverlap(start1, end1, start2, end2) {
  return (start1 < end2) && (start2 < end1);
}
async function getAvailableTimes(dateStr) {
  const settingsRes = await getSettings();
  const settings = settingsRes.data;
  const startHour = parseInt(settings.openingHour.split(':')[0]);
  const endHour = parseInt(settings.closingHour.split(':')[0]);
  const allSlots = [];
  for(let h=startHour; h<endHour; h++) {
    allSlots.push(h.toString().padStart(2, '0') + ':00');
  }
  const photographerCount = await prisma.photographerProfile.count({where:{status:'AVAILABLE'}});
  const bookings = await prisma.booking.findMany({where:{bookingDate:new Date(dateStr),status:{notIn:['EXPIRED','CANCELLED']},photographerId:{not:null}},include:{package:true}});
  const availableSlots = allSlots.filter(slot => {
    const slotEnd = addMinutesToTime(slot, 60);
    const overlaps = bookings.filter(b => checkTimeOverlap(slot, slotEnd, b.bookingTime, b.endTime || addMinutesToTime(b.bookingTime, b.package.duration || 60)));
    return overlaps.length < photographerCount;
  });
  return availableSlots;
}
getAvailableTimes('2026-05-31').then(res => {
    console.log("AVAILABLE SLOTS: ", res);
}).finally(()=>prisma.$disconnect());
