package cr.ac.ucr.paraiso.ie.c4h142.expresofast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cr.ac.ucr.paraiso.ie.c4h142.expresofast.business.EnvioService;
import cr.ac.ucr.paraiso.ie.c4h142.expresofast.dto.EnvioDTO;
import cr.ac.ucr.paraiso.ie.c4h142.expresofast.dto.PaginaDTO;

@RestController
@RequestMapping("/api/v1/envios")
public class EnvioPaginadoController {

    private final EnvioService envioService;

    public EnvioPaginadoController(EnvioService envioService) {
        this.envioService = envioService;
    }

    @GetMapping
    public PaginaDTO<EnvioDTO> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "fechaCreacion") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) String estado) {
        return PaginaDTO.de(envioService.listarPaginado(page, size, sortBy, direction, busqueda, estado));
    }

    @GetMapping("/procedimiento/{estado}")
    public List<EnvioDTO> porProcedimiento(@PathVariable String estado) {
        return envioService.listarViaStoredProcedure(estado);
    }

    @GetMapping("/metricas")
    public List<Map<String, Object>> metricas() {
        return envioService.resumenMetricas();
    }
}