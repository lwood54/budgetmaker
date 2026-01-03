# Generate Plan Functionality - Complete Walkthrough

## Overview

The "Generate Plan" feature creates a debt snowball payment plan that calculates monthly payments across multiple years, showing how debts are paid off over time with snowball payments (payments from paid-off debts rolling into remaining debts).

---

## 1. Entry Point & Component Structure

### Main Page Component

**File:** `src/routes/paydown/+page.svelte`

- Contains tab navigation (Setup, Generate Plan, Saved Plans)
- When "Generate Plan" tab is active, renders `<GeneratePlan />` component

### Generate Plan Component

**File:** `src/routes/paydown/components/GeneratePlan.svelte`

- **Lines 19-33:** State variables for plan configuration and data
  - `planStartDate`: When the plan starts
  - `yearsToPlan`: How many years to calculate (default: 5)
  - `additionalSnowball`: Extra monthly payment amount
  - `debts`, `incomes`, `recurringExpenses`: Data arrays
  - `paymentPlan`: The generated plan (array of `MonthlyPaymentPlan`)
  - `editedPayments`, `originalPayments`, `manuallyEditedPayments`: Track user edits

---

## 2. Data Loading

### On Component Mount

**File:** `GeneratePlan.svelte` - **Lines 193-197**

```typescript
onMount(() => {
  loadDebts();
  loadIncomes();
  loadRecurringExpenses();
});
```

### Data Source Functions

**File:** `src/routes/paydown/helpers/localStorage.ts`

- **`getAllDebts()`** (Lines 28-39)
  - Reads from `localStorage` key: `'paydown_debts'`
  - Returns `PaydownDebt[]` with: id, name, type, amount, interestRate, monthlyPayment, priority

- **`getAllIncomes()`** (Lines 155-165)
  - Reads from `localStorage` key: `'paydown_incomes'`
  - Returns `MonthlyIncome[]` with: id, title, amount

- **`getAllRecurringExpenses()`** (Lines 282-292)
  - Reads from `localStorage` key: `'paydown_recurring_expenses'`
  - Returns `RecurringExpense[]` with: id, title, amount

---

## 3. Plan Generation Logic

### Trigger: Generate Plan Button

**File:** `GeneratePlan.svelte` - **Line 221**

- Button click calls `handleGeneratePlan()` (Lines 47-70)

### Handle Generate Plan Function

**File:** `GeneratePlan.svelte` - **Lines 47-70**

**Step-by-step:**

1. **Validation:** Checks if debts exist (Line 48)
2. **Parse inputs:**
   - Converts `planStartDate` to Date object (Line 50)
   - Parses `additionalSnowball` as float (Line 51)
3. **Generate plan:** Calls `generateSnowballPlan()` (Lines 54-61)
4. **Clear edit state:** Resets all editing-related state (Lines 64-66)
5. **Update plan:** Sets `paymentPlan` state (Line 69)

### Core Generation Function

**File:** `src/routes/paydown/helpers/paydownPlan.ts` - **`generateSnowballPlan()`** (Lines 489-722)

**Function Signature:**

```typescript
generateSnowballPlan(
  debts: PaydownDebt[],
  startDate?: Date,
  yearsToPlan: number = 50,
  additionalSnowball: number = 0,
  incomes: MonthlyIncome[] = [],
  recurringExpenses: RecurringExpense[] = []
): MonthlyPaymentPlan[]
```

**Algorithm Flow:**

#### Phase 1: Initialization (Lines 497-520)

1. **Sort debts** by priority using `sortDebtsByPriority()` (Line 500)
   - Priority 1 = highest (receives snowball first)
   - Priority 0 = skip snowball
   - Same priority: sorted by balance (lowest first)
2. **Initialize tracking:**
   - `currentBalances`: Map of debtId → current balance
   - `currentPayments`: Map of debtId → monthly payment
   - `paidOffDebts`: Set of debt IDs that are paid off
3. **Set start date:** Normalizes to first of month (Lines 515-517)

#### Phase 2: Monthly Loop (Lines 522-719)

**Loop continues while:** debts remain unpaid AND months < maxMonths

**For each month:**

1. **Create PaymentMonth object** (Lines 529-533)
   - year, month (0-11), monthName (e.g., "January 2024")

2. **Calculate totals** (Lines 541-546)
   - `totalIncome`: Sum of all income amounts
   - `totalRecurringExpenses`: Sum of all recurring expenses

