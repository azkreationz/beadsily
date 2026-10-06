-- Attempt to over-reserve comp-accent (requesting 600 when on_hand is 500)
UPDATE components 
SET stock_reserved = stock_reserved + 600, updated_at = 1728212500000 
WHERE id = 'comp-accent';
