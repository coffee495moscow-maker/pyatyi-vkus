export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center gap-3 px-5 pt-24 text-center">
      <h1 className="font-display text-2xl">Нет соединения</h1>
      <p className="text-sm text-text-muted">
        Похоже, вы офлайн. Проверьте подключение к интернету — часть страниц
        уже сохранена и может открыться после переподключения.
      </p>
    </div>
  );
}
