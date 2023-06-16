-- CreateEnum
CREATE TYPE "UserAuthority" AS ENUM ('CLIENT_ORDER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authority" "UserAuthority"[] DEFAULT ARRAY[]::"UserAuthority"[];
