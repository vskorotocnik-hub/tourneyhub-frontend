-- Add CHECK constraints to prevent negative balances
ALTER TABLE "User" ADD CONSTRAINT "user_uc_balance_non_negative" CHECK ("ucBalance" >= 0);
ALTER TABLE "User" ADD CONSTRAINT "user_balance_non_negative" CHECK ("balance" >= 0);
