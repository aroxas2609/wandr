-- Split expenses among travelers (run after role_policies.sql)

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES users(id);

UPDATE expenses SET paid_by_user_id = user_id WHERE paid_by_user_id IS NULL;

CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  PRIMARY KEY (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Expense splits read" ON expense_splits;
DROP POLICY IF EXISTS "Expense splits mutate" ON expense_splits;

CREATE POLICY "Expense splits read" ON expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id
        AND public.can_access_trip(e.trip_id)
    )
  );

CREATE POLICY "Expense splits insert" ON expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id
        AND public.can_edit_trip(e.trip_id)
    )
  );

CREATE POLICY "Expense splits update" ON expense_splits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id
        AND public.can_edit_trip(e.trip_id)
    )
  );

CREATE POLICY "Expense splits delete" ON expense_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id
        AND public.can_edit_trip(e.trip_id)
    )
  );
