// BittsQuiz Service Worker — handles web push notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "BittsQuiz", body: event.data.text(), url: "/notifications" };
  }

  const title = data.title ?? "BittsQuiz";
  const options = {
    body: data.body ?? "",
    icon: "/file.svg",
    badge: "/file.svg",
    tag: "bittsquiz-notification",
    renotify: true,
    data: { url: data.url ?? "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
