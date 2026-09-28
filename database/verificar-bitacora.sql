SELECT 
    t.name AS nombre_tabla,
    SCHEMA_NAME(t.schema_id) AS esquema,
    LEN(t.name) AS longitud_nombre
FROM sys.tables t
WHERE t.name LIKE '%bitacora%' OR t.name LIKE '%Bitacora%';