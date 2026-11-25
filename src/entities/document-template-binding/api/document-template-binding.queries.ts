import { queryOptions } from "@tanstack/react-query";
import { documentTemplateBindingApi } from "./document-template-binding.api";

export const documentTemplateBindingQueries = {
  all: () => ["document-template-binding"] as const,

  lists: () => [...documentTemplateBindingQueries.all(), "list"] as const,
  list: () =>
    queryOptions({
      queryKey: documentTemplateBindingQueries.lists(),
      queryFn: () => documentTemplateBindingApi.list(),
    }),

  resolve: (documentType: string) =>
    queryOptions({
      queryKey: [...documentTemplateBindingQueries.all(), "resolve", documentType],
      queryFn: () => documentTemplateBindingApi.resolve(documentType),
    }),
};
