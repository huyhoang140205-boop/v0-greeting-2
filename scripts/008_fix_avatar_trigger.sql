-- Sửa trigger để không ghi đè avatar khi người dùng đã chọn
DROP TRIGGER IF EXISTS trg_default_avatar ON profiles;
DROP FUNCTION IF EXISTS set_default_avatar();

CREATE OR REPLACE FUNCTION set_default_avatar()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Chỉ set default nếu avatar_url là NULL, không phải empty string
    IF NEW.avatar_url IS NULL THEN
        NEW.avatar_url := 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_default_avatar
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_avatar();
