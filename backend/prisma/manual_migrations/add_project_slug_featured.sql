-- Approved additive change. Confirm these columns/index do not already exist
-- and take a database backup before executing. Existing rows remain unchanged.
ALTER TABLE `projects`
  ADD COLUMN `slug` VARCHAR(180) NULL AFTER `role`,
  ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT FALSE AFTER `sort_order`,
  ADD UNIQUE INDEX `uq_projects_portfolio_slug` (`portfolio_id`, `slug`);
