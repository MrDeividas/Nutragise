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
