-- Migration: Balanced Ranks (3 Reviews = Level Up)
-- Created: 2026-01-29

CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp >= 100000 THEN
        NEW.rank := 'Skeptek God';
    ELSIF NEW.xp >= 50000 THEN
        NEW.rank := 'Grand Arbiter';
    ELSIF NEW.xp >= 25000 THEN
        NEW.rank := 'Truth Serum';
    ELSIF NEW.xp >= 12000 THEN
        NEW.rank := 'Hype Slayer';
    ELSIF NEW.xp >= 6000 THEN
        NEW.rank := 'Myth Buster';
    ELSIF NEW.xp >= 3000 THEN
        NEW.rank := 'Scam Spotter';
    ELSIF NEW.xp >= 1500 THEN
        NEW.rank := 'Deal Hunter';
    ELSIF NEW.xp >= 750 THEN
        NEW.rank := 'Review Reader';
    ELSIF NEW.xp >= 250 THEN
        NEW.rank := 'Label Reader';
    ELSE
        NEW.rank := 'Window Shopper';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
