// Modern CSS output floor for the 1.35 release. Older fallback expansions are unnecessary.
// Acceptance uses current stable browser engines; targets intentionally retain native nesting.
export const modernCssTargets = {
    chrome: 154 << 16,
    firefox: 157 << 16,
    safari: (26 << 16) | (6 << 8),
};
