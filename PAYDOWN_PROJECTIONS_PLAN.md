# Paydown Projections Feature Plan

## Overview

The paydown projections feature allows users to create long-term financial projections (10 calendar years) with monthly intervals to track income, expenses, savings, transfers, and paydown items (credit cards, loans, etc.) over time.

## User Interaction Flow

### 1. Initial Projection Setup

**User Action:** Navigate to `/paydown` page and click "Create New Projection"

**Required Information:**

- Projection title (e.g., "10 Year Financial Plan")
- Paydown strategy:
  - `snowball` - Pay lowest balance first
  - `avalanche` - Pay highest interest first
  - `highest_balance` - Pay highest balance first
  - `lowest_balance` - Pay lowest balance first
  - `custom` - User-defined order

**System Action:**

- Creates a new projection record
- Generates 10 calendar year sections (e.g., 2024, 2025, ..., 2033)
- For each year, creates 12 monthly intervals (sequence 1-12)
- Returns projection ID for further configuration

### 2. Adding Income Sources

**User Action:** Add monthly income sources

**Required Information:**

- Income title (e.g., "Salary", "Freelance")
- Monthly amount (in dollars)
- Section name (optional grouping, e.g., "Income 1", "Income 2")
- Whether to apply to all months or specific months

**System Action:**

- Creates `groupItems` with `type: 'income'` for each specified interval
- If "all months" selected, creates income items for all 120 intervals (10 years × 12 months)
- Stores amount in cents

### 3. Adding Recurring Expenses

**User Action:** Add fixed monthly expenses

**Required Information:**

- Expense title (e.g., "Rent", "Utilities", "Groceries")
- Monthly amount (in dollars)
- Section name (which income source this expense belongs to)
- Whether recurring (applies to all months) or one-time

**System Action:**

- Creates `groupItems` with `type: 'expense'` and `isRecurring: true`
- Applies to specified intervals
- Stores amount in cents

### 4. Adding Paydown Items

**User Action:** Add debts/loans that need to be paid down

**Required Information:**

- Paydown item title (e.g., "Credit Card", "Auto Loan")
- Initial balance (in dollars)
- Interest rate (as percentage, e.g., 15.5%)
- Minimum payment (in dollars, optional)
- Section name (which income source pays this)
- Paydown strategy will determine payment allocation

**System Action:**

- Creates `groupItems` with:
  - `type: 'expense'`
  - `isPaydown: true`
  - `initialBalance` (in cents)
  - `interestRate` (in basis points, e.g., 1550 = 15.5%)
- Creates initial `intervalBalances` entry for first interval with starting balance
- Payment amounts will be calculated based on paydown strategy

### 5. Adding Savings Goals

**User Action:** Add savings targets

**Required Information:**

- Savings title (e.g., "Emergency Fund", "Vacation")
- Monthly amount (in dollars)
- Section name (which income source funds this)
- Target amount (optional)

**System Action:**

- Creates `groupItems` with `type: 'savings'`
- Applies to specified intervals

### 6. Adding Transfers

**User Action:** Add transfers between income sources

**Required Information:**

- Transfer title (e.g., "Transfer to Income 2")
- Amount (in dollars)
- From section name
- To section name
- Frequency

**System Action:**

- Creates `groupItems` with `type: 'transfer'`
- Links between sections via `sectionName` field

### 7. Generating Projections

**User Action:** Click "Generate Projections" button

**System Action:**

- Calculates paydown amounts based on selected strategy:
  - **Snowball:** Allocates extra payments to lowest balance items first
  - **Avalanche:** Allocates extra payments to highest interest rate items first
  - **Highest Balance:** Allocates to highest balance items first
  - **Lowest Balance:** Allocates to lowest balance items first
- For each interval:
  - Calculates available funds (income - fixed expenses - savings)
  - Allocates payments to paydown items based on strategy
  - Calculates new balances after payments
  - Applies interest to remaining balances
  - Creates `intervalBalances` entries for each paydown item
- Updates all future intervals based on previous interval balances

### 8. Viewing Projections

**User Action:** View projection details

**System Action:**

