import React, { useState } from 'react';
import { simulateRevenue } from './learningEngine.js';

export default function BusinessSimulator({ onComplete }) {
  const [visits,setVisits] = useState(10000);
  const [conversionPct,setConversionPct] = useState(5);
  const [avgOrderRub,setAvgOrderRub] = useState(1200);
  const baseline = simulateRevenue({visits:10000,conversionPct:5,avgOrderRub:1200});
  const projected = simulateRevenue({visits,conversionPct,avgOrderRub});
  const change = Math.round((projected.revenue / baseline.revenue - 1)*100);
  return <section className="lp-simulator">
    <div className="lp-kicker">Бизнес-симуляция · Песочница</div>
    <h2>Управляй выручкой маркетплейса</h2>
    <p>Измени показатели и посмотри, как связаны трафик, конверсия и средний чек. Это учебная модель без учёта расходов и ограничений бизнеса.</p>
    {[
      {name:'Посещения',value:visits,min:5000,max:20000,step:1000,set:setVisits,format:v=>v.toLocaleString('ru-RU')},
      {name:'Конверсия в покупку',value:conversionPct,min:1,max:12,step:0.5,set:setConversionPct,format:v=>v+'%'},
      {name:'Средний чек',value:avgOrderRub,min:500,max:2500,step:100,set:setAvgOrderRub,format:v=>v.toLocaleString('ru-RU')+' ₽'},
    ].map(field=><label className="lp-sim-control" key={field.name}><span>{field.name}<strong>{field.format(field.value)}</strong></span><input type="range" min={field.min} max={field.max} step={field.step} value={field.value} onChange={e=>field.set(Number(e.target.value))}/></label>)}
    <div className="lp-sim-results">
      <div><span>Заказов</span><strong>{projected.orders.toLocaleString('ru-RU',{maximumFractionDigits:0})}</strong></div>
      <div><span>Выручка</span><strong>{Math.round(projected.revenue).toLocaleString('ru-RU')} ₽</strong></div>
      <div><span>К базовой неделе</span><strong>{change>0?'+':''}{change}%</strong></div>
    </div>
    <p className="lp-sim-caveat">Базовый сценарий: 10 000 посещений, CR 5%, средний чек 1 200 ₽. Изменение расчётное, не прогноз.</p>
    <div className="lp-actions"><button className="lp-secondary" onClick={()=>{setVisits(10000);setConversionPct(5);setAvgOrderRub(1200);}}>Сбросить</button><button className="lp-primary" onClick={onComplete}>Вернуться к урокам →</button></div>
  </section>;
}