3. **Calculate snowball from paid-off debts** (Lines 548-554)
   - Sums monthly payments from all debts in `paidOffDebts` set
   - This is the "snowball" that gets added to the current recipient

4. **Process each debt** (Lines 563-685)
   - **Skip if paid off** (Line 565)
   - **Get current balance** from `currentBalances` map (Line 567)
   - **Get base payment** from `currentPayments` map (Line 568)

   **For Priority 0 debts** (Lines 570-593):
   - Calculate payment WITHOUT snowball
   - Still tracked but doesn't receive extra payments

   **For Priority > 0 debts** (Lines 595-684):
   - **Determine snowball recipient** (Lines 599-605)
     - Highest priority unpaid debt receives snowball
     - If previous recipient paid off, recalculate
   - **Calculate snowball payment** (Lines 611-627)
     - Start with base payment
     - If this debt is the recipient:
       - Add excess from debts paid off this month (if any)
       - OR add snowball from previous months + additionalSnowball
   - **Calculate debt payment** (Line 629)
     - Calls `calculateDebtPayment()` which routes to type-specific calculator

5. **Track paid-off debts** (Lines 647-679)
   - If debt is paid off:
     - Calculate excess payment (unused portion)
     - Add to `excessFromThisMonth` for next debt
     - Mark as paid off in `paidOffThisMonth` set
     - Clear snowball recipient if it was this debt

6. **Update balances** (Line 645)
   - Store new balance in `currentBalances` map

7. **Mark debts as paid off** (Lines 687-690)
   - Add `newlyPaidOffDebts` to `paidOffDebts` set

8. **Re-sort debts** (Lines 692-695)
   - Re-sort by priority and balance (balances may have changed)

9. **Calculate remaining balance** (Line 698)
   - `remainingBalance = totalIncome - totalPayment - totalRecurringExpenses`

10. **Create MonthlyPaymentPlan object** (Lines 700-711)
    - Contains: paymentMonth, debtPayments[], totals, incomes, recurringExpenses, remainingBalance

11. **Increment month counter** (Line 713)

---

## 4. Payment Calculation Logic

### Debt Payment Calculation

**File:** `paydownPlan.ts` - **`calculateDebtPayment()`** (Lines 149-170)

Routes to type-specific calculator based on debt type. Each debt type has its own calculation function that implements the appropriate payment logic for that loan type:

- `credit-card` → `calculateCreditCardPayment()` (Lines 94-123)
- `car` → `calculateCarLoanPayment()` (Lines 128-157)
- `mortgage` → `calculateMortgagePayment()` (Lines 162-191)
- `student-loan` → `calculateStudentLoanPayment()` (Lines 196-225)
- `personal-loan` → `calculatePersonalLoanPayment()` (Lines 230-259)
- `other` → `calculateOtherLoanPayment()` (Lines 264-293)

### Type-Specific Calculation Functions

Each function implements the appropriate calculation method for its debt type:

#### Credit Card Payment (`calculateCreditCardPayment`)

**Lines 94-123**

- **Method:** Credit cards use daily compounding interest, but simplified to monthly for calculations
- **Interest:** Calculated on average daily balance (simplified to start-of-month balance)
- **Payment:** Must cover interest first, then remainder goes to principal
- **Notes:** Minimum payments are typically calculated as percentage of balance + interest, but when paying more than minimum, standard interest-first applies

#### Car Loan Payment (`calculateCarLoanPayment`)

**Lines 128-157**

- **Method:** Simple interest amortization
- **Interest:** Calculated on outstanding principal balance
- **Payment:** Covers interest first, remainder goes to principal
- **Notes:** Typically fixed monthly payments based on original loan terms. Extra payments go directly to principal reduction

#### Mortgage Payment (`calculateMortgagePayment`)

**Lines 162-191**

- **Method:** Amortization schedule with monthly compounding
- **Interest:** Calculated on outstanding principal balance
- **Payment:** Covers interest first (P&I), remainder goes to principal
- **Notes:** Fixed monthly payments based on original loan terms. May include escrow (taxes/insurance) but this function calculates P&I only. Extra payments reduce principal directly

#### Student Loan Payment (`calculateStudentLoanPayment`)

**Lines 196-225**

