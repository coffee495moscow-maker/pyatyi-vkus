-- Replace database copies of bearer credentials with SHA-256 digests.
-- Existing sessions/reset links are deliberately invalidated at migration time.
update sessions set id = encode(digest(id, 'sha256'), 'hex');
update password_resets set token = encode(digest(token, 'sha256'), 'hex');
