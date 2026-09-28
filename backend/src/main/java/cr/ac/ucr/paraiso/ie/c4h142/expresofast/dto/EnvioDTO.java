package cr.ac.ucr.paraiso.ie.c4h142.expresofast.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import cr.ac.ucr.paraiso.ie.c4h142.expresofast.domain.Envio;

public record EnvioDTO(
        Integer id,
        String codigoRastreo,
        String destinatario,
        String direccionDestino,
        BigDecimal montoFlete,
        String estado,
        LocalDateTime fechaCreacion) {

    public static EnvioDTO desde(Envio e) {
        return new EnvioDTO(
                e.getId(),
                e.getCodigoRastreo(),
                e.getDestinatario(),
                e.getDireccionDestino(),
                e.getCosto(),          
                e.getEstadoEnvio(),
                e.getFechaCreacion());
    }
}