- **Method:** Federal loans accrue daily but compound monthly; private loans similar to installment loans
- **Interest:** Calculated on outstanding balance
- **Payment:** Covers interest first, remainder goes to principal
- **Notes:** May have different payment plans (standard, income-driven), but payment application follows standard amortization

#### Personal Loan Payment (`calculatePersonalLoanPayment`)

**Lines 230-259**

- **Method:** Simple interest amortization (similar to car loans)
- **Interest:** Calculated on outstanding balance
- **Payment:** Covers interest first, remainder goes to principal
- **Notes:** Fixed monthly payments based on original loan terms

#### Other Loan Payment (`calculateOtherLoanPayment`)

**Lines 264-293**

- **Method:** Standard amortization (catch-all for uncategorized loans)
- **Interest:** Calculated on outstanding balance
- **Payment:** Covers interest first, then principal

### Common Calculation Pattern

All debt types follow the same fundamental pattern (interest first, then principal), but each function is documented with its specific characteristics:

```typescript
monthlyInterestRate = interestRate / 100 / 12;
interest = balance * monthlyInterestRate;
principal = min(monthlyPayment - interest, balance);
newBalance = max(0, balance - principal);
isPaidOff = newBalance <= 0.01;
actualPayment = principal + interest;
```

**Returns (all types):**

- `interest`: Interest portion of payment
- `principal`: Principal portion (reduces balance)
- `newBalance`: Remaining balance after payment
- `isPaidOff`: Boolean if debt is fully paid
- `actualPayment`: Total payment amount (may be less than planned if paid off)

---

## 5. Display/Output Locations

### Payment Plan Grid Component

**File:** `src/routes/paydown/components/PaymentPlanGrid.svelte`

This is where ALL output occurs. The component receives:

- `paymentPlan`: Array of `MonthlyPaymentPlan`
- `debts`: Array of debt definitions
- Callback functions for editing

### Output Structure (Lines 165-446)

#### Year Grouping (Lines 36-86)

- Groups months by year
- Ensures 12 months per year (Jan-Dec)
- Handles partial years at start/end

#### Grid Layout (Lines 174-432)

**Column structure:** 1 label column + N month columns (one per month)

**Rows displayed:**

1. **Header Row** (Lines 182-207)
   - Debt label column + month headers
   - Each month header shows: month name + "Update" button

2. **Income Row** (Lines 209-227)
   - Shows `totalIncome` for each month
   - Green background (`bg-green-50`)

3. **Recurring Expenses Row** (Lines 229-255)
   - Collapsible (toggle with ▶/▼)
   - Shows `totalRecurringExpenses` for each month
   - Orange background (`bg-orange-50`)
   - **Expanded view** (Lines 257-286): Shows individual expenses

4. **Total Payments Row** (Lines 288-312)
   - Collapsible (toggle with ▶/▼)
   - Shows `totalPayment` for each month
   - Gray background (`bg-neutral-50`)

5. **Individual Debt Rows** (Lines 314-404)
   - **Only shown when expanded** (`!collapsedDebts.has(yearIndex)`)
   - One row per debt
   - **Left column:** Debt name, priority badge, interest rate
   - **Month columns:**
     - If paid off: Shows "Paid" + final payment amount (green)
     - If not paid off:
       - Shows payment amount (editable)
       - Shows balance below payment
       - **Snowball indicator:** Teal background (`bg-teal-800`) if receiving snowball
       - **Editing:** Click to edit, shows input field

6. **Remaining Balance Row** (Lines 406-431)
   - Shows `remainingBalance` for each month
   - Green if positive, red if negative
   - Gray background (`bg-neutral-100`)

### Visual Indicators

**Snowball Detection** (Lines 109-121):

```typescript
function isSnowballRecipient(monthPlan, debtId): boolean {
  // Payment > basePayment + 0.01 indicates snowball
}
```

- Debts receiving snowball have teal background (`bg-teal-800`)

**Priority Display** (Lines 326-332):

- Shows priority badge (P1, P2, etc.) for priority > 0
- Priority 0 debts don't show badge

---

## 6. Editing Functionality

### Payment Editing Flow

#### 1. User Clicks Payment Cell

**File:** `PaymentPlanGrid.svelte` - **Line 385**

- Sets `editingCell` state to `"monthIndex-debtId"`

#### 2. Input Field Appears

**File:** `PaymentPlanGrid.svelte` - **Lines 365-381**

- Shows number input with current value
- Auto-focuses and selects text (`focusOnMount` action)

