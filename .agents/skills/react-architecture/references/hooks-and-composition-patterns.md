# Canonical React Patterns & Anti-Pattern Remediation

## 1. Eliminating Derived-State `useEffect` (High-Frequency Defect)

### ❌ BAD: Redundant State + Effect Synchronization
Causes an extra render pass, risks stale state desynchronization, and obscures data flow.
```tsx
function UserList({ users, filterQuery }: { users: User[]; filterQuery: string }) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    setFilteredUsers(users.filter((u) => u.name.toLowerCase().includes(filterQuery.toLowerCase())));
  }, [users, filterQuery]);

  return <List items={filteredUsers} />;
}
```

### ✅ GOOD: Synchronous Derivation During Render

```tsx
function UserList({ users, filterQuery }: { users: User[]; filterQuery: string }) {
  const normalizedQuery = filterQuery.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter((u) => u.name.toLowerCase().includes(normalizedQuery))
    : users;

  return <List items={filteredUsers} />;
}
```

---

## 2. Resetting State Without `useEffect`

### ❌ BAD: Resetting local state inside `useEffect` when an ID changes

```tsx
function ProfileEditor({ userId }: { userId: string }) {
  const [draftBio, setDraftBio] = useState("");
  useEffect(() => {
    setDraftBio(""); // Flashes stale state for 1 frame
  }, [userId]);
  // ...
}
```

### ✅ GOOD: Use React `key` at the boundary to reset subtree state cleanly

```tsx
function ProfilePage({ userId }: { userId: string }) {
  return <ProfileEditor key={userId} userId={userId} />;
}
```

---

## 3. Semantic Variant Props vs. Boolean Prop Explosion

### ❌ BAD: Uncontrolled Boolean Combinations

Allows impossible states like `<Badge isSuccess isError isSmall isLarge />`.

```tsx
interface BadBadgeProps {
  isSuccess?: boolean;
  isWarning?: boolean;
  isError?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
}
```

### ✅ GOOD: Constrained Semantic Unions + Native Attribute Inheritance

```tsx
export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  intent?: "neutral" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

const INTENT_CLASSES: Record<NonNullable<BadgeProps["intent"]>, string> = {
  neutral: "bg-surface-2 text-fg-secondary",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger:  "bg-rose-500/15 text-rose-400",
  info:    "bg-sky-500/15 text-sky-400",
};

const SIZE_CLASSES: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "h-5 px-1.5 text-xs rounded-xs",
  md: "h-6 px-2 text-xs rounded-sm",
};

export function Badge({
  intent = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium ${INTENT_CLASSES[intent]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
```

---

## 4. Coordinated Compound Controls via Scoped Context

Parent controls geometry (`size`, `disabled`, `invalid`) so children never drift out of alignment:

```tsx
interface ControlGroupContextValue {
  size: "sm" | "md" | "lg";
  disabled?: boolean;
  invalid?: boolean;
}

const ControlGroupContext = createContext<ControlGroupContextValue>({ size: "md" });

export function useControlGroup() {
  return useContext(ControlGroupContext);
}

export function InputGroup({
  size = "md",
  disabled = false,
  invalid = false,
  children,
}: React.PropsWithChildren<ControlGroupContextValue>) {
  const value = useMemo(() => ({ size, disabled, invalid }), [size, disabled, invalid]);
  return (
    <ControlGroupContext.Provider value={value}>
      <div
        role="group"
        data-invalid={invalid || undefined}
        className="inline-flex items-center bg-surface-2 p-1 rounded-lg gap-1"
      >
        {children}
      </div>
    </ControlGroupContext.Provider>
  );
}
```
