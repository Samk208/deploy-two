"use client";

type RHFRegister = (name: string) => any;
type RHFSetValue = (name: string, value: any, opts?: any) => void;
type RHFWatch = (name: string) => any;

/**
 * Drop-in form block for supplier product create/edit.
 * Works with or without react-hook-form (RHF). If RHF is not used, fallback to controlled props.
 *
 * @component
 * @example
 * // With React Hook Form
 * <ProductDescriptionsFields register={register} setValue={setValue} watch={watch} />
 *
 * @example
 * // Without React Hook Form (controlled)
 * <ProductDescriptionsFields
 *   shortValue={shortDesc}
 *   longValue={longDesc}
 *   onShortChange={setShortDesc}
 *   onLongChange={setLongDesc}
 * />
 */
export default function ProductDescriptionsFields(props: {
  // RHF hooks (optional)
  register?: RHFRegister;
  setValue?: RHFSetValue;
  watch?: RHFWatch;
  // Controlled fallbacks (optional)
  shortValue?: string;
  longValue?: string;
  onShortChange?: (v: string) => void;
  onLongChange?: (v: string) => void;
}) {
  const {
    register,
    setValue,
    watch,
    shortValue,
    longValue,
    onShortChange,
    onLongChange,
  } = props;

  const shortLen = (watch?.("short_description")?.length ??
    shortValue?.length ??
    0) as number;

  return (
    <div className="flex flex-col gap-6">
      {/* SHORT DESCRIPTION */}
      <div className="space-y-2">
        <label htmlFor="short_description" className="text-sm font-medium">
          Short Description{" "}
          <span className="opacity-60">(ideal 120–160 chars)</span>
        </label>
        <textarea
          id="short_description"
          maxLength={160}
          rows={3}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="A concise one-liner used on cards and SEO snippets."
          {...(register ? register("short_description") : {})}
          value={register ? undefined : (shortValue ?? "")}
          onChange={(e) => {
            if (register) {
              setValue?.("short_description", e.target.value);
            } else {
              onShortChange?.(e.target.value);
            }
          }}
        />
        <div className="text-xs opacity-70">{shortLen}/160</div>
      </div>

      {/* LONG DESCRIPTION */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Long Description{" "}
          <span className="opacity-60">(recommended 300–800 words)</span>
        </label>
        <textarea
          id="description"
          rows={8}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Features, materials, sizing, care, what's included, warranty, etc."
          {...(register ? register("description") : {})}
          value={register ? undefined : (longValue ?? "")}
          onChange={(e) => {
            if (register) {
              setValue?.("description", e.target.value);
            } else {
              onLongChange?.(e.target.value);
            }
          }}
        />
        <div className="text-xs opacity-70">
          Tip: Use short paragraphs, bullets, and line breaks for readability.
        </div>
      </div>
    </div>
  );
}
