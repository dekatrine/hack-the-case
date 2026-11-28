import React, { useState } from 'react';
import { giveConsent, hasConsent } from './consent.js';
import './home.css';

// Один раз при первом входе: что мы храним и куда уходят ответы.
export default function Consent() {
  const [open, setOpen] = useState(() => !hasConsent());
  if (!open) return null;
  return <div className="home-consent" role="dialog" aria-modal="true" aria-labelledby="consent-title">
    <div className="home-consent-card">
      <h2 id="consent-title">Какие данные мы собираем</h2>
      <ul>
        <li>Прогресс, ответы и оценки хранятся в твоём браузере. Регистрации и имени нет.</li>
        <li>Итоги собесов копируются на наш сервер под случайным номером, без имени и почты.</li>
        <li>Тексты ответов отправляются во внешнюю модель YandexGPT, когда ты просишь ИИ-кейс, подсказку или разбор. Готовые собесы оцениваются прямо в браузере.</li>
        <li>Обезличенные события (какие экраны открыты, сколько собесов пройдено) считает Яндекс.Метрика.</li>
        <li>Не вводи в ответы персональные и конфиденциальные данные: ни своих, ни чужих.</li>
      </ul>
      <p className="home-muted">Копию прогресса можно сохранить в файл на экране «Прогресс».</p>
      <button type="button" className="home-btn" onClick={() => { giveConsent(); setOpen(false); }}>Понятно, продолжить</button>
    </div>
  </div>;
}
