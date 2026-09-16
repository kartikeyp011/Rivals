-- Make shared owner foreign keys nullable with ON DELETE SET NULL
-- This prevents the deletion of an arena or wager if the creator deletes their account,
-- allowing shared multiplayer data to persist safely.

DO $$
DECLARE
    arena_fk text;
    wager_fk text;
BEGIN
    -- arenas.host_user_id
    SELECT constraint_name INTO arena_fk
    FROM information_schema.key_column_usage
    WHERE table_name = 'arenas' AND column_name = 'host_user_id'
    LIMIT 1;

    IF arena_fk IS NOT NULL THEN
        EXECUTE 'ALTER TABLE arenas DROP CONSTRAINT ' || arena_fk;
    END IF;

    ALTER TABLE arenas ALTER COLUMN host_user_id DROP NOT NULL;
    ALTER TABLE arenas ADD CONSTRAINT arenas_host_user_id_fkey 
        FOREIGN KEY (host_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

    -- wagers.created_by
    SELECT constraint_name INTO wager_fk
    FROM information_schema.key_column_usage
    WHERE table_name = 'wagers' AND column_name = 'created_by'
    LIMIT 1;

    IF wager_fk IS NOT NULL THEN
        EXECUTE 'ALTER TABLE wagers DROP CONSTRAINT ' || wager_fk;
    END IF;

    ALTER TABLE wagers ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE wagers ADD CONSTRAINT wagers_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;
