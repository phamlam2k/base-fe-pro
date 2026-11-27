import { z } from "zod";

type TFn = (key: string) => string;

/** Giờ bắt đầu nghiệm thu không được ở quá khứ (khớp backend, nới 5 phút lệch đồng hồ). */
export const PROPOSED_GRACE_MS = 5 * 60 * 1000;

/** "YYYY-MM-DDTHH:mm" của <input datetime-local> là GIỜ VN → epoch ms (ISO đủ thì parse thẳng). */
function proposedAtMs(value: string): number {
  return Date.parse(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+07:00` : value,
  );
}

/**
 * MAD-8/9 — schema tạo phiếu nghiệm thu (dùng chung vật liệu + công việc).
 * ``initialProposedAt``: giờ sẵn có khi sửa & gửi lại — giữ nguyên thì không kiểm.
 */
export function createAcceptanceRequestSchema(t?: TFn, initialProposedAt?: string) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z
    .object({
      type: z.enum(["material", "work"]),
      contractorTeam: z.string().min(1, {
        message: msg("validation.teamRequired", "Chọn team Nhà thầu"),
      }),
      invitedSupervisor: z.string().optional(),
      construction: z.string().optional(),
      contractPackage: z.string().optional(),
      category: z.string().optional(),
      location: z.string().optional(),
      proposedAt: z.string().optional(),
      // Vật liệu
      materialType: z.string().optional(),
      quantity: z.string().optional(),
      origin: z.string().optional(),
      needsSampling: z.boolean().optional(),
      // Công việc
      level: z.enum(["work", "part_phase", "item_completion"]).optional(),
      description: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if (
        v.proposedAt &&
        v.proposedAt !== initialProposedAt &&
        proposedAtMs(v.proposedAt) < Date.now() - PROPOSED_GRACE_MS
      )
        ctx.addIssue({
          path: ["proposedAt"],
          code: z.ZodIssueCode.custom,
          message: msg(
            "validation.proposedAtMin",
            "Thời gian bắt đầu nghiệm thu phải sau thời điểm hiện tại",
          ),
        });
      if (v.type === "material") {
        if (!v.materialType?.trim())
          ctx.addIssue({
            path: ["materialType"],
            code: z.ZodIssueCode.custom,
            message: msg("validation.materialRequired", "Nhập chủng loại vật liệu"),
          });
        if (!v.quantity?.trim())
          ctx.addIssue({
            path: ["quantity"],
            code: z.ZodIssueCode.custom,
            message: msg("validation.quantityRequired", "Nhập khối lượng"),
          });
      } else if ((v.description?.trim().length ?? 0) < 3) {
        ctx.addIssue({
          path: ["description"],
          code: z.ZodIssueCode.custom,
          message: msg("validation.descriptionRequired", "Nhập mô tả công việc"),
        });
      }
    });
}

export type AcceptanceRequestValues = z.infer<
  ReturnType<typeof createAcceptanceRequestSchema>
>;
