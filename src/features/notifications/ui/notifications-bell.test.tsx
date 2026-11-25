import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { NotificationsBell } from "@/features/notifications/ui/notifications-bell";
import { mockRouter } from "@/test/mocks/navigation";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

function seedNotifications() {
  server.use(
    http.get("/api/notifications/unread-count", () =>
      HttpResponse.json({ data: { count: 1 } }),
    ),
    http.post("/api/notifications/:id/read", () =>
      HttpResponse.json({ data: null }),
    ),
    http.get("/api/notifications", () =>
      HttpResponse.json({
        data: [
          {
            id: "n1",
            kind: "log_submitted",
            title: "Nhật ký thi công chờ ký",
            body: "NT A · ngày 2026-07-14",
            read: false,
            target: { type: "construction_log", id: "log-123", data: {} },
            createdAt: new Date("2026-07-14T02:00:00Z").toISOString(),
          },
        ],
      }),
    ),
  );
}

describe("<NotificationsBell />", () => {
  it("điều hướng tới trang chi tiết đúng target khi bấm thông báo", async () => {
    seedNotifications();
    const { user } = renderWithProviders(<NotificationsBell />);

    // Mở dropdown (list chỉ tải khi mở).
    await user.click(screen.getByRole("button", { name: /thông báo|notification/i }));

    const item = await screen.findByText("Nhật ký thi công chờ ký");
    await user.click(item);

    // Deep-link: log_submitted → /construction-logs/{id}
    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/construction-logs/log-123"),
    );
  });
});
