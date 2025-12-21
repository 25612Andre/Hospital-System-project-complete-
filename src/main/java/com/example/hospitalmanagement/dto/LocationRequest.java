package com.example.hospitalmanagement.dto;

import com.example.hospitalmanagement.model.enums.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationRequest {
    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank
    private String name;

    @NotNull
    private LocationType type;

    private Long parentId;
}
