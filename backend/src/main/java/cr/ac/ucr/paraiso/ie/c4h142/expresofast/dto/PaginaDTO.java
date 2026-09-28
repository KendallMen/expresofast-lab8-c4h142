package cr.ac.ucr.paraiso.ie.c4h142.expresofast.dto;

import java.util.List;

import org.springframework.data.domain.Page;


public record PaginaDTO<T>(
        List<T> content,
        int number,         
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {

    public static <T> PaginaDTO<T> de(Page<T> p) {
        return new PaginaDTO<>(p.getContent(), p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages(), p.isFirst(), p.isLast());
    }
}