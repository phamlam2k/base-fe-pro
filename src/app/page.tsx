import { redirect } from "next/navigation";

import { ROUTES, defaultLandingFor } from "@/shared/config/routes";
import { getCurrentUser } from "@/shared/lib/auth/session";

export default async function RootPage() {
  const user = await getCurrentUser();
  // SuperAdmin không có Dashboard → về trang Quản lý công ty; chưa đăng nhập → login.
  redirect(user ? defaultLandingFor(user.role) : ROUTES.login);
}