#### 3. User Types New Value

**File:** `PaymentPlanGrid.svelte` - **Line 370**

- Calls `handlePaymentChange(monthIndex, debtId, value)`

#### 4. Handle Payment Change

**File:** `GeneratePlan.svelte` - **`handlePaymentChange()`** (Lines 72-103)

**Process:**

1. **Parse value** (Line 74): Converts to number (empty = 0)
2. **Store original** (Lines 77-87): If first edit for this month, saves all original payments
3. **Store edit** (Lines 91-102): Updates `editedPayments[monthIndex][debtId]`
   - Uses spread operator to trigger reactivity

#### 5. Display Payment Value

**File:** `GeneratePlan.svelte` - **`getDisplayPayment()`** (Lines 159-172)

**Logic:**

1. If edited value exists → return edited value
2. Else if original exists → return original (preserves independence until Update)
3. Else → return current payment from plan

#### 6. Update Button

**File:** `PaymentPlanGrid.svelte` - **Lines 194-201**

- Button enabled only if `hasEdits(monthIndex)` returns true
- Shows "Update" button in month header

#### 7. Has Edits Check

**File:** `GeneratePlan.svelte` - **`hasEdits()`** (Lines 174-191)

- Compares edited values to original values
- Returns true if any difference > 0.01

#### 8. User Clicks Update

**File:** `PaymentPlanGrid.svelte` - **Line 198**

- Calls `handleUpdateMonth(monthIndex)`

#### 9. Handle Update Month

**File:** `GeneratePlan.svelte` - **`handleUpdateMonth()`** (Lines 105-153)

**Process:**

1. **Validate** (Lines 106-109): Checks if edits exist
2. **Save to persistent tracker** (Lines 112-118): Stores in `manuallyEditedPayments`
3. **Merge edits** (Lines 122-125): Combines current + previous edits for month
4. **Convert to Map** (Lines 128-131): For function parameter
5. **Recalculate plan** (Lines 136-145): Calls `recalculatePlanFromMonth()`
6. **Clear temporary edits** (Lines 148-152): Removes from `editedPayments` and `originalPayments`

---

## 7. Recalculation Logic

### Recalculate Plan From Month

**File:** `paydownPlan.ts` - **`recalculatePlanFromMonth()`** (Lines 177-477)

**Purpose:** Recalculates plan from a specific month forward, preserving manually edited payments in future months.

**Function Signature:**

```typescript
recalculatePlanFromMonth(
  plan: MonthlyPaymentPlan[],
  fromMonthIndex: number,
  updatedPayments: Map<string, number>, // debtId -> new payment for update month
  debts: PaydownDebt[],
  incomes: MonthlyIncome[],
  recurringExpenses: RecurringExpense[],
  additionalSnowball: number,
  manuallyEditedPayments: Record<number, Record<string, number>> // monthIndex -> debtId -> payment
): MonthlyPaymentPlan[]
```

**Algorithm:**

#### Phase 1: Preserve Previous Months (Line 190)

- Keeps all months BEFORE `fromMonthIndex` unchanged

#### Phase 2: Initialize State (Lines 192-255)

1. **Get balances** from month before update (or initial debts)
2. **Get payments** from original debt definitions
3. **Build preserved payments map** (Lines 242-255)
   - Converts `manuallyEditedPayments` to Map structure
   - Only preserves edits in months AFTER update month

#### Phase 3: Recalculate Forward (Lines 258-474)

**For each month from `fromMonthIndex` to end:**

1. **Create PaymentMonth** (Lines 269-273)

2. **Process each debt** (Lines 300-447)
   - **Determine base payment** (Lines 309-318):
     - If update month AND edited → use edited payment
     - Else if preserved payment exists → use preserved
     - Else → use original debt monthly payment
   - **Handle Priority 0** (Lines 321-344): No snowball
   - **Handle Priority > 0** (Lines 346-442):
     - **Determine snowball recipient** (Lines 349-355)
     - **Check if manually edited** (Line 359)
       - Edited payments are treated as TOTAL (including snowball)
       - Don't add snowball to manually edited payments
     - **Calculate snowball payment** (Lines 369-386)
       - Only add snowball if NOT manually edited
       - Only add to current recipient
     - **Calculate payment** (Line 388)
     - **Track excess** (Lines 419-437): If paid off, calculate unused payment

3. **Update balances and totals** (Lines 444-446)

