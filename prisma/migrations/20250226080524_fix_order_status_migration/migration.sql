UPDATE "Order" 
SET "status" = 'DISHED_UP' 
WHERE "timeDishedUp" IS NOT NULL;

UPDATE "Order" 
SET "status" = 'COMPLETED' 
WHERE "timeCompleted" IS NOT NULL;

UPDATE "Order" 
SET "status" = 'CANCELED' 
WHERE "timeCanceled" IS NOT NULL;
