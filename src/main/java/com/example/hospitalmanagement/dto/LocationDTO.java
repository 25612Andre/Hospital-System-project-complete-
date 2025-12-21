package com.example.hospitalmanagement.dto;

import com.example.hospitalmanagement.model.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationDTO {
    private Long id;
    private String code;
    private String name;
    private LocationType type;
    private Long parentId;
    private String parentName;
    private String path;
}
