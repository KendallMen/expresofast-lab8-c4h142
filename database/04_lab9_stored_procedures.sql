USE [ExpresoFast_C4H142_II2026];
GO

IF COL_LENGTH('dbo.Envio', 'destinatario') IS NULL
    ALTER TABLE dbo.Envio ADD destinatario VARCHAR(100) NOT NULL
        CONSTRAINT DF_Envio_destinatario DEFAULT 'Sin especificar';
GO

UPDATE dbo.Envio SET destinatario = 'Luis Fernandez' WHERE codigo_rastreo = 'EXP-0001' AND destinatario = 'Sin especificar';
UPDATE dbo.Envio SET destinatario = 'Sofia Jimenez'  WHERE codigo_rastreo = 'EXP-0002' AND destinatario = 'Sin especificar';
GO

-- 2) Stored Procedures
CREATE OR ALTER PROCEDURE dbo.SP_OBTENER_ENVIOS_POR_ESTADO
    @pEstado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT envio_id, codigo_rastreo, destinatario, direccion_destino, peso_kg, costo,
           estado_envio, vehiculo_id, conductor_id, fecha_creacion, fecha_modificacion
    FROM dbo.Envio
    WHERE estado_envio = @pEstado
    ORDER BY fecha_creacion DESC;
END;
GO


CREATE OR ALTER PROCEDURE dbo.SP_RESUMEN_METRICAS_ENVIOS
AS
BEGIN
    SET NOCOUNT ON;
    SELECT estado_envio AS estado,
           COUNT(*)     AS total_envios,
           SUM(costo)   AS monto_total_flete
    FROM dbo.Envio
    GROUP BY estado_envio
    ORDER BY estado_envio;
END;
GO

-- 3) Semillas: 16 nuevos + 2 existentes = 18 envios con los 4 estados
DECLARE @v1 INT = (SELECT vehiculo_id  FROM dbo.Vehiculo  WHERE placa = 'ABC123');
DECLARE @v2 INT = (SELECT vehiculo_id  FROM dbo.Vehiculo  WHERE placa = 'XYZ789');
DECLARE @c1 INT = (SELECT conductor_id FROM dbo.Conductor WHERE licencia = 'LIC-1001');
DECLARE @c2 INT = (SELECT conductor_id FROM dbo.Conductor WHERE licencia = 'LIC-1002');

INSERT INTO dbo.Envio
    (codigo_rastreo, destinatario, direccion_destino, peso_kg, costo, estado_envio,
     vehiculo_id, conductor_id, fecha_creacion, fecha_modificacion)
SELECT s.codigo, s.destinatario, s.direccion, s.peso, s.costo, s.estado, s.veh, s.con,
       DATEADD(HOUR, -s.horas, SYSDATETIME()), SYSDATETIME()
FROM (VALUES
    ('EXP-0003', 'Ana Mora',        'Heredia, Barva',                 5.20,  3200.00, 'PENDIENTE',   @v1, @c1,   2),
    ('EXP-0004', 'Diego Castro',    'Alajuela, Centro',              12.00,  6100.00, 'PENDIENTE',   @v2, @c2,   5),
    ('EXP-0005', 'Laura Rojas',     'Cartago, Tres Rios',             3.75,  2800.00, 'PENDIENTE',   @v1, @c1,   8),
    ('EXP-0006', 'Mario Vargas',    'San Jose, Escazu',              20.00,  9200.00, 'PENDIENTE',   @v2, @c2,  12),
    ('EXP-0007', 'Elena Solis',     'Limon, Centro',                  7.10,  5400.00, 'PENDIENTE',   @v1, @c1,  20),
    ('EXP-0008', 'Pablo Araya',     'Puntarenas, Centro',             9.30,  6800.00, 'EN_TRANSITO', @v2, @c2,  26),
    ('EXP-0009', 'Karla Nunez',     'Liberia, Guanacaste',           14.80, 11500.00, 'EN_TRANSITO', @v1, @c1,  30),
    ('EXP-0010', 'Jorge Quesada',   'San Carlos, Ciudad Quesada',     6.40,  5100.00, 'EN_TRANSITO', @v2, @c2,  36),
    ('EXP-0011', 'Marta Campos',    'Turrialba, Centro',              4.20,  3900.00, 'EN_TRANSITO', @v1, @c1,  40),
    ('EXP-0012', 'Ricardo Salas',   'San Jose, Desamparados',        11.00,  5600.00, 'ENTREGADO',   @v2, @c2,  72),
    ('EXP-0013', 'Patricia Leon',   'Heredia, Santo Domingo',         2.50,  2100.00, 'ENTREGADO',   @v1, @c1,  80),
    ('EXP-0014', 'Andres Mena',     'Cartago, Oreamuno',              8.90,  4700.00, 'ENTREGADO',   @v2, @c2,  96),
    ('EXP-0015', 'Carmen Duran',    'Alajuela, Grecia',              15.30,  7300.00, 'ENTREGADO',   @v1, @c1, 110),
    ('EXP-0016', 'Felipe Mora',     'San Jose, Moravia',              6.00,  3600.00, 'ENTREGADO',   @v2, @c2, 130),
    ('EXP-0017', 'Valeria Chaves',  'Guapiles, Pococi',              18.20, 10400.00, 'CANCELADO',   @v1, @c1, 150),
    ('EXP-0018', 'Oscar Brenes',    'Nicoya, Guanacaste',            10.10,  8800.00, 'CANCELADO',   @v2, @c2, 170)
) AS s(codigo, destinatario, direccion, peso, costo, estado, veh, con, horas)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Envio e WHERE e.codigo_rastreo = s.codigo);
GO