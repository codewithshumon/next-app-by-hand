# Database Relations

## One-to-One (1:1)

### User ↔ Profile

| Table | Field | Type | Constraint |
|-------|-------|------|------------|
| User | id | String | PK (cuid) |
| Profile | userId | String | FK → User.id, Unique |

- Each **User** can have at most one **Profile**
- Each **Profile** belongs to exactly one **User**
- `Profile.userId` has a `@unique` constraint enforcing the 1:1 relationship
- On delete: Cascade (deleting a User removes their Profile)

```
User 1 ────── 0..1 Profile
```

---

## One-to-Many (1:M)

### User → Posts

| Table | Field | Type | Constraint |
|-------|-------|------|------------|
| User | id | String | PK (cuid) |
| Post | authorId | String | FK → User.id |

- Each **User** can have many **Posts**
- Each **Post** belongs to exactly one **User** (its author)
- On delete: Cascade (deleting a User removes all their Posts)

```
User 1 ────── 0..* Post
```

---

## Many-to-Many (M:M)

### User ↔ Role (via UserRole join table)

| Table | Field | Type | Constraint |
|-------|-------|------|------------|
| User | id | String | PK (cuid) |
| Role | id | String | PK (cuid) |
| UserRole | userId | String | FK → User.id |
| UserRole | roleId | String | FK → Role.id |
| UserRole | (composite) | | PK: [userId, roleId] |

- Each **User** can have many **Roles**
- Each **Role** can be assigned to many **Users**
- The **UserRole** join table resolves the M:M relationship
- Composite primary key `[userId, roleId]` prevents duplicate assignments
- On delete: Cascade on both foreign keys

```
User * ────── * Role
          |
      UserRole (join table)
```
