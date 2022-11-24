-- AlterTable
CREATE SEQUENCE "blockchain_id_seq";
ALTER TABLE "Blockchain" ALTER COLUMN "id" SET DEFAULT nextval('blockchain_id_seq');
ALTER SEQUENCE "blockchain_id_seq" OWNED BY "Blockchain"."id";
