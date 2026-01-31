import { cn } from "@/lib/utils"

type RefProp<T> = { ref?: React.Ref<T> }

// H1 Component
function H1({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & RefProp<HTMLHeadingElement>) {
  return (
    <h1
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}
H1.displayName = "H1"

// H2 Component
function H2({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & RefProp<HTMLHeadingElement>) {
  return (
    <h2
      ref={ref}
      className={cn(
        "scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0",
        className
      )}
      {...props}
    />
  )
}
H2.displayName = "H2"

// H3 Component
function H3({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & RefProp<HTMLHeadingElement>) {
  return (
    <h3
      ref={ref}
      className={cn(
        "scroll-m-20 text-lg font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}
H3.displayName = "H3"

// H4 Component
function H4({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & RefProp<HTMLHeadingElement>) {
  return (
    <h4
      ref={ref}
      className={cn(
        "scroll-m-20 text-lg font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}
H4.displayName = "H4"

// Paragraph Component
function P({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & RefProp<HTMLParagraphElement>) {
  return (
    <p
      ref={ref}
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  )
}
P.displayName = "P"

// Blockquote Component
function Blockquote({
  className,
  ref,
  ...props
}: React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
  RefProp<HTMLQuoteElement>) {
  return (
    <blockquote
      ref={ref}
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  )
}
Blockquote.displayName = "Blockquote"

// Typography Table Component
function TypographyTable({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & RefProp<HTMLTableElement>) {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table ref={ref} className={cn("w-full", className)} {...props} />
    </div>
  )
}
TypographyTable.displayName = "TypographyTable"

// Table Header Component
function Th({
  className,
  ref,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> &
  RefProp<HTMLTableCellElement>) {
  return (
    <th
      ref={ref}
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  )
}
Th.displayName = "Th"

// Table Data Component
function Td({
  className,
  ref,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> &
  RefProp<HTMLTableCellElement>) {
  return (
    <td
      ref={ref}
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  )
}
Td.displayName = "Td"

// Table Row Component
function Tr({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & RefProp<HTMLTableRowElement>) {
  return (
    <tr
      ref={ref}
      className={cn("even:bg-muted m-0 border-t p-0", className)}
      {...props}
    />
  )
}
Tr.displayName = "Tr"

// Unordered List Component
function Ul({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLUListElement> & RefProp<HTMLUListElement>) {
  return (
    <ul
      ref={ref}
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  )
}
Ul.displayName = "Ul"

// Ordered List Component
function Ol({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLOListElement> & RefProp<HTMLOListElement>) {
  return (
    <ol
      ref={ref}
      className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  )
}
Ol.displayName = "Ol"

// List Item Component
function Li({
  className,
  ref,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & RefProp<HTMLLIElement>) {
  return <li ref={ref} className={cn("", className)} {...props} />
}
Li.displayName = "Li"

// Inline Code Component
function InlineCode({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  return (
    <code
      ref={ref}
      className={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  )
}
InlineCode.displayName = "InlineCode"

// Lead Component
function Lead({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & RefProp<HTMLParagraphElement>) {
  return (
    <p
      ref={ref}
      className={cn("text-muted-foreground text-lg", className)}
      {...props}
    />
  )
}
Lead.displayName = "Lead"

// Large Component
function Large({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  return (
    <div
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}
Large.displayName = "Large"

// Small Component
function Small({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  return (
    <small
      ref={ref}
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  )
}
Small.displayName = "Small"

// Muted Component
function Muted({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & RefProp<HTMLParagraphElement>) {
  return (
    <p
      ref={ref}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}
Muted.displayName = "Muted"

export {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  TypographyTable,
  Th,
  Td,
  Tr,
  Ul,
  Ol,
  Li,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted
}
