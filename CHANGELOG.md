# Changelog

All notable changes to Epic Modals will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.6] - 2026-01-29

### Fixed
- Minimize animation state machine race condition
  - Modal no longer gets stuck in `data-state="minimizing"` after animation completes
  - Animation state now properly resets when minimize completes (modal stays mounted for dock restore)
  - Added guard against race where store sets `isMinimized=true` before animation controller starts

## [1.0.5] - 2026-01-28

### Added
- WizardStep components can now be wrapped in other components (React)
  - React WizardModal now uses context-based step registration, matching Svelte's behavior
  - Previously, only direct children of WizardModal were detected as steps
- Reactive prop updates for modal options (`glow`, `maxWidth`, `preferredHeight`, `closeOnEscape`)
  - Props can now be changed after modal creation and will update live
  - New `updateOptions()` method on ModalController for batch updates

### Fixed
- Vanilla `customIcon` option now works (was logging a warning and doing nothing)
- `closeOnEscape` reactive updates now take effect immediately (was only checked at modal creation)
- Svelte 5 `useModal` now accepts getter function to avoid reactivity warnings when destructuring
  - `const { close, shake } = useModal(() => id)` - id read lazily when methods called
  - Direct ID still supported for backward compatibility: `useModal('my-modal')`

### Improved
- Smoother genie minimize/restore animations
  - New easing curves for more natural motion (`cubic-bezier(0.33, 0, 0.2, 1)` for open, `cubic-bezier(0.16, 1, 0.3, 1)` for close)
  - Gradual opacity fade with intermediate keyframes (30%, 60% for minimize; 40%, 70% for restore)
  - Larger minimum scale during genie effect (0.12x0.08 instead of 0.05x0.02) for better visual continuity

## [1.0.4] - 2026-01-28

### Changed
- Minimal public API for adapters
  - Removed internal functions from public exports
  - Svelte adapter exports only: components, useModal hook, essential functions
  - Users should use useModal hook for most interactions
  - Direct functions (openModal, closeModal) available for dynamic scenarios

### Fixed
- Export `getModalDialogElement` and `screenCenter` from core (was causing build failures)

## [1.0.3] - 2026-01-28

### Fixed
- Export missing core functions required by adapters

## [1.0.2] - 2026-01-28

### Changed
- Optimized build output and chunking
  - Two-phase build: core built first, adapters import from shared core.js
  - Simplified to 10 files: core/svelte/react/vanilla .js + .d.ts + 2 CSS presets
  - Removed root export - users must import from specific adapters
  - Bundled TypeScript declarations into single .d.ts per entry
- CSS presets: `basic.css` (core styles) and `showcase.css` (with themes)

### Added
- Release workflow documentation

## [1.0.1] - 2026-01-27

### Fixed
- TypeScript declaration errors
- Build dependencies in release package.json
- Template literal parsing in comment stripper

### Changed
- License switched to MIT

## [1.0.0] - 2026-01-27

### Added
- **Multi-framework support**: React, Svelte, and Vanilla JS adapters
- **Modal features**:
  - Draggable modals with header drag handle
  - Resizable modals with 8-direction handles
  - Minimize to dock
  - Parent-child modal relationships
  - Transparency toggle
  - Close on Escape key
  - Auto-open option
  - Custom icons and footers
  - Glow effects
- **Smart positioning**: Automatic layout algorithm that prevents overlap
- **Dock system**: Minimized modals appear in a configurable dock
- **Backdrop**: Configurable backdrop with blur effect
- **Animations**: Open, close, minimize, restore animations with FLIP technique
- **WizardModal**: Multi-step wizard built on Modal
- **Accessibility**: ARIA roles, focus management, keyboard navigation
- **Configuration**: Global config for features, dock position, header layout (macOS/Windows)

### Architecture
- Framework-agnostic core with shared state management
- Controller pattern: ModalStyling, ModalPositioning, ModalLifecycle, ModalInteractions, ModalStateManager
- Testing Library adapter tests running across all frameworks
- E2E tests with Playwright for cross-framework verification
