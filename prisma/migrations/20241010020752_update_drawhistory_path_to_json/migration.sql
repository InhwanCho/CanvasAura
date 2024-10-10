/*
  Warnings:

  - You are about to alter the column `path` on the `drawhistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `drawhistory` MODIFY `path` JSON NOT NULL;
