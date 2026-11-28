import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { downloadBackup, restoreBackup } from './backup.js';
import './home.css';

export default function BackupCard() {
  const input = useRef(null);
  const [message, setMessage] = useState('');
  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = restoreBackup(await file.text());
    if (!result.ok) { setMessage(result.error); return; }
    setMessage('Прогресс восстановлен. Обновляю страницу…');
    setTimeout(() => window.location.reload(), 600);
  }
  return <section className="home-card" aria-label="Данные и копия прогресса">
    <span className="home-label">Твои данные</span>
    <p className="home-muted">Прогресс хранится в этом браузере, без регистрации. Завершённые собесы дополнительно копируются на сервер под случайным номером, без имени и почты. Тексты ответов уходят в YandexGPT только при ИИ-кейсах, подсказках и разборе. Если очистишь данные сайта или сменишь устройство, прогресс пропадёт — сохрани копию в файл.</p>
    <div className="home-row">
      <button type="button" className="home-btn" onClick={downloadBackup}><Download size={16}/> Сохранить в файл</button>
      <button type="button" className="home-link" onClick={() => input.current?.click()}><Upload size={16}/> Загрузить из файла</button>
    </div>
    <input ref={input} type="file" accept="application/json,.json" hidden onChange={onFile} aria-label="Файл с копией прогресса"/>
    {message && <p role="status" className="home-muted">{message}</p>}
  </section>;
}
