import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { OrganizationView } from "@/features/organization/views/organization-view";
import { buildSessionUser } from "@/test/factories";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen } from "@/test/test-utils";

/**
 * Integration test: real components + react-query + axios, network mocked at
 * the MSW boundary. Exercises the company picker → members flow.
 */
const companies = [
  {
    id: "com_001",
    name: "Hoa Binh Group",
    status: "ACTIVE",
    memberCount: 2,
    projectCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "com_002",
    name: "Coteccons JSC",
    status: "SUSPENDED",
    memberCount: 1,
    projectCount: 0,
    createdAt: "2026-02-01T00:00:00.000Z",
  },
];

const membersByCompany: Record<string, unknown[]> = {
  com_001: [
    {
      id: "mem_001",
      companyId: "com_001",
      name: "Nguyen Van Tong",
      email: "ceo@hoabinh.vn",
      role: "COMPANY_ADMIN",
      customTitle: "Tong Giam doc",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  com_002: [],
};

function useOrgHandlers() {
  server.use(
    http.get("/api/organization/companies", () =>
      HttpResponse.json({
        data: {
          items: companies,
          page: 1,
          pageSize: 100,
          total: companies.length,
          totalPages: 1,
        },
      }),
    ),
    http.get("/api/organization/members", ({ request }) => {
      const companyId = new URL(request.url).searchParams.get("companyId") ?? "";
      const items = membersByCompany[companyId] ?? [];
      return HttpResponse.json({
        data: { items, page: 1, pageSize: 10, total: items.length, totalPages: 1 },
      });
    }),
  );
}

describe("<OrganizationView />", () => {
  it("shows members of the first company by default", async () => {
    useOrgHandlers();
    renderWithProviders(<OrganizationView />);

    expect(await screen.findByText("Nguyen Van Tong")).toBeInTheDocument();
    expect(screen.getByText("ceo@hoabinh.vn")).toBeInTheDocument();
  });

  it("lets an admin add a member", async () => {
    useOrgHandlers();
    renderWithProviders(<OrganizationView />);
    await screen.findByText("Nguyen Van Tong");

    expect(
      screen.getByRole("button", { name: /Add member/ }),
    ).toBeInTheDocument();
  });

  it("hides the add-member button from a read-only viewer", async () => {
    useOrgHandlers();
    renderWithProviders(<OrganizationView />, {
      sessionUser: buildSessionUser({ role: "viewer" }),
    });
    await screen.findByText("Nguyen Van Tong");

    expect(
      screen.queryByRole("button", { name: /Add member/ }),
    ).not.toBeInTheDocument();
  });
});