- Displays projection with all sections (years)
- Shows each interval (month) with:
  - Income items
  - Expenses (recurring and paydown)
  - Savings
  - Transfers
  - Current balances for paydown items
- Visual timeline showing balance reduction over time

### 9. Editing Projections

**User Action:** Edit any interval's items

**System Action:**

- User can modify:
  - Income amounts
  - Expense amounts
  - Paydown item payments
  - Add one-time expenses
- When paydown item is modified:
  - Recalculates balance for that interval
  - Cascades changes to all following intervals
  - Updates `intervalBalances` for affected intervals

### 10. Updating Balances Mid-Projection

**User Action:** Update balance for a paydown item at a specific month

**System Action:**

- User can manually adjust balance (e.g., added $600 to credit card in month 5)
- System recalculates all following intervals based on new balance
- Updates `intervalBalances` for affected intervals

## Data Structure

### Projection Creation

- **Projection:** Top-level container
  - Title
  - Paydown strategy
  - User ID

### Sections (Years)

- 10 sections representing calendar years
- Each section has `order` field (1-10)
- Title is year (e.g., "2024")

### Intervals (Months)

- 12 intervals per section
- Each interval has `sequence` field (1-12)
- Represents January through December

### Group Items

- **Incomes:** Monthly income sources
- **Expenses:** Fixed recurring expenses
- **Paydown Items:** Debts/loans with balances
- **Savings:** Savings goals
- **Transfers:** Money transfers between sections

### Interval Balances

- Tracks balance for each paydown item at the start of each interval
- Used for cascading calculations
- Updated when user modifies payments or balances

## API Endpoints Needed

### 1. Create Projection

- **POST** `/api/projections`
- Creates projection with 10 years × 12 months structure
- Returns projection ID

### 2. Get Projections

- **GET** `/api/projections`
- Returns all projections for authenticated user

### 3. Get Projection Details

- **GET** `/api/projections/[uuid]`
- Returns full projection with all sections, intervals, and items

### 4. Add Group Items

- **POST** `/api/projections/[uuid]/items`
- Adds income, expense, savings, or transfer items
- Can add to specific intervals or all intervals

### 5. Generate Projections

- **POST** `/api/projections/[uuid]/generate`
- Calculates paydown amounts and balances
- Creates interval balances for all paydown items

### 6. Update Group Item

- **PUT** `/api/projections/[uuid]/items/[itemId]`
- Updates an existing group item
- Cascades changes if it's a paydown item

### 7. Update Interval Balance

- **PUT** `/api/projections/[uuid]/intervals/[intervalId]/balances/[itemId]`
- Manually updates balance for a paydown item at specific interval
- Recalculates all following intervals

### 8. Delete Projection

- **DELETE** `/api/projections/[uuid]`
- Removes projection and all related data

## Implementation Phases

### Phase 1: Basic Structure (Current)

- ✅ Database schema created
- ✅ Migration applied
- 🔄 Create API endpoints for projection CRUD
- 🔄 Create endpoint to generate 10-year structure

### Phase 2: Item Management

- Add endpoints for adding group items
- Support for income, expenses, savings, transfers
- Support for paydown items with initial balances

### Phase 3: Paydown Calculations

- Implement paydown strategy algorithms
- Calculate balances over time
- Apply interest calculations
- Cascade balance updates

### Phase 4: UI Components

- Projection list view
- Projection detail view with timeline
- Forms for adding items
- Visualization of paydown progress

### Phase 5: Editing & Updates

- Edit individual items
- Update balances mid-projection
- Recalculate cascading changes
- Undo/redo functionality

## Key Considerations

1. **Performance:** Generating 120 intervals with multiple items can be heavy - consider batching or background jobs
2. **Accuracy:** Interest calculations need to be precise (monthly vs. daily compounding)
3. **Flexibility:** Users may want different time periods (weeks, days) - schema supports this
4. **Validation:** Ensure paydown items have required fields (initialBalance, interestRate)
5. **Cascading Updates:** When balance changes, need efficient way to recalculate future intervals
6. **Data Integrity:** Foreign key constraints ensure data consistency
