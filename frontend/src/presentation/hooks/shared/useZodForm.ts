import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form"
import type { z } from "zod"

export interface UseZodFormOptions<
  TSchema extends z.ZodType<unknown, FieldValues>,
  TContext = unknown,
> extends Omit<
  UseFormProps<z.input<TSchema>, TContext, z.output<TSchema>>,
  "resolver" | "formControl"
> {
  schema: TSchema
}

/**
 * Creates a form instance configured with a Zod schema resolver.
 *
 * @param options - Form configuration and Zod schema.
 * @returns React Hook Form instance with schema-derived input and output types.
 */
export function useZodForm<
  TSchema extends z.ZodType<unknown, FieldValues>,
  TContext = unknown,
>(options: UseZodFormOptions<TSchema, TContext>) {
  const { schema, ...formOptions } = options

  return useForm<z.input<TSchema>, TContext, z.output<TSchema>>({
    resolver: zodResolver(schema),
    ...formOptions,
  })
}
