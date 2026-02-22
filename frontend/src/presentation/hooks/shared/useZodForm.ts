import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form"
import type { z } from "zod"

export interface UseZodFormOptions<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
  TContext = unknown,
> extends Omit<UseFormProps<TFieldValues, TContext>, "resolver" | "formControl"> {
  schema: z.ZodType<TTransformedValues, TFieldValues>
}

/**
 * Creates a form instance configured with a Zod schema resolver.
 *
 * @param options - Form configuration and Zod schema.
 * @returns React Hook Form instance with schema-derived input and output types.
 */
export function useZodForm<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
  TContext = unknown,
>(
  options: UseZodFormOptions<TFieldValues, TTransformedValues, TContext>,
) {
  const { schema, ...formOptions } = options

  return useForm<TFieldValues, TContext, TTransformedValues>({
    resolver: zodResolver(schema),
    ...formOptions,
  })
}
