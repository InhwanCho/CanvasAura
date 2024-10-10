/*
  Warnings:

  - Added the required column `bounds` to the `DrawHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `drawhistory` ADD COLUMN `bounds` JSON NOT NULL;
