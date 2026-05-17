# Legacy frontend copy

Эта папка сейчас не используется в деплое.

Render собирает актуальный frontend из корня репозитория согласно `render.yaml`:

```yaml
buildCommand: npm ci && npm run build
staticPublishPath: dist
```

Если нужно изменить production-интерфейс, редактируй файлы в корне:

- `main.jsx`
- `styles.css`
- `api/client.js`
- `quizData.js`
- `courseData.js`
