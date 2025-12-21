package com.example.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SearchResultDTO {
    private String type;
    private Long id;
    private String label;
    private String detail;
}
