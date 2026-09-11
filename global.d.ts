/**
 * Ambient type declarations for stylesheet side-effect imports such as
 * `import './globals.css'` in app/layout.tsx.
 *
 * Next.js 13.5 only ships type declarations for CSS Modules
 * (`*.module.css` / `*.module.sass` / `*.module.scss`) via
 * `next/types/global.d.ts`. Plain `.css` files are compiled away by
 * Next.js/PostCSS at build time but have no type declarations, so the
 * TypeScript language service reports "Cannot find module or type
 * declarations for side-effect import of '*.css'". This wildcard allows
 * those imports to type-check (as `any`) without affecting the
 * more specific CSS Modules declarations.
 */
declare module '*.css';