4. **Mark paid off** (Lines 449-452)

5. **Re-sort debts** (Lines 454-457)

6. **Calculate remaining balance** (Line 460)

7. **Add to plan** (Lines 462-473)

**Key Difference from Initial Generation:**

- Preserves manually edited payments in future months
- Only recalculates from the update month forward
- Edited payments override snowball logic (treated as total payment)

---

## 8. Data Types

### PaydownDebt

```typescript
{
  id: string;
  name: string;
  type: DebtType; // 'credit-card' | 'car' | 'mortgage' | etc.
  amount: number; // Initial balance
  interestRate: number; // Percentage (e.g., 4.25)
  monthlyPayment: number; // Base monthly payment
  priority: number; // 1 = highest, 0 = skip snowball
  createdAt: string;
  updatedAt: string;
}
```

### MonthlyPaymentPlan

```typescript
{
  paymentMonth: {
    year: number;
    month: number; // 0-11
    monthName: string; // "January 2024"
  };
  debtPayments: DebtPayment[]; // One per debt
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  incomes: MonthlyIncome[];
  totalIncome: number;
  recurringExpenses: RecurringExpense[];
  totalRecurringExpenses: number;
  remainingBalance: number; // income - payments - expenses
}
```

### DebtPayment

```typescript
{
  debtId: string;
  debtName: string;
  balance: number; // Remaining balance after payment
  payment: number; // Actual payment amount
  interest: number;
  principal: number;
  isPaidOff: boolean;
}
```

---

## 9. Key Functions Summary

| Function                       | Location                  | Purpose                           |
| ------------------------------ | ------------------------- | --------------------------------- |
| `handleGeneratePlan()`         | `GeneratePlan.svelte:47`  | Entry point for plan generation   |
| `generateSnowballPlan()`       | `paydownPlan.ts:489`      | Core plan generation algorithm    |
| `recalculatePlanFromMonth()`   | `paydownPlan.ts:177`      | Recalculate after edits           |
| `calculateDebtPayment()`       | `paydownPlan.ts:149`      | Route to type-specific calculator |
| `calculateDebtPaymentByType()` | `paydownPlan.ts:51`       | Core payment calculation          |
| `sortDebtsByPriority()`        | `debtSorting.ts:13`       | Sort debts for snowball order     |
| `handlePaymentChange()`        | `GeneratePlan.svelte:72`  | Track user edits                  |
| `handleUpdateMonth()`          | `GeneratePlan.svelte:105` | Apply edits and recalculate       |
| `getDisplayPayment()`          | `GeneratePlan.svelte:159` | Get value to display in cell      |
| `hasEdits()`                   | `GeneratePlan.svelte:174` | Check if month has unsaved edits  |

---

## 10. Output Flow Diagram

```
User clicks "Generate Plan"
    ↓
handleGeneratePlan()
    ↓
generateSnowballPlan()
    ↓
For each month (up to yearsToPlan * 12):
    ├─ Calculate totals (income, expenses)
    ├─ Calculate snowball from paid-off debts
    ├─ For each debt:
    │   ├─ Calculate payment (with/without snowball)
    │   ├─ Update balance
    │   └─ Track if paid off
    ├─ Calculate remaining balance
    └─ Create MonthlyPaymentPlan object
    ↓
paymentPlan state updated
    ↓
PaymentPlanGrid component renders
    ↓
Displays grid with:
    ├─ Income row
    ├─ Recurring expenses row
    ├─ Total payments row
    ├─ Individual debt rows (collapsible)
    └─ Remaining balance row
```

---

## 11. Editing Flow Diagram

```
User clicks payment cell
    ↓
Input field appears
    ↓
User types new value
    ↓
handlePaymentChange() stores edit
    ↓
getDisplayPayment() shows edited value
    ↓
"Update" button enabled (hasEdits() = true)
    ↓
User clicks "Update"
    ↓
handleUpdateMonth()
    ├─ Save edits to manuallyEditedPayments
    └─ Call recalculatePlanFromMonth()
        ↓
        Recalculate from this month forward
        ├─ Use edited payments for this month
        ├─ Preserve manually edited payments in future months
        └─ Recalculate snowball for remaining months
    ↓
paymentPlan state updated
    ↓
Grid re-renders with new calculations
```

---

This walkthrough covers the complete flow from data loading through plan generation, display, and editing functionality.
