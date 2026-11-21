// Deterministic classroom scenario, not a forecast of real marketplace performance.
export const DECISION_CASE = {
  id:'checkout-growth',title:'Кейс: рост заказов при ограниченном бюджете',
  description:'Ты PM маркетплейса. За месяц нужно увеличить вклад в прибыль, не превысив бюджет 180 000 ₽.',
  budget:180000,
  baseline:{visits:50000,conversionPct:5,avgOrderRub:1200,grossMarginPct:25},
  initiatives:[
    {id:'checkout',title:'Упростить checkout',cost:100000,trafficDelta:0,crDelta:0.9,marginDelta:0,detail:'Убираем лишний шаг оплаты и проверяем ошибки формы.'},
    {id:'crm',title:'Вернуть пользователей через CRM',cost:40000,trafficDelta:0,crDelta:0.4,marginDelta:0,detail:'Показываем напоминание о незавершённом заказе.'},
    {id:'acquisition',title:'Запустить платное привлечение',cost:140000,trafficDelta:10000,crDelta:0,marginDelta:0,detail:'Приводим дополнительные посещения по платным каналам.'},
    {id:'discount',title:'Скидка на весь каталог',cost:80000,trafficDelta:0,crDelta:1.2,marginDelta:-6,detail:'CR растёт, но валовая маржа снижается на 6 п.п.'}
  ],
  checks:[
    {id:'checkout-logs',label:'Проверить ошибки и воронку checkout',correct:true,feedback:'Так можно отделить реальную проблему оформления от изменений состава трафика.'},
    {id:'only-dau',label:'Смотреть только общий DAU',correct:false,feedback:'DAU не покажет, почему падает конверсия из корзины в оплату.'},
    {id:'launch-now',label:'Сразу масштабировать всё без проверки',correct:false,feedback:'Без проверки причины и guardrail-метрик легко потратить бюджет без эффекта.'}
  ]
};
export function evaluateInitiatives(caseData, ids) {
  const unique=[...new Set(ids)];
  const selected=caseData.initiatives.filter(i=>unique.includes(i.id));
  const spent=selected.reduce((sum,i)=>sum+i.cost,0);
  if(spent>caseData.budget) throw new Error('Выбранные инициативы превышают бюджет');
  const b=caseData.baseline;
  const visits=b.visits+selected.reduce((sum,i)=>sum+i.trafficDelta,0);
  const conversionPct=Math.min(100,Math.max(0,b.conversionPct+selected.reduce((sum,i)=>sum+i.crDelta,0)));
  const grossMarginPct=Math.min(100,Math.max(0,b.grossMarginPct+selected.reduce((sum,i)=>sum+i.marginDelta,0)));
  const orders=visits*conversionPct/100;
  const revenue=orders*b.avgOrderRub;
  const grossProfit=revenue*grossMarginPct/100;
  const baselineRevenue=b.visits*b.conversionPct/100*b.avgOrderRub;
  const baselineGrossProfit=baselineRevenue*b.grossMarginPct/100;
  // Incremental contribution after initiative costs relative to doing nothing.
  const incrementalContribution=grossProfit-baselineGrossProfit-spent;
  return {selected,spent,remaining:caseData.budget-spent,visits,conversionPct,grossMarginPct,orders,revenue,grossProfit,baselineRevenue,baselineGrossProfit,incrementalContribution};
}
export function assessReason(id, result) {
  const correct=id==='contribution';
  return {correct,feedback:correct
    ? 'Верно. Чтобы сравнить инициативы, нужно учитывать не только заказы и выручку, но и валовую маржу, расходы и ограничения модели.'
    : 'Рост CR или выручки не гарантирует рост прибыли. Пересчитай результат с учётом маржи и затрат на инициативы.'};
}
