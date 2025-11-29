# 🧭 Cursor Guidelines – Nutrapp

## 📌 Primary Rule
**Follow only the items in `TODO.md`. Do not create, delete, or modify anything not explicitly listed.**

---

## ✅ Development Rules

- Each task in `TODO.md` must be implemented **exactly as described**.
- Once a task is completed, **check it off** in the `TODO.md` list.
- **Do not add extra features, files, or dependencies** that are not listed.
- **Do not delete** existing components or logic unless instructed in `TODO.md`.
- If a task is ambiguous, prioritize minimal implementation and leave a comment.

---

## 🧱 Stack Rules

- Use **React Native (Expo)** with **TypeScript**.
- Use **Supabase** for:
  - Auth
  - Database (PostgreSQL)
  - Storage (for photos)
- Use **Tailwind via NativeWind** for all styling.
- Use **Zustand or React Context** for state management.

---

## 📂 File Structure Expectations

- `components/` – Reusable UI components only if needed
- `screens/` – Each screen from the TODO list
- `lib/` – Supabase client, utility functions
- `state/` – App-wide stores (Zustand or Context)
- `types/` – All database and app models

---

## 💡 Coding Conventions

- Use `async/await` for all Supabase operations
- Maintain clean, consistent, and minimal code
- Write modular components if UI complexity grows
- Use explicit types and interfaces from Supabase schema

## 🎨 UI Styling Patterns

### Card/Box Styling
- Use white background (`#FFFFFF`) with border (`#E5E7EB`) and shadow for consistent card styling:
  ```typescript
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  ```
- Apply this pattern to: profile boxes, post cards, spotlight sections, journey previews, etc.

### Challenge Cards
- Challenge cards use a two-section layout:
  - Top section (35% height): White background with title and participant count
  - Bottom section (65% height): Colored background (category color) with details
- Border radius: 20px
- Participant count: Positioned absolutely in top section (bottom: 8, right: 16) with icon size 14

### Horizontal Carousels
- Use `ScrollView` with `horizontal` prop
- Add `snapToInterval`, `snapToAlignment="start"`, and `decelerationRate="fast"` for smooth snapping
- Use `style={{ overflow: 'visible' }}` to prevent clipping
- Calculate snap interval: `cardWidth + margin`

### Loading Screens
- Use white background (`#FFFFFF`) instead of dark/transparent overlays
- Text color should use `theme.textPrimary` for dark text on white background

### Chat Boxes
- White background with border (no top border when expanded)
- Use `Animated.View` for slide animations
- Position absolutely with calculated top and maxHeight
- Add dimming overlay when expanded (exclude header elements)

---

## 🔒 Scope Control

🚫 Do **NOT**:
- Add new features not listed
- Create unused files or folders
- Add external packages unless clearly required by a TODO item
- Modify UI/UX outside the scope of current checklist

✅ Do:
- Follow each checklist item exactly
- Ask (via comment or placeholder) if clarification is needed
- Keep the project minimal and focused

---

This project is scope-limited and must remain clean, focused, and lean. **Strictly follow the TODO list.**
