-- Approved additive schema change. Confirm the live table does not already
-- contain this column and take a database backup before executing.
ALTER TABLE `experiences`
  ADD COLUMN `achievements` JSON NULL AFTER `description`;
