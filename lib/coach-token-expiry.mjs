/** Calendar-month expiry in UTC, clamped to the last valid day of the target month. */
export function coachTokenExpiry(startedAt, settings={}) {
  if(settings.months!==undefined && settings.hours!==undefined) throw new Error('Specify expiration in months or legacy hours, not both.');
  // Existing integrations may still send hours. Their original short-term contract stays valid.
  if(settings.hours!==undefined){
    const hours=Number(settings.hours);
    if(!Number.isInteger(hours)||hours<1||hours>168)throw new Error('Legacy hours must be 1–168. Use months for longer expiration.');
    return startedAt+hours*3600000;
  }
  const months=settings.months===undefined?12:settings.months;
  if(typeof months!=='number'||!Number.isSafeInteger(months)||months<1)throw new Error('Choose a positive whole number of months.');
  const expires=new Date(startedAt),day=expires.getUTCDate();
  expires.setUTCDate(1);
  expires.setUTCMonth(expires.getUTCMonth()+months);
  if(!Number.isFinite(expires.getTime()))throw new Error('Expiration exceeds the supported date range.');
  const last=new Date(expires.getTime());last.setUTCMonth(last.getUTCMonth()+1,0);
  if(!Number.isFinite(last.getTime()))throw new Error('Expiration exceeds the supported date range.');
  expires.setUTCDate(Math.min(day,last.getUTCDate()));
  if(!Number.isFinite(expires.getTime())||expires.getTime()<=startedAt)throw new Error('Expiration exceeds the supported date range.');
  return expires.getTime();
}
