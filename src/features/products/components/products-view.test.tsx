import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { ProductsView } from "@/features/products/components/products-view";
import { buildSessionUser } from "@/test/factories";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor, within } from "@/test/test-utils";

/**
 * Integration test: real components + react-query + axios, network mocked at
 * the MSW boundary (see src/test/msw/handlers.ts for the default dataset).
 */
describe("<ProductsView />", () => {
  it("renders products returned by the API", async () => {
    renderWithProviders(<ProductsView />);

    expect(await screen.findByText("Aurora Headphones")).toBeInTheDocument();
    expect(screen.getByText("Nimbus Backpack")).toBeInTheDocument();
    expect(screen.getByText("Vertex Lamp")).toBeInTheDocument();
  });

  it("filters the list when searching (debounced)", async () => {
    const { user } = renderWithProviders(<ProductsView />);
    await screen.findByText("Aurora Headphones");

    await user.type(
      screen.getByPlaceholderText("Search by name or SKU..."),
      "nimbus",
    );

    await waitFor(() =>
      expect(screen.queryByText("Aurora Headphones")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Nimbus Backpack")).toBeInTheDocument();
  });

  it("hides mutating controls from a viewer (read-only role)", async () => {
    renderWithProviders(<ProductsView />, {
      sessionUser: buildSessionUser({ role: "viewer" }),
    });
    await screen.findByText("Aurora Headphones");

    expect(
      screen.queryByRole("button", { name: "Add product" }),
    ).not.toBeInTheDocument();
    // No selection checkboxes without the delete permission.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("bulk-deletes the selected rows after confirmation", async () => {
    const bulkDeleteSpy = vi.fn();
    server.use(
      http.post("/api/products/bulk-delete", async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        bulkDeleteSpy(body.ids);
        return HttpResponse.json({ data: { deleted: body.ids.length } });
      }),
    );

    const { user } = renderWithProviders(<ProductsView />);
    await screen.findByText("Aurora Headphones");

    // Select every row on the page via the header checkbox.
    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await user.click(screen.getByRole("button", { name: /Delete \(3\)/ }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(bulkDeleteSpy).toHaveBeenCalledWith([
        "prd_001",
        "prd_002",
        "prd_003",
      ]),
    );
  });
});
