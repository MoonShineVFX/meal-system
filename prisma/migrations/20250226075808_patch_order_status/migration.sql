-- 更新 CANCELED 狀態
UPDATE "Order" 
SET "status" = 'CANCELED' 
WHERE "timeCanceled" IS NOT NULL;

-- 更新 COMPLETED 狀態
UPDATE "Order" 
SET "status" = 'COMPLETED' 
WHERE "timeCompleted" IS NOT NULL;

-- 更新 DISHED_UP 狀態
UPDATE "Order" 
SET "status" = 'DISHED_UP' 
WHERE "timeDishedUp" IS NOT NULL;
